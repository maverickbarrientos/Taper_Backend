
import { ProgramCreateInput, PhaseCreateInput } from "../../generated/prisma/models";

export type CreateProgram = 
  Pick<ProgramCreateInput, "name" | "date" | "startDate" | "endDate"> 
  & { athleteId: string }

export type CreatePhase = 
  Pick<PhaseCreateInput, "name" | "phaseType" | "startDate" | "endDate">
  & { programId: string }