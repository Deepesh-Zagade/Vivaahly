import { z } from "zod";

const requiredText = (label: string, maximum: number) =>
  z
    .string()
    .trim()
    .min(2, `${label} must contain at least 2 characters.`)
    .max(maximum, `${label} must contain at most ${maximum} characters.`);

const optionalLocalizedText = z
  .string()
  .trim()
  .max(100, "Marathi text must contain at most 100 characters.")
  .transform((value) => value || undefined)
  .optional();

const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid wedding date.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Choose a valid wedding date.");

const timezoneSchema = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}, "Choose a valid timezone.");

const coupleSchema = z.object({
  bride: z.object({
    name: z.object({
      en: requiredText("Bride's English name", 100),
      mr: optionalLocalizedText,
    }),
  }),
  groom: z.object({
    name: z.object({
      en: requiredText("Groom's English name", 100),
      mr: optionalLocalizedText,
    }),
  }),
});

export const createWeddingSchema = z
  .object({
    couple: coupleSchema,
    title: z.object({
      en: requiredText("Wedding title", 140),
      mr: optionalLocalizedText,
    }),
    mainWeddingDate: calendarDateSchema,
    timezone: timezoneSchema,
    primaryVenue: z.object({
      city: z.object({
        en: requiredText("Wedding city or location", 120),
        mr: optionalLocalizedText,
      }),
    }),
  })
  .strict();

export type CreateWeddingInput = z.infer<typeof createWeddingSchema>;

export const updateWeddingSchema = z
  .object({
    couple: coupleSchema,
    title: z
      .object({
        en: requiredText("Wedding title", 140),
      })
      .strict(),
    mainWeddingDate: calendarDateSchema,
    timezone: timezoneSchema,
    primaryVenue: z
      .object({
        city: z
          .object({
            en: requiredText("Wedding city or location", 120),
          })
          .strict(),
      })
      .strict(),
  })
  .strict();

export type UpdateWeddingInput = z.infer<typeof updateWeddingSchema>;
