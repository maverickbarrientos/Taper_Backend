
import { PrismaClient, UserRole } from "../../generated/prisma/client"
import { UserCreateInput, UserWhereInput } from "../../generated/prisma/models"
import supabase from "../../lib/supabase"
import { generatePassword } from "../../lib/utils"
import { ConflictError } from "../../lib/errors"

export class UserService {

  constructor (private db: PrismaClient) {}

  async getUser(where: UserWhereInput) {
    return await this.db.user.findFirst({ where });
  }

  async supabaseCreateUser (user: UserCreateInput) {

    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: generatePassword(user),
      user_metadata: {
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role
      }
    });

    if (error) throw error

    return data

  }

  async createAthlete (athlete: UserCreateInput) {

    const existing = await this.getUser({ email: athlete.email })

    if (existing) throw new ConflictError("An account with this email already exists");

    const { user } = await this.supabaseCreateUser({ ...athlete, role: UserRole.ATHLETE });

    const createdAthlete = await this.db.user.create({
      data: {
        ...athlete,
        id: user.id,
        role: UserRole.ATHLETE
      }
    });

    return createdAthlete
  }
}