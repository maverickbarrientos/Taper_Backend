
import { Request, Response } from "express";
import { ExerciseService } from "./service";
import { APIResponses } from "../../lib/api-responses";
import { AppError } from "../../lib/errors";

export class ExerciseController {

  constructor (private service: ExerciseService) {}

  async addExercisesToSession(req: Request, res: Response) {
    const exercise = await this.service.addExercisesToSession(req.body);
    return APIResponses.created(res, exercise);
  }

  async logExercise(req: Request, res: Response) {
    const user = req.user!

    console.log(user);

    if (!req.body?.exerciseId || typeof req.body.exerciseId !== "string") throw new AppError(400, "Exercise id is required");

    const log = await this.service.logExercise({ ...req.body, athleteId: user.id, loggedBy: user.id });
    return APIResponses.created(res, log);
  }

  async updateLog(req: Request, res: Response) {
    const user = req.user!
    const { exerciseId } = req.params

    if (!exerciseId || typeof exerciseId !== "string") throw new AppError(400, "Exercise id is required");

    const log = await this.service.updateLog({ ...req.body, exerciseId, athleteId: user.id, loggedBy: user.id });
    return APIResponses.ok(res, log);
  }
}