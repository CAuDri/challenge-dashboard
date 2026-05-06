"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import type { CameraSourceType } from "@/types/screen";

type CameraStreamViewProps = {
  sourceType: CameraSourceType;
  sourceUrl: string | undefined;
  className?: string;
  mediaClassName?: string;
  loadingLabel?: string;
  emptyLabel?: string;
  errorLabel?: string;
};

function waitForIceGatheringComplete(peerConnection: RTCPeerConnection) {
  if (peerConnection.iceGatheringState === "complete") {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    function handleIceGatheringStateChange() {
      if (peerConnection.iceGatheringState === "complete") {
        peerConnection.removeEventListener(
          "icegatheringstatechange",
          handleIceGatheringStateChange,
        );
        resolve();
      }
    }

    peerConnection.addEventListener(
      "icegatheringstatechange",
      handleIceGatheringStateChange,
    );
  });
}

export function CameraStreamView({
  sourceType,
  sourceUrl,
  className,
  mediaClassName,
  loadingLabel = "Loading camera...",
  emptyLabel = "No camera source configured",
  errorLabel = "Failed to load camera stream",
}: CameraStreamViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    sourceUrl ? "loading" : "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!sourceUrl) {
      let isMounted = true;

      queueMicrotask(() => {
        if (!isMounted) {
          return;
        }

        setStatus("idle");
        setErrorMessage(undefined);
      });

      return () => {
        isMounted = false;
      };
    }

    const activeSourceUrl = sourceUrl;
    let cancelled = false;
    let hls: Hls | undefined;
    let peerConnection: RTCPeerConnection | undefined;
    let whepSessionUrl: string | undefined;
    const video = videoRef.current;

    async function setupStream() {
      setStatus("loading");
      setErrorMessage(undefined);

      try {
        if (sourceType === "mjpeg") {
          return;
        }

        if (!video) {
          return;
        }

        if (sourceType === "hls") {
          if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.srcObject = null;
            video.src = activeSourceUrl;
            void video.play().catch(() => undefined);
            video.load();
            setStatus("ready");
            return;
          }

          if (!Hls.isSupported()) {
            throw new Error("HLS is not supported in this browser.");
          }

          hls = new Hls({
            lowLatencyMode: true,
          });

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!cancelled) {
              void video.play().catch(() => undefined);
              setStatus("ready");
            }
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (cancelled) {
              return;
            }

            if (data.fatal) {
              setErrorMessage(data.details || errorLabel);
              setStatus("error");
            }
          });

          hls.loadSource(activeSourceUrl);
          hls.attachMedia(video);
          return;
        }

        peerConnection = new RTCPeerConnection({
          bundlePolicy: "max-bundle",
        });

        const mediaStream = new MediaStream();
        video.srcObject = mediaStream;

        peerConnection.addTransceiver("video", {
          direction: "recvonly",
        });

        peerConnection.ontrack = (event) => {
          mediaStream.addTrack(event.track);
          void video.play().catch(() => undefined);
          if (!cancelled) {
            setStatus("ready");
          }
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        await waitForIceGatheringComplete(peerConnection);

        const response = await fetch(activeSourceUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/sdp",
            Accept: "application/sdp",
          },
          body: peerConnection.localDescription?.sdp ?? offer.sdp ?? "",
        });

        if (!response.ok) {
          throw new Error(`WHEP request failed: ${response.status}`);
        }

        whepSessionUrl =
          response.headers.get("Location") !== null
            ? new URL(
                response.headers.get("Location")!,
                activeSourceUrl,
              ).toString()
            : undefined;

        const answerSdp = await response.text();

        await peerConnection.setRemoteDescription({
          type: "answer",
          sdp: answerSdp,
        });
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setErrorMessage(
            error instanceof Error ? error.message : String(error),
          );
          setStatus("error");
        }
      }
    }

    void setupStream();

    return () => {
      cancelled = true;

      if (hls) {
        hls.destroy();
      }

      if (peerConnection) {
        peerConnection.close();
      }

      if (whepSessionUrl) {
        void fetch(whepSessionUrl, {
          method: "DELETE",
        }).catch(() => undefined);
      }

      if (video) {
        video.pause();
        video.src = "";
        video.srcObject = null;
        video.load();
      }
    };
  }, [errorLabel, sourceType, sourceUrl]);

  if (!sourceUrl) {
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
      {sourceType === "mjpeg" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sourceUrl}
          alt=""
          onLoad={() => setStatus("ready")}
          onError={() => {
            setErrorMessage(errorLabel);
            setStatus("error");
          }}
          className={`h-full w-full object-contain ${
            mediaClassName ?? ""
          } ${status === "error" ? "invisible" : ""}`}
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full object-contain ${
            mediaClassName ?? ""
          } ${status === "error" ? "invisible" : ""}`}
        />
      )}

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-slate-500">
          {loadingLabel}
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-rose-300">
          {errorMessage ?? errorLabel}
        </div>
      )}
    </div>
  );
}
