import { z } from "zod";
import { getOrganizerPasswordError } from "@/modules/auth/password-policy";

const normalizedEmailSchema = z
  .string()
  .trim()
  .min(1, "Email address is required.")
  .max(254, "Email address is too long.")
  .email("Enter a valid email address.")
  .transform((email) => email.toLowerCase());

export const registerOrganizerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters.")
      .max(100, "Name must contain at most 100 characters.")
      .transform((name) => name.replaceAll(/\s+/g, " ")),
    email: normalizedEmailSchema,
    password: z.string().superRefine((password, context) => {
      const error = getOrganizerPasswordError(password);

      if (error) context.addIssue({ code: "custom", message: error });
    }),
  })
  .strict();

export const loginOrganizerSchema = z
  .object({
    email: normalizedEmailSchema,
    password: z
      .string()
      .min(1, "Password is required.")
      .max(128, "Password must contain at most 128 characters."),
  })
  .strict();

export type RegisterOrganizerInput = z.infer<typeof registerOrganizerSchema>;
export type LoginOrganizerInput = z.infer<typeof loginOrganizerSchema>;
