import { z } from "zod";

/** PATCH /api/notifications — mark notifications as read */
export const markReadSchema = z
  .object({
    mark_all_read: z.literal(true).optional(),
    id: z.string().uuid().optional(),
    ids: z.array(z.string().uuid()).max(100).optional(),
  })
  .refine(
    (data) => data.mark_all_read || data.id || (data.ids && data.ids.length > 0),
    { message: "Provide mark_all_read, id, or ids" }
  );
