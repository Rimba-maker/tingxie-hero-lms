"use client";

import { useEffect, useRef } from "react";
import { QrCode, X, Zap } from "lucide-react";

import { normalizeOrientation, useCameraCapture } from "@/features/capture-worksheet/model/useCameraCapture";
import { ShutterButton } from "@/features/capture-worksheet/ui/ShutterButton";
import { cn } from "@/shared/lib/utils";

type CameraViewfinderProps = {
  onClose: () => void;
  onCapture: (file: Blob) => void;
  capturing?: boolean;
};

export function CameraViewfinder({ onClose, onCapture, capturing }: CameraViewfinderProps) {
  const { videoRef, state, error, torchSupported, torchOn, start, toggleTorch, capture } =
    useCameraCapture();
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    start();
  }, [start]);

  async function handleShutterClick() {
    const blob = await capture();
    if (blob) onCapture(blob);
  }

  // A gallery pick needs the exact same EXIF-orientation fix a live capture
  // gets (see useCameraCapture.ts's own comment on normalizeOrientation) -
  // a photo already sitting in the gallery is just as likely to carry a
  // real phone camera's orientation tag as one taken through this screen.
  // Not gated on camera `state`: this is the actual fallback for when the
  // camera errors out (permission denied, no hardware), not just a
  // nice-to-have alongside a working stream.
  async function handleGallerySelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets the same file be re-selected later
    if (!file) return;
    const normalized = await normalizeOrientation(file);
    if (normalized) onCapture(normalized);
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

      {/* z-30, above ScanScreen's busy overlay (z-20 - confirmed live: it's
          `inset-0`, covers this whole component, and Playwright's own
          actionability check reported it "intercepts pointer events" on
          Close) - without this, a user has zero way to back out for the
          entire upload/grade cycle (up to 60s), trapped until it succeeds
          or fails on its own. */}
      <div className="relative z-30 flex items-center justify-between p-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close camera"
          className="flex size-10 items-center justify-center rounded-full bg-black/40 outline-none focus-visible:ring-3 focus-visible:ring-white"
        >
          <X className="size-5" />
        </button>
        <h1 className="text-sm font-medium">Align Worksheet</h1>
        {/* Real torch toggle where the device/browser supports it (Chromium
            only — MDN confirms no Safari/Firefox support, verified via
            Context7). Disabled rather than hidden elsewhere, so the design
            element from the mockup is always present, it just never claims
            to do something the hardware/browser can't. */}
        <button
          type="button"
          onClick={toggleTorch}
          disabled={!torchSupported}
          aria-label={torchOn ? "Turn off flash" : "Turn on flash"}
          aria-pressed={torchOn}
          className={cn(
            "flex size-10 items-center justify-center rounded-full bg-black/40 outline-none focus-visible:ring-3 focus-visible:ring-white disabled:opacity-40",
            torchOn && "bg-white text-black",
          )}
        >
          <Zap className="size-5" />
        </button>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center">
        <div className="relative aspect-square w-4/5 max-w-sm">
          {/* Corner brackets marking the alignment frame — matches
              docs/reference/mockups/screen3-camera.png */}
          <span className="absolute left-0 top-0 size-8 border-l-2 border-t-2 border-white" />
          <span className="absolute right-0 top-0 size-8 border-r-2 border-t-2 border-white" />
          <span className="absolute bottom-0 left-0 size-8 border-b-2 border-l-2 border-white" />
          <span className="absolute bottom-0 right-0 size-8 border-b-2 border-r-2 border-white" />

          {/* QR target box — static visual element only, no functional QR
              scanning (per PRD_TingXieHero.md §5: no QR-scanning requirement
              appears anywhere in the assignment's Technical Requirements). */}
          <span className="absolute right-2 top-12 flex size-10 items-center justify-center rounded border border-dashed border-white/70 bg-black/20">
            <QrCode className="size-5 text-white/70" />
          </span>
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
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={capturing}
          className="mt-1 py-3.5 text-xs text-white/70 underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40"
        >
          Choose from Gallery
        </button>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleGallerySelect}
          className="hidden"
          aria-label="Choose a worksheet photo from your device"
        />
      </div>
    </div>
  );
}
