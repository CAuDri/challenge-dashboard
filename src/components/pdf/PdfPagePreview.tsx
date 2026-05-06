"use client";

import { useEffect, useRef, useState } from "react";

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
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    fileUrl ? "loading" : "idle",
  );

  useEffect(() => {
    if (!fileUrl) {
      return;
    }

    let cancelled = false;
    let activeRenderTask:
      | {
          cancel?: () => void;
          promise?: Promise<unknown>;
        }
      | undefined;

    async function renderPage() {
      setStatus("loading");

      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const documentTask = pdfjs.getDocument(fileUrl);
        const pdfDocument = await documentTask.promise;

        if (cancelled) {
          return;
        }

        onDocumentLoadSuccess?.(pdfDocument.numPages);

        const nextPageNumber = Math.min(
          Math.max(1, pageNumber),
          pdfDocument.numPages,
        );
        const pdfPage = await pdfDocument.getPage(nextPageNumber);

        if (cancelled) {
          return;
        }

        const viewport = pdfPage.getViewport({ scale: 1 });
        onPageLoadSuccess?.({
          width: viewport.width,
          height: viewport.height,
        });

        const horizontalScale = width ? width / viewport.width : Number.POSITIVE_INFINITY;
        const verticalScale = height ? height / viewport.height : Number.POSITIVE_INFINITY;
        const scale = Math.min(horizontalScale, verticalScale);
        const renderViewport = pdfPage.getViewport({
          scale: Number.isFinite(scale) ? scale : 1,
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
        canvas.style.width = `${renderViewport.width}px`;
        canvas.style.height = `${renderViewport.height}px`;

        activeRenderTask = pdfPage.render({
          canvas,
          canvasContext: context,
          viewport: renderViewport,
        });

        await activeRenderTask.promise;

        if (!cancelled) {
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
    fileUrl,
    height,
    onDocumentLoadSuccess,
    onPageLoadSuccess,
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
    <div className={`relative ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        className={`${pageClassName ?? ""} ${
          status === "ready" ? "" : "invisible"
        }`}
      />

      {status === "loading" && (
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
