
import { PrismaClient } from "../../generated/prisma/client";
import { AthleteLogsWhereInput } from "../../generated/prisma/models";
import { CreateExercise, LogExercise } from "./types";
import { ConflictError } from "../../lib/errors";

export class ExerciseService {

  constructor (private db: PrismaClient) {}

  async getExistingLog (where: AthleteLogsWhereInput) {
    return await this.db.athleteLogs.findFirst({ where });
  }

  async addExerciseToSession (data: CreateExercise) {
    
    const exercise = await this.db.exercise.create({
      data: {
        sessionId: data.sessionId,
        name: data.name,
        sets: data.sets,
        reps: data.reps,
        notes: data.notes ?? ""
      }
    });

    return exercise

  }

  async logExercise (data: LogExercise) {

    const existingLog = await this.getExistingLog({ 
      athleteId: data.athleteId,
      exerciseId: data.exerciseId,
      loggedBy: data.loggedBy
    });

    if (existingLog) throw new ConflictError("Log for this exercise already exists");
    
    const log = await this.db.athleteLogs.create({
      data: {
        athleteId: data.athleteId,
        exerciseId: data.exerciseId,
        loggedBy: data.loggedBy,
        actualSets: data.actualSets,
        actualReps: data.actualReps,
        notes: data.notes ?? ""
      }
    });

    return log
  }

}