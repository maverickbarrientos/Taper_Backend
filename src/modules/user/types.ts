import { UserUpdateInput } from "../../generated/prisma/models";

export type UpdateProfile =
  Pick<UserUpdateInput, "firstName" | "lastName" | "email" | "events" | "goals">
  & { password?: string }
