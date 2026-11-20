export const allowedOrigins = () =>
  (process.env.PUBLIC_ORIGIN || "http://localhost:3000").split(",");
