import { mongo } from "#/config/mongo.ts";
import { FileMetadata } from "#/types.js";
import { ObjectId } from "mongodb";
import fs from "fs"
import { fileExists } from "#/utils/file.ts";

const db = mongo.collection<FileMetadata>("files")

export async function saveFileMetadata(metadata: FileMetadata): Promise<{ ok: true; id: ObjectId;  } | { ok: false; error: string }> {
  const exists = await fileExists(metadata.path)

  if (exists) {
    const result = await db.insertOne(metadata)
    return { ok: true, id: result.insertedId }
  }
  return { ok: false, error: "file_does_not_exist" as const}
}

export async function getFileById(id: ObjectId) {
  const metadata = await db.findOne({ _id: id })
  return metadata
}

const PAGE_SIZE = 15
export async function getFiles(page: number = 1) {
  const skipCount = (page - 1) * PAGE_SIZE
  const cursor = db.find({})
    .sort({ uploadedAt: -1 })
    .skip(skipCount)
    .limit(PAGE_SIZE)

  return await cursor.toArray()
}

export async function deleteFile(id: ObjectId) {
  const metadata = await getFileById(id)
  if (!metadata) {
    return "missing_file" as const
  }
  try {
    const res = await db.deleteOne({ _id: id})
    if (res.deletedCount === 0) {
      return "could_not_delete"
    }
    await fs.promises.unlink(metadata.path)
    return
  } catch {
    return "unknown_error" as const
  }
}
