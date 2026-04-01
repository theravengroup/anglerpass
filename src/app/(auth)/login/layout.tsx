import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In | AnglerPass",
  description:
    "Log in to your AnglerPass account to access private fly fishing waters.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
