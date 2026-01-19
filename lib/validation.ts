import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Bitte gib deine E-Mail-Adresse ein.")
    .email("Bitte gib eine gültige E-Mail-Adresse ein."),
  password: z.string().min(1, "Bitte gib dein Passwort ein."),
});

const SCHOOL_EMAIL_DOMAIN = "@lessing-ffm.net";

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Bitte gib deine E-Mail-Adresse ein.")
      .email("Bitte gib eine gültige E-Mail-Adresse ein.")
      .refine(
        (email) => email.toLowerCase().endsWith(SCHOOL_EMAIL_DOMAIN),
        `Bitte verwende deine Schul-E-Mail-Adresse (${SCHOOL_EMAIL_DOMAIN}).`
      ),
    password: z
      .string()
      .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein."),
    confirmPassword: z.string().min(1, "Bitte bestätige dein Passwort."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// User Management Schemas
export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "Bitte gib eine E-Mail-Adresse ein.")
    .email("Bitte gib eine gültige E-Mail-Adresse ein."),
  password: z
    .string()
    .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein."),
  firstName: z.string().min(1, "Bitte gib einen Vornamen ein."),
  lastName: z.string().min(1, "Bitte gib einen Nachnamen ein."),
  role: z.enum(["STUDENT", "ADMIN"], {
    message: "Bitte wähle eine gültige Rolle.",
  }),
});

export const updateUserSchema = z
  .object({
    email: z
      .string()
      .email("Bitte gib eine gültige E-Mail-Adresse ein.")
      .optional(),
    firstName: z.string().min(1, "Bitte gib einen Vornamen ein.").optional(),
    lastName: z.string().min(1, "Bitte gib einen Nachnamen ein.").optional(),
    role: z.enum(["STUDENT", "ADMIN"]).optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Bitte gib mindestens ein Feld zum Aktualisieren an.",
  });

// Settings Schemas
export const updateProfileSchema = z
  .object({
    firstName: z.string().min(1, "Bitte gib deinen Vornamen ein.").optional(),
    lastName: z.string().min(1, "Bitte gib deinen Nachnamen ein.").optional(),
    email: z
      .string()
      .email("Bitte gib eine gültige E-Mail-Adresse ein.")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Bitte gib mindestens ein Feld zum Aktualisieren an.",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Bitte gib dein aktuelles Passwort ein."),
    newPassword: z
      .string()
      .min(8, "Das neue Passwort muss mindestens 8 Zeichen lang sein."),
    confirmPassword: z
      .string()
      .min(1, "Bitte bestätige dein neues Passwort."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["confirmPassword"],
  });

// Student Management Schemas
export const createStudentSchema = z.object({
  firstName: z.string().min(1, "Bitte gib einen Vornamen ein."),
  lastName: z.string().min(1, "Bitte gib einen Nachnamen ein."),
  email: z
    .string()
    .min(1, "Bitte gib eine E-Mail-Adresse ein.")
    .email("Bitte gib eine gültige E-Mail-Adresse ein.")
    .refine(
      (email) => email.toLowerCase().endsWith(SCHOOL_EMAIL_DOMAIN),
      `Die E-Mail-Adresse muss auf ${SCHOOL_EMAIL_DOMAIN} enden.`
    ),
});

export const updateStudentSchema = z
  .object({
    firstName: z.string().min(1, "Bitte gib einen Vornamen ein.").optional(),
    lastName: z.string().min(1, "Bitte gib einen Nachnamen ein.").optional(),
    email: z
      .string()
      .email("Bitte gib eine gültige E-Mail-Adresse ein.")
      .refine(
        (email) => email.toLowerCase().endsWith(SCHOOL_EMAIL_DOMAIN),
        `Die E-Mail-Adresse muss auf ${SCHOOL_EMAIL_DOMAIN} enden.`
      )
      .optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Bitte gib mindestens ein Feld zum Aktualisieren an.",
  });

// Export Types
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
