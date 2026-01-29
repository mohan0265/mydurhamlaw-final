export type IcsEvent = {
  uid: string;
  title: string;
  start: Date; // local date/time
  end?: Date; // optional
  description?: string;
  url?: string;
  location?: string;
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function toICSDate(d: Date) {
  // Convert local -> "floating" ICS time (or use UTC with 'Z' if you prefer)
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${y}${m}${day}T${hh}${mm}${ss}`;
}

export function buildICS(
  filenameBase: string,
  events: IcsEvent[],
): { filename: string; content: string } {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Caseway//Planner//EN",
    "CALSCALE:GREGORIAN",
  ];

  for (const e of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.uid}`);
    lines.push(`DTSTAMP:${toICSDate(new Date())}`);
    lines.push(`DTSTART:${toICSDate(e.start)}`);
    if (e.end) lines.push(`DTEND:${toICSDate(e.end)}`);
    lines.push(`SUMMARY:${(e.title || "").replace(/\r?\n/g, " ")}`);
    if (e.description)
      lines.push(`DESCRIPTION:${e.description.replace(/\r?\n/g, " ")}`);
    if (e.url) lines.push(`URL:${e.url}`);
    if (e.location) lines.push(`LOCATION:${e.location}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return { filename: `${filenameBase}.ics`, content: lines.join("\r\n") };
}
