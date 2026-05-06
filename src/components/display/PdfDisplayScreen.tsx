"use client";

import { useEffect, useRef, useState } from "react";
import { PdfPagePreview } from "@/components/pdf/PdfPagePreview";
import type { ScreenDefinition } from "@/types/screen";

type PdfDisplayScreenProps = {
  screen: ScreenDefinition;
};

type Size = {
  width: number;
  height: number;
};

function clampPage(pageNumber: number, numPages: number) {
  return Math.min(Math.max(1, pageNumber), Math.max(1, numPages));
}

export function PdfDisplayScreen({ screen }: PdfDisplayScreenProps) {
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
    function showNextPage() {
      setCurrentPage((pageNumber) => Math.min(pageNumber + 1, pageCount));
    }

    function showPreviousPage() {
      setCurrentPage((pageNumber) => Math.max(pageNumber - 1, 1));
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
        setCurrentPage(1);
      }

      if (event.key.toLowerCase() === "end") {
        event.preventDefault();
        setCurrentPage(pageCount);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pageCount]);

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

  const horizontalPadding = Math.max(24, containerSize.width * 0.04);
  const verticalPadding = Math.max(24, containerSize.height * 0.04);
  const infoBarHeight = 56;
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
        className="flex min-h-0 flex-1 items-center justify-center px-[clamp(1.5rem,4vw,3.5rem)] py-[clamp(1.25rem,3vw,2.5rem)]"
      >
        <PdfPagePreview
          fileUrl={pdfUrl}
          pageNumber={currentPage}
          width={fittedWidth > 0 ? fittedWidth : undefined}
          className="flex h-full w-full items-center justify-center"
          pageClassName="shadow-2xl"
          loadingLabel="Loading presentation..."
          errorLabel="Failed to load presentation"
          onDocumentLoadSuccess={(numPages) => {
            setPageCount(numPages);
            setCurrentPage((pageNumber) => clampPage(pageNumber, numPages));
          }}
          onPageLoadSuccess={(page) => {
            setPageAspectRatio(page.width / page.height);
          }}
        />
      </div>

      <footer className="flex h-14 shrink-0 items-center justify-between border-t border-white/10 px-6 text-sm text-slate-300">
        <span className="truncate">{screen.name}</span>
        <span className="font-mono text-slate-400">
          {currentPage} / {pageCount}
        </span>
      </footer>
    </main>
  );
}
