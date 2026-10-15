import type { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
  }
}

export function validationError(err: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "body");
    if (!fields[key]) fields[key] = issue.message;
  }
  return new AppError(400, "VALIDATION_ERROR", "Invalid input", fields);
}