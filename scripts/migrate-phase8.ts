/**
 * Safe Phase 8 backfill. It creates scalable immutable `questions` arrays
 * only for legacy responses that do not have one. Existing source fields are
 * retained untouched, so this is safe to run repeatedly and never deletes data.
 */
import fs from "node:fs";
import path from "node:path";
for (const line of (() => { const file = path.resolve(process.cwd(), ".env.local"); return fs.existsSync(file) ? fs.readFileSync(file, "utf8").split("\n") : []; })()) {
  const [key, ...value] = line.split("="); if (key?.trim() && value.length && !process.env[key.trim()]) process.env[key.trim()] = value.join("=").trim().replace(/^"|"$/g, "");
}
import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/db/connect";
import { QuestionnaireResponse } from "../src/models/QuestionnaireResponse";
import { QUESTIONNAIRE_PROMPTS } from "../src/lib/constants/questionnaire";

async function main() {
  await connectToDatabase();
  const responses = await QuestionnaireResponse.find({ questions: { $exists: false } });
  let updated = 0;
  for (const response of responses) {
    const questions = [
      response.question1Answer ? { questionText: response.question1Text ?? QUESTIONNAIRE_PROMPTS.question1, answer: `${response.question1Answer}${response.question1OtherText ? ` — ${response.question1OtherText}` : ""}` } : null,
      response.question2Answer ? { questionText: response.question2Text ?? QUESTIONNAIRE_PROMPTS.question2, answer: `${response.question2Answer}${response.question2OtherText ? ` — ${response.question2OtherText}` : ""}` } : null,
      response.question3Answer ? { questionText: response.question3Text ?? QUESTIONNAIRE_PROMPTS.question3, answer: response.question3Answer } : null,
    ].filter(Boolean);
    if (questions.length) { response.questions = questions as NonNullable<typeof response.questions>; await response.save(); updated += 1; }
  }
  await mongoose.connection.close();
  console.log(`Phase 8 migration complete: ${updated} response(s) backfilled.`);
}
main().catch((error) => { console.error("Phase 8 migration failed:", error); process.exit(1); });
