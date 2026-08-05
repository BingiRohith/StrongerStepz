/**
 * One-time Phase 7 backfill for data that predates this phase's schema
 * additions — run with `npm run migrate:phase7`.
 *
 * Idempotent: every step only touches documents missing the field it sets,
 * so re-running this against an already-migrated (or partially migrated)
 * database is always safe and a no-op past the first successful pass.
 *
 * Steps:
 *   1. `Registration.joinedCommunity` — default `false` where missing.
 *   2. `QuestionnaireResponse.workshopId` / `FeedbackResponse.workshopId` —
 *      backfilled from the linked `Registration`, where that registration
 *      still exists.
 *   3. `QuestionnaireResponse.question1Text`/`question2Text`/`question3Text`
 *      — snapshotted from the current `QUESTIONNAIRE_PROMPTS` constant.
 *   4. `FeedbackResponse.answers[].label` — snapshotted from the parent
 *      `FeedbackForm`'s current field labels, where that form/field still
 *      exists.
 */
import fs from "node:fs";
import path from "node:path";

// tsx doesn't auto-load .env.local the way `next dev` does, so load it manually
// before anything that reads process.env (connectToDatabase, etc.).
function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/db/connect";
import { Registration } from "../src/models/Registration";
import { QuestionnaireResponse } from "../src/models/QuestionnaireResponse";
import { FeedbackResponse } from "../src/models/FeedbackResponse";
import { FeedbackForm } from "../src/models/FeedbackForm";
import { QUESTIONNAIRE_PROMPTS } from "../src/lib/constants/questionnaire";

async function backfillJoinedCommunity(): Promise<void> {
  const result = await Registration.updateMany(
    { joinedCommunity: { $exists: false } },
    { $set: { joinedCommunity: false } }
  );
  console.log(`[joinedCommunity] defaulted ${result.modifiedCount} registration(s) to false.`);
}

async function backfillQuestionnaireWorkshopId(): Promise<void> {
  const missing = await QuestionnaireResponse.find({ workshopId: { $exists: false } })
    .select({ _id: 1, registrationId: 1 })
    .lean();

  let updated = 0;
  let skipped = 0;
  for (const response of missing) {
    const registration = await Registration.findById(response.registrationId).select({ workshopId: 1 }).lean();
    if (!registration) {
      skipped += 1;
      continue;
    }
    await QuestionnaireResponse.updateOne({ _id: response._id }, { $set: { workshopId: registration.workshopId } });
    updated += 1;
  }
  console.log(
    `[QuestionnaireResponse.workshopId] backfilled ${updated} of ${missing.length} (skipped ${skipped} — registration no longer exists).`
  );
}

async function backfillFeedbackWorkshopId(): Promise<void> {
  const missing = await FeedbackResponse.find({ workshopId: { $exists: false }, registrationId: { $exists: true } })
    .select({ _id: 1, registrationId: 1 })
    .lean();

  let updated = 0;
  let skipped = 0;
  for (const response of missing) {
    const registration = await Registration.findById(response.registrationId).select({ workshopId: 1 }).lean();
    if (!registration) {
      skipped += 1;
      continue;
    }
    await FeedbackResponse.updateOne({ _id: response._id }, { $set: { workshopId: registration.workshopId } });
    updated += 1;
  }
  console.log(
    `[FeedbackResponse.workshopId] backfilled ${updated} of ${missing.length} (skipped ${skipped} — registration no longer exists).`
  );
}

async function backfillQuestionnaireTextSnapshots(): Promise<void> {
  const result = await QuestionnaireResponse.updateMany(
    { question1Text: { $exists: false } },
    {
      $set: {
        question1Text: QUESTIONNAIRE_PROMPTS.question1,
        question2Text: QUESTIONNAIRE_PROMPTS.question2,
        question3Text: QUESTIONNAIRE_PROMPTS.question3,
      },
    }
  );
  console.log(`[QuestionnaireResponse question text] snapshotted ${result.modifiedCount} response(s).`);
}

async function backfillFeedbackAnswerLabels(): Promise<void> {
  const missing = await FeedbackResponse.find({ "answers.label": { $exists: false } });

  let updated = 0;
  let skippedAnswers = 0;
  for (const response of missing) {
    const form = await FeedbackForm.findById(response.formId).select({ fields: 1 }).lean();
    const labelByKey = new Map((form?.fields ?? []).map((field) => [field.key, field.label]));

    let changed = false;
    for (const answer of response.answers) {
      if (answer.label) continue;
      const label = labelByKey.get(answer.fieldKey);
      if (label) {
        answer.label = label;
        changed = true;
      } else {
        skippedAnswers += 1;
      }
    }

    if (changed) {
      await response.save();
      updated += 1;
    }
  }
  console.log(
    `[FeedbackResponse answer labels] snapshotted labels on ${updated} of ${missing.length} response(s) (skipped ${skippedAnswers} answer(s) — field no longer exists on its form).`
  );
}

async function main() {
  await connectToDatabase();

  await backfillJoinedCommunity();
  await backfillQuestionnaireWorkshopId();
  await backfillFeedbackWorkshopId();
  await backfillQuestionnaireTextSnapshots();
  await backfillFeedbackAnswerLabels();

  await mongoose.connection.close();
  console.log("Phase 7 migration complete.");
}

main().catch((error) => {
  console.error("Phase 7 migration failed:", error);
  process.exit(1);
});
