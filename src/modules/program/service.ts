
import { PhaseStatus, PrismaClient } from "../../generated/prisma/client";
import { ProgramWhereInput, PhaseWhereInput } from "../../generated/prisma/models";
import { CreateProgram, CreatePhase } from "./types";
import { ConflictError } from "../../lib/errors";

export class ProgramService {

  constructor (private db: PrismaClient) {}

  async getAllPrograms() {
    return await this.db.program.findMany({
      include: { athlete: true }
    });
  }

  async getAthleteProgram (where: ProgramWhereInput) {
    return await this.db.program.findFirst(
      { 
        where,
        include: {
          athlete: true,
        }
      }
    );
  }

  async createProgram (data: CreateProgram) {

    const existing = await this.getAthleteProgram({ athleteId: data.athleteId, status: "ONGOING" });

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

  async getPhase(where: PhaseWhereInput) {

    return await this.db.phase.findFirst({ where })
  
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
}