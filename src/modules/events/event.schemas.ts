import { z } from "zod";

const requiredTitle = z
  .string()
  .trim()
  .min(2, "Event name must contain at least 2 characters.")
  .max(120, "Event name must contain at most 120 characters.");

function optionalText(maximum: number, message: string) {
  return z
    .string()
    .trim()
    .max(maximum, message)
    .transform((value) => value || undefined)
    .optional();
}

const optionalName = optionalText(160, "Venue name must contain at most 160 characters.");
const optionalAddress = optionalText(300, "Venue address must contain at most 300 characters.");
const optionalDescription = optionalText(2_000, "Description must contain at most 2000 characters.");
const optionalDressCode = optionalText(200, "Dress code must contain at most 200 characters.");

const optionalHttpsUrl = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional()
  .refine((value) => {
    if (!value) return true;
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a valid secure map link beginning with https://.");

const instantSchema = z
  .string()
  .datetime({ offset: true, message: "Choose a valid date and time." });

const eventInputShape = {
  title: z
    .object({
      en: requiredTitle,
      mr: optionalText(120, "Marathi event name must contain at most 120 characters."),
    })
    .strict(),
  description: z
    .object({
      en: optionalDescription,
      mr: optionalDescription,
    })
    .strict(),
  startAt: instantSchema,
  endAt: instantSchema,
  venue: z
    .object({
      name: z.object({ en: optionalName, mr: optionalName }).strict(),
      address: z.object({ en: optionalAddress, mr: optionalAddress }).strict(),
      mapUrl: optionalHttpsUrl,
    })
    .strict(),
  dressCode: z
    .object({ en: optionalDressCode, mr: optionalDressCode })
    .strict(),
  privateNotes: optionalText(
    2_000,
    "Private organizer notes must contain at most 2000 characters.",
  ),
};

function withChronologyValidation(
  schema: z.ZodObject<typeof eventInputShape>,
) {
  return schema.superRefine((value, context) => {
    const start = new Date(String(value.startAt));
    const end = new Date(String(value.endAt));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
    if (end.getTime() <= start.getTime()) {
      context.addIssue({
        code: "custom",
        path: ["endAt"],
        message: "End time must be later than the start time.",
      });
    }
  });
}

export const createEventSchema = withChronologyValidation(
  z.object(eventInputShape).strict(),
);

export const updateEventSchema = withChronologyValidation(
  z.object(eventInputShape).strict(),
);

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
