
import { PhaseStatus, PrismaClient } from "../../generated/prisma/client";
import { ProgramWhereInput, ProgramWhereUniqueInput, ProgramUpdateInput, PhaseWhereInput, PhaseUpdateInput } from "../../generated/prisma/models";
import { AISummaryService } from "../ai-summary/service";
import { CreateProgram, CreatePhase } from "./types";
import { AppError, ConflictError, NotFoundError } from "../../lib/errors";
import { elapsedPercent, startOfDay } from "../../lib/utils";

export class ProgramService {

  private aiSummary: AISummaryService;

  constructor (private db: PrismaClient) {
    this.aiSummary = new AISummaryService(this.db);
  }

  async getAllPrograms() {
    return await this.db.program.findMany({
      include: { athlete: true }
    });
  }

  async getProgram (where: ProgramWhereInput) {

    return await this.db.program.findFirst(
      { 
        where,
        include: {
          athlete: true,
          aiSummary: { 
            orderBy: { weekStart: "desc" },
            take: 1, 
          },
          phase: {
            include: {
              session: {
                include: { 
                  exercise: { orderBy: { order: "asc" } }
                }
              }
            }
          },
        }
      }
    );
  }

  async createProgram (data: CreateProgram) {

    const existing = await this.getProgram({ athleteId: data.athleteId, status: "ONGOING" });

    if (existing) throw new ConflictError("This athlete currently has an ongoing program");

    const createdProgram = await this.db.program.create({
      data: {
        name: data.name,
        date: data.date,
        startDate: data.startDate,
        endDate: data.endDate,
        status: "ONGOING",
        athlete: { connect: { id: data.athleteId } }
      }
    });

    return createdProgram
  }

  async updateProgram (programId: string, data: ProgramUpdateInput) {
    return await this.db.program.update({
      where: { id: programId },
      data
    })
  }

  async getPhase(where: PhaseWhereInput) {
    return await this.db.phase.findFirst({ 
      where,
      include: {
        session: { include: { exercise: true } }
      }
    })
  }

  async getProgramWeekData({ id, athleteId }: ProgramWhereUniqueInput) {
    if (!athleteId || typeof athleteId !== "string" || !id) throw new AppError(400, "Athlete id or Program id is required")

    return await this.aiSummary.getProgramWeekData(athleteId, id);
  }

  async generateWeeklySummary({ id, athleteId }: ProgramWhereUniqueInput, force = false) {
    if (!athleteId || typeof athleteId !== "string" || !id) {
      throw new AppError(400, "Athlete id or Program id is required")
    }

    return await this.aiSummary.generateWeeklySummary(id, athleteId, force);
  }

  async createPhase(data: CreatePhase) {

    const existing = await this.getPhase({ programId: data.programId, status: PhaseStatus.ONGOING });

    if (existing) throw new ConflictError("The program currently has ongoing phase");

    const createdPhase = await this.db.phase.create({
      data: {
        programId: data.programId,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        phaseType: data.phaseType,
        status: "ONGOING",
      }
    });

    return createdPhase
  }

  async updatePhase(phaseId: string, data: PhaseUpdateInput) {
    
    return await this.db.phase.update({
      where: { id: phaseId }, data
    })
  }

  async deleteProgram(id: string) {

    const existing = await this.db.program.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Program");

    const results = await this.db.$transaction([
      this.db.athleteLogs.deleteMany({ where: { exercise: { session: { phase: { programId: id } } } } }),
      this.db.exercise.deleteMany({ where: { session: { phase: { programId: id } } } }),
      this.db.session.deleteMany({ where: { phase: { programId: id } } }),
      this.db.phase.deleteMany({ where: { programId: id } }),
      this.db.aISummary.deleteMany({ where: { programId: id } }),
      this.db.program.delete({ where: { id } }),
    ]);

    return results[5]
  }

  async deletePhase(id: string) {

    const existing = await this.getPhase({ id });
    if (!existing) throw new NotFoundError("Phase");

    const results = await this.db.$transaction([
      this.db.athleteLogs.deleteMany({ where: { exercise: { session: { phaseId: id } } } }),
      this.db.exercise.deleteMany({ where: { session: { phaseId: id } } }),
      this.db.session.deleteMany({ where: { phaseId: id } }),
      this.db.phase.delete({ where: { id } }),
    ]);

    return results[3]
  }

  private summarize(phases: { session: { exercise: { status: string }[] }[] }[]) {
    const sessions = phases.flatMap(p => p.session);
    const exercises = sessions.flatMap(s => s.exercise);

    return {
      phases: phases.length,
      sessions: sessions.length,
      completedSessions: sessions.filter(s => s.exercise.length > 0 && s.exercise.every(e => e.status === "LOGGED")).length,
      exercises: exercises.length,
      loggedExercises: exercises.filter(e => e.status === "LOGGED").length,
    };
  }

  async getAthleteProgramView(athleteId: string, programId?: string) {

    const now = new Date();
    const today = startOfDay(now);

    const program = await this.db.program.findFirst({
      where: programId ? { id: programId, athleteId } : { athleteId, status: "ONGOING" },
      include: {
        aiSummary: { orderBy: { weekStart: "desc" }, take: 1 },
        phase: {
          orderBy: { startDate: "asc" },
          include: {
            session: {
              orderBy: { date: "asc" },
              include: {
                exercise: {
                  orderBy: { order: "asc" },
                  include: {
                    athleteLogs: {
                      where: { athleteId },
                      orderBy: { loggedAt: "desc" },
                      take: 1,
                      select: { log: true, notes: true, loggedAt: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!program) {
      if (programId) throw new NotFoundError("Program");
      return null;
    }

    const phases = program.phase.map(({ session, ...phase }) => ({
      ...phase,
      progress: elapsedPercent(phase.startDate, phase.endDate, now),
      session: session.map(({ exercise, ...s }) => {
        const logged = exercise.filter(e => e.status === "LOGGED").length;
        const status =
          exercise.length > 0 && logged === exercise.length ? "COMPLETED"
          : s.date >= today ? "UPCOMING"
          : logged > 0 ? "PARTIAL"
          : "MISSED";

        return {
          ...s,
          status,
          exercise: exercise.map(({ athleteLogs, ...e }) => ({ ...e, log: athleteLogs[0] ?? null })),
        };
      }),
    }));

    const { phase: _phase, aiSummary, ...fields } = program;

    return {
      program: {
        ...fields,
        progress: elapsedPercent(program.startDate, program.endDate, now),
        totals: this.summarize(program.phase),
      },
      phases,
      latestSummary: aiSummary[0] ?? null,
    };
  }

  async getAthleteProgramList(athleteId: string) {

    const now = new Date();

    const programs = await this.db.program.findMany({
      where: { athleteId },
      orderBy: { startDate: "desc" },
      include: { phase: { select: { session: { select: { exercise: { select: { status: true } } } } } } }
    });

    return programs.map(({ phase, ...program }) => ({
      ...program,
      progress: elapsedPercent(program.startDate, program.endDate, now),
      totals: this.summarize(phase),
    }));
  }

}
