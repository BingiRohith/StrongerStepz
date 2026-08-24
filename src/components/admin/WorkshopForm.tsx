"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ReorderControls } from "@/components/admin/ReorderControls";
import type { WorkshopStatus } from "@/models/Workshop";

export interface WorkshopFormInitialValue {
  title?: string;
  subtitle?: string;
  description?: string;
  date?: string;
  time?: string;
  duration?: string;
  price?: number;
  originalPrice?: number;
  doctors?: { name: string }[];
  benefits?: string[];
  passIncludes?: string[];
  agenda?: { icon: string; text: string }[];
  faq?: { question: string; answer: string }[];
  zoomLink?: string;
  whatsappCommunityLink?: string;
  registrationLimit?: number | null;
  limitedSeatsEnabled?: boolean;
  limitedSeats?: number | null;
  questionnaireQuestions?: { _id?: string; text: string; type?: "option" | "text"; options?: string[] }[];
  registrationOpenDate?: string;
  registrationCloseDate?: string;
  status?: WorkshopStatus;
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
}

export interface WorkshopFormProps {
  mode: "create" | "edit";
  workshopId?: string;
  initialValue?: WorkshopFormInitialValue;
}

interface FormState {
  title: string;
  subtitle: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  price: string;
  originalPrice: string;
  doctors: { name: string }[];
  benefits: string[];
  passIncludes: string[];
  agenda: { icon: string; text: string }[];
  faq: { question: string; answer: string }[];
  zoomLink: string;
  whatsappCommunityLink: string;
  registrationLimit: string;
  limitedSeatsEnabled: boolean;
  limitedSeats: string;
  questionnaireQuestions: { _id?: string; text: string; type: "option" | "text"; options: string[] }[];
  registrationOpenDate: string;
  registrationCloseDate: string;
  status: WorkshopStatus;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  slug: string;
}

function toDateInputValue(date?: string | Date): string {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function buildInitialState(initialValue?: WorkshopFormInitialValue): FormState {
  return {
    title: initialValue?.title ?? "",
    subtitle: initialValue?.subtitle ?? "",
    description: initialValue?.description ?? "",
    date: toDateInputValue(initialValue?.date),
    time: initialValue?.time ?? "",
    duration: initialValue?.duration ?? "",
    price: initialValue?.price !== undefined ? String(initialValue.price) : "",
    originalPrice: initialValue?.originalPrice !== undefined ? String(initialValue.originalPrice) : "",
    doctors: initialValue?.doctors?.length ? initialValue.doctors : [{ name: "" }],
    benefits: initialValue?.benefits?.length ? initialValue.benefits : [""],
    passIncludes: initialValue?.passIncludes?.length ? initialValue.passIncludes : [""],
    agenda: initialValue?.agenda?.length ? initialValue.agenda : [{ icon: "", text: "" }],
    faq: initialValue?.faq?.length ? initialValue.faq : [{ question: "", answer: "" }],
    zoomLink: initialValue?.zoomLink ?? "",
    whatsappCommunityLink: initialValue?.whatsappCommunityLink ?? "",
    registrationLimit: initialValue?.registrationLimit != null ? String(initialValue.registrationLimit) : "",
    limitedSeatsEnabled: initialValue?.limitedSeatsEnabled ?? false,
    limitedSeats: initialValue?.limitedSeats != null ? String(initialValue.limitedSeats) : "",
    questionnaireQuestions: initialValue?.questionnaireQuestions?.length ? initialValue.questionnaireQuestions.map((question) => ({ ...question, type: question.type ?? "text", options: question.options ?? [] })) : [],
    registrationOpenDate: toDateInputValue(initialValue?.registrationOpenDate),
    registrationCloseDate: toDateInputValue(initialValue?.registrationCloseDate),
    status: initialValue?.status ?? "draft",
    featured: initialValue?.featured ?? false,
    seoTitle: initialValue?.seoTitle ?? "",
    seoDescription: initialValue?.seoDescription ?? "",
    slug: initialValue?.slug ?? "",
  };
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(index, 1);
  if (moved === undefined) return items;
  next.splice(targetIndex, 0, moved);
  return next;
}

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "disabled", label: "Disabled" },
  { value: "archived", label: "Archived" },
];

export function WorkshopForm({ mode, workshopId, initialValue }: WorkshopFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildInitialState(initialValue));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      description: form.description,
      date: form.date,
      time: form.time,
      duration: form.duration,
      price: form.price === "" ? undefined : Number(form.price),
      originalPrice: form.originalPrice === "" ? undefined : Number(form.originalPrice),
      doctors: form.doctors.filter((doctor) => doctor.name.trim() !== ""),
      benefits: form.benefits.map((b) => b.trim()).filter(Boolean),
      passIncludes: form.passIncludes.map((p) => p.trim()).filter(Boolean),
      agenda: form.agenda.filter((item) => item.text.trim() !== ""),
      faq: form.faq.filter((item) => item.question.trim() !== "" && item.answer.trim() !== ""),
      zoomLink: form.zoomLink,
      whatsappCommunityLink: form.whatsappCommunityLink,
      registrationLimit: form.registrationLimit === "" ? null : Number(form.registrationLimit),
      limitedSeatsEnabled: form.limitedSeatsEnabled,
      limitedSeats: form.limitedSeatsEnabled && form.limitedSeats !== "" ? Number(form.limitedSeats) : null,
      questionnaireQuestions: form.questionnaireQuestions.map((question) => ({ ...question, text: question.text.trim(), options: question.type === "option" ? question.options.map((option) => option.trim()).filter(Boolean) : [] })).filter((question) => question.text),
      registrationOpenDate: form.registrationOpenDate || undefined,
      registrationCloseDate: form.registrationCloseDate || undefined,
      status: form.status,
      featured: form.featured,
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      slug: form.slug,
    };

    try {
      const url = mode === "create" ? "/api/workshops" : `/api/workshops/${workshopId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();

      if (!response.ok || !body.success) {
        if (body.error?.code === "VALIDATION_ERROR" && body.error.details?.fieldErrors) {
          const nextFieldErrors: Record<string, string> = {};
          for (const [field, messages] of Object.entries(body.error.details.fieldErrors as Record<string, string[]>)) {
            if (messages[0]) nextFieldErrors[field] = messages[0];
          }
          setFieldErrors(nextFieldErrors);
        } else {
          setFormError(body.error?.message ?? "Something went wrong. Please try again.");
        }
        return;
      }

      router.push("/admin/workshops");
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {formError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {formError}
        </p>
      )}

      <Card className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
        <Input label="Title" required value={form.title} onChange={(e) => update("title", e.target.value)} error={fieldErrors.title} />
        <Input label="Slug" required value={form.slug} onChange={(e) => update("slug", e.target.value)} error={fieldErrors.slug} placeholder="wolfs-law" />
        <div className="md:col-span-2">
          <Input label="Subtitle" required value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} error={fieldErrors.subtitle} />
        </div>
        <div className="md:col-span-2">
          <Textarea label="Description" required rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} error={fieldErrors.description} />
        </div>
        <Input label="Date" type="date" required value={form.date} onChange={(e) => update("date", e.target.value)} error={fieldErrors.date} />
        <Input label="Time" required value={form.time} onChange={(e) => update("time", e.target.value)} error={fieldErrors.time} placeholder="9 AM - 1 PM" />
        <Input label="Duration" required value={form.duration} onChange={(e) => update("duration", e.target.value)} error={fieldErrors.duration} placeholder="4 hours" />
        <Input label="Price (₹)" type="number" min={0} required value={form.price} onChange={(e) => update("price", e.target.value)} error={fieldErrors.price} />
        <Input label="Original Price (₹)" type="number" min={0} value={form.originalPrice} onChange={(e) => update("originalPrice", e.target.value)} error={fieldErrors.originalPrice} />
      </Card>

      <Card className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
        <Input label="Zoom Link" type="url" value={form.zoomLink} onChange={(e) => update("zoomLink", e.target.value)} error={fieldErrors.zoomLink} placeholder="https://zoom.us/j/..." />
        <Input label="WhatsApp Community Link" type="url" value={form.whatsappCommunityLink} onChange={(e) => update("whatsappCommunityLink", e.target.value)} error={fieldErrors.whatsappCommunityLink} placeholder="https://chat.whatsapp.com/..." />
        <Input label="Registration Limit" type="number" min={1} value={form.registrationLimit} onChange={(e) => update("registrationLimit", e.target.value)} error={fieldErrors.registrationLimit} placeholder="Leave blank for unlimited" />
        <label className="flex items-center gap-3 font-semibold text-ink">
          <input type="checkbox" className="h-5 w-5 accent-primary" checked={form.limitedSeatsEnabled} onChange={(e) => update("limitedSeatsEnabled", e.target.checked)} />
          Show limited-seats notice
        </label>
        {form.limitedSeatsEnabled ? <Input label="Limited Seats" type="number" min={1} required value={form.limitedSeats} onChange={(e) => update("limitedSeats", e.target.value)} error={fieldErrors.limitedSeats} placeholder="20" /> : <div />}
        <Select label="Status" options={statusOptions} value={form.status} onChange={(e) => update("status", e.target.value as WorkshopStatus)} />
        <Input label="Registration Open Date" type="date" value={form.registrationOpenDate} onChange={(e) => update("registrationOpenDate", e.target.value)} />
        <Input label="Registration Close Date" type="date" value={form.registrationCloseDate} onChange={(e) => update("registrationCloseDate", e.target.value)} />
        <label className="flex items-center gap-3 font-semibold text-ink">
          <input type="checkbox" className="h-5 w-5 accent-primary" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
          Featured (shown on the public landing page)
        </label>
      </Card>

      <Card className="p-6">
        <h3 className="mb-1 font-heading text-lg text-primary-dark">Questionnaire Questions</h3>
        <p className="mb-4 text-sm text-ink-muted">These questions apply only to this workshop. Submitted answers keep a permanent copy of the question text.</p>
        <div className="flex flex-col gap-3">
          {form.questionnaireQuestions.map((question, index) => (
            <div key={question._id ?? index} className="flex items-start gap-3">
              <ReorderControls canMoveUp={index > 0} canMoveDown={index < form.questionnaireQuestions.length - 1} onMoveUp={() => update("questionnaireQuestions", moveItem(form.questionnaireQuestions, index, -1))} onMoveDown={() => update("questionnaireQuestions", moveItem(form.questionnaireQuestions, index, 1))} />
              <div className="flex-1"><Textarea rows={2} placeholder="What would you like to improve?" value={question.text} onChange={(e) => update("questionnaireQuestions", form.questionnaireQuestions.map((item, itemIndex) => itemIndex === index ? { ...item, text: e.target.value } : item))} /><Select className="mt-2" value={question.type} onChange={(e) => update("questionnaireQuestions", form.questionnaireQuestions.map((item, itemIndex) => itemIndex === index ? { ...item, type: e.target.value as "option" | "text" } : item))} options={[{ value: "text", label: "Written answer" }, { value: "option", label: "Selectable options" }]} />{question.type === "option" && <div className="mt-2 flex flex-col gap-2">{question.options.map((option, optionIndex) => <div key={optionIndex} className="flex gap-2"><ReorderControls canMoveUp={optionIndex > 0} canMoveDown={optionIndex < question.options.length - 1} onMoveUp={() => update("questionnaireQuestions", form.questionnaireQuestions.map((item, itemIndex) => itemIndex === index ? { ...item, options: moveItem(item.options, optionIndex, -1) } : item))} onMoveDown={() => update("questionnaireQuestions", form.questionnaireQuestions.map((item, itemIndex) => itemIndex === index ? { ...item, options: moveItem(item.options, optionIndex, 1) } : item))} /><Input className="flex-1" value={option} placeholder="Option" onChange={(e) => update("questionnaireQuestions", form.questionnaireQuestions.map((item, itemIndex) => itemIndex === index ? { ...item, options: item.options.map((current, currentIndex) => currentIndex === optionIndex ? e.target.value : current) } : item))} /><Button type="button" variant="ghost" size="sm" onClick={() => update("questionnaireQuestions", form.questionnaireQuestions.map((item, itemIndex) => itemIndex === index ? { ...item, options: item.options.filter((_, currentIndex) => currentIndex !== optionIndex) } : item))}>Remove</Button></div>)}<Button type="button" variant="secondary" size="sm" onClick={() => update("questionnaireQuestions", form.questionnaireQuestions.map((item, itemIndex) => itemIndex === index ? { ...item, options: [...item.options, ""] } : item))}>+ Add Option</Button></div>}</div>
              <Button type="button" variant="ghost" size="sm" onClick={() => update("questionnaireQuestions", form.questionnaireQuestions.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => update("questionnaireQuestions", [...form.questionnaireQuestions, { text: "", type: "text", options: [] }])}>+ Add Question</Button>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-heading text-lg text-primary-dark">Doctors</h3>
        <div className="flex flex-col gap-3">
          {form.doctors.map((doctor, index) => (
            <div key={index} className="flex items-center gap-3">
              <Input
                className="flex-1"
                placeholder="Dr. Full Name"
                value={doctor.name}
                onChange={(e) => update("doctors", form.doctors.map((d, i) => (i === index ? { name: e.target.value } : d)))}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => update("doctors", form.doctors.filter((_, i) => i !== index))}>
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => update("doctors", [...form.doctors, { name: "" }])}>
          + Add Doctor
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-heading text-lg text-primary-dark">Benefits</h3>
        <div className="flex flex-col gap-3">
          {form.benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <Input
                className="flex-1"
                placeholder="Why the body changes after 50"
                value={benefit}
                onChange={(e) => update("benefits", form.benefits.map((b, i) => (i === index ? e.target.value : b)))}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => update("benefits", form.benefits.filter((_, i) => i !== index))}>
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => update("benefits", [...form.benefits, ""])}>
          + Add Benefit
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-heading text-lg text-primary-dark">Pass Includes</h3>
        <p className="mb-4 text-sm text-ink-muted">Shown as the checklist under &ldquo;Your pass includes&rdquo; on the registration card. Leave empty to hide that box.</p>
        <div className="flex flex-col gap-3">
          {form.passIncludes.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <ReorderControls
                canMoveUp={index > 0}
                canMoveDown={index < form.passIncludes.length - 1}
                onMoveUp={() => update("passIncludes", moveItem(form.passIncludes, index, -1))}
                onMoveDown={() => update("passIncludes", moveItem(form.passIncludes, index, 1))}
              />
              <Input
                className="flex-1"
                placeholder="Live workshop access"
                value={item}
                onChange={(e) => update("passIncludes", form.passIncludes.map((p, i) => (i === index ? e.target.value : p)))}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => update("passIncludes", form.passIncludes.filter((_, i) => i !== index))}>
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => update("passIncludes", [...form.passIncludes, ""])}>
          + Add Item
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-heading text-lg text-primary-dark">Agenda</h3>
        <div className="flex flex-col gap-3">
          {form.agenda.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <Input
                className="w-20"
                placeholder="📍"
                value={item.icon}
                onChange={(e) => update("agenda", form.agenda.map((a, i) => (i === index ? { ...a, icon: e.target.value } : a)))}
              />
              <Input
                className="flex-1"
                placeholder="Guided wellness session"
                value={item.text}
                onChange={(e) => update("agenda", form.agenda.map((a, i) => (i === index ? { ...a, text: e.target.value } : a)))}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => update("agenda", form.agenda.filter((_, i) => i !== index))}>
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => update("agenda", [...form.agenda, { icon: "", text: "" }])}>
          + Add Agenda Item
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-heading text-lg text-primary-dark">FAQ</h3>
        <div className="flex flex-col gap-4">
          {form.faq.map((item, index) => (
            <div key={index} className="rounded-xl border border-gray-200 p-4">
              <div className="mb-3 flex items-center gap-3">
                <Input
                  className="flex-1"
                  placeholder="Question"
                  value={item.question}
                  onChange={(e) => update("faq", form.faq.map((f, i) => (i === index ? { ...f, question: e.target.value } : f)))}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => update("faq", form.faq.filter((_, i) => i !== index))}>
                  Remove
                </Button>
              </div>
              <Textarea
                rows={2}
                placeholder="Answer"
                value={item.answer}
                onChange={(e) => update("faq", form.faq.map((f, i) => (i === index ? { ...f, answer: e.target.value } : f)))}
              />
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => update("faq", [...form.faq, { question: "", answer: "" }])}>
          + Add FAQ Item
        </Button>
      </Card>

      <Card className="grid grid-cols-1 gap-5 p-6">
        <Input label="SEO Title" required value={form.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} error={fieldErrors.seoTitle} />
        <Textarea label="SEO Description" required rows={3} value={form.seoDescription} onChange={(e) => update("seoDescription", e.target.value)} error={fieldErrors.seoDescription} />
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/workshops")}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create Workshop" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
