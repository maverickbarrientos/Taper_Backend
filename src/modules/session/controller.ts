
import { Request, Response } from "express";
import { SessionService } from "./service";
import { APIResponses } from "../../lib/api-responses";
import { AppError, ForbiddenError } from "../../lib/errors";
import { UserRole } from "../../generated/prisma/enums";

export class SessionController {

  constructor (private service: SessionService) {}

  async createSession (req: Request, res: Response) {
    const createdSession = await this.service.createSession(req.body);
    APIResponses.created(res, createdSession);
  }

  async getCalendar (req: Request, res: Response) {
    const user = req.user!
    if (!user || !user.id) throw new ForbiddenError("Invalid or expired token");

    const { start, end, athleteId } = req.query

    const startDate = new Date(String(start));
    const endDate = new Date(String(end));

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new AppError(400, "Valid start and end dates are required");
    }

    let targetId: string | undefined = user.id;

    if (user.role === UserRole.COACH) {
      if (athleteId !== undefined && typeof athleteId !== "string") throw new AppError(400, "Invalid athlete id");
      targetId = athleteId;
    }

    const sessions = await this.service.getCalendar(targetId, startDate, endDate);
    APIResponses.ok(res, sessions);
  }

  async getSession(req: Request, res: Response) {
    const { id } = req.params

    if (!id || typeof id !== "string") throw new AppError(400, "Session id is required")

    const session = await this.service.getSession({ id });
    APIResponses.ok(res, session);
  }

  async updateSession (req: Request, res: Response) {
    const { id } = req.params

    if (!id || typeof id !== "string") throw new AppError(400, "Session id is required")

    const updatedSession = await this.service.updateSession(id, req.body);
    APIResponses.created(res, updatedSession);
  }

  async deleteSession (req: Request, res: Response) {
    const { id } = req.params

    if (!id || typeof id !== "string") throw new AppError(400, "Session id is required")

    const deletedSession = await this.service.deleteSession(id);
    APIResponses.ok(res, deletedSession);
  }

}
