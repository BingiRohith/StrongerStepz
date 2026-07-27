# Implementation Plan — Testimonials, Doctors, PDF Management, Questionnaire, Feedback

Status: **architecture & planning only — no UI or code changes made yet.**
Scope decisions confirmed with client: Cloudinary for all uploads (via one reusable upload
service), fixed (non-configurable) Questionnaire with 3 given questions, all six new modules
are **global/site-wide** (no per-workshop scoping in this phase).

**Revision 2 corrections (this update):** `QuestionnaireResponse` now links to `Registration`
via a required `registrationId` instead of duplicating name/email/phone (§8); `FeedbackResponse`
gained an optional `registrationId` for future reporting (§9); PDF Management dropped the
dedicated "Replace PDF" route — replacement now happens transparently inside the normal update
(§7); the homepage section plan (§1) now lists the client's exact REMOVE/ADD section names and
maps each to real files.

---

## 1. Homepage architecture (current state)

Route: `src/app/page.tsx` → fetches the single active `Workshop` via `WorkshopService.getActive()`
→ passed into `src/components/site/LandingPage.tsx`, which composes sections in order:

| # | Section | File | Data source |
|---|---|---|---|
| 1 | Hero | `src/components/site/Hero.tsx` | `workshop` |
| 2 | ChallengeSection | `src/components/site/ChallengeSection.tsx` | static mock (`src/mock/workshop.mock.ts`) |
| 3 | AboutSection | `src/components/site/AboutSection.tsx` | `workshop.doctors` (embedded `{name}[]`), `workshop.description` |
| 4 | BenefitsSection | `src/components/site/BenefitsSection.tsx` | `workshop.benefits` |
| 5 | AudienceSection | `src/components/site/AudienceSection.tsx` | static mock |
| 6 | PricingSection | `src/components/site/PricingSection.tsx` | `workshop` |
| 7 | FaqSection | `src/components/site/FaqSection.tsx` | `workshop.faq` |
| 8 | CtaSection | `src/components/site/CtaSection.tsx` | static mock |
| 9 | RegisterModal | `src/components/site/RegisterModal.tsx` | posts to `/api/registrations` |
| — | LiveStatsBar (after footer) | `src/components/site/LiveStatsBar.tsx` | static mock |

**Client-confirmed homepage changes (future UI phase — planning only, not implemented now):**

| Action | Client-named section | Maps to (current code) | Notes |
|---|---|---|---|
| REMOVE | "What You Missed" | `ChallengeSection` (`src/components/site/ChallengeSection.tsx`) | mock title is literally `"What you missed ?"` in `src/mock/workshop.mock.ts` — confirms the mapping |
| REMOVE | "Introducing" | `AboutSection` (`src/components/site/AboutSection.tsx`) | component's default prop is literally `badgeText = "Introducing"` — confirms the mapping |
| REMOVE | "Who Is This For" | `AudienceSection` (`src/components/site/AudienceSection.tsx`) | mock title is literally `"Who is this for?"` — confirms the mapping |
| ADD | "What Clients Say About Us" | new `TestimonialsSection` (does not exist yet) | backed by the new `Testimonial` model (§5) via `GET /api/testimonials/active`; takes the slot vacated by `ChallengeSection` |
| ADD | "Is This For Me" | new/rewritten `AudienceSection` replacement (does not exist yet) | takes the slot vacated by `AudienceSection`; content source (static vs. admin-managed) is a UI-phase decision, not settled by this plan |
| ADD | "You Are In Safe Hands" | new `DoctorsSection` (does not exist yet) | backed by the new `Doctor` model (§6) via `GET /api/doctors/active`; takes the slot vacated by `AboutSection`, replacing its inline "Led by Dr. X & Dr. Y" text |

**Unaffected sections:** `Hero`, `BenefitsSection`, `PricingSection`, `FaqSection`, `CtaSection`,
`RegisterModal`, `LiveStatsBar` — no client-requested changes to these.

**Not implemented in this phase.** This plan only prepares the backend (models/APIs from §5 and
§6) that the future `TestimonialsSection`/`DoctorsSection` will read from. No homepage component
is added, removed, or edited now — `workshop.doctors`, `ChallengeSection`, `AboutSection`, and
`AudienceSection` all stay exactly as they are until that UI phase is explicitly scoped and
approved.

**Reusable homepage components:** section-shell patterns (`Section.tsx`, `Container.tsx`,
`Card.tsx`) from `src/components/ui/**` are the pieces the future `TestimonialsSection` /
`DoctorsSection` / "Is This For Me" section would reuse — noted for the later UI phase, not
acted on now.

---

## 2. Admin panel architecture (current state, verified against source)

Representative full-CRUD module: **Workshops**. Confirmed end-to-end by reading the actual files
(not inferred):

- **Model** `src/models/Workshop.ts` — `Schema` + `models.X || model<X>(...)` guard, embedded
  sub-schemas (`{ _id: false }`) for array fields, `{ timestamps: true }`, compound index.
- **Validator** `src/validators/workshop.schema.ts` — Zod v4. `createXSchema`, `updateXSchema =
  createXSchema.partial()`, `listXQuerySchema`. Idioms confirmed: `z.coerce.date()`, `.refine()`
  for cross-field rules, empty-string→`undefined` transforms for optional URL fields, and a
  `queryBooleanSchema` for `"true"/"false"` query strings.
- **Repository** `src/repositories/WorkshopRepository.ts extends BaseRepository<T>`
  (`src/repositories/BaseRepository.ts`) — generic `create/findById/findOne/findMany/updateById/
  deleteById/count`, all `connectToDatabase()` first, all errors wrapped as `DatabaseError` /
  `ConflictError` (E11000 detection). Subclasses add only bespoke queries (`findBySlug`,
  `findActive` — needed `.sort()`, which the generic `findOne` doesn't expose).
- **Service** `src/services/WorkshopService.ts` — constructor-injectable repository
  (`repository = new WorkshopRepository()`), throws `NotFoundError` on missing docs,
  `enable()/disable()` are thin wrappers around `update(id, { status: ... })`.
- **API routes** `src/app/api/workshops/**` — every handler wrapped in `withErrorHandling` /
  `withParamsErrorHandling` (`src/api/handler.ts`), body/query validated with
  `parseOrThrow(schema, data)` (`src/api/validate.ts`), success via `apiSuccess(data, status?)`
  (`src/api/response.ts`). One `const service = new XService();` per route file. Dedicated
  `PATCH .../enable` and `PATCH .../disable` route files exist alongside the generic
  `GET/PATCH/DELETE [id]/route.ts`.
- **Admin UI** — list page (`src/app/admin/workshops/page.tsx`) is a bespoke client component:
  raw `fetch` in `useEffect`, client-side search + `Pagination`, `Table/TableHeader/TableBody/
  TableRow/TableHead/TableCell` primitives, `Badge` for status, `Dialog` for delete confirmation.
  **No generic `<DataTable columns={...}/>` exists** — each list page hand-assembles the same
  primitives. Create/edit pages render one bespoke form component (`WorkshopForm.tsx`, 342
  lines) with hand-rolled array add/remove/reorder logic (doctors/benefits/agenda/faq each
  repeat the same `map`/`filter` idiom) and manual Zod-error-to-field mapping. Every admin page
  is wrapped in `AdminLayout` with `navItems={ADMIN_NAV_ITEMS}` (`src/components/admin/
  adminNav.ts`).

**Image upload — does not exist today.** `bannerImage` is a plain text `Input` where the admin
types a path to a file that must already exist in `public/assets/images/`. No multer/cloudinary/
S3/sharp/formidable dependency, no upload API route, no upload UI widget anywhere. This phase
introduces the first real upload capability (§4).

**Display order — does not exist** on any model; embedded arrays are ordered by array position
only. New standalone collections (Testimonials, Doctors) need their own `displayOrder` field.

**Active/Inactive — one precedent exists**: Workshop's `status` enum (`draft/published/disabled/
archived`) + dedicated `enable()`/`disable()` service methods + dedicated `PATCH .../enable` /
`.../disable` routes. New modules in this plan use a simpler boolean `isActive` (matching the
spec's literal "Active/Inactive" requirement, not a 4-state enum) but **keep the same route
shape** (`PATCH [id]/enable`, `PATCH [id]/disable`) for consistency.

**All existing Mongoose models:** `Workshop`, `Registration`, `Payment`, `AdminUser`, `Counter`
(atomic sequence generator), `Settings` (generic `{key, value: Mixed}` store — the one existing
precedent for schema-flexible data, reused for Feedback answers in §7). All re-exported from
`src/models/index.ts`.

**Full existing API route tree:**
```
/api/admin/dashboard, /login, /logout, /me
/api/payments/order, /outcome, /registration/[registrationId], /verify, /webhook
/api/registrations                 GET, POST
/api/registrations/[id]            GET, PATCH
/api/registrations/export          GET (streams .xlsx via exceljs, bypasses withErrorHandling)
/api/workshops                     GET, POST
/api/workshops/[id]                GET, PATCH, DELETE
/api/workshops/[id]/enable         PATCH
/api/workshops/[id]/disable        PATCH
/api/workshops/active              GET (public exception)
/api/workshops/slug/[slug]         GET (public exception)
```

**Auth pattern** — `src/middleware.ts`: reads the session cookie, verifies JWT with `jose`
(Edge-compatible). `config.matcher` lists which path prefixes the middleware even runs on; inside
it, `requiresAuth` is a **second, separate allowlist** of prefixes that actually require a
session (`/admin`, `/api/admin`, `/api/workshops`, `/api/registrations`); anything not in that
list is allowed through unauthenticated. `PUBLIC_API_EXCEPTIONS` is a regex+method allowlist for
specific reads inside an otherwise-protected prefix. **Consequence for this plan:** every new API
prefix must be added to *both* `config.matcher` and the `requiresAuth` check, or it is silently
unprotected — this is called out explicitly in §13.

---

## 3. Shared/reusable pieces (current state)

- `src/components/ui/**` — presentational only: `Badge, Button, Card, Container, Dialog
  (confirm dialogs), EmptyState, Input, Select, Textarea, Loader, Modal, Pagination, SearchBar,
  Section, Table` (composable primitives, no generic columns API). All exported from
  `src/components/ui/index.ts`. **No toast/notification system** — errors render inline as
  `<p role="alert">`.
- `src/components/admin/**` — `LogoutButton, SettingsForm, StatCard, WorkshopForm, adminNav.ts`.
- `src/errors/**` — `ApiError` base (`statusCode, code, details`) + `ValidationError (400)`,
  `NotFoundError (404)`, `ConflictError (409)`, `DatabaseError (500)`, `UnauthorizedError (401)`,
  all re-exported from `src/errors/index.ts`. `apiError()` is the single place that maps any
  thrown error to the JSON envelope; only `ValidationError.details` is ever sent to the client.
- `src/lib/**` — `auth/` (jwt, password, requireAdmin, session), `db/connect.ts` (Mongoose
  singleton), `excel/export.ts` (`buildRegistrationsWorkbook`/`buildExportFilename` — pure
  "data in, `Buffer` out" pattern reused for Questionnaire/Feedback export in §8/§9),
  `payments/` (Razorpay), `constants/theme.ts`, `fonts.ts`.
- `src/hooks/**` — `useDisclosure` (open/close, used for every modal), `useMediaQuery`,
  `useOutsideClick`, `useScrollPosition`. **No data-fetching hook** — every admin page does raw
  `fetch` + `useState`/`useEffect`.
- `src/features/**` — **empty except a README** describing an *intended* (never adopted)
  feature-folder convention. The real, working Workshop module does **not** use it — it lives
  directly under `src/app/admin/**` + `src/models` + `src/services` + etc. **Decision for this
  plan: follow the realized pattern (flat `src/models`, `src/services`, `src/app/admin/X`), not
  the unused `src/features/` convention**, to stay consistent with what's actually running today.
- `src/mock/workshop.mock.ts` — real shipped content for still-unmigrated homepage sections, not
  test fixtures.
- `scripts/seed.ts` — idempotent dev seed, talks to models directly (bypasses repository/service
  layers — seed-only, not a request-flow precedent).

**No existing questionnaire/feedback form anywhere** — confirmed via full grep of `src/` and
`legacy/` (`legacy/index.html`'s registration form is a 3-field subset of today's `Registration`
model; no questionnaire, feedback, or survey content exists in legacy or current code). Both
modules are genuinely new data shapes with no legacy constraint to preserve.

**Naming conventions confirmed:** PascalCase components/classes (`WorkshopForm.tsx`,
`WorkshopService.ts`), camelCase hooks/utils, `*.schema.ts` for validators — **no** `.model.ts` /
`.service.ts` / `.repository.ts` suffixes; the type-named folder (`src/models/`, `src/services/`)
carries that meaning instead. Zod v4 throughout; every schema file exports both the `const`
schema and an inferred `type X = z.infer<typeof xSchema>`. API envelope: `{success:true,data}` /
`{success:false,error:{code,message,details?}}` via `apiSuccess`/`apiError`.

**Dependencies relevant to this work (from `package.json`):** Next.js 15.5.20 (App Router),
React 19.1.0, `mongoose ^9.7.4`, `zod ^4.4.3`, `bcryptjs`, `jose`, `exceljs`, `razorpay`,
`clsx`/`tailwind-merge`. **No** upload library, **no** PDF library, **no** UI kit, **no** data-
fetching lib today — confirmed absent.

---

## 4. Generic File Upload Service (Cloudinary) — foundational, built once, reused everywhere

Per client decision: all images and PDFs go to Cloudinary; MongoDB stores only the secure URL
and `publicId`. One reusable service, not one per module.

**New dependency:** `cloudinary` (official Node SDK).

**New env vars** (add to `.env.example` and `.env.local`):
```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```
(Server-side only — no `NEXT_PUBLIC_` variant needed, since uploads are proxied through our own
API route rather than uploaded directly from the browser to Cloudinary.)

**New files:**
- `src/lib/uploads/cloudinary.ts` — configures and exports the Cloudinary SDK client from env
  vars (mirrors how `src/lib/payments/razorpay.ts` configures Razorpay from env).
- `src/lib/uploads/uploadFile.ts` — `uploadFile(buffer: Buffer, opts: { folder: string;
  resourceType: "image" | "raw"; filename?: string }): Promise<UploadResult>`. Uses
  `cloudinary.uploader.upload_stream` (buffer-based, no temp files on disk). `folder` namespaces
  assets in Cloudinary per module (`strongersteps/testimonials`, `strongersteps/doctors`,
  `strongersteps/pdfs`).
- `src/lib/uploads/deleteFile.ts` — `deleteFile(publicId: string, resourceType: "image" | "raw"):
  Promise<void>` wraps `cloudinary.uploader.destroy`. Called by services on replace/delete so
  orphaned Cloudinary assets don't accumulate.
- `src/types/upload.ts` — `interface UploadResult { url: string; secureUrl: string; publicId:
  string; format?: string; bytes: number; resourceType: "image" | "raw" }`.

**New generic API route** — `src/app/api/uploads/route.ts`:
- `POST /api/uploads` — accepts `multipart/form-data` (`request.formData()`, native to Next.js
  15 route handlers, no `multer`/`formidable` needed). Fields: `file` (required), `folder`
  (required, one of a fixed allow-list: `testimonials | doctors | pdfs`), validated for size/MIME
  before upload (images: `image/jpeg|png|webp`, max ~5MB; PDFs: `application/pdf`, max ~15MB —
  thresholds to confirm with client before implementation). Returns `apiSuccess(uploadResult,
  201)`. Admin-only (added to middleware protection, §13).

**Why a separate upload step instead of multipart entity create/update:** every existing
create/update route is JSON-body + `parseOrThrow(zodSchema, body)`. Mixing `FormData` into that
would break the one validation idiom used everywhere. Instead, the admin form uploads the file
first (gets back `{url, publicId}`), then submits the entity's normal JSON payload referencing
those two strings — exactly how `bannerImage: string` already works today, just populated by an
upload call instead of manual typing. This keeps every entity CRUD route unchanged in shape.

**Reused by:** Testimonials (photo), Doctors (photo), PDF Management (file) — three call sites,
zero duplicated upload logic. The `resourceType` is implied by `folder` server-side, not trusted
from the client.

---

## 5. Module: Testimonials

**Model** `src/models/Testimonial.ts`:
```ts
interface TestimonialDocument {
  _id: Types.ObjectId;
  name: string;
  message: string;
  photoUrl?: string;
  photoPublicId?: string;
  isActive: boolean;      // default true
  displayOrder: number;   // default 0, admin-controlled
  createdAt: Date;
  updatedAt: Date;
}
```
Index: `{ isActive: 1, displayOrder: 1 }` (serves the future public "active testimonials in
order" read, same rationale as Workshop's compound index).

**Validator** `src/validators/testimonial.schema.ts` — `createTestimonialSchema`
(`name, message` required; `photoUrl`/`photoPublicId` optional strings; `displayOrder:
z.number().int().nonnegative().optional()`), `updateTestimonialSchema = createTestimonialSchema
.partial()`, `reorderTestimonialsSchema = z.object({ orderedIds: z.array(z.string()).min(1) })`.

**Repository** `src/repositories/TestimonialRepository.ts extends BaseRepository` — adds
`findActiveOrdered()` (`{isActive:true}`, `.sort({displayOrder:1})` — needs the repo's raw
`.sort()`, same reason `findActive` does on Workshop).

**Service** `src/services/TestimonialService.ts` — `list, getById, create, update, delete,
enable, disable` (same shape as `WorkshopService`, `isActive` boolean instead of `status` enum),
plus `reorder(orderedIds: string[])`: bulk-updates `displayOrder` to each id's index in the array
(one repository method, e.g. `bulkSetOrder`, using `Model.bulkWrite` — new to `BaseRepository`'s
vocabulary, added as a `TestimonialRepository`-only method since it's the first module needing
it; **Doctors reuses the identical method by the same name**, worth promoting to
`BaseRepository` if a third module ever needs it).

**API routes** `src/app/api/testimonials/**`:
```
GET/POST            /api/testimonials
GET/PATCH/DELETE     /api/testimonials/[id]
PATCH                /api/testimonials/[id]/enable
PATCH                /api/testimonials/[id]/disable
PATCH                /api/testimonials/reorder        body: { orderedIds: string[] }
GET                  /api/testimonials/active          public exception — future homepage read
```
On delete/replace, service calls `deleteFile(photoPublicId, "image")` if present.

---

## 6. Module: Doctors

**Model** `src/models/Doctor.ts`:
```ts
interface DoctorDocument {
  _id: Types.ObjectId;
  name: string;
  qualification: string;
  experience: string;       // e.g. "12+ years" — free text, matches how Workshop.duration is free text
  description: string;
  photoUrl?: string;
  photoPublicId?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```
Index: `{ isActive: 1, displayOrder: 1 }`.

**Validator/Repository/Service/Routes** — identical shape to Testimonials (§5), swapping fields:
`src/validators/doctor.schema.ts`, `src/repositories/DoctorRepository.ts`,
`src/services/DoctorService.ts`, `src/app/api/doctors/**` (`GET/POST`, `[id]` GET/PATCH/DELETE,
`[id]/enable`, `[id]/disable`, `reorder`, `active`).

**Relationship to existing `Workshop.doctors`:** left untouched in this phase (§1). The new
`Doctor` collection is additive; nothing reads or writes it from the homepage yet.

---

## 7. Module: PDF Management

**Model** `src/models/PdfDocument.ts`:
```ts
interface PdfDocumentDocument {
  _id: Types.ObjectId;
  title: string;           // e.g. "Workshop Brochure", admin-facing label
  fileUrl: string;
  filePublicId: string;
  fileSizeBytes?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```
No `displayOrder` — the client-confirmed scope for this module is just Title / PDF Upload /
Active-Inactive. **Simplified per client feedback: no dedicated "Replace PDF" capability.**
Uploading a new file during an edit is handled transparently as part of the normal update, not
as a separate action/route.

**Validator** `src/validators/pdfDocument.schema.ts` — `createPdfDocumentSchema` (`title,
fileUrl, filePublicId` required, `fileSizeBytes` optional), `updatePdfDocumentSchema =
createPdfDocumentSchema.partial()` — the same single schema shape used by every other module in
this plan; `fileUrl`/`filePublicId` are just regular optional fields on it, not walled off into a
separate route.

**Repository** `src/repositories/PdfDocumentRepository.ts extends BaseRepository` — no bespoke
queries needed beyond the base set.

**Service** `src/services/PdfDocumentService.ts` — `list, getById, create, delete, enable,
disable`, plus **`update(id, input)`**: if `input` includes a new `fileUrl`/`filePublicId` (i.e.
the admin uploaded a replacement file), the service first reads the current doc, and — if a
`filePublicId` was already set and differs from the incoming one — calls
`deleteFile(oldFilePublicId, "raw")` to clean up the outgoing Cloudinary asset, then proceeds
with the normal `updateById`. If `input` doesn't touch the file fields (e.g. only `title` or
`isActive` changed), no Cloudinary call happens. This keeps "upload a new PDF" and "edit the
title" as the same single `PATCH`, matching how every other module's generic update works,
instead of a bespoke `replace` action.

**API routes** `src/app/api/pdfs/**`:
```
GET/POST            /api/pdfs
GET/PATCH/DELETE     /api/pdfs/[id]        PATCH body may include title, isActive, and/or a new
                                            fileUrl+filePublicId — old Cloudinary asset is cleaned
                                            up automatically inside the service when it does
PATCH                /api/pdfs/[id]/enable
PATCH                /api/pdfs/[id]/disable
GET                  /api/pdfs/active            public exception — future homepage download links
```
Cloudinary `resourceType: "raw"` for PDFs throughout (uploads and deletes).

---

## 8. Module: Questionnaire Responses (fixed schema, no admin builder)

Per client: exactly 3 fixed single-select questions, not admin-configurable. Modeled with
explicit fields and Zod enums using the exact option text supplied.

**Model** `src/models/QuestionnaireResponse.ts`:
```ts
type QuestionnaireQ1Answer =
  | "I want to stay healthy as I age."
  | "I have a specific health problem I'd like to improve."
  | "My doctor advised me to learn more."
  | "A family member or friend suggested this workshop."
  | "I want to prevent future health problems."
  | "I want to become stronger and more active."
  | "I'm just curious and want to learn."
  | "Other";

type QuestionnaireQ2Answer =
  | "I want to prevent future health problems."
  | "I want to become stronger and more active."
  | "I want to manage an existing health condition."
  | "I'm here for a family member."
  | "I'm a healthcare professional."
  | "Other";

type QuestionnaireQ3Answer =
  | "I spend most of my day sitting."
  | "I walk around the house and do light chores."
  | "I walk for at least 30 minutes most days."
  | "I regularly exercise or attend fitness classes."
  | "I do strength training, yoga, or sports regularly.";

interface QuestionnaireResponseDocument {
  _id: Types.ObjectId;
  registrationId: Types.ObjectId;   // ref Registration, required — respondent identity
                                     // (name/email/phone) lives on Registration, not duplicated here
  question1Answer: QuestionnaireQ1Answer;
  question1OtherText?: string;   // only when question1Answer === "Other"
  question2Answer: QuestionnaireQ2Answer;
  question2OtherText?: string;   // only when question2Answer === "Other"
  question3Answer: QuestionnaireQ3Answer;
  createdAt: Date;
  updatedAt: Date;
}
```
**Corrected per client feedback:** no `name`/`email`/`phone` fields — those already live on
`Registration` (`src/models/Registration.ts`: `name, email, phone, age, gender, city`) and
duplicating them here would create two sources of truth. Every questionnaire response links back
via `registrationId: Schema.Types.ObjectId, ref: "Registration", required: true` — the same
`ref` pattern `Registration.workshopId` already uses for `Workshop`, so this isn't a new idiom,
just the existing one pointed at a different collection. Reading a response's respondent details
means `populate("registrationId")` (or a manual lookup), not a stored copy.
Index: `{ registrationId: 1 }`, **unique** — one questionnaire submission per registration
(assumption: the questionnaire is filled once as part of registering; flagged for client
confirmation before implementation in case a registrant should be able to resubmit).

**Validator** `src/validators/questionnaireResponse.schema.ts` — `createQuestionnaireResponseSchema`:
`registrationId: z.string().min(1)` plus Zod `z.enum([...])` for each question using the literal
option strings above, plus `.refine()` requiring the matching `...OtherText` when the answer is
`"Other"` (same refine idiom as `optionalUrlSchema` in `workshop.schema.ts`). No update schema —
responses are immutable once submitted (no admin edit capability, matching "store the selected
answer," not "manage" it).

**Repository** `src/repositories/QuestionnaireResponseRepository.ts extends BaseRepository` —
adds `findByRegistrationId(registrationId)` (used both to check the uniqueness assumption above
at submit time, and for a future admin "view this registrant's questionnaire" lookup); otherwise
no bespoke queries beyond base `findMany`/`count` (used with pagination, see risk note in §11).

**Service** `src/services/QuestionnaireResponseService.ts` — `submit(input)`: verifies the
`registrationId` refers to a real `Registration` (`NotFoundError` if not — mirrors how
`WorkshopService` checks existence before acting) before creating; `list(query)`, `getById(id)`,
`delete(id)` (admin cleanup only — no update).

**API routes** `src/app/api/questionnaire-responses/**`:
```
POST   /api/questionnaire-responses          public exception — the actual submission
GET    /api/questionnaire-responses          admin only, paginated + filterable (§11)
GET    /api/questionnaire-responses/[id]     admin only
DELETE /api/questionnaire-responses/[id]     admin only
GET    /api/questionnaire-responses/export   admin only, streams .xlsx
```

**Export** — `src/lib/excel/export.ts` gains `buildQuestionnaireResponsesWorkbook(responses)`
alongside the existing `buildRegistrationsWorkbook`, reusing `buildExportFilename`. Mirrors
`/api/registrations/export`'s "bypasses `withErrorHandling`, streams a `Buffer`" pattern exactly.

---

## 9. Modules: Feedback Forms (dynamic) + Feedback Responses

Per client: this is the one module that **is** admin-configurable — the form's questions
themselves are data, not code.

**Model** `src/models/FeedbackForm.ts`:
```ts
type FeedbackFieldType = "text" | "textarea" | "single_select" | "multi_select" | "rating" | "boolean";

interface FeedbackFormField {
  key: string;              // stable machine key, unique within the form, used to key answers
  label: string;             // question text shown to the respondent
  type: FeedbackFieldType;
  options?: string[];        // required when type is single_select/multi_select
  required: boolean;
}

interface FeedbackFormDocument {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  fields: FeedbackFormField[];   // embedded, {_id:false} sub-schema — ordered by array position,
                                  // same idiom as Workshop.agenda/faq (no separate order field)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Model** `src/models/FeedbackResponse.ts`:
```ts
interface FeedbackAnswer {
  fieldKey: string;
  value: unknown;   // Schema.Types.Mixed — the one existing precedent for this is Settings.value
}

interface FeedbackResponseDocument {
  _id: Types.ObjectId;
  formId: Types.ObjectId;            // ref FeedbackForm
  registrationId?: Types.ObjectId;   // ref Registration, optional — links feedback to a known
                                      // registrant when available, without requiring one (feedback
                                      // may be collected from non-registered visitors too)
  answers: FeedbackAnswer[];
  createdAt: Date;
  updatedAt: Date;
}
```
**Added per client feedback:** `registrationId` is optional (unlike Questionnaire's required
link) — it enables future reporting that connects a registered participant to their submitted
feedback, while keeping the module flexible enough to accept feedback that isn't tied to a
registration. Same `ref: "Registration"` idiom as `QuestionnaireResponse.registrationId`.
Index: `{ formId: 1, createdAt: -1 }`; `{ registrationId: 1 }` (sparse, since optional).

**Validators** `src/validators/feedbackForm.schema.ts`:
- `feedbackFieldSchema` — static Zod shape for one field definition (`key, label, type, options?,
  required`), with `.refine()` requiring `options` (min 2) when `type` is a select type.
- `createFeedbackFormSchema` / `updateFeedbackFormSchema` — validate the form *definition*
  (title, description?, fields: array of `feedbackFieldSchema`, isActive?).

`src/validators/feedbackResponse.schema.ts`:
- `submitFeedbackResponseEnvelopeSchema = z.object({ formId: z.string(), registrationId:
  z.string().optional(), answers: z.array(z.object({ fieldKey: z.string(), value: z.unknown() }))
  })` — this validates only the
  **envelope shape**, not the actual answers, because the real constraints (which keys are
  required, which values are valid for a `single_select`) live in a DB row (`FeedbackForm`), not
  in code. **This is a deliberate, called-out deviation from the "one static Zod schema per
  route" convention used everywhere else** — it's the only place in this codebase a schema can't
  be fully known at compile time.

**Service** `src/services/FeedbackResponseService.ts` — `submit(input)`:
1. `parseOrThrow(submitFeedbackResponseEnvelopeSchema, body)` at the route (shape only).
2. Service loads the `FeedbackForm` by `formId` (`NotFoundError` if missing/inactive).
3. Service validates `answers` against `form.fields` by hand: every `required` field present,
   every `single_select`/`multi_select` value is one of that field's `options`, `rating` is a
   number in range, `boolean` is a boolean. On failure, throws `ValidationError("Validation
   failed", { fieldErrors: { [fieldKey]: [message] } })` — same `details` shape Zod's
   `.flatten()` would produce, so `apiError()` and the admin form's existing "map fieldErrors
   under each input" logic both work unmodified.
4. On success, `repository.create({ formId, registrationId, answers })` — `registrationId` is
   passed through as-is if present, with no existence check (unlike Questionnaire's required
   link, this one is optional and best-effort, not a referential-integrity requirement).

**Service** `src/services/FeedbackFormService.ts` — standard `list, getById, create, update,
delete, enable, disable` (same shape as Testimonials/Doctors, no `displayOrder` — a form's field
*order* lives inside `fields[]`, not across forms).

**API routes:**
```
GET/POST             /api/feedback-forms
GET/PATCH/DELETE      /api/feedback-forms/[id]
PATCH                 /api/feedback-forms/[id]/enable
PATCH                 /api/feedback-forms/[id]/disable
GET                   /api/feedback-forms/active            public exception — public site fetches
                                                              the live form definition to render

POST                  /api/feedback-responses                public exception — public submission
GET                   /api/feedback-responses                admin only, filter by formId, paginated
GET                   /api/feedback-responses/[id]            admin only
GET                   /api/feedback-responses/export?formId=  admin only, .xlsx with columns derived
                                                                from that form's fields[] at export time
```

---

## 10. New Mongoose models — summary

| Model | File | Notable |
|---|---|---|
| `Testimonial` | `src/models/Testimonial.ts` | `displayOrder`, `isActive`, Cloudinary photo refs |
| `Doctor` | `src/models/Doctor.ts` | same shape as Testimonial + qualification/experience/description |
| `PdfDocument` | `src/models/PdfDocument.ts` | Cloudinary `raw` file refs; replacement handled inside the normal `update()`, no dedicated route |
| `QuestionnaireResponse` | `src/models/QuestionnaireResponse.ts` | fixed 3-question enum schema; required `registrationId` ref, no duplicated name/email/phone |
| `FeedbackForm` | `src/models/FeedbackForm.ts` | embedded dynamic `fields[]` definition |
| `FeedbackResponse` | `src/models/FeedbackResponse.ts` | `formId` ref + optional `registrationId` ref + `Mixed` answers, precedent: `Settings.value` |

All follow the existing `Schema` → `{timestamps:true}` → `models.X || model<X>(...)` guard
pattern and get re-exported from `src/models/index.ts` alongside the current six.

---

## 11. Database migrations

Mongoose collections are created lazily on first write — **no migration scripts required** for
these six new, independent collections; nothing existing is altered or backfilled.
`scripts/seed.ts` optionally gets extended later with dev fixtures (e.g. a sample `FeedbackForm`
and a couple of `Testimonial`/`Doctor` rows) so `npm run dev` has content to show immediately —
this is a nice-to-have, not required, and follows the seed script's existing "talk to models
directly, bypass service layer" precedent.

Recommended indexes (new, additive only):
- `Testimonial`: `{ isActive: 1, displayOrder: 1 }`
- `Doctor`: `{ isActive: 1, displayOrder: 1 }`
- `FeedbackResponse`: `{ formId: 1, createdAt: -1 }`, `{ registrationId: 1 }` (sparse)
- `QuestionnaireResponse`: `{ registrationId: 1 }` (unique — see §8's uniqueness assumption,
  needs confirmation before implementation)

Both new `registrationId` references (`QuestionnaireResponse`, `FeedbackResponse`) point at the
existing `Registration` collection and follow the same `ref: "Registration"` idiom
`Registration.workshopId` already uses for `Workshop` — no new referencing pattern, and no change
to the `Registration` model itself is required (it doesn't need a reverse-reference array; both
new collections look Registration up by `_id`, the same direction `Payment.registrationId`
already queries in).

---

## 12. Components to reuse vs. new generic components needed

**Reused as-is:** `Table/TableHeader/TableBody/TableRow/TableHead/TableCell`, `Badge`, `Dialog`,
`Pagination`, `SearchBar`, `Loader`, `EmptyState`, `Button`, `Input`, `Textarea`, `Select`,
`AdminLayout`, `useDisclosure`, `cn()`, the `withErrorHandling`/`apiSuccess`/`apiError`/
`parseOrThrow` request pipeline, `BaseRepository`, the `ApiError` hierarchy.

**New generic components (built once, reused across the new modules — avoids the "duplicate
upload/reorder logic per module" trap):**
- `src/components/admin/UploadField.tsx` — file input + preview + upload progress, parameterized
  by `accept` (`image/*` or `application/pdf`) and Cloudinary `folder`; POSTs to `/api/uploads`,
  returns `{url, publicId}` to the parent form. Used by Testimonials, Doctors (photo), PDF
  Management (file).
- `src/components/admin/ReorderControls.tsx` — simple up/down buttons per row (no new drag-and-
  drop dependency, since none exists in the codebase today) that call the module's `reorder`
  endpoint. Used by Testimonials and Doctors list pages.
- `src/components/admin/DynamicFieldListEditor.tsx` — generalizes the add/remove/reorder-by-
  array-index idiom `WorkshopForm.tsx` currently hand-rolls three separate times (for
  `benefits`/`agenda`/`faq`) into one reusable component, used by the Feedback Form builder for
  its `fields[]` editor. **Note:** `WorkshopForm.tsx` itself is left untouched in this phase
  (no UI changes) — this is a new component for the new module, not a refactor of existing code.

---

## 13. Middleware & navigation changes required (config-only, not yet applied)

`src/middleware.ts` must gain, for every new API prefix:
1. An entry in `config.matcher`.
2. An entry in the `requiresAuth` prefix check (routes are **unprotected by default** unless
   listed here — verified from the actual middleware logic, not assumed).
3. `PUBLIC_API_EXCEPTIONS` entries for the specific public reads/writes:
   - `GET /api/testimonials/active`, `GET /api/doctors/active`, `GET /api/pdfs/active`,
     `GET /api/feedback-forms/active`
   - `POST /api/questionnaire-responses`, `POST /api/feedback-responses`
   - `/api/uploads` gets **no** exception — admin-only, always.

`src/components/admin/adminNav.ts` (`ADMIN_NAV_ITEMS`) gains entries for: Testimonials, Doctors,
PDF Management, Questionnaire Responses, Feedback Forms, Feedback Responses — six new nav items,
UI not built yet but routes reserved: `/admin/testimonials`, `/admin/doctors`, `/admin/pdfs`,
`/admin/questionnaire-responses`, `/admin/feedback-forms`, `/admin/feedback-responses`.

---

## 14. Files analyzed

`src/app/page.tsx`, `src/components/site/**` (all 9 section components + `LandingPage.tsx`),
`src/mock/workshop.mock.ts`, `src/models/Workshop.ts`, `src/models/Registration.ts`,
`src/models/index.ts` (and the other 4 models by listing), `src/validators/workshop.schema.ts`,
`src/repositories/BaseRepository.ts`, `src/repositories/WorkshopRepository.ts`,
`src/services/WorkshopService.ts`, `src/api/handler.ts`, `src/api/response.ts`,
`src/api/validate.ts`, `src/app/api/workshops/route.ts`, `src/app/api/workshops/[id]/route.ts`,
`src/app/api/workshops/[id]/enable/route.ts`, `src/app/api/registrations/route.ts`,
`src/middleware.ts`, `src/errors/**` (all 7 files), `src/components/layouts/AdminLayout.tsx`,
`src/components/admin/adminNav.ts`, `src/app/admin/workshops/page.tsx`, `src/components/ui/**`
(index + directory listing), `src/hooks/**`, `src/lib/**` (directory listing + `excel/export.ts`
role), `src/features/README.md`, `src/mock/**`, `scripts/seed.ts`, `legacy/index.html`,
`legacy/script.js`, `.env.example`, `next.config.ts`, `package.json`.

## 15. New models required

`Testimonial`, `Doctor`, `PdfDocument`, `QuestionnaireResponse`, `FeedbackForm`,
`FeedbackResponse` — full field lists in §5–§9.

## 16. New APIs required

New route handlers across 7 prefixes (`/api/uploads`, `/api/testimonials`, `/api/doctors`,
`/api/pdfs`, `/api/questionnaire-responses`, `/api/feedback-forms`, `/api/feedback-responses`) —
full list in §4–§9, all following the existing `withErrorHandling` + `parseOrThrow` +
`apiSuccess` skeleton. Note `/api/pdfs` no longer has a separate `/replace` route (§7) — one
fewer route than the previous version of this plan, since replacement now happens inside the
normal `PATCH [id]` update.

## 17. Components to reuse

All of `src/components/ui/**`, `AdminLayout`, `useDisclosure`, `cn()` — see §12 for the full
list and the 3 new generic components this plan introduces to avoid duplicating upload/reorder/
dynamic-field logic per module.

## 18. Potential risks

- **Cloudinary is a new external dependency and cost/quota surface** — needs real credentials
  before any of §4 can be implemented or tested; free-tier limits should be checked against
  expected PDF/image volume.
- **Dynamic Feedback validation is hand-rolled, not Zod-generated** (§9) — this is the one place
  the codebase's "everything validated by a static schema" convention can't hold, since the
  schema itself is admin-authored data. Needs solid test coverage; a malformed `FeedbackForm`
  (e.g. a `single_select` with zero options) should be prevented at form-*creation* time by
  `feedbackFieldSchema`'s refine, not just fail confusingly at submission time.
- **List endpoints have no server-side pagination anywhere today** (Workshop's admin list loads
  everything and paginates client-side). Fine for Testimonials/Doctors (naturally small N), but
  `QuestionnaireResponse` and `FeedbackResponse` are unbounded, append-only collections — this
  plan calls for real `skip`/`limit` query support on those two `list()` methods specifically,
  which is a deliberate small deviation from the Workshop precedent, not an oversight.
- **`QuestionnaireResponse.registrationId` is modeled as required + unique** on the assumption
  the questionnaire is submitted once, as part of registering (§8) — needs explicit client
  confirmation before implementation; if a registrant can legitimately resubmit, the unique index
  must be dropped before the first write, not after.
- **`workshopId` linkage remains explicitly descoped** for all six modules per the "global, no
  workshop relationships yet" decision — `registrationId` refs (Questionnaire, required; Feedback,
  optional) connect responses to a *registrant*, but not to *which workshop* they registered for.
  If a future multi-workshop phase needs that, it's reachable via `registrationId →
  Registration.workshopId` without a schema change to these two new models — no migration risk
  there, since the path already exists through the existing `Registration` document.
- **`src/features/**` ambiguity** — resolved by following the realized flat-folder pattern (§3);
  flagging so it isn't re-litigated per module.
- **No toast/notification system exists** — new admin forms will follow the existing inline
  `<p role="alert">` pattern; if the client wants nicer upload-progress/success UX later, that's
  a separate, cross-cutting UI decision, not specific to any one new module.

## 19. Recommended implementation order

1. **File Upload Service** (§4) — Cloudinary config, `uploadFile`/`deleteFile`, `/api/uploads`
   route. Everything else depends on it.
2. **Models + validators** for all 6 modules (§5–§9) — no dependencies between them, can be done
   together.
3. **Repositories + Services** — depends on step 2.
4. **API routes + middleware updates** (§13) — depends on step 3; middleware changes should land
   in the same change as the first new route group to avoid a window of unprotected endpoints.
5. **Generic admin components** (`UploadField`, `ReorderControls`, `DynamicFieldListEditor`, §12).
6. **Admin UI pages**, module by module: Testimonials → Doctors → PDF Management → Feedback
   Forms (builder) → Feedback Responses (read-only viewer) → Questionnaire Responses (read-only
   viewer + export).
7. **Homepage wiring** — per §1: remove `ChallengeSection` ("What You Missed"), `AboutSection`
   ("Introducing"), and `AudienceSection` ("Who Is This For"); add `TestimonialsSection` ("What
   Clients Say About Us"), a new "Is This For Me" section, and `DoctorsSection` ("You Are In Safe
   Hands"), plus a PDF download link and feedback/questionnaire entry points. Explicitly a later,
   separate phase requiring its own sign-off — not part of this plan.
