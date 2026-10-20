
import { PrismaClient } from "../../generated/prisma/client";
import { CreateExercise } from "./types";

export class ExerciseService {

  constructor (private db: PrismaClient) {}

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

}