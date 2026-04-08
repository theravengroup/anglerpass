import "server-only";

import { streamText, tool, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

import { requireAuth, jsonError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsageStatus, recordMessage } from "@/lib/compass/usage";
import { getPropertyForecast } from "@/lib/weather";
import { getStreamConditions } from "@/lib/compass/tools/usgs-stream";
import { getSolunarData } from "@/lib/compass/tools/solunar";
import { getSunTimes } from "@/lib/compass/tools/sun-times";
import { getActiveHatches } from "@/lib/compass/constants/hatches";
import {
  getSpeciesAdvisory,
  getFishableSpecies,
} from "@/lib/compass/constants/species-temps";
import { getGearRecommendation } from "@/lib/compass/constants/gear-logic";

/* ═══════════════════════════════════════════════════════════════════════
   RATE LIMITING (in-memory, per-user, resets hourly)
   ═══════════════════════════════════════════════════════════════════════ */

const MAX_MESSAGES_PER_HOUR = 20;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || entry.resetAt <= now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }

  if (entry.count >= MAX_MESSAGES_PER_HOUR) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Prune stale entries every 10 minutes to prevent memory leaks
if (typeof globalThis !== "undefined") {
  const pruneKey = Symbol.for("compass-rate-limit-prune");
  const globalRecord = globalThis as unknown as Record<symbol, boolean>;
  if (!globalRecord[pruneKey]) {
    globalRecord[pruneKey] = true;
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of rateLimitMap) {
        if (entry.resetAt <= now) {
          rateLimitMap.delete(key);
        }
      }
    }, 10 * 60 * 1000).unref?.();
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   SYSTEM PROMPT
   ═══════════════════════════════════════════════════════════════════════ */

const SYSTEM_PROMPT = `You are AnglerPass Compass — a knowledgeable, warm trip-planning assistant for the AnglerPass private fly fishing platform. Think of yourself as a trusted fishing buddy who also happens to know the platform inside and out.

## About AnglerPass
AnglerPass connects anglers with exclusive private water through a club-based access model:
- **Clubs** lease water from **landowners** and vet **anglers** for membership
- Anglers book rod days on club properties — bookings are instant (no landowner approval needed)
- **Cross-club access** lets anglers from one club book on partner club water for a fee
- **Guides** can be hired for trips and must be approved by the property's club
- Rod fees are per-angler, per-day. Half-day options exist on some properties
- The platform handles payment splits: landowner payout, club commission, platform fee, and optional guide fees

## Your Personality
- Warm and enthusiastic about fly fishing, but never over-the-top
- Concise — anglers want answers, not essays. Keep responses tight
- Conservation-minded — catch and release, barbless hooks, respect for private water
- Honest — if you don't know something or don't have data, say so. Ask clarifying questions
- Never make up properties, availability, prices, or weather data. Only report what tool calls return

## What You Can Help With
- Finding available private water (by location, species, dates, water type)
- Trip planning: weather, stream flows, hatches, gear, best times, moon/solunar periods
- Understanding AnglerPass pricing and booking mechanics
- Guide recommendations for specific properties
- Checking booking details and availability
- Species-specific advice: temperature advisories, techniques, seasonal behavior
- Real-time stream conditions: CFS (flow), water temperature from USGS gauges
- Gear recommendations: rod/reel, wading, clothing, flies tailored to conditions
- General fly fishing knowledge (hatches, techniques, gear, seasons)
- Detailed property fishing intel: water characteristics, species behavior, hatch charts, seasonal conditions, gear recommendations (from Knowledge Profiles)

## Key Rules
1. NEVER fabricate property names, prices, or availability. Always use searchProperties or getPropertyDetails
2. When showing properties, include key details: name, location, species, rate, water type
3. For weather and stream data, always fetch fresh data — don't guess
4. If a user asks about a specific date, check availability before recommending
5. Keep responses under 200 words unless the user asks for detail
6. When you don't have enough info to help, ask one focused clarifying question
7. Species names should be properly capitalized (Brown Trout, Rainbow Trout, Brook Trout, etc.)
8. Dollar amounts should be formatted as currency ($150/rod day)
9. When recommending a trip, proactively include stream conditions, hatch info, and gear suggestions
10. Always note conservation advisories when water temps are elevated — fish welfare first

## Enhanced Data You Have Access To
- **USGS Stream Gauges**: Real-time discharge (CFS) and water temperature from nearby gauges
- **Colorado Hatch Chart**: 14 major hatches with patterns, sizes, seasons, and temperature triggers
- **Species Temperature Profiles**: Optimal/stress/lethal thresholds for 8 species
- **Gear Decision Trees**: Rod, wading, clothing, and fly recommendations based on conditions
- **Solunar/Moon Data**: Moon phase, solunar feeding periods, moonrise/set
- **Sun Times**: Sunrise/sunset, golden hours, prime fishing windows

When giving trip advice, combine these data sources for comprehensive, contextual guidance. For example: check stream flows + water temp → get species advisory → check active hatches → recommend gear → note best fishing windows.

## Property Knowledge Profiles
You have access to rich Knowledge Profiles for properties that have them filled out. These contain:
- Water characteristics (clarity, temperature, structure, wadeability)
- Species detail (sizes, abundance, trophy potential, behavior)
- Hatch charts with matching fly patterns
- Seasonal conditions and best months to visit
- Flow data and USGS gauge references
- Equipment recommendations (rods, waders, flies, tippet)
- Safety info, amenities, and experience profiles

Use getPropertyKnowledge when anglers ask detailed questions about a specific property. When comparing properties, note that higher knowledge_completeness scores mean you can give more detailed advice.

**CRITICAL SECURITY RULE**: NEVER reveal gate codes, lock combinations, access codes, or specific private driving directions. This information is ONLY shared through the booking confirmation system. If an angler asks for gate codes or access details, tell them these will be provided in their booking confirmation after payment.

## Fly Fishing Knowledge
You have deep knowledge of fly fishing: seasonal hatches, water conditions, gear selection, techniques (dry fly, nymph, streamer, euro-nymph), reading water, and the culture of private water access. Use this when giving advice, but always defer to property-specific rules and regulations from the data.`;

/* ═══════════════════════════════════════════════════════════════════════
   TOOLS — factory that closes over userId
   ═══════════════════════════════════════════════════════════════════════ */

function buildTools(userId: string) {
  return {
    searchProperties: tool({
      description:
        "Search available properties on AnglerPass. Use this when the user wants to find private water, fishing spots, or properties matching certain criteria.",
      inputSchema: z.object({
        location: z
          .string()
          .optional()
          .describe(
            "Location keyword to search (e.g. 'Colorado', 'Montana', 'near Denver')"
          ),
        species: z
          .array(z.string())
          .optional()
          .describe(
            "Fish species to filter by (e.g. ['Brown Trout', 'Rainbow Trout'])"
          ),
        water_type: z
          .string()
          .optional()
          .describe(
            "Type of water: 'river', 'stream', 'lake', 'spring creek', 'tailwater'"
          ),
        max_results: z
          .number()
          .default(5)
          .describe("Maximum number of results to return"),
      }),
      execute: async ({ location, species, water_type, max_results }) => {
        try {
          const admin = createAdminClient();
          let query = admin
            .from("properties")
            .select(
              "id, name, description, location_description, species, water_type, water_miles, rate_adult_full_day, rate_adult_half_day, half_day_allowed, max_rods, latitude, longitude, photos, status, lodging_available, created_by_club_id, knowledge_completeness"
            )
            .eq("status", "active");

          if (location) {
            query = query.ilike(
              "location_description",
              `%${location.replace(/[%_\\]/g, "\\$&")}%`
            );
          }

          if (water_type) {
            query = query.ilike(
              "water_type",
              `%${water_type.replace(/[%_\\]/g, "\\$&")}%`
            );
          }

          if (species?.length) {
            query = query.overlaps("species", species);
          }

          query = query.limit(max_results);

          const { data: properties, error } = await query;

          if (error) {
            return { error: `Failed to search properties: ${error.message}` };
          }

          if (!properties?.length) {
            return {
              results: [],
              message: "No properties found matching your criteria.",
            };
          }

          const clubIds = [
            ...new Set(
              (
                properties
                  .map((p) => p.created_by_club_id)
                  .filter(Boolean) as string[]
              )
            ),
          ];

          let clubMap = new Map<string, string>();
          if (clubIds.length > 0) {
            const { data: clubs } = await admin
              .from("clubs")
              .select("id, name")
              .in("id", clubIds);

            if (clubs) {
              clubMap = new Map(clubs.map((c) => [c.id, c.name]));
            }
          }

          return {
            results: properties.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              location: p.location_description,
              species: p.species,
              water_type: p.water_type,
              water_miles: p.water_miles,
              rate_full_day: p.rate_adult_full_day,
              rate_half_day: p.rate_adult_half_day,
              half_day_allowed: p.half_day_allowed,
              max_rods: p.max_rods,
              lodging_available: p.lodging_available,
              club_name: p.created_by_club_id
                ? clubMap.get(p.created_by_club_id) ?? null
                : null,
              has_photo: (p.photos?.length ?? 0) > 0,
              knowledge_completeness: p.knowledge_completeness ?? null,
            })),
            count: properties.length,
          };
        } catch (err) {
          return {
            error: `Search failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          };
        }
      },
    }),

    getPropertyDetails: tool({
      description:
        "Get full details for a specific property including pricing, rules, amenities, and club info.",
      inputSchema: z.object({
        property_id: z.string().describe("The UUID of the property"),
      }),
      execute: async ({ property_id }) => {
        try {
          const admin = createAdminClient();
          const { data: property, error } = await admin
            .from("properties")
            .select("*")
            .eq("id", property_id)
            .maybeSingle();

          if (error || !property) {
            return { error: "Property not found" };
          }

          // Check if user has a confirmed+paid booking
          const { count: bookingCount } = await admin
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("property_id", property_id)
            .eq("angler_id", userId)
            .in("status", ["confirmed"]);

          const hasConfirmedBooking = (bookingCount ?? 0) > 0;

          let clubInfo = null;
          if (property.created_by_club_id) {
            const { data: club } = await admin
              .from("clubs")
              .select("id, name, description, location, website, rules")
              .eq("id", property.created_by_club_id)
              .maybeSingle();

            if (club) {
              clubInfo = club;
            }
          }

          return {
            property: {
              id: property.id,
              name: property.name,
              description: property.description,
              location: property.location_description,
              species: property.species,
              water_type: property.water_type,
              water_miles: property.water_miles,
              rate_full_day: property.rate_adult_full_day,
              rate_half_day: property.rate_adult_half_day,
              rate_youth_full_day: property.rate_youth_full_day,
              rate_child_full_day: property.rate_child_full_day,
              half_day_allowed: property.half_day_allowed,
              max_rods: property.max_rods,
              max_guests: property.max_guests,
              lodging_available: property.lodging_available,
              lodging_url: property.lodging_url,
              regulations: property.regulations,
              access_notes: hasConfirmedBooking ? property.access_notes : null,
              latitude: property.latitude,
              longitude: property.longitude,
              photo_count: property.photos?.length ?? 0,
            },
            club: clubInfo,
          };
        } catch (err) {
          return {
            error: `Failed to get property: ${err instanceof Error ? err.message : "Unknown error"}`,
          };
        }
      },
    }),

    getPropertyKnowledge: tool({
      description:
        "Get the detailed knowledge profile for a property including water characteristics, species detail, hatches, seasonal conditions, flow data, equipment recommendations, and more. Use this when you need detailed fishing intel about a specific property.",
      inputSchema: z.object({
        property_id: z.string().describe("The UUID of the property"),
      }),
      execute: async ({ property_id }: { property_id: string }) => {
        try {
          const admin = createAdminClient();

          // Only return knowledge for published/active properties
          const { data: property } = await admin
            .from("properties")
            .select("id, name, status")
            .eq("id", property_id)
            .maybeSingle();

          if (
            !property ||
            !["published", "active"].includes(property.status)
          ) {
            return { error: "Property not found or not published" };
          }

          const { data: knowledge, error } = await admin
            .from("property_knowledge")
            .select(
              "water_characteristics, species_detail, hatches_and_patterns, seasonal_conditions, flow_and_gauge, regulations_and_rules, equipment_recommendations, safety_and_hazards, amenities, experience_profile, pressure_and_crowding, completeness_score"
            )
            .eq("property_id", property_id)
            .maybeSingle();

          if (error || !knowledge) {
            return {
              knowledge: null,
              message:
                "No knowledge profile available for this property",
            };
          }

          // Explicitly EXCLUDE access_and_logistics from the return
          // to prevent leaking gate codes or sensitive access details
          return {
            property_name: property.name,
            completeness_score: knowledge.completeness_score,
            knowledge: {
              water_characteristics: knowledge.water_characteristics,
              species_detail: knowledge.species_detail,
              hatches_and_patterns: knowledge.hatches_and_patterns,
              seasonal_conditions: knowledge.seasonal_conditions,
              flow_and_gauge: knowledge.flow_and_gauge,
              regulations_and_rules: knowledge.regulations_and_rules,
              equipment_recommendations:
                knowledge.equipment_recommendations,
              safety_and_hazards: knowledge.safety_and_hazards,
              amenities: knowledge.amenities,
              experience_profile: knowledge.experience_profile,
              pressure_and_crowding: knowledge.pressure_and_crowding,
            },
          };
        } catch (err: unknown) {
          return {
            error: `Failed to get knowledge: ${err instanceof Error ? err.message : "Unknown error"}`,
          };
        }
      },
    }),

    checkAvailability: tool({
      description:
        "Check if a property has available rod slots on specific dates. Use before recommending a booking.",
      inputSchema: z.object({
        property_id: z.string().describe("The UUID of the property"),
        date: z.string().describe("Start date in YYYY-MM-DD format"),
        num_days: z
          .number()
          .default(1)
          .describe("Number of days to check (1-7)"),
      }),
      execute: async ({ property_id, date, num_days }) => {
        try {
          const admin = createAdminClient();

          const { data: property } = await admin
            .from("properties")
            .select("id, name, max_rods")
            .eq("id", property_id)
            .maybeSingle();

          if (!property) {
            return { error: "Property not found" };
          }

          const days = Math.min(num_days, 7);
          const availability: Array<{
            date: string;
            booked_rods: number;
            max_rods: number;
            available: boolean;
          }> = [];

          for (let i = 0; i < days; i++) {
            const checkDate = new Date(date);
            checkDate.setDate(checkDate.getDate() + i);
            const dateStr = checkDate.toISOString().slice(0, 10);

            const { count } = await admin
              .from("bookings")
              .select("id", { count: "exact", head: true })
              .eq("property_id", property_id)
              .eq("booking_date", dateStr)
              .in("status", ["confirmed", "pending"]);

            const booked = count ?? 0;
            const maxRods = property.max_rods ?? 4;

            availability.push({
              date: dateStr,
              booked_rods: booked,
              max_rods: maxRods,
              available: booked < maxRods,
            });
          }

          return {
            property_name: property.name,
            availability,
            all_available: availability.every((d) => d.available),
          };
        } catch (err) {
          return {
            error: `Availability check failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          };
        }
      },
    }),

    getWeather: tool({
      description:
        "Get the 7-day weather forecast for a property's location. Includes fishing conditions ratings.",
      inputSchema: z.object({
        property_id: z.string().describe("The UUID of the property"),
      }),
      execute: async ({ property_id }) => {
        try {
          const admin = createAdminClient();
          const { data: property } = await admin
            .from("properties")
            .select(
              "id, name, latitude, longitude, location_description"
            )
            .eq("id", property_id)
            .maybeSingle();

          if (!property) {
            return { error: "Property not found" };
          }

          if (!property.latitude || !property.longitude) {
            return {
              error: "No coordinates available for this property",
              property_name: property.name,
            };
          }

          const forecast = await getPropertyForecast(
            property.latitude,
            property.longitude
          );

          if (!forecast) {
            return {
              error: "Weather forecast temporarily unavailable",
              property_name: property.name,
            };
          }

          return {
            property_name: property.name,
            location:
              forecast.locationLabel ?? property.location_description,
            elevation_ft: forecast.elevationFt,
            updated_at: forecast.updatedAt,
            days: forecast.days.map((d) => ({
              date: d.date,
              label: d.label,
              summary: d.summary,
              high: d.highF,
              low: d.lowF,
              precip_chance: d.precipChance,
              wind: d.wind,
              wind_direction: d.windDirection,
              sunrise: d.sunrise,
              sunset: d.sunset,
              fishing_condition: d.fishingCondition,
            })),
          };
        } catch (err) {
          return {
            error: `Weather fetch failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          };
        }
      },
    }),

    getStreamFlow: tool({
      description:
        "Get real-time stream flow (CFS) and water temperature from USGS gauges near a property. Critical for trip planning — shows current river conditions.",
      inputSchema: z.object({
        property_id: z.string().describe("The UUID of the property"),
        radius_miles: z
          .number()
          .default(20)
          .describe("Search radius in miles (default 20)"),
      }),
      execute: async ({ property_id, radius_miles }) => {
        try {
          const admin = createAdminClient();
          const { data: property } = await admin
            .from("properties")
            .select("id, name, latitude, longitude")
            .eq("id", property_id)
            .maybeSingle();

          if (!property) {
            return { error: "Property not found" };
          }

          if (!property.latitude || !property.longitude) {
            return {
              error: "No coordinates available for this property",
              property_name: property.name,
            };
          }

          const gauges = await getStreamConditions(
            property.latitude,
            property.longitude,
            radius_miles
          );

          if (gauges.length === 0) {
            return {
              property_name: property.name,
              gauges: [],
              message:
                "No USGS stream gauges found within the search radius.",
            };
          }

          return {
            property_name: property.name,
            gauges: gauges.slice(0, 5).map((g) => ({
              site_id: g.siteId,
              site_name: g.siteName,
              discharge_cfs: g.dischargeCfs,
              water_temp_f: g.waterTempF,
              water_temp_c: g.waterTempC,
              last_reading: g.dischargeDateTime ?? g.waterTempDateTime,
            })),
          };
        } catch (err) {
          return {
            error: `Stream flow fetch failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          };
        }
      },
    }),

    getHatchReport: tool({
      description:
        "Get current hatch activity report based on month and water temperature. Returns active hatches with fly patterns, sizes, and timing.",
      inputSchema: z.object({
        month: z
          .number()
          .min(1)
          .max(12)
          .describe("Month number (1-12)"),
        water_temp_f: z
          .number()
          .optional()
          .describe(
            "Current water temperature in °F (if known, improves accuracy)"
          ),
      }),
      execute: async ({ month, water_temp_f }) => {
        const hatches = getActiveHatches(month, water_temp_f ?? null);

        return {
          month,
          water_temp_f: water_temp_f ?? null,
          active_hatches: hatches.map((h) => ({
            name: h.name,
            patterns: h.patterns,
            sizes: h.sizes,
            season: h.seasonLabel,
            time_of_day: h.timeOfDay,
            water_types: h.waterTypes,
            notes: h.notes,
          })),
          count: hatches.length,
        };
      },
    }),

    getSpeciesInfo: tool({
      description:
        "Get species temperature advisory and fishing advice. Shows whether conditions are optimal, marginal, stressed, or dangerous for a target species.",
      inputSchema: z.object({
        species_name: z
          .string()
          .describe(
            "Species name (e.g. 'Brown Trout', 'Rainbow Trout', 'Cutthroat Trout')"
          ),
        water_temp_f: z
          .number()
          .describe("Current water temperature in °F"),
      }),
      execute: async ({ species_name, water_temp_f }) => {
        const advisory = getSpeciesAdvisory(species_name, water_temp_f);

        if (!advisory) {
          // Try to find fishable species at this temp instead
          const fishable = getFishableSpecies(water_temp_f);
          return {
            error: `Species "${species_name}" not found in database.`,
            fishable_species_at_this_temp: fishable.map((f) => ({
              name: f.species.name,
              status: f.status,
              optimal_range: f.species.optimalRange,
            })),
          };
        }

        return {
          species: advisory.species.name,
          status: advisory.status,
          advisory: advisory.advisory,
          optimal_range: advisory.species.optimalRange,
          stress_range: advisory.species.stressRange,
          lethal_threshold: advisory.species.lethalThreshold,
          feeding_notes: advisory.species.feedingNotes,
          best_techniques: advisory.species.bestTechniques,
          seasonal_notes: advisory.species.seasonalNotes,
        };
      },
    }),

    getGearSuggestions: tool({
      description:
        "Get comprehensive gear recommendations for a trip based on conditions. Returns rod, wading, clothing, boot, and fly suggestions.",
      inputSchema: z.object({
        water_temp_f: z
          .number()
          .optional()
          .describe("Water temperature in °F"),
        air_temp_high_f: z
          .number()
          .describe("Expected high air temperature in °F"),
        air_temp_low_f: z
          .number()
          .describe("Expected low air temperature in °F"),
        water_type: z
          .string()
          .optional()
          .describe(
            "Type of water (river, stream, spring creek, tailwater, lake)"
          ),
        species: z
          .array(z.string())
          .optional()
          .describe("Target species"),
        month: z.number().min(1).max(12).describe("Month (1-12)"),
        precip_chance: z
          .number()
          .default(0)
          .describe("Precipitation chance (0-100)"),
        wind: z
          .string()
          .optional()
          .describe("Wind conditions description"),
      }),
      execute: async ({
        water_temp_f,
        air_temp_high_f,
        air_temp_low_f,
        water_type,
        species,
        month,
        precip_chance,
        wind,
      }) => {
        const gear = getGearRecommendation({
          waterTempF: water_temp_f ?? null,
          airTempHighF: air_temp_high_f,
          airTempLowF: air_temp_low_f,
          waterType: water_type ?? null,
          species: species ?? null,
          month,
          precipChance: precip_chance,
          wind: wind ?? null,
        });

        return gear;
      },
    }),

    getSolunarReport: tool({
      description:
        "Get moon phase, solunar feeding periods, and sunrise/sunset for a location and date. Helps determine best fishing times.",
      inputSchema: z.object({
        property_id: z.string().describe("The UUID of the property"),
        date: z
          .string()
          .describe("Date in YYYY-MM-DD format"),
      }),
      execute: async ({ property_id, date }) => {
        try {
          const admin = createAdminClient();
          const { data: property } = await admin
            .from("properties")
            .select("id, name, latitude, longitude")
            .eq("id", property_id)
            .maybeSingle();

          if (!property) {
            return { error: "Property not found" };
          }

          if (!property.latitude || !property.longitude) {
            return {
              error: "No coordinates available for this property",
              property_name: property.name,
            };
          }

          const targetDate = new Date(`${date}T12:00:00`);
          const solunar = getSolunarData(
            targetDate,
            property.latitude,
            property.longitude
          );
          const sunTimes = getSunTimes(
            targetDate,
            property.latitude,
            property.longitude
          );

          return {
            property_name: property.name,
            date,
            sun: {
              sunrise: sunTimes.sunrise,
              sunset: sunTimes.sunset,
              dawn: sunTimes.dawn,
              dusk: sunTimes.dusk,
              day_length_hours: sunTimes.dayLengthHours,
              golden_hour_morning: sunTimes.goldenHourMorning,
              golden_hour_evening: sunTimes.goldenHourEvening,
            },
            moon: solunar.moon,
            solunar_periods: solunar.periods,
            prime_fishing_windows: sunTimes.primeFishingWindows,
            overall_solunar_rating: solunar.overallRating,
          };
        } catch (err) {
          return {
            error: `Solunar data failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          };
        }
      },
    }),

    getUserProfile: tool({
      description:
        "Get the current user's angler profile — experience level, favorite species, and location.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const admin = createAdminClient();
          const { data: profile, error } = await admin
            .from("profiles")
            .select(
              "id, display_name, role, location, fishing_experience, favorite_species, bio"
            )
            .eq("id", userId)
            .maybeSingle();

          if (error || !profile) {
            return { error: "Could not load user profile" };
          }

          return {
            display_name: profile.display_name,
            role: profile.role,
            location: profile.location,
            experience: profile.fishing_experience,
            favorite_species: profile.favorite_species,
            bio: profile.bio,
          };
        } catch (err) {
          return {
            error: `Profile fetch failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          };
        }
      },
    }),

    getBookingDetails: tool({
      description:
        "Get details for a specific booking including property, dates, and guide info.",
      inputSchema: z.object({
        booking_id: z.string().describe("The UUID of the booking"),
      }),
      execute: async ({ booking_id }) => {
        try {
          const admin = createAdminClient();
          const { data: booking, error } = await admin
            .from("bookings")
            .select(
              "id, booking_date, booking_days, status, total_amount, base_rate, party_size, duration, message, property_id, guide_id, angler_id"
            )
            .eq("id", booking_id)
            .maybeSingle();

          if (error || !booking) {
            return { error: "Booking not found" };
          }

          if (booking.angler_id !== userId) {
            return { error: "You can only view your own bookings" };
          }

          let propertyName = null;
          if (booking.property_id) {
            const { data: prop } = await admin
              .from("properties")
              .select("name, location_description")
              .eq("id", booking.property_id)
              .maybeSingle();
            if (prop) {
              propertyName = prop.name;
            }
          }

          let guideName = null;
          if (booking.guide_id) {
            const { data: guide } = await admin
              .from("guide_profiles")
              .select("display_name")
              .eq("id", booking.guide_id)
              .maybeSingle();
            if (guide) {
              guideName = guide.display_name;
            }
          }

          return {
            id: booking.id,
            date: booking.booking_date,
            days: booking.booking_days,
            status: booking.status,
            total: booking.total_amount,
            base_rate: booking.base_rate,
            party_size: booking.party_size,
            duration: booking.duration,
            message: booking.message,
            property_name: propertyName,
            guide_name: guideName,
          };
        } catch (err) {
          return {
            error: `Booking fetch failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          };
        }
      },
    }),

    searchGuides: tool({
      description:
        "Search for guides approved at a property's club. Optionally filter by date availability.",
      inputSchema: z.object({
        property_id: z
          .string()
          .describe("The UUID of the property to find guides for"),
        date: z
          .string()
          .optional()
          .describe(
            "Optional date to check guide availability (YYYY-MM-DD)"
          ),
      }),
      execute: async ({ property_id, date }) => {
        try {
          const admin = createAdminClient();

          const { data: property } = await admin
            .from("properties")
            .select("id, name, created_by_club_id")
            .eq("id", property_id)
            .maybeSingle();

          if (!property?.created_by_club_id) {
            return {
              error: "Property not found or has no associated club",
            };
          }

          const { data: affiliations } = await admin
            .from("guide_club_affiliations")
            .select("guide_id")
            .eq("club_id", property.created_by_club_id)
            .eq("status", "approved");

          if (!affiliations?.length) {
            return {
              guides: [],
              message:
                "No approved guides found for this property's club.",
            };
          }

          const guideIds = affiliations.map((a) => a.guide_id);

          const { data: guides } = await admin
            .from("guide_profiles")
            .select(
              "id, display_name, bio, species, techniques, rate_full_day, rate_half_day, rating_avg, rating_count, base_location, max_anglers, gear_included, status"
            )
            .in("id", guideIds)
            .eq("status", "approved");

          if (!guides?.length) {
            return {
              guides: [],
              message: "No approved guides currently available.",
            };
          }

          let busyGuideIds = new Set<string>();
          if (date) {
            const { data: bookedGuides } = await admin
              .from("bookings")
              .select("guide_id")
              .eq("booking_date", date)
              .in("status", ["confirmed", "pending"])
              .in(
                "guide_id",
                guides.map((g) => g.id)
              );

            if (bookedGuides) {
              busyGuideIds = new Set(
                bookedGuides
                  .map((b) => b.guide_id)
                  .filter(Boolean) as string[]
              );
            }
          }

          return {
            property_name: property.name,
            guides: guides.map((g) => ({
              id: g.id,
              name: g.display_name,
              bio: g.bio,
              species: g.species,
              techniques: g.techniques,
              rate_full_day: g.rate_full_day,
              rate_half_day: g.rate_half_day,
              rating: g.rating_avg,
              review_count: g.rating_count,
              location: g.base_location,
              max_anglers: g.max_anglers,
              gear_included: g.gear_included,
              available_on_date: date
                ? !busyGuideIds.has(g.id)
                : null,
            })),
          };
        } catch (err) {
          return {
            error: `Guide search failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          };
        }
      },
    }),
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   ROUTE HANDLER
   ═══════════════════════════════════════════════════════════════════════ */

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth) {
    return jsonError("Unauthorized", 401);
  }

  if (!checkRateLimit(auth.user.id)) {
    return jsonError(
      "Rate limit exceeded. Try again in a few minutes.",
      429
    );
  }

  // Fetch user profile for role-based usage limits
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, roles")
    .eq("id", auth.user.id)
    .single();

  const userRoles: string[] = profile?.roles ?? [profile?.role ?? "angler"];

  // Check usage quota
  const usage = await getUsageStatus(auth.user.id, userRoles);
  if (!usage.canSend) {
    return Response.json(
      {
        error: "compass_limit_reached",
        monthlyUsed: usage.monthlyUsed,
        monthlyLimit: usage.monthlyLimit,
        creditBalance: usage.creditBalance,
      },
      { status: 429 }
    );
  }

  const body = await request.json();
  const messages = body.messages;

  if (!Array.isArray(messages)) {
    return jsonError("Invalid request: messages array required", 400);
  }

  const tools = buildTools(auth.user.id);

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    stopWhen: stepCountIs(5),
    onFinish: () => {
      // Fire-and-forget: record usage after successful response
      recordMessage(auth.user.id, userRoles).catch(() => {});
    },
  });

  return result.toUIMessageStreamResponse();
}
