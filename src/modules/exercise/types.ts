
import { ExerciseCreateInput, AthleteLogsCreateInput } from "../../generated/prisma/models";

export type CreateExercise = 
  Pick<ExerciseCreateInput, "name" | "sets" | "reps" | "order" | "notes">
  & { sessionId: string }

export type LogExercise =
  Pick<AthleteLogsCreateInput, "log" | "notes">
  & { exerciseId: string, loggedBy: string, athleteId: string }