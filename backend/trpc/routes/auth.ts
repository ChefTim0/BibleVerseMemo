import * as z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { db } from "../../db";
import { hashPassword, verifyPassword, signToken } from "../../utils/auth";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        username: z.string().min(3).max(20),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const existingUser = await db.execute({
        sql: 'SELECT id FROM users WHERE email = ? OR username = ?',
        args: [input.email, input.username]
      });
      
      if (existingUser.rows.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email or username already exists',
        });
      }

      const passwordHash = await hashPassword(input.password);
      
      const result = await db.execute({
        sql: 'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)',
        args: [input.email, input.username, passwordHash]
      });

      const userId = Number(result.lastInsertRowid);
      
      const token = signToken({
        userId,
        email: input.email,
        username: input.username,
      });

      return {
        token,
        user: {
          id: userId,
          email: input.email,
          username: input.username,
        },
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        emailOrUsername: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const userResult = await db.execute({
        sql: 'SELECT id, email, username, password_hash FROM users WHERE email = ? OR username = ?',
        args: [input.emailOrUsername, input.emailOrUsername]
      });

      const user = userResult.rows[0] as any;

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      const isValidPassword = await verifyPassword(input.password, user.password_hash);
      
      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      await db.execute({
        sql: 'UPDATE users SET last_login = ? WHERE id = ?',
        args: [Math.floor(Date.now() / 1000), user.id]
      });

      const token = signToken({
        userId: user.id,
        email: user.email,
        username: user.username,
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      };
    }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const userResult = await db.execute({
      sql: 'SELECT id, email, username, created_at, last_login FROM users WHERE id = ?',
      args: [ctx.user.userId]
    });

    const user = userResult.rows[0] as any;

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    };
  }),
});
