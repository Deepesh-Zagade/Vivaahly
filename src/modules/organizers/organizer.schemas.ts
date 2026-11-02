import { z } from "zod";
import { getOrganizerPasswordError } from "@/modules/auth/password-policy";

const organizerPasswordSchema = z.string().superRefine((password, context) => {
  const error = getOrganizerPasswordError(password);
  if (error) context.addIssue({ code: "custom", message: error });
});

const normalizedEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254)
  .transform((email) => email.toLowerCase());

export const createOrganizerInvitationSchema = z
  .object({
    email: normalizedEmailSchema,
    role: z.enum(["ADMIN", "MANAGER"]),
  })
  .strict();

export const acceptOrganizerInvitationSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(100).optional(),
    password: organizerPasswordSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if ((value.name && !value.password) || (!value.name && value.password)) {
      context.addIssue({
        code: "custom",
        path: value.name ? ["password"] : ["name"],
        message: "Name and password are both required when creating an account.",
      });
    }
  });

export type CreateOrganizerInvitationInput = z.infer<
  typeof createOrganizerInvitationSchema
>;
export type AcceptOrganizerInvitationInput = z.infer<
  typeof acceptOrganizerInvitationSchema
>;
