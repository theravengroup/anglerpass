import type { Metadata } from "next";
import RoadmapChecklist from "./RoadmapChecklist";

export const metadata: Metadata = {
  title: "Platform Roadmap | AnglerPass",
  description:
    "AnglerPass development roadmap — track what's complete, what's in progress, and what's planned.",
};

export default function RoadmapPage() {
  return (
    <main className="min-h-screen bg-offwhite pt-24 pb-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-12">
          <p className="font-body text-sm font-medium uppercase tracking-widest text-bronze mb-3">
            Development Roadmap
          </p>
          <h1 className="font-heading text-4xl font-medium text-forest-deep leading-tight sm:text-5xl">
            AnglerPass Platform Roadmap
          </h1>
          <p className="mt-4 max-w-2xl font-body text-lg text-text-secondary leading-relaxed">
            V1 launch target: <strong className="text-forest">May 1, 2026</strong>.
            Track progress across all platform systems — from payments to
            partnerships.
          </p>
        </div>

        <RoadmapChecklist />
      </div>
    </main>
  );
}
