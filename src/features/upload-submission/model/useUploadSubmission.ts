import { create } from "zustand";

export type UploadSubmissionApi = {
  uploadSubmission(params: { file: Blob; lessonId: string }): Promise<{ submissionId: string }>;
  gradeSubmission(
    submissionId: string,
  ): Promise<{ score: number; totalPossible: number }>;
};

export type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "grading"; submissionId: string }
  | { status: "success"; submissionId: string; score: number; totalPossible: number }
  | { status: "error"; message: string };

export type UploadStore = UploadState & {
  // Returns the terminal state ("success" or "error"), not just void — so
  // callers read the outcome from what they already awaited instead of
  // reaching for the store's getState() escape hatch right after.
  upload(params: { file: Blob; lessonId: string }): Promise<UploadState>;
  reset(): void;
};

export function createUploadSubmissionStore(api: UploadSubmissionApi) {
  return create<UploadStore>((set) => ({
    status: "idle",
    async upload(params) {
      set({ status: "uploading" });
      try {
        const { submissionId } = await api.uploadSubmission(params);
        set({ status: "grading", submissionId });
        const { score, totalPossible } = await api.gradeSubmission(submissionId);
        const result: UploadState = { status: "success", submissionId, score, totalPossible };
        set(result);
        return result;
      } catch (err) {
        const result: UploadState = {
          status: "error",
          message: err instanceof Error ? err.message : "Upload failed",
        };
        set(result);
        return result;
      }
    },
    reset() {
      set({ status: "idle" });
    },
  }));
}

// Both API routes return { error: string } on failure — read it instead of
// discarding the body and showing the user a bare status code.
async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

// Real API-backed instance — talks to POST /api/upload then POST /api/grade.
// Exported so its error-message extraction can be tested against a mocked
// fetch without dragging the whole store through it.
export const realApi: UploadSubmissionApi = {
  async uploadSubmission({ file, lessonId }) {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("lessonId", lessonId);

    const response = await fetch("/api/upload", { method: "POST", body: formData });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, `Upload failed: ${response.status}`));
    }
    return response.json();
  },
  async gradeSubmission(submissionId) {
    const response = await fetch("/api/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId }),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, `Grading failed: ${response.status}`));
    }
    return response.json();
  },
};

export const useUploadSubmission = createUploadSubmissionStore(realApi);
