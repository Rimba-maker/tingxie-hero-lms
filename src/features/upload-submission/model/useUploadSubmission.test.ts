import { describe, expect, test } from "vitest";

import { createUploadSubmissionStore, type UploadSubmissionApi } from "./useUploadSubmission";

describe("useUploadSubmission store", () => {
  test("transitions idle -> uploading -> success", async () => {
    const fakeApi: UploadSubmissionApi = {
      uploadSubmission: async () => ({ submissionId: "sub-123" }),
    };
    const store = createUploadSubmissionStore(fakeApi);

    expect(store.getState().status).toBe("idle");

    const promise = store
      .getState()
      .upload({ file: new Blob(["fake-image-bytes"]), lessonId: "lesson-1" });
    expect(store.getState().status).toBe("uploading");

    await promise;
    expect(store.getState()).toMatchObject({ status: "success", submissionId: "sub-123" });
  });

  test("transitions to error with a message when the upload fails", async () => {
    const fakeApi: UploadSubmissionApi = {
      uploadSubmission: async () => {
        throw new Error("Network error");
      },
    };
    const store = createUploadSubmissionStore(fakeApi);

    await store.getState().upload({ file: new Blob(["fake-image-bytes"]), lessonId: "lesson-1" });

    expect(store.getState()).toMatchObject({ status: "error", message: "Network error" });
  });

  test("reset returns to idle", async () => {
    const fakeApi: UploadSubmissionApi = {
      uploadSubmission: async () => ({ submissionId: "sub-123" }),
    };
    const store = createUploadSubmissionStore(fakeApi);

    await store.getState().upload({ file: new Blob(["fake-image-bytes"]), lessonId: "lesson-1" });
    store.getState().reset();

    expect(store.getState().status).toBe("idle");
  });
});
