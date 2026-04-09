"use client";

import { KNOWLEDGE_SECTIONS } from "@/lib/constants/property-knowledge";
import {
  WaterCharacteristicsSection,
  SpeciesDetailSection,
  HatchesSection,
  SeasonalConditionsSection,
  FlowGaugeSection,
} from "./knowledge-sections-water";
import {
  AccessLogisticsSection,
  RegulationsSection,
  EquipmentSection,
  SafetySection,
} from "./knowledge-sections-logistics";
import {
  AmenitiesSection,
  ExperienceProfileSection,
  PressureCrowdingSection,
} from "./knowledge-sections-experience";

interface KnowledgeDisplayProps {
  knowledge: Record<string, unknown> | null;
}

const SECTION_RENDERERS: Record<string, (data: unknown) => React.ReactNode> = {
  water_characteristics: (d) => <WaterCharacteristicsSection data={d} />,
  species_detail: (d) => <SpeciesDetailSection data={d} />,
  hatches_and_patterns: (d) => <HatchesSection data={d} />,
  seasonal_conditions: (d) => <SeasonalConditionsSection data={d} />,
  flow_and_gauge: (d) => <FlowGaugeSection data={d} />,
  access_and_logistics: (d) => <AccessLogisticsSection data={d} />,
  regulations_and_rules: (d) => <RegulationsSection data={d} />,
  equipment_recommendations: (d) => <EquipmentSection data={d} />,
  safety_and_hazards: (d) => <SafetySection data={d} />,
  amenities: (d) => <AmenitiesSection data={d} />,
  experience_profile: (d) => <ExperienceProfileSection data={d} />,
  pressure_and_crowding: (d) => <PressureCrowdingSection data={d} />,
};

export default function KnowledgeDisplay({ knowledge }: KnowledgeDisplayProps) {
  if (!knowledge) {
    return (
      <div className="rounded-xl border border-stone-light/20 p-6 text-center">
        <p className="text-sm text-text-light italic">
          No knowledge profile available for this property.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-text-primary">
        Property Knowledge Profile
      </h2>
      {KNOWLEDGE_SECTIONS.map((section) => {
        const renderer = SECTION_RENDERERS[section.key];
        if (!renderer) return null;
        const sectionData = knowledge[section.key];
        return <div key={section.key}>{renderer(sectionData)}</div>;
      })}
    </div>
  );
}
