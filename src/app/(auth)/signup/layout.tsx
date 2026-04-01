import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | AnglerPass",
  description:
    "Create your AnglerPass account to book private fly fishing access, list your water, or manage a club.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
