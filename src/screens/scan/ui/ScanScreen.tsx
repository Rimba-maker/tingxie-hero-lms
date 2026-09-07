"use client";

import { useRouter } from "next/navigation";

import { useUploadSubmission } from "@/features/upload-submission/model/useUploadSubmission";
import { CameraViewfinder } from "@/widgets/camera-viewfinder/ui/CameraViewfinder";

type ScanScreenProps = {
  lessonId: string;
};

export function ScanScreen({ lessonId }: ScanScreenProps) {
  const router = useRouter();
  const upload = useUploadSubmission();

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
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 text-white">
          {upload.status === "uploading" ? "Uploading…" : "Grading…"}
        </div>
      )}

      {upload.status === "error" && (
        <div className="absolute inset-x-4 bottom-28 z-20 rounded-md bg-red-950/90 p-3 text-center text-sm text-white">
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
