
import { Request, Response } from "express";
import { UserService } from "./service";

import { APIResponses } from "../../lib/api-responses";

export class UserController {

  constructor (private service: UserService) {}

  async createAthlete (req: Request, res: Response) {
    const athlete = await this.service.createAthlete(req.body);
    APIResponses.created(res, athlete);
  }

}