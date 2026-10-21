
import { Request, Response } from "express"
import { ProgramService } from "./service"
import { APIResponses } from "../../lib/api-responses";
import { AppError, NotFoundError } from "../../lib/errors";

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

  async getAthleteProgram (req: Request, res: Response) {

    const { id } = req.params

    if (typeof id !== "string" || !id) {
      throw new AppError(400, "Program id is required");
    }

    const athleteProgram = await this.service.getAthleteProgram({ id });

    if (!athleteProgram) throw new NotFoundError("Program")

    return APIResponses.ok(res, athleteProgram);
  }

  async getAllPrograms (req: Request, res: Response) {

    const programs = await this.service.getAllPrograms();
    return APIResponses.ok(res, programs);

  }
}