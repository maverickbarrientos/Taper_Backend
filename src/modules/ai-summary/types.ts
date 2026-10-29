
import { Prisma } from "../../generated/prisma/client";

export const weeklySummarySelect = (athleteId: string, weekStart: Date, weekEnd: Date) => ({
  name: true, date: true, status: true, startDate: true, endDate: true,
  phase: {
    where: { status: "ONGOING" },
    select: {
      session: {
        where: { date: { gte: weekStart, lt: weekEnd } },
        orderBy: { date: "asc" },
        select: {
          title: true, notes: true, date: true,
          exercise: {
            orderBy: { order: "asc" },
            select: {
              name: true, sets: true, reps: true, notes: true, status: true,
              athleteLogs: {
                where: { athleteId },
                select: { log: true, notes: true, loggedAt: true }
              }
            }
          }
        }
      }
    }
  }
} satisfies Prisma.ProgramSelect);

export type WeeklyProgramData = Prisma.ProgramGetPayload<{
  select: ReturnType<typeof weeklySummarySelect>
}>;

export type WeeklySessionData = WeeklyProgramData["phase"][number]["session"][number];

// Shape of one entry in AthleteLogs.log (Json[] in the schema)
export type LoggedSet = { set: string; reps: string };
