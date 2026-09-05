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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      const capabilities = stream.getVideoTracks()[0]?.getCapabilities() as
        | TorchCapabilities
        | undefined;
      setTorchSupported(!!capabilities?.torch);
      setTorchOn(false);
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

  const capture = useCallback(async (): Promise<Blob | null> => {
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
        return await new ImageCapture(track).takePhoto();
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

  return { videoRef, state, error, torchSupported, torchOn, start, stop, toggleTorch, capture };
}
