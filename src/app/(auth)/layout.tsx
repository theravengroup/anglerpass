import Link from "next/link";
import AnglerPassLogo from "@/components/icons/AnglerPassLogo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-offwhite)] px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-[var(--color-forest)]"
        >
          <AnglerPassLogo className="size-8" />
          <span
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            AnglerPass
          </span>
        </Link>

        <div className="rounded-xl border border-[var(--color-parchment)] bg-white px-8 py-10 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
