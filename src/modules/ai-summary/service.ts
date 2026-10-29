
import { PrismaClient } from "../../generated/prisma/client";
import { AISummaryWhereInput } from "../../generated/prisma/models";
import { LLMClient } from "../../ai/client";
import { WEEKLY_SUMMARY_SYSTEM, buildWeeklyPrompt } from "../../ai/prompts";
import { startOfWeek, addWeeks } from "../../lib/utils";
import { weeklySummarySelect } from "./types";
import { NotFoundError } from "../../lib/errors";

export class AISummaryService {

  private llm = new LLMClient()

  constructor(private db: PrismaClient) { }

  async getExistingSummary(where: AISummaryWhereInput) {
    return this.db.aISummary.findFirst({ where });
  }

  async getProgramWeekData(athleteId: string, programId: string) {

    const weekStart = addWeeks(startOfWeek(), -1); // week that just ended
    const weekEnd = addWeeks(weekStart, 1);

    const programWithLogs = await this.db.program.findFirst({
      where: { id: programId },
      select: weeklySummarySelect(athleteId, weekStart, weekEnd)
    });

    return programWithLogs
  }

  async saveSummary (programId: string, weekStart: Date, content: string) {
    return this.db.aISummary.create({
      data: { programId, weekStart, content }
    });
  }

  // force: regenerate and overwrite this week's summary instead of returning the saved one
  async generateWeeklySummary (programId: string, athleteId: string, force = false) {
    const weekStart = addWeeks(startOfWeek(), -1);
    const weekEnd = addWeeks(weekStart, 1);

    const existing = await this.getExistingSummary({ programId, weekStart });
    if (existing && !force) return existing;

    const program = await this.getProgramWeekData(athleteId, programId);
    if (!program) throw new NotFoundError("Program");

    const sessions = program.phase.flatMap(p => p.session);

    const content = await this.llm.generateText(
      WEEKLY_SUMMARY_SYSTEM,
      buildWeeklyPrompt(program, sessions, weekStart, weekEnd),
    );

    if (existing) {
      return this.db.aISummary.update({ where: { id: existing.id }, data: { content } });
    }

    return this.saveSummary(programId, weekStart, content);
  }
}