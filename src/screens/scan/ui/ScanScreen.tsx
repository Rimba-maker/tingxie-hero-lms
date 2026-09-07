"use client";

import { useEffect, useRef } from "react";
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

  // Now that Close is reachable mid-upload (see CameraViewfinder), leaving
  // before this resolves is an expected path, not just a rare browser-back
  // edge case. Fetches aren't cancelled by unmounting, so this component's
  // own handleCapture keeps running after the user has navigated elsewhere
  // - without this check, a since-abandoned scan finishing successfully
  // later would force-navigate the user to its Results page mid-whatever
  // they're now doing, entirely unprompted.
  const mountedRef = useRef(true);
  useEffect(() => {
    // Confirmed live, not assumed: this app's App Router has React Strict
    // Mode on by default (Next.js 13.5.1+) with no override in
    // next.config.ts, so `npm run dev` deliberately double-invokes this
    // effect (mount -> cleanup -> mount) to help surface exactly this class
    // of bug. Without resetting to true here, the simulated cleanup's
    // `= false` was never undone by the real mount that follows it -
    // instrumented directly and caught mountedRef.current reading false at
    // the success-navigation check despite the component being genuinely,
    // currently mounted, silently breaking every retry/capture success in
    // dev (production builds don't double-invoke, so this specific failure
    // mode wouldn't reproduce there - but dev is how this gets tested).
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function handleCapture(file: Blob) {
    const result = await upload.upload({ file, lessonId });
    if (mountedRef.current && result.status === "success") {
      router.push(`/results/${result.submissionId}`);
    }
  }

  // Confirmed live: this previously fired retryGrade() and did nothing with
  // its result - a retry that actually succeeded left the user staring at
  // the bare camera view with zero feedback, the error banner gone but
  // nothing navigating anywhere either. Same success-navigation handling
  // handleCapture already has, for the same reason (retryGrade can also now
  // be abandoned mid-flight since Close is reachable during "grading" too).
  async function handleRetry(submissionId: string) {
    const result = await upload.retryGrade(submissionId);
    if (mountedRef.current && result.status === "success") {
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
            onClick={() => (upload.submissionId ? handleRetry(upload.submissionId) : upload.reset())}
            className="underline"
          >
            Try again
          </button>
        </div>
      )}
    </main>
  );
}
