
import { Request, Response } from "express";
import { ExerciseService } from "./service";
import { APIResponses } from "../../lib/api-responses";

export class ExerciseController {

  constructor (private service: ExerciseService) {}

  async addExerciseToSession(req: Request, res: Response) {
    const exercise = await this.service.addExerciseToSession(req.body);
    return APIResponses.created(res, exercise);
  }

  async logExercise(req: Request, res: Response) {
    const log = await this.service.logExercise(req.body);
    return APIResponses.created(res, log);
  }
}