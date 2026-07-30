import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback | Stronger Steps",
  description: "Share your feedback about the Stronger Steps workshop.",
};

export default function FeedbackRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
