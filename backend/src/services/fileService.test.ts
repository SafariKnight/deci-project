import "#src/config/index.ts";
import { mongo } from '#src/config/mongo.js';
import { FileMetadata } from "#src/types.js";
import {
  deleteFileByFilename,
  getFileByFilename,
  getFiles,
  uploadFile,
} from './fileService.js';
import { ERROR_CODES } from '#src/utils/errorCodes.js';

const filesDb = mongo.collection("files");

afterEach(async () => {
  await filesDb.drop().catch(() => {});
  await mongo.collection("images.files").drop().catch(() => {});
  await mongo.collection("images.chunks").drop().catch(() => {});
});

const testBuffer = Buffer.from("This is a test\n");

describe("File Service", () => {
  it("Uploads a file to GridFS and saves metadata", async () => {
    const result = await uploadFile("testFile.txt", testBuffer, {
      owner: 1,
      uploadedAt: 1783627790456,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Test failed");
    expect(result.metadata.filename).toBe("testFile.txt");
    expect(result.metadata.size).toBe(testBuffer.length);
    expect(result.metadata.owner).toBe(1);

    const res = await filesDb.findOne({ filename: "testFile.txt" });
    expect(res).toBeDefined();
  });

  it("Can retrieve a file by filename", async () => {
    await uploadFile("testFile.txt", testBuffer, {
      owner: 1,
      uploadedAt: 1783627790456,
    });

    const result = await getFileByFilename("testFile.txt");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Test failed");
    expect(result.metadata.filename).toBe("testFile.txt");
  });

  it("Returns not found for non-existent filename", async () => {
    const result = await getFileByFilename("does-not-exist.txt");

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Test failed");
    expect(result.error).toBe(ERROR_CODES.FILE.NOT_FOUND);
  });

  it("Can delete a file", async () => {
    const result = await uploadFile("testFile.txt", testBuffer, {
      owner: 1,
      uploadedAt: 1783627790456,
    });
    if (!result.ok) throw new Error("Setup failed");

    const deleteResult = await deleteFileByFilename("testFile.txt");
    expect(deleteResult.ok).toBe(true);

    const res = await filesDb.findOne({ filename: "testFile.txt" });
    expect(res).toBeNull();
  });

  it("Fails to delete a non-existent file", async () => {
    const result = await deleteFileByFilename("ghost.txt");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Test failed");
    expect(result.error).toBe(ERROR_CODES.FILE.MISSING);
  });

  it("Lists files correctly", async () => {
    await uploadFile("testFile.txt", testBuffer, {
      owner: 1,
      uploadedAt: 1783627790456,
    });

    const files = await getFiles(1);
    expect(files).toBeInstanceOf(Array);
    expect(files.length).toBeGreaterThan(0);
    expect(files[0].filename).toBe("testFile.txt");
  });
});
