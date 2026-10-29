import { Request, Response } from "express";
import { DashboardService } from "./service";
import { APIResponses } from "../../lib/api-responses";
import { AppError, ForbiddenError } from "../../lib/errors";

export class DashboardController {

  constructor (private service: DashboardService) {}

  async getOverview (req: Request, res: Response) {
    const overview = await this.service.getOverview();
    APIResponses.ok(res, overview);
  }

  async getAthletes (req: Request, res: Response) {
    const athletes = await this.service.getAthletes();
    APIResponses.ok(res, athletes);
  }

  async getTrend (req: Request, res: Response) {
    const { weeks, athleteId } = req.query

    if (athleteId !== undefined && typeof athleteId !== "string") throw new AppError(400, "Invalid athlete id");

    const trend = await this.service.getTrend(weeks === undefined ? 8 : Number(weeks), athleteId);
    APIResponses.ok(res, trend);
  }

  async getMyProgress (req: Request, res: Response) {
    const user = req.user!
    if (!user || !user.id) throw new ForbiddenError("Invalid or expired token");

    const progress = await this.service.getAthleteProgress(user.id);
    APIResponses.ok(res, progress);
  }

}
