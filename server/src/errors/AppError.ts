export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RECORD_NOT_FOUND'
  | 'RECIPIENT_NOT_FOUND'
  | 'ROUTE_NOT_FOUND'
  | 'EMAIL_ALREADY_EXISTS'
  | 'PAYLOAD_TOO_LARGE'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  invalidCredentials: () => new AppError(401, 'INVALID_CREDENTIALS', 'אימייל או סיסמה שגויים.'),
  unauthorized: () => new AppError(401, 'UNAUTHORIZED', 'נדרשת התחברות.'),
  adminOnly: () => new AppError(403, 'FORBIDDEN', 'הפעולה מותרת למנהל בלבד.'),
  ownerOnly: () => new AppError(403, 'FORBIDDEN', 'רק יוצר הרשומה רשאי לערוך אותה.'),
  recordNotFound: () => new AppError(404, 'RECORD_NOT_FOUND', 'הרשומה לא נמצאה.'),
  recipientNotFound: () =>
    new AppError(404, 'RECIPIENT_NOT_FOUND', 'לא ניתן לשלוח רשומה למשתמש המבוקש.'),
  emailExists: () => new AppError(409, 'EMAIL_ALREADY_EXISTS', 'כתובת האימייל כבר רשומה במערכת.'),
  internal: () => new AppError(500, 'INTERNAL_ERROR', 'אירעה שגיאה פנימית בשרת.'),
};
