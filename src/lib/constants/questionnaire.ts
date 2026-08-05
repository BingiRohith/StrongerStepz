/**
 * The fixed 3-question post-registration questionnaire's prompt text — the
 * single source of truth shared by the public questionnaire page (rendering)
 * and `QuestionnaireResponseService` (snapshotting into each submitted
 * response at submit time, see `question1Text`/`question2Text`/
 * `question3Text` on `QuestionnaireResponse`). Snapshotting means a future
 * edit to the text below never changes how an already-submitted response
 * displays in the admin — only new submissions pick up the new wording.
 */
export const QUESTIONNAIRE_PROMPTS = {
  question1: "What brings you to this workshop?",
  question2: "Who are you attending for?",
  question3: "How active are you currently?",
} as const;
