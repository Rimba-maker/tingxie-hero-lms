"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useUploadSubmission } from "@/features/upload-submission/model/useUploadSubmission";
import { CameraViewfinder } from "@/widgets/camera-viewfinder/ui/CameraViewfinder";

type ScanScreenProps = {
  lessonId: string;
};

export function ScanScreen({ lessonId }: ScanScreenProps) {
  const router = useRouter();
  const upload = useUploadSubmission();

  // useUploadSubmission is a module-level Zustand store, not per-component
  // state - it survives client-side navigation away from this screen.
  // Confirmed live: fail a scan, close, then open a completely fresh scan
  // for a different lesson via normal in-app navigation (no reload) - the
  // previous session's error banner ("Upload failed, please try again")
  // was still showing before the user had done anything in the new
  // session. Resetting on mount means every scan session always starts
  // from a clean slate, regardless of how the last one ended.
  useEffect(() => {
    upload.reset();
    // `upload` (the whole store snapshot) changes identity on every status
    // transition - depending on it would re-run this on every "uploading"
    // -> "grading" -> "success" step, resetting the in-progress upload it's
    // supposed to only run once, on mount. `reset` itself is a stable
    // Zustand action reference, so this deps array is correct as scoped.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upload.reset]);

  async function handleCapture(file: Blob) {
    const result = await upload.upload({ file, lessonId });
    if (result.status === "success") {
      router.push(`/results/${result.submissionId}`);
    }
  }

  const isBusy = upload.status === "uploading" || upload.status === "grading";

  return (
    <main className="relative">
      <CameraViewfinder onClose={() => router.back()} onCapture={handleCapture} capturing={isBusy} />

      {isBusy && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 text-white"
        >
          {upload.status === "uploading" ? "Uploading…" : "Grading…"}
        </div>
      )}

      {upload.status === "error" && (
        <div
          role="alert"
          className="absolute inset-x-4 bottom-28 z-20 rounded-md bg-red-950/90 p-3 text-center text-sm text-white"
        >
          {upload.message}{" "}
          <button
            type="button"
            onClick={() => (upload.submissionId ? upload.retryGrade(upload.submissionId) : upload.reset())}
            className="underline"
          >
            Try again
          </button>
        </div>
      )}
    </main>
  );
}
