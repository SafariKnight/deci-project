import "#/config/index.ts"
import { mongo } from "#/config/mongo.ts"
import { FileMetadata } from "#/types.js"
import path from "path"
import { deleteFileById, saveFileMetadata } from "./fileService.ts"
import fs from "fs"
import { fileURLToPath } from "url"

const db = mongo.collection("files")

const testMetadata: FileMetadata = {
  filename: "testFile.txt",
  uploadedAt: 1783627790456,
  path: "/home/kareem/projects/DECI/week8/backend/images/textFile.txt",
  size: 1962
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

afterEach(async () => {
  await db.drop()
})

describe("File Service", () => {
  it("Saves files", async () => {
    await fs.promises.copyFile(path.resolve(__dirname, "testFile.txt"), testMetadata.path)
    const file = await saveFileMetadata(testMetadata)

    if (!file.ok) {
      throw new Error("Failed to save metadata")
    }

    const res = await db.findOne({ _id: file.id})
    expect(res).toBeDefined()
    await fs.promises.unlink(testMetadata.path)
  })

  it("Can delete a file", async () => {
    await fs.promises.copyFile(path.resolve(__dirname, "testFile.txt"), testMetadata.path)
    const file = await saveFileMetadata(testMetadata)

    if (!file.ok) {
      throw new Error("Failed to save metadata")
    }

    await deleteFileById(file.id)

    const res = await db.findOne({ _id: file.id })

    expect(res).toBeNull()
  })
})
