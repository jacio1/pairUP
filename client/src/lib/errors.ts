export function errorCode(error: unknown) {
  const code = (error as { data?: { code?: string } })?.data?.code;
  const supported = [
    "RATE_LIMIT",
    "INVALID_PASSWORD",
    "UNAUTHORIZED",
    "FORBIDDEN",
    "AI_BUSY",
    "AI_UNAVAILABLE",
    "AI_INTERRUPTED",
    "INVALID_INPUT",
    "MESSAGE_NOT_FOUND",
  ];
  return supported.includes(code || "") ? code! : "SERVER_ERROR";
}
