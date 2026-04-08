"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  propertyKnowledgeSchema,
  type PropertyKnowledgeFormData,
} from "@/lib/validations/property-knowledge";
import {
  KNOWLEDGE_SECTIONS,
  type KnowledgeSectionKey,
} from "@/lib/constants/property-knowledge";
import {
  sectionCompleteness,
  calculateCompleteness,
  completenessMessage,
} from "@/lib/utils/knowledge-completeness";

import KnowledgeStepIndicator from "./KnowledgeStepIndicator";
import KnowledgeCompletionSummary from "./KnowledgeCompletionSummary";
import WaterCharacteristicsStep from "./WaterCharacteristicsStep";
import SpeciesDetailStep from "./SpeciesDetailStep";
import HatchesAndPatternsStep from "./HatchesAndPatternsStep";
import SeasonalConditionsStep from "./SeasonalConditionsStep";
import FlowAndGaugeStep from "./FlowAndGaugeStep";
import AccessAndLogisticsStep from "./AccessAndLogisticsStep";
import RegulationsAndRulesStep from "./RegulationsAndRulesStep";
import EquipmentRecommendationsStep from "./EquipmentRecommendationsStep";
import SafetyAndHazardsStep from "./SafetyAndHazardsStep";
import AmenitiesStep from "./AmenitiesStep";
import ExperienceProfileStep from "./ExperienceProfileStep";
import PressureAndCrowdingStep from "./PressureAndCrowdingStep";

interface KnowledgeWizardProps {
  propertyId: string;
  propertyName: string;
  backHref: string;
  existingSpecies?: string[];
}

export default function KnowledgeWizard({
  propertyId,
  propertyName,
  backHref,
  existingSpecies,
}: KnowledgeWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const form = useForm<PropertyKnowledgeFormData>({
    resolver: zodResolver(propertyKnowledgeSchema),
    defaultValues: {
      water_characteristics: null,
      species_detail: [],
      hatches_and_patterns: [],
      seasonal_conditions: null,
      flow_and_gauge: null,
      access_and_logistics: null,
      regulations_and_rules: null,
      equipment_recommendations: null,
      safety_and_hazards: null,
      amenities: null,
      experience_profile: null,
      pressure_and_crowding: null,
    },
  });

  const { register, setValue, watch, control, formState: { errors }, getValues, reset } = form;

  // Load existing knowledge data
  useEffect(() => {
    async function loadKnowledge() {
      try {
        const res = await fetch(`/api/properties/${propertyId}/knowledge`);
        if (!res.ok) return;

        const { knowledge } = await res.json();
        if (knowledge) {
          reset({
            water_characteristics: knowledge.water_characteristics ?? null,
            species_detail: knowledge.species_detail ?? [],
            hatches_and_patterns: knowledge.hatches_and_patterns ?? [],
            seasonal_conditions: knowledge.seasonal_conditions ?? null,
            flow_and_gauge: knowledge.flow_and_gauge ?? null,
            access_and_logistics: knowledge.access_and_logistics ?? null,
            regulations_and_rules: knowledge.regulations_and_rules ?? null,
            equipment_recommendations: knowledge.equipment_recommendations ?? null,
            safety_and_hazards: knowledge.safety_and_hazards ?? null,
            amenities: knowledge.amenities ?? null,
            experience_profile: knowledge.experience_profile ?? null,
            pressure_and_crowding: knowledge.pressure_and_crowding ?? null,
          });
        } else if (existingSpecies?.length) {
          // Pre-populate species from the property's existing species array
          reset({
            ...getValues(),
            species_detail: existingSpecies.map((name) => ({
              species_name: name,
              abundance: null,
              avg_size_min_inches: null,
              avg_size_max_inches: null,
              trophy_size_inches: null,
              population_source: null,
              stocking_schedule: null,
              spawn_months: null,
              feeding_patterns: null,
              best_technique: null,
              notes: null,
            })),
          });
        }
      } catch {
        // Silently fail — form starts empty
      } finally {
        setLoading(false);
      }
    }
    loadKnowledge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  // Save current form state to API
  const saveKnowledge = useCallback(async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const data = getValues();
      const res = await fetch(`/api/properties/${propertyId}/knowledge`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Failed to save");
      }

      setSaveMessage("Saved");
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [getValues, propertyId]);

  // Calculate section completeness for the indicator
  const allFormData = watch();
  const sectionFilled = {} as Record<KnowledgeSectionKey, { filled: number; total: number }>;
  for (const section of KNOWLEDGE_SECTIONS) {
    sectionFilled[section.key] = sectionCompleteness(section.key, allFormData);
  }

  const totalScore = calculateCompleteness(allFormData);
  const { message: scoreMessage } = completenessMessage(totalScore);

  const totalSteps = KNOWLEDGE_SECTIONS.length; // 12 sections + summary = 13 steps
  const isSummary = currentStep >= totalSteps;

  async function handleSaveAndContinue() {
    await saveKnowledge();
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  }

  function handleSkip() {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  async function handleSaveAndExit() {
    await saveKnowledge();
    router.push(backHref);
  }

  // Step component props
  const stepProps = {
    register,
    errors,
    watch,
    setValue,
    control,
  };

  const stepComponents = [
    <WaterCharacteristicsStep key="water" {...stepProps} />,
    <SpeciesDetailStep key="species" {...stepProps} />,
    <HatchesAndPatternsStep key="hatches" {...stepProps} />,
    <SeasonalConditionsStep key="seasonal" {...stepProps} />,
    <FlowAndGaugeStep key="flow" {...stepProps} />,
    <AccessAndLogisticsStep key="access" {...stepProps} />,
    <RegulationsAndRulesStep key="regulations" {...stepProps} />,
    <EquipmentRecommendationsStep key="equipment" {...stepProps} />,
    <SafetyAndHazardsStep key="safety" {...stepProps} />,
    <AmenitiesStep key="amenities" {...stepProps} />,
    <ExperienceProfileStep key="experience" {...stepProps} />,
    <PressureAndCrowdingStep key="pressure" {...stepProps} />,
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-forest/30 border-t-forest" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Knowledge Profile
          </h1>
          <p className="text-sm text-text-secondary">{propertyName}</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-sm text-text-light">{saveMessage}</span>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveAndExit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save & Exit"}
          </Button>
        </div>
      </div>

      {/* Completeness bar */}
      <div className="rounded-lg border border-stone-light/20 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">
            Profile Completeness
          </span>
          <span className="text-sm font-semibold text-forest">{totalScore}%</span>
        </div>
        <div className="mb-2 h-2 overflow-hidden rounded-full bg-stone-light/20">
          <div
            className="h-full rounded-full bg-forest transition-all duration-500"
            role="progressbar"
            aria-valuenow={totalScore}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ width: `${totalScore}%` }}
          />
        </div>
        <p className="text-xs text-text-light">{scoreMessage}</p>
      </div>

      {/* Main layout: sidebar + content */}
      <div className="flex gap-6">
        {/* Sidebar — step indicator (hidden on mobile) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6">
            <KnowledgeStepIndicator
              currentStep={currentStep}
              sectionFilled={sectionFilled}
              onStepClick={setCurrentStep}
            />
          </div>
        </aside>

        {/* Mobile step selector */}
        <div className="mb-4 flex items-center gap-2 lg:hidden">
          <span className="text-sm text-text-secondary">
            Step {Math.min(currentStep + 1, totalSteps + 1)} of {totalSteps + 1}
          </span>
          {!isSummary && (
            <span className="text-sm font-medium text-text-primary">
              — {KNOWLEDGE_SECTIONS[currentStep]?.label}
            </span>
          )}
        </div>

        {/* Content area */}
        <div className="min-w-0 grow">
          {isSummary ? (
            <KnowledgeCompletionSummary
              completenessScore={totalScore}
              sectionFilled={sectionFilled}
            />
          ) : (
            stepComponents[currentStep]
          )}

          {/* Navigation buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>

            <div className="flex gap-3">
              {!isSummary && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-text-light"
                  >
                    Skip Section
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveAndContinue}
                    disabled={saving}
                    className="bg-forest text-white hover:bg-forest-deep"
                  >
                    {saving ? "Saving..." : "Save & Continue"}
                  </Button>
                </>
              )}
              {isSummary && (
                <Button
                  type="button"
                  onClick={handleSaveAndExit}
                  disabled={saving}
                  className="bg-forest text-white hover:bg-forest-deep"
                >
                  {saving ? "Saving..." : "Done — Return to Property"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
