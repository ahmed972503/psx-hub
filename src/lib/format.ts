export function formatWhen(value: Date | string | null | undefined) {
  if (!value) return "Time not provided by source";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Time not provided by source";
  return `${new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  }).format(date)} PKT`;
}

export function formatDay(value: Date | string | null | undefined) {
  if (!value) return "Date not stated in source";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not stated in source";
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeZone: "Asia/Karachi",
  }).format(date);
}

export function countdown(value: Date | string | null | undefined) {
  if (!value) return "No date";
  const date = value instanceof Date ? value : new Date(value);
  const start = new Date();
  const today = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const target = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const days = Math.round((target - today) / 86400000);
  if (days < 0) return "Past";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

export function titleCase(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}
