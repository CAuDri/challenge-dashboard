"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type {
  PDFDocumentProxy,
  RenderTask,
} from "pdfjs-dist/types/src/display/api";

export type PdfPagePreviewProps = {
  fileUrl: string | undefined;
  pageNumber: number;
  width?: number;
  height?: number;
  className?: string;
  pageClassName?: string;
  loadingLabel?: string;
  emptyLabel?: string;
  errorLabel?: string;
  onDocumentLoadSuccess?: (numPages: number) => void;
  onPageLoadSuccess?: (page: { width: number; height: number }) => void;
};

export function PdfPagePreview({
  fileUrl,
  pageNumber,
  width,
  height,
  className,
  pageClassName,
  loadingLabel = "Loading PDF...",
  emptyLabel = "No PDF selected",
  errorLabel = "Failed to load PDF",
  onDocumentLoadSuccess,
  onPageLoadSuccess,
}: PdfPagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const documentRef = useRef<PDFDocumentProxy | undefined>(undefined);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    fileUrl ? "loading" : "idle",
  );
  const [documentRevision, setDocumentRevision] = useState(0);
  const [hasRenderedPage, setHasRenderedPage] = useState(false);
  const devicePixelRatioRef = useRef(1);
  const handleDocumentLoadSuccess = useEffectEvent((numPages: number) => {
    onDocumentLoadSuccess?.(numPages);
  });
  const handlePageLoadSuccess = useEffectEvent(
    (page: { width: number; height: number }) => {
      onPageLoadSuccess?.(page);
    },
  );

  useEffect(() => {
    devicePixelRatioRef.current =
      typeof window === "undefined"
        ? 1
        : Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5));
  }, []);

  useEffect(() => {
    if (!fileUrl) {
      documentRef.current = undefined;
      let isMounted = true;

      queueMicrotask(() => {
        if (!isMounted) {
          return;
        }

        setStatus("idle");
        setHasRenderedPage(false);
      });

      return () => {
        isMounted = false;
      };
    }

    let cancelled = false;

    async function loadDocument() {
      setStatus("loading");
      setHasRenderedPage(false);

      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const documentTask = pdfjs.getDocument(fileUrl);
        const pdfDocument = await documentTask.promise;

        if (cancelled) {
          pdfDocument.destroy?.();
          return;
        }

        documentRef.current = pdfDocument;
        handleDocumentLoadSuccess(pdfDocument.numPages);
        setDocumentRevision((currentRevision) => currentRevision + 1);
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          documentRef.current = undefined;
          setStatus("error");
        }
      }
    }

    void loadDocument();

    return () => {
      cancelled = true;
      const activeDocument = documentRef.current;
      documentRef.current = undefined;
      activeDocument?.destroy?.();
    };
  }, [fileUrl]);

  useEffect(() => {
    const activeDocument = documentRef.current;

    if (!fileUrl || !activeDocument) {
      return;
    }

    let cancelled = false;
    let activeRenderTask: RenderTask | undefined;

    async function renderPage() {
      try {
        const pdfDocument = activeDocument;

        if (!pdfDocument) {
          return;
        }

        const nextPageNumber = Math.min(
          Math.max(1, pageNumber),
          pdfDocument.numPages,
        );
        const pdfPage = await pdfDocument.getPage(nextPageNumber);

        if (cancelled) {
          return;
        }

        const viewport = pdfPage.getViewport({ scale: 1 });
        handlePageLoadSuccess({
          width: viewport.width,
          height: viewport.height,
        });

        const horizontalScale = width ? width / viewport.width : Number.POSITIVE_INFINITY;
        const verticalScale = height ? height / viewport.height : Number.POSITIVE_INFINITY;
        const scale = Math.min(horizontalScale, verticalScale);
        const baseScale = Number.isFinite(scale) ? scale : 1;
        const cssViewport = pdfPage.getViewport({
          scale: baseScale,
        });
        const renderViewport = pdfPage.getViewport({
          scale: baseScale * devicePixelRatioRef.current,
        });
        const canvas = canvasRef.current;

        if (!canvas) {
          return;
        }

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Canvas 2D context is unavailable");
        }

        canvas.width = Math.ceil(renderViewport.width);
        canvas.height = Math.ceil(renderViewport.height);
        canvas.style.width = `${cssViewport.width + 0.5}px`;
        canvas.style.height = `${cssViewport.height + 0.5}px`;

        activeRenderTask = pdfPage.render({
          canvas,
          canvasContext: context,
          viewport: renderViewport,
        });

        await activeRenderTask.promise;

        if (!cancelled) {
          setHasRenderedPage(true);
          setStatus("ready");
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setStatus("error");
        }
      }
    }

    void renderPage();

    return () => {
      cancelled = true;
      activeRenderTask?.cancel?.();
    };
  }, [
    documentRevision,
    fileUrl,
    height,
    pageNumber,
    width,
  ]);

  if (!fileUrl) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center text-center text-sm text-slate-500 ${className ?? ""}`}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        className={`block ${pageClassName ?? ""} ${
          hasRenderedPage ? "" : "invisible"
        }`}
      />

      {status === "loading" && !hasRenderedPage && (
        <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-slate-500">
          {loadingLabel}
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-rose-300">
          {errorLabel}
        </div>
      )}
    </div>
  );
}
