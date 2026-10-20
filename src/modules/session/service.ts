
import { PrismaClient } from "../../generated/prisma/client";
import { SessionWhereInput } from "../../generated/prisma/models";
import { CreateSession } from "./types";
import { ConflictError } from "../../lib/errors";

export class SessionService {

  constructor (private db: PrismaClient) {}

  async getSession (where: SessionWhereInput) {

    return await this.db.session.findFirst({ where })

  }

  async createSession (data: CreateSession) {

    const existing = await this.getSession({ date: data.date })

    if (existing) throw new ConflictError("Session for this date already exists");

    const createdSession = await this.db.session.create({
      data: {
        phaseId: data.phaseId,
        title: data.title,
        date: data.date,
        notes: data.notes ?? ""
      }
    });

    return createdSession

  }

}