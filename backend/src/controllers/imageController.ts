import {
  deleteFileByFilename,
  getFileByFilename,
  getFileStream,
  uploadFile,
} from '#src/services/fileService.js';
import { FileMetadata } from "../types.js";
import { RequestHandler } from "express";
import { type Request, type Response } from "express";
import { ERROR_CODES } from '#src/utils/errorCodes.js';
import path from "path";

export const uploadRoute: RequestHandler = async (req, res) => {
  const user = req.user;
  if (!req.file) {
    res.status(422).json({
      message: "Missing Image",
      error: "missing_image",
    });
    return;
  }

  const ext = path.extname(req.file.originalname);
  const filename = Date.now().toString() + ext;

  const result = await uploadFile(filename, req.file.buffer, {
    owner: user.id,
    uploadedAt: Date.now(),
  });

  if (!result.ok) {
    res.status(500).json({
      message: "File failed to upload",
      error: result.error,
    });
    return;
  }

  res.status(201).json({
    message: "Successfully created",
    path: `${process.env.BASE_URL}/image/by-name/${filename}`,
    filename,
  });
};

export const deleteRoute = async (
  req: Request<{ image: string }>,
  res: Response,
) => {
  const user = req.user;
  const filename = req.params.image;

  const fileResult = await getFileByFilename(filename);

  if (!fileResult.ok) {
    res.status(404).json({
      message: "File does not exist",
      error: fileResult.error,
    });
    return;
  }

  const file = fileResult.metadata;

  if (user.id !== file.owner && user.role !== "ADMIN") {
    res.status(403).json({
      message: "You're not authorized to delete this file",
      error: ERROR_CODES.USER.FORBIDDEN,
    });
    return;
  }

  const deleteResult = await deleteFileByFilename(file.filename);

  if (!deleteResult.ok) {
    res.status(500).json({
      message: "Failed to delete file",
      error: deleteResult.error,
    });
    return;
  }

  res.status(200).json({
    message: "Successfully deleted",
  });
};

export const getRoute: RequestHandler = async (req, res) => {
  const filename = req.params.image as string;

  const fileStream = await getFileStream(filename);
  if (!fileStream) {
    res.status(404).json({
      message: "File not found",
      error: ERROR_CODES.FILE.NOT_FOUND,
    });
    return;
  }

  res.setHeader("Content-Type", fileStream.contentType);
  res.setHeader("Content-Length", fileStream.length);
  fileStream.stream.pipe(res);
};
