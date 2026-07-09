import { mongo } from "#/config/mongo.ts";
import { FileMetadata } from "../types.js";
import { ObjectId } from "mongodb";
import fs from "fs"
import { fileExists } from "#/utils/file.ts";

const db = mongo.collection<FileMetadata>("files")

export async function saveFileMetadata(metadata: FileMetadata): Promise<{ ok: true; id: ObjectId;  } | { ok: false; error: "file_does_not_exist" }> {
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

export async function getFileByFilename(filename: string) {
  const metadata = await db.findOne({ filename })
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

export async function deleteFileById(id: ObjectId) {
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

export async function deleteFileByFilename(filename: string) {
  const metadata = await getFileByFilename(filename)
  if (!metadata) {
    return "missing_file" as const
  }
  try {
    const res = await db.deleteOne({ _id: metadata._id})
    if (res.deletedCount === 0) {
      return "could_not_delete"
    }
    await fs.promises.unlink(metadata.path)
    return
  } catch {
    return "unknown_error" as const
  }
}
