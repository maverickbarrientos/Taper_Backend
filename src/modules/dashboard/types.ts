import { PhaseType } from "../../generated/prisma/enums";

export type ComplianceTally = {
  logged: number
  missed: number
  compliance: number | null // 0-100, null when nothing was due
}

export type AttentionReason =
  | "NO_ONGOING_PROGRAM"
  | "LOW_COMPLIANCE"
  | "MISSED_THIS_WEEK"
  | "INACTIVE"
  | "PROGRAM_ENDING_SOON"

export type AthleteRow = {
  id: string
  firstName: string
  lastName: string
  program: { id: string, name: string, startDate: Date, endDate: Date } | null
  phase: { id: string, name: string, phaseType: PhaseType, startDate: Date, endDate: Date, progress: number } | null
  week: ComplianceTally
  programToDate: ComplianceTally
  lastLoggedAt: Date | null
  reasons: AttentionReason[]
}

export type TrendPoint = ComplianceTally & { weekStart: Date }
