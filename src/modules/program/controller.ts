
import { Request, Response } from "express"
import { ProgramService } from "./service"
import { APIResponses } from "../../lib/api-responses";

export class ProgramController {

  constructor (private service: ProgramService) {}

  async createProgram (req: Request, res: Response) {
    const createdProgram = await this.service.createProgram(req.body);
    APIResponses.created(res, createdProgram);
  }

  async createPhase (req: Request, res: Response) {
    const createdPhase = await this.service.createPhase(req.body);
    APIResponses.created(res, createdPhase);
  }
}