import { z } from 'zod';

export const emailField = z
  .string({ required_error: 'אימייל הוא שדה חובה' })
  .trim()
  .max(255, 'אימייל ארוך מדי')
  .email('פורמט אימייל אינו תקין')
  .transform((value) => value.toLowerCase());
