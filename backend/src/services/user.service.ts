import { prisma } from "../db/client.js";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export const userService = {
  async list(): Promise<UserSummary[]> {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    return users.map((user) => ({ id: user.id, name: user.name, email: user.email }));
  },
};
