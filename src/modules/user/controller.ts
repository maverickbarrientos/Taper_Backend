
import { Request, Response } from "express";
import { UserService } from "./service";
import { UpdateProfile } from "./types";

import { APIResponses } from "../../lib/api-responses";
import { AppError, ForbiddenError, NotFoundError } from "../../lib/errors";
import { UserRole } from "../../generated/prisma/enums";

export class UserController {

  constructor (private service: UserService) {}

  async createAthlete (req: Request, res: Response) {
    const athlete = await this.service.createAthlete(req.body);
    APIResponses.created(res, athlete);
  }

  async getAllAthletes (req: Request, res: Response) {
    const { role } = req.query

    const athletes = await this.service.getAllUsers({ role: role as UserRole });
    APIResponses.ok(res, athletes);
  }

  async getAthlete(req: Request, res: Response) {
    const { id } = req.params

    if (!id || typeof id !== "string") throw new AppError(400, "Athlete id is required");

    const athlete = await this.service.getAthlete({ id });
    APIResponses.ok(res, athlete)
  }

  async getProfile (req: Request, res: Response) {
    const user = req.user!
    if (!user || !user.id) throw new ForbiddenError("Invalid or expired token");

    const profile = await this.service.getProfile(user.id);
    if (!profile) throw new NotFoundError("User");

    APIResponses.ok(res, profile);
  }

  private pickProfile (body: Record<string, unknown>): UpdateProfile {
    const { firstName, lastName, email, password, events, goals } = body
    return {
      ...(firstName !== undefined && { firstName: firstName as string }),
      ...(lastName !== undefined && { lastName: lastName as string }),
      ...(email !== undefined && { email: email as string }),
      ...(password !== undefined && { password: password as string }),
      ...(events !== undefined && { events: events as string[] }),
      ...(goals !== undefined && { goals: goals as string[] }),
    }
  }

  async updateProfile (req: Request, res: Response) {
    const user = req.user!
    if (!user || !user.id) throw new ForbiddenError("Invalid or expired token");

    const updatedUser = await this.service.updateProfile(user.id, this.pickProfile(req.body));
    APIResponses.ok(res, updatedUser);
  }

  async updateAthleteProfile (req: Request, res: Response) {
    const user = req.user!
    if (!user || user.role !== UserRole.COACH) throw new ForbiddenError("Only coaches can update athlete profiles");

    const { id } = req.params

    if (!id || typeof id !== "string") throw new AppError(400, "Athlete id is required");

    const athlete = await this.service.getUser({ id, role: UserRole.ATHLETE });
    if (!athlete) throw new NotFoundError("Athlete");

    const updatedAthlete = await this.service.updateProfile(id, this.pickProfile(req.body));
    APIResponses.ok(res, updatedAthlete);
  }

  async deleteAthlete (req: Request, res: Response) {
    const { id } = req.params

    if (!id || typeof id !== "string") throw new AppError(400, "Athlete id is required");

    const deletedAthlete = await this.service.deleteAthlete(id);
    APIResponses.ok(res, deletedAthlete);
  }

}
