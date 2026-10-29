import type { WeeklyProgramData, WeeklySessionData, LoggedSet } from "../modules/ai-summary/types";

export const WEEKLY_SUMMARY_SYSTEM = `You are an assistant for a track and field coach.
Summarize one athlete's training week from the data provided.

Cover, in this order:
1. Planned vs. actual: completed, missed, and off-target exercises or sessions.
2. Anything notable in the athlete's notes (pain, fatigue, PRs).
3. One suggested tweak for next week, only if the data supports it.

Rules:
- Be short and factual: under 200 words, plain text, no headings or markdown.
- Athlete and coach notes may be in English, Tagalog, or Hiligaynon. Quote the original note and give a short English translation.
- An exercise marked "not logged" on a past date counts as not done. Never call it "pending".
- Compare logged reps to planned reps and mention meaningful differences.
- Mention how many days remain until competition only if it affects the suggestion.
- The coach makes the final call, so phrase suggestions as options, not orders.
- Do not invent data that isn't provided. If something is missing, say so.
- If the data says no exercises were logged this week, state only that, list the planned sessions, and do not describe performance, fatigue, or progress. Make no training suggestion beyond asking the athlete to log their sessions.`;

const dayFmt = (d: Date) =>
  d.toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Manila",
  });

function buildHeader(program: WeeklyProgramData, weekStart: Date, weekEnd: Date, now = new Date()) {
  const daysToComp = Math.ceil((program.date.getTime() - now.getTime()) / 86_400_000);
  const lastDay = new Date(weekEnd.getTime() - 24 * 60 * 60 * 1000); // Sunday

  const lines = [
    `Program: ${program.name}`,
    `Week covered: ${dayFmt(weekStart)} to ${dayFmt(lastDay)}`,
  ];
  if (daysToComp > 0) lines.push(`Competition in ${daysToComp} days`);
  return lines.join("\n");
}

function buildWeekText(sessions: WeeklySessionData[]) {
  return sessions
    .map((s) => {
      const lines = s.exercise.map((e) => {
        const entry = e.athleteLogs[0];
        const sets = (entry?.log ?? []) as LoggedSet[];
        const actual = entry
          ? `logged ${sets.length} sets: ${sets.map((l) => l.reps).join(", ")} reps`
          : "not logged";
        const note = entry?.notes ? ` | athlete note: "${entry.notes}"` : "";
        return `- ${e.name}: planned ${e.sets}x${e.reps}; ${actual}${note}`;
      });
      const coachNote = s.notes ? ` (coach notes: ${s.notes})` : "";
      return `${dayFmt(s.date)}: ${s.title}${coachNote}\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

export function buildWeeklyPrompt(
  program: WeeklyProgramData,
  sessions: WeeklySessionData[],
  weekStart: Date,
  weekEnd: Date,
): string {
  const anyLogged = sessions.some((s) => s.exercise.some((e) => e.athleteLogs.length > 0));
  const logNote = anyLogged ? "" : "\n\nNo exercises were logged by the athlete this week.";
  return `${buildHeader(program, weekStart, weekEnd)}\n\n${buildWeekText(sessions)}${logNote}`;
}