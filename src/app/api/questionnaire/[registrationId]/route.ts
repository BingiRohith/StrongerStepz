import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { RegistrationRepository } from "@/repositories/RegistrationRepository";
import { WorkshopRepository } from "@/repositories/WorkshopRepository";
import { NotFoundError } from "@/errors/NotFoundError";

/** Public, minimal questionnaire context for a registration; no registrant details are exposed. */
export const GET = withParamsErrorHandling<{ registrationId: string }>(async (_request, { params }) => {
  const { registrationId } = await params;
  const registration = await new RegistrationRepository().findById(registrationId);
  if (!registration) throw new NotFoundError("Registration not found");
  const workshop = await new WorkshopRepository().findById(registration.workshopId.toString());
  if (!workshop) throw new NotFoundError("Workshop not found");
  const questionnaireQuestions = workshop.questionnaireQuestions ?? [];
  return apiSuccess({ questions: questionnaireQuestions.filter((question) => question._id).map((question) => ({ _id: question._id!.toString(), text: question.text, type: question.type ?? "text", options: question.options ?? [] })) });
});
