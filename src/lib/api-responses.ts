
import { Response } from "express";

export class APIResponses {

  static ok<T>(res: Response, data: T, message: string = "Success") {
    return res.status(200).json({ success: true, message, data });
  }

  static created<T>(res: Response, data: T, message: string = "Created") {
    return res.status(201).json({ success: true, message, data });
  }

}