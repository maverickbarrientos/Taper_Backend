
import { Request, Response } from "express"
import { ProgramService } from "./service"
import { APIResponses } from "../../lib/api-responses";
import { AppError, ForbiddenError, NotFoundError } from "../../lib/errors";

export class ProgramController {

  constructor (private service: ProgramService) {}

  async createProgram (req: Request, res: Response) {
    const createdProgram = await this.service.createProgram(req.body);
    APIResponses.created(res, createdProgram);
  }

  async getProgram (req: Request, res: Response) {

    const { id } = req.params

    if (typeof id !== "string" || !id) {
      throw new AppError(400, "Program id is required");
    }

    const program = await this.service.getProgram({ id });

    if (!program) throw new NotFoundError("Program");
    APIResponses.ok(res, program);
  }

  async getAthleteProgram(req: Request, res: Response) {
    const user = req.user!
    if (!user || !user.id || !user.email) throw new ForbiddenError("Invalid or expired token");

    const program = await this.service.getProgram({ athleteId: user.id, status: "ONGOING" });
    APIResponses.ok(res, program);
  }

  async getAllPrograms (req: Request, res: Response) {
    const programs = await this.service.getAllPrograms();
    return APIResponses.ok(res, programs);
  }

  async updateProgram (req: Request, res: Response) {

    const { id } = await req.params

    if (!id || typeof id !== "string") throw new AppError(400, "Program id is required");

    const updatedProgram = await this.service.updateProgram(id, req.body);
    APIResponses.created(res, updatedProgram);
  }

  async createPhase (req: Request, res: Response) {
    const createdPhase = await this.service.createPhase(req.body);
    APIResponses.created(res, createdPhase);
  }

  async getProgramWeekData(req: Request, res: Response) {
    const { id } = req.params;
    const { athleteId } = req.body

    if (!id || typeof id !== "string") throw new AppError(400, "Program id is required");

    const weeklySummary = await this.service.getProgramWeekData({ id, athleteId });
    APIResponses.ok(res, weeklySummary);
  }

  async generateWeeklySummary(req: Request, res: Response) {
    const { id } = req.params;
    const { athleteId } = req.body

    if (!id || typeof id !== "string") throw new AppError(400, "Program id is required");

    const weeklySummary = await this.service.generateWeeklySummary({ id, athleteId }, true);
    APIResponses.ok(res, weeklySummary);
  }

  async getPhase (req: Request, res: Response) {
    const { id } = req.params

    if (!id || typeof id !== "string") throw new AppError(400, "Phase id is required")

    const phase = await this.service.getPhase({ id });
    APIResponses.ok(res, phase)
  }

  async updatePhase(req: Request, res: Response) {
    const { id } = req.params

    if (!id || typeof id !== "string") throw new AppError(400, "Phase id is required")

    const updatedPhase = await this.service.updatePhase(id, req.body);
    APIResponses.created(res, updatedPhase);
  }

  async deleteProgram(req: Request, res: Response) {
    const { id } = req.params

    if (!id || typeof id !== "string") throw new AppError(400, "Program id is required");

    const deletedProgram = await this.service.deleteProgram(id);
    APIResponses.ok(res, deletedProgram);
  }

  async deletePhase(req: Request, res: Response) {
    const { id } = req.params

    if (!id || typeof id !== "string") throw new AppError(400, "Phase id is required")

    const deletedPhase = await this.service.deletePhase(id);
    APIResponses.ok(res, deletedPhase);
  }

  async getMyProgramView(req: Request, res: Response) {
    const user = req.user!
    if (!user || !user.id) throw new ForbiddenError("Invalid or expired token");

    const view = await this.service.getAthleteProgramView(user.id);
    APIResponses.ok(res, view);
  }

  async getMyProgramList(req: Request, res: Response) {
    const user = req.user!
    if (!user || !user.id) throw new ForbiddenError("Invalid or expired token");

    const programs = await this.service.getAthleteProgramList(user.id);
    APIResponses.ok(res, programs);
  }

  async getMyProgramById(req: Request, res: Response) {
    const user = req.user!
    if (!user || !user.id) throw new ForbiddenError("Invalid or expired token");

    const { id } = req.params

    if (!id || typeof id !== "string") throw new AppError(400, "Program id is required");

    const view = await this.service.getAthleteProgramView(user.id, id);
    APIResponses.ok(res, view);
  }

}
