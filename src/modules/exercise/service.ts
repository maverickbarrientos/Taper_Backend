
import { PrismaClient } from "../../generated/prisma/client";
import { AthleteLogsWhereInput, ExerciseUpdateInput } from "../../generated/prisma/models";
import { CreateExercise, LogExercise } from "./types";
import { AppError, ConflictError, NotFoundError } from "../../lib/errors";
import { LoggedSet } from "../ai-summary/types";

export class ExerciseService {

  constructor (private db: PrismaClient) {}

  async getExistingLog (where: AthleteLogsWhereInput) {
    return await this.db.athleteLogs.findFirst({ where });
  }

  // an exercise is loggable only when it belongs to one of the athlete's programs
  async getAthleteExercise (exerciseId: string, athleteId: string) {
    const exercise = await this.db.exercise.findFirst({
      where: { id: exerciseId, session: { phase: { program: { athleteId } } } }
    });

    if (!exercise) throw new NotFoundError("Exercise");
    return exercise
  }

  private normalizeLog (log: unknown): LoggedSet[] {
    if (!Array.isArray(log) || log.length === 0) throw new AppError(400, "Log must contain at least one set");

    return log.map(entry => {
      const { set, reps } = (entry ?? {}) as Record<string, unknown>;
      const valid = (v: unknown) => (typeof v === "string" || typeof v === "number") && String(v).trim() !== "";

      if (!valid(set) || !valid(reps)) throw new AppError(400, "Each set needs a set number and reps");
      return { set: String(set).trim(), reps: String(reps).trim() };
    });
  }

  async addExercisesToSession (data: CreateExercise[]) {
    
    const exercise = await this.db.exercise.createMany({
      data: data.map((exercise, index) => ({
        sessionId: exercise.sessionId,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        order: exercise.order,
        notes: exercise.notes ?? "",
      }))
    });
    return exercise
  }

  async logExercise (data: LogExercise) {

    await this.getAthleteExercise(data.exerciseId, data.athleteId);
    const log = this.normalizeLog(data.log);

    const existingLog = await this.getExistingLog({ 
      athleteId: data.athleteId,
      exerciseId: data.exerciseId,
      loggedBy: data.loggedBy
    });

    if (existingLog) throw new ConflictError("Log for this exercise already exists");
    
    const createdLog = await this.db.athleteLogs.create({
      data: {
        athleteId: data.athleteId,
        exerciseId: data.exerciseId,
        loggedBy: data.loggedBy,
        log,
        notes: data.notes ?? ""
      }
    });

    await this.updateExercise(createdLog.exerciseId, { status: "LOGGED" });

    return createdLog
  }

  async updateLog (data: LogExercise) {

    await this.getAthleteExercise(data.exerciseId, data.athleteId);

    const existingLog = await this.getExistingLog({ athleteId: data.athleteId, exerciseId: data.exerciseId });
    if (!existingLog) throw new NotFoundError("Log");

    return await this.db.athleteLogs.update({
      where: { id: existingLog.id },
      data: { log: this.normalizeLog(data.log), notes: data.notes ?? "" }
    });
  }

  async updateExercise(exerciseId: string, data: ExerciseUpdateInput) {

    const updatedExercise = await this.db.exercise.update({
      where: { id: exerciseId },
      data
    });

    return updatedExercise

  }

}