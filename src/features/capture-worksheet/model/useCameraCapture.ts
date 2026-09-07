"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraCaptureState = "idle" | "requesting" | "streaming" | "error";

// `torch` is a real, shipped MediaTrackConstraint/Capability (Chromium's
// Image Capture extensions) but isn't in TypeScript's DOM lib — MDN
// confirms it has no Safari/Firefox support at all, so every use below is
// behind a capability check anyway.
type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };
type TorchConstraintSet = MediaTrackConstraintSet & { torch?: boolean };

export function useCameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraCaptureState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setState("requesting");
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // Ideal, not exact/min — an ideal hint degrades gracefully on
        // cameras that can't do 1080p instead of failing getUserMedia
        // outright (confirmed via Context7/MDN's constraints guide).
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      const capabilities = stream.getVideoTracks()[0]?.getCapabilities() as
        | TorchCapabilities
        | undefined;
      setTorchSupported(!!capabilities?.torch);
      setTorchOn(false);

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        // getUserMedia() resolving doesn't mean the video element has
        // decoded a first frame yet - confirmed live: a tap landing in that
        // gap made captureOnce()'s videoWidth===0 guard silently return
        // null, with the shutter button already enabled and zero feedback
        // shown. Only enabling the shutter (state: "streaming") once a
        // frame genuinely exists closes the gap at its source rather than
        // handling the failure after the fact.
        if (video.videoWidth === 0) {
          await new Promise<void>((resolve) => {
            video.addEventListener("loadedmetadata", () => resolve(), { once: true });
          });
        }
      }
      setState("streaming");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not access camera");
      setState("error");
    }
  }, []);

  const stop = useCallback(() => {
    stopStream();
    setState("idle");
    setTorchSupported(false);
    setTorchOn(false);
  }, [stopStream]);

  // Always release the camera when the component unmounts, even if the
  // caller never explicitly calls stop() — a leaked MediaStream keeps the
  // camera's hardware indicator lit and can block getUserMedia elsewhere.
  useEffect(() => stopStream, [stopStream]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as TorchConstraintSet] });
      setTorchOn(next);
    } catch {
      // Capability said yes but the device rejected it mid-stream — leave
      // torchOn as-is rather than show a state that didn't actually apply.
    }
  }, [torchOn]);

  const captureOnce = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;

    // ImageCapture.takePhoto() captures at the camera's full photo
    // resolution, which is often higher than the video preview stream —
    // genuinely better than a canvas snapshot where it's available
    // (Chromium only, confirmed via Context7/MDN; no Safari/Firefox
    // support, so this is a progressive enhancement over the fallback
    // below, never a replacement for it).
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && typeof ImageCapture !== "undefined") {
      try {
        const photo = await new ImageCapture(track).takePhoto();
        // Unlike the canvas path below, takePhoto() reads straight from the
        // camera hardware and can carry an EXIF orientation tag (real phone
        // cameras commonly set one). Gemini's box_2d coordinates and this
        // Blob's own pixel buffer would then disagree with what a
        // <img>/EXIF-aware viewer displays - normalizing bakes the rotation
        // into the pixels and drops the tag, so every consumer of this photo
        // sees identical, unambiguous pixels. Confirmed live in a real
        // browser: an EXIF-tagged test image's markers land in the correct
        // display position after this, with no orientation tag surviving.
        return await normalizeOrientation(photo);
      } catch {
        // Some Chromium builds expose the constructor but reject
        // takePhoto() on specific hardware — fall through to the canvas
        // snapshot below rather than fail the capture entirely.
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  }, []);

  // ShutterButton only disables once the caller's own upload/grading state
  // flips - which happens after captureOnce (now slower than before, since
  // orientation normalization added a decode+redraw step) resolves and its
  // caller reacts to the Blob. A tap landing in that window would start a
  // second concurrent capture on the same camera stream. Guarding here, not
  // in the UI, fixes it once for every caller rather than trusting each one
  // to debounce correctly.
  const capturingRef = useRef(false);
  const capture = useCallback(async (): Promise<Blob | null> => {
    if (capturingRef.current) return null;
    capturingRef.current = true;
    try {
      return await captureOnce();
    } finally {
      capturingRef.current = false;
    }
  }, [captureOnce]);

  return { videoRef, state, error, torchSupported, torchOn, start, stop, toggleTorch, capture };
}

// "from-image" makes the decode itself apply the Blob's EXIF orientation, so
// the bitmap's width/height are already the corrected (display) dimensions —
// re-drawing it plain bakes that rotation into the pixels. canvas.toBlob
// never writes EXIF, so the result carries no orientation tag for anything
// downstream to interpret differently.
async function normalizeOrientation(blob: Blob): Promise<Blob | null> {
  const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return blob;
  ctx.drawImage(bitmap, 0, 0);
  return new Promise((resolve) => canvas.toBlob((normalized) => resolve(normalized ?? blob), "image/jpeg", 0.9));
}
