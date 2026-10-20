
import { SessionCreateInput } from "../../generated/prisma/models";

export type CreateSession = 
  Pick<SessionCreateInput, "title" | "date" | "notes">
  & { phaseId: string } 