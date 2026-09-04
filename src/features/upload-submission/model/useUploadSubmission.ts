import { create } from "zustand";

export type UploadSubmissionApi = {
  uploadSubmission(params: { file: Blob; lessonId: string }): Promise<{ submissionId: string }>;
};

export type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "success"; submissionId: string }
  | { status: "error"; message: string };

export type UploadStore = UploadState & {
  upload(params: { file: Blob; lessonId: string }): Promise<void>;
  reset(): void;
};

export function createUploadSubmissionStore(api: UploadSubmissionApi) {
  return create<UploadStore>((set) => ({
    status: "idle",
    async upload(params) {
      set({ status: "uploading" });
      try {
        const { submissionId } = await api.uploadSubmission(params);
        set({ status: "success", submissionId });
      } catch (err) {
        set({ status: "error", message: err instanceof Error ? err.message : "Upload failed" });
      }
    },
    reset() {
      set({ status: "idle" });
    },
  }));
}

// Real API-backed instance — talks to POST /api/upload.
const realApi: UploadSubmissionApi = {
  async uploadSubmission({ file, lessonId }) {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("lessonId", lessonId);

    const response = await fetch("/api/upload", { method: "POST", body: formData });
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    return response.json();
  },
};

export const useUploadSubmission = createUploadSubmissionStore(realApi);
