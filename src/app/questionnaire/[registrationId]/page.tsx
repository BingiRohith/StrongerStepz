"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";

interface Question { _id: string; text: string; type: "option" | "text"; options: string[] }
interface ApiEnvelope<T> { success: boolean; data?: T; error?: { message: string } }
interface PdfDocumentView { _id: string; title: string }
interface WhatsappCommunitySettings { inviteUrl: string; buttonText: string; enabled: boolean }

/** Fetches the registration's workshop questions and submits immutable question-id/answer pairs. */
export default function QuestionnairePage() {
  const { registrationId } = useParams<{ registrationId: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pdf, setPdf] = useState<PdfDocumentView | null>(null);
  const [whatsappCommunity, setWhatsappCommunity] = useState<WhatsappCommunitySettings | null>(null);

  useEffect(() => {
    fetch(`/api/questionnaire/${registrationId}`).then(async (response) => {
      const body = await response.json() as ApiEnvelope<{ questions: Question[] }>;
      if (!response.ok || !body.success || !body.data) throw new Error(body.error?.message ?? "Unable to load questionnaire.");
      setQuestions(body.data.questions);
    }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, [registrationId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (questions.some((question) => !answers[question._id]?.trim())) { setError("Please answer every question."); return; }
    setSubmitting(true); setError(null);
    try {
      const response = await fetch("/api/questionnaire-responses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registrationId, questions: questions.map((question) => ({ questionId: question._id, answer: answers[question._id]!.trim() })) }) });
      const body = await response.json() as ApiEnvelope<unknown>;
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Unable to submit questionnaire.");
      const [pdfResponse, communityResponse] = await Promise.all([fetch("/api/pdfs/active").catch(() => null), fetch("/api/whatsapp-community").catch(() => null)]);
      if (pdfResponse?.ok) { const pdfBody = await pdfResponse.json() as ApiEnvelope<PdfDocumentView[]>; const activePdf = pdfBody.data?.[0]; if (activePdf) { setPdf(activePdf); const link = document.createElement("a"); link.href = `/api/pdfs/${activePdf._id}/download`; link.download = activePdf.title; document.body.appendChild(link); link.click(); link.remove(); } }
      if (communityResponse?.ok) { const communityBody = await communityResponse.json() as ApiEnvelope<WhatsappCommunitySettings>; if (communityBody.data) setWhatsappCommunity(communityBody.data); }
      setSubmitted(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to submit questionnaire."); }
    finally { setSubmitting(false); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-surface-light px-4 py-12"><Card className="w-full max-w-2xl p-6 sm:p-10">{submitted ? <div className="text-center"><p className="mb-2 text-5xl">🎉</p><h1 className="mb-3 font-heading text-2xl text-primary-dark">Thank You!</h1><p className="text-ink-muted">Your responses have been recorded. We can&apos;t wait to see you at the workshop!</p>{pdf && <a className="mt-5 block" href={`/api/pdfs/${pdf._id}/download`}><Button className="w-full">Download {pdf.title}</Button></a>}{whatsappCommunity?.enabled && whatsappCommunity.inviteUrl && <a className="mt-4 block" href={whatsappCommunity.inviteUrl} target="_blank" rel="noopener noreferrer" onClick={() => { fetch(`/api/registrations/${registrationId}/join-community`, { method: "PATCH" }).catch(() => undefined); }}><Button className="w-full bg-[#25D366] shadow-none hover:bg-[#1ebc59]">📱 {whatsappCommunity.buttonText}</Button></a>}</div> : loading ? <p className="text-center text-ink-muted">Loading questionnaire…</p> : error && !questions.length ? <p role="alert" className="text-center text-red-600">{error}</p> : !questions.length ? <form onSubmit={submit} className="text-center"><h1 className="mb-2 font-heading text-2xl text-primary-dark">You&apos;re all set</h1><p className="mb-6 text-ink-muted">There are no questionnaire questions for this workshop.</p><Button type="submit" disabled={submitting}>{submitting ? "Continuing…" : "Continue"}</Button></form> : <form onSubmit={submit} className="flex flex-col gap-6"><div className="text-center"><h1 className="mb-2 font-heading text-2xl text-primary-dark">Just One More Step</h1><p className="text-ink-muted">Help us tailor this workshop to you.</p></div>{questions.map((question, index) => question.type === "option" ? <fieldset key={question._id}><legend className="mb-3 font-semibold text-ink">{index + 1}. {question.text}</legend>{question.options.map((option) => <label key={option} className="mb-2 flex items-center gap-3 rounded-xl border p-3"><input type="radio" name={question._id} required checked={answers[question._id] === option} onChange={() => setAnswers((current) => ({ ...current, [question._id]: option }))} disabled={submitting} /><span>{option}</span></label>)}</fieldset> : <Textarea key={question._id} label={`${index + 1}. ${question.text}`} rows={4} required value={answers[question._id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question._id]: event.target.value }))} disabled={submitting} />)}{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<Button type="submit" size="lg" className="w-full" disabled={submitting}>{submitting ? "Submitting…" : "Submit"}</Button></form>}</Card></main>;
}
