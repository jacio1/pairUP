export const subjects = [
  "math",
  "physics",
  "chemistry",
  "biology",
  "computerScience",
  "english",
  "russian",
  "history",
  "socialStudies",
  "other",
];
export const levels = [
  "beginner",
  "intermediate",
  "advanced",
  "olympiad",
  "examPreparation",
];
export const formats = ["online", "offline", "hybrid"];

export function parseListing(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const data = body as Record<string, unknown>;
  if (
    typeof data.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      data.id,
    )
  )
    return null;
  const limits = {
    title: [5, 150],
    goal: [5, 300],
    description: [10, 2000],
    schedule: [0, 200],
    location: [0, 150],
    authorName: [1, 60],
  } as const;
  const text = {} as Record<keyof typeof limits, string>;
  for (const [key, [min, max]] of Object.entries(limits)) {
    const value = data[key];
    if (
      typeof value !== "string" ||
      value.length > max ||
      value.trim().length < min
    )
      return null;
    text[key as keyof typeof limits] = value.trim();
  }
  if (
    typeof data.subject !== "string" ||
    !subjects.includes(data.subject) ||
    typeof data.level !== "string" ||
    !levels.includes(data.level) ||
    typeof data.format !== "string" ||
    !formats.includes(data.format) ||
    (data.format !== "online" && !text.location)
  )
    return null;
  return {
    id: data.id,
    ...text,
    subject: data.subject,
    level: data.level,
    format: data.format,
    location: data.format === "online" ? "" : text.location,
  };
}
