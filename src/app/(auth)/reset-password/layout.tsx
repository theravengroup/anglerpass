import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | AnglerPass",
  description:
    "Set a new password for your AnglerPass account.",
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
