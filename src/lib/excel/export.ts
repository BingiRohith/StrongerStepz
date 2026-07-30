import ExcelJS from "exceljs";
import type { RegistrationDocument } from "@/models/Registration";
import type { QuestionnaireResponseDocument } from "@/models/QuestionnaireResponse";
import type { FeedbackFormDocument } from "@/models/FeedbackForm";
import type { FeedbackResponseDocument } from "@/models/FeedbackResponse";

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending Payment",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

/** Builds the registrations workbook — pure "data in, spreadsheet out", no fetching or auth here. */
export async function buildRegistrationsWorkbook(registrations: RegistrationDocument[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Registrations");

  sheet.columns = [
    { header: "Registration Number", key: "registrationNumber", width: 20 },
    { header: "Name", key: "name", width: 24 },
    { header: "WhatsApp Number", key: "phone", width: 16 },
    { header: "Email", key: "email", width: 28 },
    { header: "Age", key: "age", width: 8 },
    { header: "Gender", key: "gender", width: 18 },
    { header: "City", key: "city", width: 18 },
    { header: "Preferred Language", key: "preferredLanguage", width: 18 },
    { header: "Registration Status", key: "status", width: 20 },
    { header: "Registration Date", key: "createdAt", width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const registration of registrations) {
    sheet.addRow({
      registrationNumber: registration.registrationNumber,
      name: registration.name,
      phone: registration.phone,
      email: registration.email,
      age: registration.age,
      gender: GENDER_LABELS[registration.gender] ?? registration.gender,
      city: registration.city,
      preferredLanguage: registration.preferredLanguage,
      status: STATUS_LABELS[registration.status] ?? registration.status,
      createdAt: new Date(registration.createdAt).toLocaleString("en-IN"),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** "Wolf's Law-18-07-2026.xlsx" — workshop title + its date as DD-MM-YYYY. */
export function buildExportFilename(workshopTitle: string, workshopDate: Date): string {
  const date = new Date(workshopDate);
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  return `${workshopTitle}-${dd}-${mm}-${yyyy}.xlsx`;
}

/** "Questionnaire-Responses-27-07-2026.xlsx" — base name + today's date as DD-MM-YYYY, for exports with no single workshop/date to key off. */
export function buildTimestampedExportFilename(baseName: string): string {
  const now = new Date();
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = now.getUTCFullYear();
  return `${baseName}-${dd}-${mm}-${yyyy}.xlsx`;
}

/** Builds the questionnaire responses workbook — pure "data in, spreadsheet out", no fetching or auth here. */
export async function buildQuestionnaireResponsesWorkbook(
  responses: QuestionnaireResponseDocument[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Questionnaire Responses");

  sheet.columns = [
    { header: "Registration ID", key: "registrationId", width: 26 },
    { header: "Question 1", key: "question1Answer", width: 45 },
    { header: "Question 1 (Other)", key: "question1OtherText", width: 30 },
    { header: "Question 2", key: "question2Answer", width: 45 },
    { header: "Question 2 (Other)", key: "question2OtherText", width: 30 },
    { header: "Question 3", key: "question3Answer", width: 45 },
    { header: "Submitted At", key: "createdAt", width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const response of responses) {
    sheet.addRow({
      registrationId: response.registrationId.toString(),
      question1Answer: response.question1Answer,
      question1OtherText: response.question1OtherText ?? "",
      question2Answer: response.question2Answer,
      question2OtherText: response.question2OtherText ?? "",
      question3Answer: response.question3Answer,
      createdAt: new Date(response.createdAt).toLocaleString("en-IN"),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function formatFeedbackAnswerValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

/** Builds the feedback responses workbook — columns are derived from the referenced form's `fields[]` at export time, since the schema itself is admin-authored data. */
export async function buildFeedbackResponsesWorkbook(
  form: FeedbackFormDocument,
  responses: FeedbackResponseDocument[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Feedback Responses");

  sheet.columns = [
    { header: "Registration ID", key: "registrationId", width: 26 },
    ...form.fields.map((field) => ({ header: field.label, key: field.key, width: 30 })),
    { header: "Submitted At", key: "createdAt", width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const response of responses) {
    const row: Record<string, string> = {
      registrationId: response.registrationId ? response.registrationId.toString() : "",
      createdAt: new Date(response.createdAt).toLocaleString("en-IN"),
    };
    for (const answer of response.answers) {
      row[answer.fieldKey] = formatFeedbackAnswerValue(answer.value);
    }
    sheet.addRow(row);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
