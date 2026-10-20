
import { ExerciseCreateInput } from "../../generated/prisma/models";

export type CreateExercise = 
  Pick<ExerciseCreateInput, "name" | "sets" | "reps" | "notes">
  & { sessionId: string }