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
  // submissionId is present when the upload itself succeeded and only
  // grading failed - carrying it forward is what lets retryGrade skip
  // re-uploading the photo. Absent when the upload step itself failed.
  | { status: "error"; message: string; submissionId?: string };

export type UploadStore = UploadState & {
  // Returns the terminal state ("success" or "error"), not just void — so
  // callers read the outcome from what they already awaited instead of
  // reaching for the store's getState() escape hatch right after.
  upload(params: { file: Blob; lessonId: string }): Promise<UploadState>;
  // Re-runs grading for a submission that already uploaded successfully -
  // the PRD's own rationale for splitting upload/grade into two routes
  // ("lets grading be retried without re-uploading the photo").
  retryGrade(submissionId: string): Promise<UploadState>;
  reset(): void;
};

export function createUploadSubmissionStore(api: UploadSubmissionApi) {
  function errorMessage(err: unknown, fallback: string) {
    return err instanceof Error ? err.message : fallback;
  }

  return create<UploadStore>((set) => {
    async function grade(submissionId: string): Promise<UploadState> {
      set({ status: "grading", submissionId });
      try {
        const { score, totalPossible } = await api.gradeSubmission(submissionId);
        const result: UploadState = { status: "success", submissionId, score, totalPossible };
        set(result);
        return result;
      } catch (err) {
        const result: UploadState = {
          status: "error",
          message: errorMessage(err, "Grading failed"),
          submissionId,
        };
        set(result);
        return result;
      }
    }

    return {
      status: "idle",
      async upload(params) {
        set({ status: "uploading" });
        let submissionId: string;
        try {
          ({ submissionId } = await api.uploadSubmission(params));
        } catch (err) {
          const result: UploadState = { status: "error", message: errorMessage(err, "Upload failed") };
          set(result);
          return result;
        }
        return grade(submissionId);
      },
      retryGrade: grade,
      reset() {
        set({ status: "idle" });
      },
    };
  });
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
