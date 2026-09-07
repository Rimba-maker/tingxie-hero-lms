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

    const result = await promise;
    expect(result).toMatchObject({
      status: "success",
      submissionId: "sub-123",
      score: 2,
      totalPossible: 3,
    });
    expect(store.getState()).toMatchObject(result);
  });

  test("transitions to error with a message when the upload step fails", async () => {
    const fakeApi: UploadSubmissionApi = {
      uploadSubmission: async () => {
        throw new Error("Network error");
      },
      gradeSubmission: async () => ({ score: 0, totalPossible: 0 }),
    };
    const store = createUploadSubmissionStore(fakeApi);

    const result = await store
      .getState()
      .upload({ file: new Blob(["fake-image-bytes"]), lessonId: "lesson-1" });

    expect(result).toMatchObject({ status: "error", message: "Network error" });
    expect(store.getState()).toMatchObject(result);
  });

  test("transitions to error with a message when the grade step fails, keeping the submissionId", () => {
    const fakeApi: UploadSubmissionApi = {
      uploadSubmission: async () => ({ submissionId: "sub-123" }),
      gradeSubmission: async () => {
        throw new Error("Grading failed");
      },
    };
    const store = createUploadSubmissionStore(fakeApi);

    return store
      .getState()
      .upload({ file: new Blob(["fake-image-bytes"]), lessonId: "lesson-1" })
      .then((result) => {
        // The submission itself uploaded fine - only grading failed. Keeping
        // its id lets the caller retry grading without re-uploading the photo.
        expect(result).toMatchObject({
          status: "error",
          message: "Grading failed",
          submissionId: "sub-123",
        });
        expect(store.getState()).toMatchObject(result);
      });
  });

  test("an upload-step failure carries no submissionId - there's nothing to retry grading for", async () => {
    const fakeApi: UploadSubmissionApi = {
      uploadSubmission: async () => {
        throw new Error("Network error");
      },
      gradeSubmission: async () => ({ score: 0, totalPossible: 0 }),
    };
    const store = createUploadSubmissionStore(fakeApi);

    const result = await store
      .getState()
      .upload({ file: new Blob(["fake-image-bytes"]), lessonId: "lesson-1" });

    expect(result).toMatchObject({ status: "error", message: "Network error" });
    expect("submissionId" in result && result.submissionId).toBeFalsy();
  });

  test("retryGrade re-grades an existing submission without uploading a new photo", async () => {
    let uploadCalls = 0;
    let gradeCalls = 0;
    const fakeApi: UploadSubmissionApi = {
      uploadSubmission: async () => {
        uploadCalls++;
        return { submissionId: "sub-123" };
      },
      gradeSubmission: async () => {
        gradeCalls++;
        if (gradeCalls === 1) throw new Error("Grading failed");
        return { score: 3, totalPossible: 3 };
      },
    };
    const store = createUploadSubmissionStore(fakeApi);

    await store.getState().upload({ file: new Blob(["fake-image-bytes"]), lessonId: "lesson-1" });
    expect(store.getState().status).toBe("error");

    const result = await store.getState().retryGrade("sub-123");

    expect(uploadCalls).toBe(1); // never re-uploaded
    expect(gradeCalls).toBe(2);
    expect(result).toMatchObject({ status: "success", submissionId: "sub-123", score: 3, totalPossible: 3 });
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
