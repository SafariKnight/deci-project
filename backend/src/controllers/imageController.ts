import { RequestHandler } from "express";

/*
{
  fieldname: 'image',
  originalname: 'Screenshot 2026-07-02 18:30:03.png',
  encoding: '7bit',
  mimetype: 'image/png',
  path: '/home/kareem/projects/DECI/week8/backend/images/1783616056596.png',
  destination: '/home/kareem/projects/DECI/week8/images/backend',
  filename: '1783616056596.png',
  size: 1962
}
*/

export const uploadRoute: RequestHandler = (req, res) => {
  if (!req.file) {
    res.status(422).send({
      message: "Missing Image",
      error: "missing_image"
    })
    return
  }

  const image = req.file
  console.log(image)

}
