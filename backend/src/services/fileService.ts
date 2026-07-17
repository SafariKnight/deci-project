import { mongo } from '#src/config/mongo.js';
import { FileMetadata } from "../types.js";
import { GridFSBucket, ObjectId } from "mongodb";
import { Readable } from "stream";
import { ERROR_CODES, Result } from '#src/utils/errorCodes.js';

const bucket = new GridFSBucket(mongo, { bucketName: "images" });
const filesCollection = mongo.collection<FileMetadata>("files");

export async function uploadFile(
  filename: string,
  buffer: Buffer,
  metadata: { owner: number; uploadedAt: number },
): Promise<Result<{ metadata: FileMetadata }>> {
  return new Promise((resolve) => {
    const readable = Readable.from(buffer);
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { owner: metadata.owner, uploadedAt: metadata.uploadedAt },
    });

    readable.pipe(uploadStream);

    uploadStream.on("finish", async () => {
      const fileMetadata: FileMetadata = {
        filename,
        gridfsId: uploadStream.id.toString(),
        size: buffer.length,
        uploadedAt: metadata.uploadedAt,
        owner: metadata.owner,
      };

      await filesCollection.insertOne(fileMetadata);
      resolve({ ok: true, metadata: fileMetadata });
    });

    uploadStream.on("error", () => {
      resolve({ ok: false, error: ERROR_CODES.FILE.UPLOAD_FAILED });
    });
  });
}

export async function getFileStream(filename: string): Promise<{
  stream: Readable;
  length: number;
  contentType: string;
} | null> {
  const file = await filesCollection.findOne({ filename });
  if (!file) return null;
  const stream = bucket.openDownloadStream(new ObjectId(file.gridfsId));
  return { stream, length: file.size, contentType: "application/octet-stream" };
}

export async function getFileByFilename(
  filename: string,
): Promise<Result<{ metadata: FileMetadata }>> {
  const metadata = await filesCollection.findOne({ filename });
  if (!metadata) {
    return { ok: false, error: ERROR_CODES.FILE.NOT_FOUND };
  }
  return { ok: true, metadata };
}

const PAGE_SIZE = 15;
export async function getFiles(page: number = 1) {
  const skipCount = (page - 1) * PAGE_SIZE;
  const cursor = filesCollection
    .find({})
    .sort({ uploadedAt: -1 })
    .skip(skipCount)
    .limit(PAGE_SIZE);
  return await cursor.toArray();
}

export async function deleteFileByFilename(
  filename: string,
): Promise<Result<{ ok: true }>> {
  const result = await getFileByFilename(filename);
  if (!result.ok) {
    return { ok: false, error: ERROR_CODES.FILE.MISSING };
  }
  const metadata = result.metadata;
  try {
    await bucket.delete(new ObjectId(metadata.gridfsId));
    await filesCollection.deleteOne({ filename });
    return { ok: true };
  } catch {
    return { ok: false, error: ERROR_CODES.FILE.UNKNOWN };
  }
}
