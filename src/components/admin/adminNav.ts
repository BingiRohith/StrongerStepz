import type { AdminNavItem } from "@/components/layouts/AdminLayout";

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Workshops", href: "/admin/workshops" },
  { label: "Homepage Images", href: "/admin/homepage-images" },
  { label: "Registrations", href: "/admin/registrations" },
  { label: "Testimonials", href: "/admin/testimonials" },
  { label: "Real Life Stories", href: "/admin/real-life-stories" },
  { label: "Doctors", href: "/admin/doctors" },
  { label: "PDF Management", href: "/admin/pdfs" },
  { label: "Feedback Forms", href: "/admin/feedback-forms" },
  { label: "Feedback Responses", href: "/admin/feedback-responses" },
  { label: "Questionnaire Responses", href: "/admin/questionnaire-responses" },
  { label: "Settings", href: "/admin/settings" },
];
