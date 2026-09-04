import { describe, expect, test } from "vitest";

import { createUploadSubmissionStore, type UploadSubmissionApi } from "./useUploadSubmission";

describe("useUploadSubmission store", () => {
  test("transitions idle -> uploading -> grading -> success", async () => {
    const fakeApi: UploadSubmissionApi = {
      uploadSubmission: async () => ({ submissionId: "sub-123" }),
      gradeSubmission: async () => ({ score: 2, totalPossible: 3 }),
    };
    const store = createUploadSubmissionStore(fakeApi);

    expect(store.getState().status).toBe("idle");

    const promise = store
      .getState()
      .upload({ file: new Blob(["fake-image-bytes"]), lessonId: "lesson-1" });
    expect(store.getState().status).toBe("uploading");

    await promise;
    expect(store.getState()).toMatchObject({
      status: "success",
      submissionId: "sub-123",
      score: 2,
      totalPossible: 3,
    });
  });

  test("transitions to error with a message when the upload step fails", async () => {
    const fakeApi: UploadSubmissionApi = {
      uploadSubmission: async () => {
        throw new Error("Network error");
      },
      gradeSubmission: async () => ({ score: 0, totalPossible: 0 }),
    };
    const store = createUploadSubmissionStore(fakeApi);

    await store.getState().upload({ file: new Blob(["fake-image-bytes"]), lessonId: "lesson-1" });

    expect(store.getState()).toMatchObject({ status: "error", message: "Network error" });
  });

  test("transitions to error with a message when the grade step fails", async () => {
    const fakeApi: UploadSubmissionApi = {
      uploadSubmission: async () => ({ submissionId: "sub-123" }),
      gradeSubmission: async () => {
        throw new Error("Grading failed");
      },
    };
    const store = createUploadSubmissionStore(fakeApi);

    await store.getState().upload({ file: new Blob(["fake-image-bytes"]), lessonId: "lesson-1" });

    expect(store.getState()).toMatchObject({ status: "error", message: "Grading failed" });
  });

  test("reset returns to idle", async () => {
    const fakeApi: UploadSubmissionApi = {
      uploadSubmission: async () => ({ submissionId: "sub-123" }),
      gradeSubmission: async () => ({ score: 2, totalPossible: 3 }),
    };
    const store = createUploadSubmissionStore(fakeApi);

    await store.getState().upload({ file: new Blob(["fake-image-bytes"]), lessonId: "lesson-1" });
    store.getState().reset();

    expect(store.getState().status).toBe("idle");
  });
});
