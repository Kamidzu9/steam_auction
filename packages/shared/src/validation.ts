import { z } from "zod";

export const steamIdSchema = z.string().min(1, "Steam ID is required");

export const appIdSchema = z.coerce.number().int().positive("Invalid app ID");

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

export const addFriendSchema = z.object({
  steamId: z.string().min(1, "Steam ID is required"),
  displayName: z.string().max(100).optional(),
});

export const bulkAddFriendsSchema = z.object({
  friends: z.array(
    z.object({
      steamId: z.string().min(1),
      displayName: z.string().max(100).optional(),
    })
  ),
});

export type CreatePoolInput = z.infer<typeof createPoolSchema>;
export type AddGameInput = z.infer<typeof addGameSchema>;
export type PickGameInput = z.infer<typeof pickGameSchema>;
export type AddFriendInput = z.infer<typeof addFriendSchema>;
export type BulkAddFriendsInput = z.infer<typeof bulkAddFriendsSchema>;
