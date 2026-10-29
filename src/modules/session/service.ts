
import { PrismaClient } from "../../generated/prisma/client";
import { SessionWhereInput } from "../../generated/prisma/models";
import { CreateSession, UpdateSession } from "./types";
import { ConflictError, NotFoundError } from "../../lib/errors";

export class SessionService {

  constructor (private db: PrismaClient) {}

  async getSession (where: SessionWhereInput) {
    return await this.db.session.findFirst({ where, include: { exercise: { orderBy: { order: 'asc' } } } })
  }

  async getCalendar (athleteId: string | undefined, start: Date, end: Date) {
    return await this.db.session.findMany({
      where: {
        date: { gte: start, lte: end },
        ...(athleteId && { phase: { program: { athleteId } } })
      },
      orderBy: { date: 'asc' },
      include: {
        phase: { select: { id: true, name: true, phaseType: true, status: true, programId: true } },
        exercise: { orderBy: { order: 'asc' } }
      }
    });
  }

  async createSession (data: CreateSession) {

    const existing = await this.getSession({ date: data.date })

    if (existing) throw new ConflictError("Session for this date already exists");

    const createdSession = await this.db.session.create({
      data: {
        phase: { connect: { id: data.phaseId } },
        title: data.title,
        date: data.date,
        notes: data.notes ?? "",
        exercise: { 
          createMany: {
            data: data.exercise
          }
        }
      },
      include: { exercise: true }
    });

    return createdSession
  }

  async updateSession (sessionId: string, data: UpdateSession) {

    const { exercise, phaseId, ...fields } = data;

    const existing = exercise.filter((e): e is typeof e & { id: string } => !!e.id);
    const created = exercise.filter(e => !e.id).map(({ id, ...rest }) => rest);

    const updatedSession = this.db.session.update({
      where: { id: sessionId },
      data: {
        ...fields,
        ...(phaseId && { phase: { connect: { id: phaseId } } }),
        exercise: {
          upsert: existing.map(({ id, ...exerciseFields }) => ({
            where: { id, sessionId },
            update: exerciseFields,
            create: { id, ...exerciseFields },
          })),
          create: created,
        },
      },
      include: { exercise: { orderBy: { order: 'asc' } } }
    });

    return updatedSession

  }

  async deleteSession (id: string) {

    const existing = await this.getSession({ id });
    if (!existing) throw new NotFoundError("Session");

    const results = await this.db.$transaction([
      this.db.athleteLogs.deleteMany({ where: { exercise: { sessionId: id } } }),
      this.db.exercise.deleteMany({ where: { sessionId: id } }),
      this.db.session.delete({ where: { id } }),
    ]);

    return results[2]
  }
}
