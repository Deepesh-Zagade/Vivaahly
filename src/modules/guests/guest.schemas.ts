import { z } from "zod";
import { GUEST_TAGS } from "@/modules/guests/guest.types";

const requiredName = (label: string) =>
  z
    .string()
    .trim()
    .min(2, `${label} must contain at least 2 characters.`)
    .max(120, `${label} must contain at most 120 characters.`);

const optionalName = z
  .string()
  .trim()
  .max(120, "Marathi name must contain at most 120 characters.")
  .transform((value) => value || undefined)
  .optional();

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value || undefined)
  .optional()
  .refine(
    (value) => !value || (value.length <= 254 && z.email().safeParse(value).success),
    "Enter a valid email address.",
  );

const optionalPhone = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional()
  .refine((value) => {
    if (!value) return true;
    if (value.length > 30 || !/^[+()\-\s\d]+$/u.test(value)) return false;
    const digitCount = value.replace(/\D/gu, "").length;
    return digitCount >= 7 && digitCount <= 15;
  }, "Enter a valid contact number, including the country code when needed.");

const optionalNotes = z
  .string()
  .trim()
  .max(2_000, "Organizer notes must contain at most 2000 characters.")
  .transform((value) => value || undefined)
  .optional();

const localizedDisplayName = z
  .object({
    en: requiredName("Guest or family name"),
    mr: optionalName,
  })
  .strict();

const localizedContactName = z
  .object({
    en: requiredName("Primary invitee name"),
    mr: optionalName,
  })
  .strict();

export const guestInputSchema = z
  .object({
    guestType: z.enum(["INDIVIDUAL", "FAMILY"]),
    displayName: localizedDisplayName,
    primaryContact: z
      .object({
        name: localizedContactName,
        email: optionalEmail,
        phone: optionalPhone,
      })
      .strict(),
    tags: z
      .array(z.enum(GUEST_TAGS))
      .max(GUEST_TAGS.length, "Too many guest tags were selected."),
    organizerNotes: optionalNotes,
  })
  .strict()
  .superRefine((value, context) => {
    if (new Set(value.tags).size !== value.tags.length) {
      context.addIssue({
        code: "custom",
        path: ["tags"],
        message: "Each guest tag can be selected only once.",
      });
    }
  });

export const createGuestSchema = guestInputSchema;
export const updateGuestSchema = guestInputSchema;

export const assignGuestEventsSchema = z
  .object({
    eventIds: z
      .array(
        z
          .string()
          .regex(/^[a-f\d]{24}$/iu, "An invited event could not be recognized."),
      )
      .max(10, "A guest cannot be assigned to more than 10 events."),
  })
  .strict()
  .superRefine((value, context) => {
    if (new Set(value.eventIds.map((id) => id.toLowerCase())).size !== value.eventIds.length) {
      context.addIssue({
        code: "custom",
        path: ["eventIds"],
        message: "Each event can be selected only once.",
      });
    }
  });

const optionalQueryValue = <Schema extends z.ZodType>(schema: Schema) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    schema.optional(),
  );

export const guestListQuerySchema = z.object({
  q: optionalQueryValue(z.string().trim().max(120)),
  guestType: optionalQueryValue(z.enum(["INDIVIDUAL", "FAMILY"])),
  tag: optionalQueryValue(z.enum(GUEST_TAGS)),
  eventId: optionalQueryValue(z.string().regex(/^[a-f\d]{24}$/iu)),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .pipe(z.union([z.literal(10), z.literal(50), z.literal(100)]))
    .default(10),
});

export type GuestInput = z.infer<typeof guestInputSchema>;
export type AssignGuestEventsInput = z.infer<typeof assignGuestEventsSchema>;
