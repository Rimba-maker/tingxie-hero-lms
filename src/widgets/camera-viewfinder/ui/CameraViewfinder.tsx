"use client";

import { useEffect } from "react";
import { X, Zap } from "lucide-react";

import { useCameraCapture } from "@/features/capture-worksheet/model/useCameraCapture";
import { ShutterButton } from "@/features/capture-worksheet/ui/ShutterButton";

type CameraViewfinderProps = {
  onClose: () => void;
  onCapture: (file: Blob) => void;
  capturing?: boolean;
};

export function CameraViewfinder({ onClose, onCapture, capturing }: CameraViewfinderProps) {
  const { videoRef, state, error, start, capture } = useCameraCapture();

  useEffect(() => {
    start();
  }, [start]);

  async function handleShutterClick() {
    const blob = await capture();
    if (blob) onCapture(blob);
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-black text-white">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 size-full object-cover"
      />

      <div className="relative z-10 flex items-center justify-between p-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close camera"
          className="flex size-10 items-center justify-center rounded-full bg-black/40 outline-none focus-visible:ring-3 focus-visible:ring-white"
        >
          <X className="size-5" />
        </button>
        <span className="text-sm font-medium">Align Worksheet</span>
        <span className="flex size-10 items-center justify-center rounded-full bg-black/40">
          <Zap className="size-5" />
        </span>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center">
        <div className="relative aspect-square w-4/5 max-w-sm">
          {/* Corner brackets marking the alignment frame — matches
              docs/reference/mockups/screen3-camera.png */}
          <span className="absolute left-0 top-0 size-8 border-l-2 border-t-2 border-white" />
          <span className="absolute right-0 top-0 size-8 border-r-2 border-t-2 border-white" />
          <span className="absolute bottom-0 left-0 size-8 border-b-2 border-l-2 border-white" />
          <span className="absolute bottom-0 right-0 size-8 border-b-2 border-r-2 border-white" />
        </div>
      </div>

      {state === "error" && (
        <div className="relative z-10 mx-4 mb-4 rounded-md bg-red-950/80 p-3 text-center text-sm">
          {error ?? "Could not access the camera."}{" "}
          <button
            type="button"
            onClick={start}
            className="rounded underline outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Retry
          </button>
        </div>
      )}

      {state === "streaming" && (
        <div className="relative z-10 mx-auto mb-4 rounded-full bg-black/60 px-4 py-2 text-center text-xs">
          Keep page flat and inside the brackets
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-2 pb-10">
        <ShutterButton onClick={handleShutterClick} disabled={state !== "streaming" || capturing} />
        <span className="text-sm">Capture &amp; Grade</span>
      </div>
    </div>
  );
}
