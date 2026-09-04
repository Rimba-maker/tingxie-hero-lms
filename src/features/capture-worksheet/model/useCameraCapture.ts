"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraCaptureState = "idle" | "requesting" | "streaming" | "error";

export function useCameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraCaptureState>("idle");
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setState("requesting");
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
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
  }, [stopStream]);

  // Always release the camera when the component unmounts, even if the
  // caller never explicitly calls stop() — a leaked MediaStream keeps the
  // camera's hardware indicator lit and can block getUserMedia elsewhere.
  useEffect(() => stopStream, [stopStream]);

  const capture = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;

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

  return { videoRef, state, error, start, stop, capture };
}
