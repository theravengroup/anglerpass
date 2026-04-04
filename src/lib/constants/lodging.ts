export const LODGING_TYPES = [
  'cabin',
  'house',
  'lodge_room',
  'cottage',
  'glamping',
  'rv_hookup',
  'other',
] as const;

export type LodgingType = (typeof LODGING_TYPES)[number];

export const LODGING_TYPE_LABELS: Record<LodgingType, string> = {
  cabin: 'Cabin',
  house: 'House',
  lodge_room: 'Lodge Room',
  cottage: 'Cottage',
  glamping: 'Glamping',
  rv_hookup: 'RV Hookup',
  other: 'Other',
};

export const PET_POLICIES = ['allowed', 'not_allowed', 'case_by_case'] as const;

export type PetPolicy = (typeof PET_POLICIES)[number];

export const PET_POLICY_LABELS: Record<PetPolicy, string> = {
  allowed: 'Pets Welcome',
  not_allowed: 'No Pets',
  case_by_case: 'Pets — Ask First',
};

export const LODGING_AMENITIES = [
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'kitchen', label: 'Full Kitchen' },
  { key: 'kitchenette', label: 'Kitchenette' },
  { key: 'heating', label: 'Heating' },
  { key: 'air_conditioning', label: 'Air Conditioning' },
  { key: 'washer_dryer', label: 'Washer/Dryer' },
  { key: 'fireplace', label: 'Fireplace' },
  { key: 'fire_pit', label: 'Fire Pit / Outdoor Fireplace' },
  { key: 'grill', label: 'Grill / BBQ' },
  { key: 'hot_tub', label: 'Hot Tub' },
  { key: 'parking', label: 'Parking' },
  { key: 'ev_charging', label: 'EV Charging' },
  { key: 'boat_launch', label: 'Boat Launch / Dock' },
  { key: 'gear_storage', label: 'Gear Storage / Wader Room' },
  { key: 'fly_tying_bench', label: 'Fly Tying Bench' },
  { key: 'rod_rack', label: 'Rod Rack' },
  { key: 'game_cleaning', label: 'Fish/Game Cleaning Station' },
  { key: 'linens', label: 'Linens Provided' },
  { key: 'towels', label: 'Towels Provided' },
  { key: 'coffee_maker', label: 'Coffee Maker' },
  { key: 'tv', label: 'TV' },
  { key: 'cell_service', label: 'Cell Service' },
  { key: 'generator', label: 'Generator / Backup Power' },
] as const;

/** Amenity keys that are angling-specific (grouped visually on public display) */
export const ANGLING_AMENITY_KEYS = [
  'boat_launch',
  'gear_storage',
  'fly_tying_bench',
  'rod_rack',
  'game_cleaning',
] as const;

export const COMMON_CHECKIN_TIMES = [
  '14:00',
  '15:00',
  '16:00',
] as const;

export const COMMON_CHECKOUT_TIMES = [
  '10:00',
  '11:00',
  '12:00',
] as const;

export interface PropertyLodging {
  id: string;
  property_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  lodging_name: string | null;
  lodging_type: LodgingType | null;
  lodging_type_other: string | null;
  lodging_description: string | null;
  sleeps: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  amenities: Record<string, boolean>;
  nightly_rate_min: number | null;
  nightly_rate_max: number | null;
  min_nights: number;
  pet_policy: PetPolicy;
  checkin_time: string | null;
  checkout_time: string | null;
  external_listing_url: string | null;
  hospitable_property_uuid: string | null;
  hospitable_last_synced_at: string | null;
  hospitable_sync_status: string | null;
  hospitable_listing_url: string | null;
}
