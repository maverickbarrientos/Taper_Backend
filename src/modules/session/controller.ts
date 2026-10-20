
import { Request, Response } from "express";
import { SessionService } from "./service";
import { APIResponses } from "../../lib/api-responses";

export class SessionController {

  constructor (private service: SessionService) {}

  async createSession (req: Request, res: Response) {
    const createdSession = await this.service.createSession(req.body);
    APIResponses.created(res, createdSession);
  }

}