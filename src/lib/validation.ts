import { z } from "zod";

// Steam API validation schemas
export const steamIdSchema = z.string().min(1, "Steam ID is required");

export const appIdSchema = z.coerce.number().int().positive("Invalid app ID");

// Pool validation schemas
export const createPoolSchema = z.object({
  friendId: z.string().min(1, "Friend ID is required"),
  name: z.string().min(1).max(100).optional(),
});

export const addGameSchema = z.object({
  appId: z.number().int().positive("Invalid app ID"),
  name: z.string().min(1, "Game name is required").max(200),
  storeUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  weight: z.number().positive().optional(),
});

export const pickGameSchema = z.object({
  mode: z.enum(["pure", "avoid"]).optional(),
  avoidCount: z.number().int().min(0).max(100).optional(),
  appIds: z.array(z.number().int().positive()).optional(),
});

export const limitSchema = z.coerce.number().int().min(0).max(50).default(0);
