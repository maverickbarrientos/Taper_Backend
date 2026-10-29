
import { SessionCreateInput } from "../../generated/prisma/models";
import { CreateExercise } from "../exercise/types";

export type CreateSession =
  Pick<SessionCreateInput, "title" | "date" | "notes"> & {
    phaseId: string
    exercise: Omit<CreateExercise, "sessionId">[]
  }

export type UpdateSession =
  Partial<Omit<CreateSession, "exercise">>
  & { exercise: (Omit<CreateExercise, "sessionId"> & { id?: string })[] }