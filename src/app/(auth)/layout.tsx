import Link from "next/link";
import Nav from "@/components/homepage/Nav";
import MarketingFooter from "@/components/shared/MarketingFooter";
import "../(marketing)/homepage.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <div className="relative flex-1 bg-offwhite">
        {/* Subtle background texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(154,115,64,0.04),_transparent_60%)]" />

        <div className="relative flex flex-col items-center px-4 pb-20 pt-32">
          {/* Logo */}
          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-2.5 no-underline"
          >
            <img
              src="/images/anglerpass-noword-logo.svg"
              alt=""
              className="h-9 w-auto"
            />
            <span className="font-heading text-2xl font-semibold tracking-tight text-forest">
              AnglerPass
            </span>
          </Link>

          {/* Form card */}
          <div className="w-full max-w-md rounded-xl border border-parchment bg-white px-8 py-10 shadow-md shadow-black/5">
            {children}
          </div>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}
