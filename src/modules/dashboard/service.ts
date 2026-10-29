import { PrismaClient, UserRole } from "../../generated/prisma/client";
import { PhaseStatus, ProgramStatus } from "../../generated/prisma/enums";
import { addDays, addWeeks, elapsedPercent, startOfDay, startOfWeek } from "../../lib/utils";
import { AppError, NotFoundError } from "../../lib/errors";
import { LoggedSet } from "../ai-summary/types";
import { AthleteRow, AttentionReason, ComplianceTally, TrendPoint } from "./types";

const LOW_COMPLIANCE = 60;
const INACTIVE_DAYS = 5;
const ENDING_SOON_DAYS = 14;
const MAX_TREND_WEEKS = 26;
const PROGRESS_WEEKS = 8;
const RECENT_LOGS = 10;

type DueExercise = { athleteId: string, date: Date, status: string }

export class DashboardService {

  constructor (private db: PrismaClient) {}

  // an exercise is "missed" when flagged MISSED, or still PENDING after its session date passed
  private tally(rows: { status: string }[]): ComplianceTally {
    const logged = rows.filter(r => r.status === "LOGGED").length;
    const missed = rows.length - logged;
    return { logged, missed, compliance: rows.length ? Math.round((logged / rows.length) * 100) : null };
  }

  // exercises whose session date has already passed
  private async getDueExercises(athleteIds: string[], from: Date, now: Date): Promise<DueExercise[]> {
    const exercises = await this.db.exercise.findMany({
      where: {
        session: {
          date: { gte: from, lt: now },
          phase: { program: { athleteId: { in: athleteIds } } }
        }
      },
      select: {
        status: true,
        session: { select: { date: true, phase: { select: { program: { select: { athleteId: true } } } } } }
      }
    });

    return exercises.map(e => ({
      athleteId: e.session.phase.program.athleteId,
      date: e.session.date,
      status: e.status,
    }));
  }

  private phaseProgress(start: Date, end: Date, now: Date) {
    return elapsedPercent(start, end, now);
  }

  async getAthletes(): Promise<AthleteRow[]> {

    const now = new Date();
    const weekStart = startOfWeek(now);

    const athletes = await this.db.user.findMany({
      where: { role: UserRole.ATHLETE, deletedAt: null },
      orderBy: { firstName: "asc" },
      include: {
        program: {
          where: { status: ProgramStatus.ONGOING },
          take: 1,
          include: { phase: { where: { status: PhaseStatus.ONGOING }, take: 1 } }
        }
      }
    });

    const ids = athletes.map(a => a.id);

    const [due, lastLogs] = await Promise.all([
      this.getDueExercises(ids, new Date(0), now),
      this.db.athleteLogs.groupBy({
        by: ["athleteId"],
        where: { athleteId: { in: ids } },
        _max: { loggedAt: true }
      })
    ]);

    const lastLogged = new Map(lastLogs.map(l => [l.athleteId, l._max.loggedAt]));

    return athletes.map(a => {
      const program = a.program[0] ?? null;
      const phase = program?.phase[0] ?? null;
      const mine = due.filter(d => d.athleteId === a.id);
      const week = this.tally(mine.filter(d => d.date >= weekStart));
      const programToDate = this.tally(mine);
      const lastLoggedAt = lastLogged.get(a.id) ?? null;

      const reasons: AttentionReason[] = [];
      if (!program) reasons.push("NO_ONGOING_PROGRAM");
      if (programToDate.compliance !== null && programToDate.compliance < LOW_COMPLIANCE) reasons.push("LOW_COMPLIANCE");
      if (week.missed > 0) reasons.push("MISSED_THIS_WEEK");
      if (program && (!lastLoggedAt || lastLoggedAt < addDays(now, -INACTIVE_DAYS))) reasons.push("INACTIVE");
      if (program && program.endDate < addDays(now, ENDING_SOON_DAYS)) reasons.push("PROGRAM_ENDING_SOON");

      return {
        id: a.id,
        firstName: a.firstName,
        lastName: a.lastName,
        program: program && { id: program.id, name: program.name, startDate: program.startDate, endDate: program.endDate },
        phase: phase && {
          id: phase.id, name: phase.name, phaseType: phase.phaseType,
          startDate: phase.startDate, endDate: phase.endDate,
          progress: this.phaseProgress(phase.startDate, phase.endDate, now),
        },
        week,
        programToDate,
        lastLoggedAt,
        reasons,
      };
    });
  }

  async getOverview() {

    const today = startOfDay();

    const [athletes, sessionsToday] = await Promise.all([
      this.getAthletes(),
      this.db.session.count({ where: { date: { gte: today, lt: addDays(today, 1) } } })
    ]);

    const withProgram = athletes.filter(a => a.program);
    const weekLogged = athletes.reduce((n, a) => n + a.week.logged, 0);
    const weekDue = athletes.reduce((n, a) => n + a.week.logged + a.week.missed, 0);

    const phaseDistribution: Record<string, number> = {};
    for (const a of athletes) {
      if (a.phase) phaseDistribution[a.phase.phaseType] = (phaseDistribution[a.phase.phaseType] ?? 0) + 1;
    }

    return {
      kpis: {
        totalAthletes: athletes.length,
        withOngoingProgram: withProgram.length,
        withoutOngoingProgram: athletes.length - withProgram.length,
        teamComplianceThisWeek: weekDue ? Math.round((weekLogged / weekDue) * 100) : null,
        sessionsToday,
      },
      needsAttention: athletes
        .filter(a => a.reasons.length)
        .sort((x, y) => y.reasons.length - x.reasons.length)
        .map(a => ({ id: a.id, firstName: a.firstName, lastName: a.lastName, reasons: a.reasons })),
      phaseDistribution,
    };
  }

  async getTrend(weeks: number, athleteId?: string): Promise<TrendPoint[]> {

    if (!Number.isInteger(weeks) || weeks < 1 || weeks > MAX_TREND_WEEKS) {
      throw new AppError(400, `weeks must be between 1 and ${MAX_TREND_WEEKS}`);
    }

    const now = new Date();
    const firstWeek = addWeeks(startOfWeek(now), -(weeks - 1));

    const ids = athleteId
      ? [athleteId]
      : (await this.db.user.findMany({ where: { role: UserRole.ATHLETE, deletedAt: null }, select: { id: true } })).map(u => u.id);

    const due = await this.getDueExercises(ids, firstWeek, now);

    return Array.from({ length: weeks }, (_, i) => {
      const weekStart = addWeeks(firstWeek, i);
      const weekEnd = addWeeks(weekStart, 1);
      return { weekStart, ...this.tally(due.filter(d => d.date >= weekStart && d.date < weekEnd)) };
    });
  }

  async getAthleteProgress(athleteId: string) {

    const now = new Date();
    const weekStart = startOfWeek(now);
    const firstWeek = addWeeks(weekStart, -(PROGRESS_WEEKS - 1));

    const athlete = await this.db.user.findUnique({
      where: { id: athleteId },
      include: {
        program: {
          where: { status: ProgramStatus.ONGOING },
          take: 1,
          include: { phase: { where: { status: PhaseStatus.ONGOING }, take: 1 } }
        }
      }
    });

    if (!athlete) throw new NotFoundError("Athlete");

    const program = athlete.program[0] ?? null;
    const phase = program?.phase[0] ?? null;

    const [due, pastSessions, nextSession, weeklyLogs, recentLogs, trend] = await Promise.all([
      this.getDueExercises([athleteId], program?.startDate ?? new Date(0), now),
      this.db.session.findMany({
        where: { date: { lt: now }, phase: { program: { athleteId } } },
        orderBy: { date: "desc" },
        select: { exercise: { select: { status: true } } }
      }),
      this.db.session.findFirst({
        where: { date: { gte: now }, phase: { program: { athleteId } } },
        orderBy: { date: "asc" },
        select: { id: true, title: true, date: true, exercise: { select: { id: true } } }
      }),
      this.db.athleteLogs.findMany({
        where: { athleteId, loggedAt: { gte: firstWeek } },
        select: { log: true, loggedAt: true }
      }),
      this.db.athleteLogs.findMany({
        where: { athleteId },
        orderBy: { loggedAt: "desc" },
        take: RECENT_LOGS,
        select: {
          log: true, notes: true, loggedAt: true,
          exercise: { select: { name: true, session: { select: { title: true, date: true } } } }
        }
      }),
      this.getTrend(PROGRESS_WEEKS, athleteId),
    ]);

    // consecutive most-recent sessions with every exercise logged
    const incomplete = pastSessions.findIndex(s => s.exercise.some(e => e.status !== "LOGGED"));
    const streak = incomplete === -1 ? pastSessions.length : incomplete;

    // best-effort: reps are free text (e.g. "8-10"), so parse the leading number
    const volume = Array.from({ length: PROGRESS_WEEKS }, (_, i) => {
      const start = addWeeks(firstWeek, i);
      const end = addWeeks(start, 1);
      const sets = weeklyLogs
        .filter(l => l.loggedAt >= start && l.loggedAt < end)
        .flatMap(l => l.log as unknown as LoggedSet[]);
      return {
        weekStart: start,
        sets: sets.length,
        reps: sets.reduce((n, s) => n + (parseInt(s.reps, 10) || 0), 0),
      };
    });

    return {
      program: program && { id: program.id, name: program.name, startDate: program.startDate, endDate: program.endDate,
        progress: this.phaseProgress(program.startDate, program.endDate, now) },
      phase: phase && { id: phase.id, name: phase.name, phaseType: phase.phaseType, startDate: phase.startDate, endDate: phase.endDate,
        progress: this.phaseProgress(phase.startDate, phase.endDate, now) },
      compliance: {
        week: this.tally(due.filter(d => d.date >= weekStart)),
        programToDate: this.tally(due),
        trend,
      },
      streak,
      volume,
      nextSession: nextSession && { id: nextSession.id, title: nextSession.title, date: nextSession.date, exerciseCount: nextSession.exercise.length },
      recentLogs,
    };
  }

}
