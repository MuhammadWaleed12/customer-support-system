import { randomBytes } from "node:crypto";
import { prisma } from "../db/client.js";
import { verifyPassword } from "../lib/password.js";
import { ValidationError } from "../lib/errors.js";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export interface LoginResult {
  token: string;
  user: SessionUser;
  expiresAt: Date;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new ValidationError("Invalid email or password");
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await prisma.session.create({ data: { id: token, userId: user.id, expiresAt } });

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email },
      expiresAt,
    };
  },

  async logout(token: string): Promise<void> {
    await prisma.session.deleteMany({ where: { id: token } });
  },

  async getSessionUser(token: string): Promise<SessionUser | null> {
    const session = await prisma.session.findUnique({
      where: { id: token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) return null;

    return { id: session.user.id, name: session.user.name, email: session.user.email };
  },
};
