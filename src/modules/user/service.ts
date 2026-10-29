
import { PhaseStatus, PrismaClient, UserRole } from "../../generated/prisma/client"
import { UserCreateInput, UserWhereInput, UserWhereUniqueInput } from "../../generated/prisma/models"
import supabase from "../../lib/supabase"
import { UpdateProfile } from "./types"
import { generatePassword } from "../../lib/utils"
import { sendAthleteCredentials } from "../../lib/mailer"
import { AppError,ConflictError, NotFoundError } from "../../lib/errors"

export class UserService {

  constructor (private db: PrismaClient) {}

  async getUser(where: UserWhereInput) {
    return await this.db.user.findFirst({ where: { ...where, deletedAt: null } });
  }

  async getProfile(id: string) {
    const user = await this.db.user.findUnique({
      where: { id },
      include: {
        program: {
          where: { status: "ONGOING" },
          take: 1,
          include: { phase: { where: { status: PhaseStatus.ONGOING }, take: 1 } }
        }
      }
    });

    if (!user) return user;

    const { program, ...profile } = user;
    const { phase, ...currentProgram } = program[0] ?? {};

    if (user.role !== UserRole.ATHLETE) return profile;

    return {
      ...profile,
      currentProgram: program[0] ? currentProgram : null,
      currentPhase: phase?.[0] ?? null,
    };
  }

  async getAthlete(where: UserWhereInput) {
    return await this.db.user.findFirst({ where: { ...where, deletedAt: null }, include: { program: { include: { aiSummary: true } } } });
  }

  async getAllUsers(where: UserWhereInput) {
    return await this.db.user.findMany({ where: { ...where, deletedAt: null } })
  }

  async supabaseCreateUser (user: UserCreateInput) {

    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: generatePassword(user),
      user_metadata: {
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
      },
      email_confirm: true
    });

    if (error) throw error

    return data

  }

  // events and goals are free-text lists: trim each entry and drop blanks
  private normalizeList (value: unknown, label: string): string[] {
    if (!Array.isArray(value) || value.some(v => typeof v !== "string")) {
      throw new AppError(400, `${label} must be a list of text`);
    }
    return value.map((v: string) => v.trim()).filter(Boolean);
  }

  async createAthlete (athlete: UserCreateInput) {

    const existing = await this.getUser({ email: athlete.email })

    if (existing) throw new ConflictError("An account with this email already exists");

    const { user } = await this.supabaseCreateUser({ ...athlete, role: UserRole.ATHLETE });

    const createdAthlete = await this.db.user.create({
      data: {
        ...athlete,
        events: this.normalizeList(athlete.events ?? [], "Events"),
        goals: this.normalizeList(athlete.goals ?? [], "Goals"),
        id: user.id,
        role: UserRole.ATHLETE
      }
    });

    // the account already exists at this point, so a mail failure must not fail the request
    try {
      await sendAthleteCredentials(createdAthlete, generatePassword(athlete));
    } catch (error) {
      console.error("Failed to send athlete credentials email:", error);
    }

    return createdAthlete
  }

  async updateProfile (id: string, data: UpdateProfile) {

    const existing = await this.getAthlete({ id });
    if (!existing) throw new NotFoundError("User");

    const { firstName, lastName, email, password, events, goals } = data;

    if (!firstName && !lastName && !email && !password && events === undefined && goals === undefined) {
      throw new AppError(400, "Nothing to update");
    }
    if (password !== undefined && password.length < 6) {
      throw new AppError(400, "Password must be at least 6 characters");
    }

    if (typeof email === "string" && email !== existing.email) {
      const taken = await this.getUser({ email, id: { not: id } });
      if (taken) throw new ConflictError("An account with this email already exists");
    }

    const lists = {
      ...(events !== undefined && { events: this.normalizeList(events, "Events") }),
      ...(goals !== undefined && { goals: this.normalizeList(goals, "Goals") }),
    };

    const { error } = await supabase.auth.admin.updateUserById(id, {
      ...(typeof email === "string" && { email, email_confirm: true }),
      ...(password && { password }),
      user_metadata: {
        ...(firstName && { first_name: firstName }),
        ...(lastName && { last_name: lastName }),
      }
    });

    if (error) throw error

    const { password: _password, events: _events, goals: _goals, ...fields } = data;

    return await this.db.user.update({
      where: { id },
      data: { ...fields, ...lists }
    });
  }

  // soft delete: the athlete's programs, sessions and logs are kept, but the account can no longer sign in or appear in lists
  async deleteAthlete (id: string) {

    const athlete = await this.getUser({ id, role: UserRole.ATHLETE });
    if (!athlete) throw new NotFoundError("Athlete");

    const deletedAthlete = await this.db.user.update({ where: { id }, data: { deletedAt: new Date() } });

    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error && error.status !== 404) {
      await this.db.user.update({ where: { id }, data: { deletedAt: null } });
      throw error
    }

    return deletedAthlete
  }

}
