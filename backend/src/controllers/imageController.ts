import {
  deleteFileByFilename,
  getFileByFilename,
  saveFileMetadata,
} from "#/services/fileService.ts";
import { FileMetadata } from "../types.js";
import { RequestHandler } from "express";
import { type Request, type Response } from "express";

export const uploadRoute: RequestHandler = async (req, res) => {
  const user = req.user;
  if (!req.file) {
    res.status(422).send({
      message: "Missing Image",
      error: "missing_image",
    });
    return;
  }

  const metadata: FileMetadata = {
    filename: req.file.filename,
    path: req.file.path,
    size: req.file.size,
    uploadedAt: Date.now(),
    owner: user.id,
  };

  const saveResult = await saveFileMetadata(metadata);

  if (!saveResult.ok) {
    res.status(500).json({
      message: "File failed to upload",
      error: saveResult.error,
    });
    return;
  }
  res.status(201).json({
    message: "Successfully created",
    path: `${process.env.BASE_URL}/image/by-name/${metadata.filename}`,
  });
};

export const deleteRoute = async (req: Request<{ image: string }>, res: Response) => {
  const user = req.user;
  const filename = req.params.image;

  const file = await getFileByFilename(filename);

  if (!file) {
    res.status(404).send({
      message: "File does not exist",
      error: "file_not_exist",
    });
    return;
  }

  if (user.id !== file.owner && user.role !== "ADMIN") {
    res.status(403).json({
      message: "You're not authorized to delete this file",
      error: "not_authorized",
    });
    return;
  }

  await deleteFileByFilename(file.filename);

  res.status(200).json({
    message: "Successfully deleted",
  });
};
