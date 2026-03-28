import PropertyForm from "@/components/properties/PropertyForm";

export const metadata = {
  title: "Add Property",
};

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Add Property
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Create a new property listing. Save as a draft and submit for review
          when ready.
        </p>
      </div>

      <PropertyForm mode="create" />
    </div>
  );
}
