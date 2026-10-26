import { z } from 'zod';
import { emailField } from './common';

export const registerSchema = z.object({
  email: emailField,
  password: z
    .string({ required_error: 'סיסמה היא שדה חובה' })
    .min(8, 'הסיסמה חייבת להכיל 8 תווים לפחות')
    .max(128, 'הסיסמה ארוכה מדי')
    .regex(/[A-Za-z]/, 'הסיסמה חייבת להכיל לפחות אות אחת')
    .regex(/[0-9]/, 'הסיסמה חייבת להכיל לפחות מספר אחד'),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ required_error: 'סיסמה היא שדה חובה' }).min(1, 'סיסמה היא שדה חובה'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
