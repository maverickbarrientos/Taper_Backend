
import { ExerciseCreateInput, AthleteLogsCreateInput } from "../../generated/prisma/models";

export type CreateExercise = 
  Pick<ExerciseCreateInput, "name" | "sets" | "reps" | "notes">
  & { sessionId: string }

export type LogExercise =
  Pick<AthleteLogsCreateInput, "actualSets" | "actualReps" | "notes">
  & { exerciseId: string, loggedBy: string, athleteId: string }