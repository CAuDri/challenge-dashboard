"use client";

import { useEffect, useRef, useState } from "react";
import { PdfPagePreview } from "@/components/pdf/PdfPagePreview";
import type { ScreenDefinition } from "@/types/screen";
import type { DisplayControlState } from "@/types/display-client";

type PdfDisplayScreenProps = {
  screen: ScreenDefinition;
  displayClientId?: string;
  displayControl: DisplayControlState;
  onPageChange: (payload: {
    clientId: string;
    screenId: string;
    page: number;
    pageCount: number;
  }) => void;
};

type Size = {
  width: number;
  height: number;
};

function clampPage(pageNumber: number, numPages: number) {
  return Math.min(Math.max(1, pageNumber), Math.max(1, numPages));
}

export function PdfDisplayScreen({
  screen,
  displayClientId,
  displayControl,
  onPageChange,
}: PdfDisplayScreenProps) {
  const pdfUrl = screen.config?.pdf?.pdfUrl;
  const initialPage = screen.config?.pdf?.previewPage ?? 1;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<Size>({
    width: 0,
    height: 0,
  });
  const [pageAspectRatio, setPageAspectRatio] = useState<number>(1 / Math.SQRT2);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const syncedPageState = displayControl.pdfPages[screen.id];
  const canControlSharedState =
    !displayControl.syncEnabled ||
    !displayControl.mainDisplayClientId ||
    displayControl.mainDisplayClientId === displayClientId;

  useEffect(() => {
    let isMounted = true;

    queueMicrotask(() => {
      if (!isMounted) {
        return;
      }

      setCurrentPage(initialPage);
      setPageCount(1);
    });

    return () => {
      isMounted = false;
    };
  }, [initialPage, screen.id]);

  useEffect(() => {
    if (!displayControl.syncEnabled || canControlSharedState) {
      return;
    }

    if (!syncedPageState) {
      return;
    }

    queueMicrotask(() => {
      setCurrentPage(clampPage(syncedPageState.page, pageCount));
    });
  }, [
    canControlSharedState,
    displayControl.syncEnabled,
    pageCount,
    syncedPageState,
  ]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    function setSharedPage(pageNumber: number) {
      if (displayControl.syncEnabled && !canControlSharedState) {
        return;
      }

      const nextPage = clampPage(pageNumber, pageCount);

      setCurrentPage(nextPage);

      if (displayClientId && canControlSharedState) {
        onPageChange({
          clientId: displayClientId,
          screenId: screen.id,
          page: nextPage,
          pageCount,
        });
      }
    }

    function showNextPage() {
      setSharedPage(currentPage + 1);
    }

    function showPreviousPage() {
      setSharedPage(currentPage - 1);
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.currentTarget;

      if (!(target instanceof Window)) {
        return;
      }

      if (event.clientX < target.innerWidth / 2) {
        showPreviousPage();
        return;
      }

      showNextPage();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === " " ||
        event.key === "Enter" ||
        event.key === "ArrowRight" ||
        event.key === "PageDown"
      ) {
        event.preventDefault();
        showNextPage();
      }

      if (
        event.key === "ArrowLeft" ||
        event.key === "Backspace" ||
        event.key === "PageUp"
      ) {
        event.preventDefault();
        showPreviousPage();
      }

      if (event.key.toLowerCase() === "home") {
        event.preventDefault();
        setSharedPage(1);
      }

      if (event.key.toLowerCase() === "end") {
        event.preventDefault();
        setSharedPage(pageCount);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    canControlSharedState,
    currentPage,
    displayClientId,
    displayControl.syncEnabled,
    onPageChange,
    pageCount,
    screen.id,
  ]);

  if (!pdfUrl) {
    return (
      <main className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white">
        <section className="text-center">
          <p className="font-[family-name:var(--font-rajdhani)] text-2xl font-semibold uppercase tracking-[0.5em] text-cyan-300">
            CAuDri-Challenge
          </p>
          <h1 className="mt-10 font-[family-name:var(--font-rajdhani)] text-7xl font-bold tracking-tight">
            {screen.name}
          </h1>
          <p className="mx-auto mt-8 max-w-3xl text-xl leading-8 text-slate-300">
            Upload a PDF to use this screen on the display.
          </p>
        </section>
      </main>
    );
  }

  const horizontalPadding = Math.max(12, containerSize.width * 0.018);
  const verticalPadding = Math.max(12, containerSize.height * 0.018);
  const infoBarHeight = 40;
  const availableWidth = Math.max(0, containerSize.width - horizontalPadding * 2);
  const availableHeight = Math.max(
    0,
    containerSize.height - verticalPadding * 2 - infoBarHeight,
  );
  const fittedWidth = Math.floor(
    Math.min(availableWidth, availableHeight * pageAspectRatio),
  );

  return (
    <main className="flex h-full w-full flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white">
      <div
        ref={containerRef}
        className="flex min-h-0 flex-1 items-center justify-center px-[clamp(0.75rem,1.8vw,1.5rem)] py-[clamp(0.75rem,1.8vw,1.5rem)]"
      >
        <PdfPagePreview
          fileUrl={pdfUrl}
          pageNumber={currentPage}
          width={fittedWidth > 0 ? fittedWidth : undefined}
          height={availableHeight > 0 ? availableHeight : undefined}
          className="flex h-full w-full items-center justify-center"
          pageClassName="shadow-2xl"
          loadingLabel="Loading presentation..."
          errorLabel="Failed to load presentation"
          onDocumentLoadSuccess={(numPages) => {
            setPageCount(numPages);
            setCurrentPage((pageNumber) => {
              const nextPage = clampPage(pageNumber, numPages);

              if (displayClientId && canControlSharedState) {
                onPageChange({
                  clientId: displayClientId,
                  screenId: screen.id,
                  page: nextPage,
                  pageCount: numPages,
                });
              }

              return nextPage;
            });
          }}
          onPageLoadSuccess={(page) => {
            setPageAspectRatio(page.width / page.height);
          }}
        />
      </div>

      <footer className="flex h-10 shrink-0 items-center justify-between border-t border-white/10 px-4 text-xs text-slate-300">
        <span className="truncate">{screen.name}</span>
        <span className="font-mono text-slate-400">
          {currentPage} / {pageCount}
        </span>
      </footer>
    </main>
  );
}
