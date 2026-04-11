-- ═══════════════════════════════════════════════════════════════
-- 00081: Affiliate Program — product catalog, link tracking, revenue
-- ═══════════════════════════════════════════════════════════════

-- Affiliate network partnerships (Impact, CJ, direct)
create table affiliate_networks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,                         -- e.g. "Impact", "CJ Affiliate", "Direct - Orvis"
  network_type text not null check (network_type in ('impact', 'cj', 'shareasale', 'direct', 'other')),
  base_url text,                                     -- network's tracking domain
  api_key_encrypted text,                            -- encrypted API key (for future auto-sync)
  default_commission_rate numeric(5,4),               -- e.g. 0.0800 = 8%
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Brands we link to (Orvis, Simms, Patagonia, etc.)
create table affiliate_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,                         -- "Orvis", "Simms", etc.
  slug text not null unique,                         -- "orvis", "simms"
  logo_url text,
  website_url text,
  network_id uuid references affiliate_networks(id) on delete set null,
  affiliate_program_id text,                         -- brand's ID within the network
  commission_rate numeric(5,4),                       -- brand-specific rate override
  tier text not null default 'direct' check (tier in ('direct', 'retailer', 'digital')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Product catalog (what Compass AI can recommend)
create table affiliate_products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references affiliate_brands(id) on delete cascade,
  name text not null,                                -- "Orvis Helios 3F 5-Weight 9'"
  slug text not null,
  category text not null check (category in (
    'rod', 'reel', 'line', 'leader_tippet', 'waders', 'boots',
    'jacket', 'baselayer', 'pack', 'net', 'sunglasses', 'hat',
    'flies', 'tools', 'accessories', 'app', 'service', 'other'
  )),
  description text,
  price_cents integer,                               -- MSRP in cents
  image_url text,
  affiliate_url text not null,                       -- full affiliate link with tracking params
  fallback_url text,                                 -- non-affiliate product page
  tags text[] not null default '{}',                 -- e.g. ['5-weight', 'trout', 'dry-fly', 'premium']
  species_tags text[] not null default '{}',         -- e.g. ['trout', 'bass']
  water_type_tags text[] not null default '{}',      -- e.g. ['river', 'stream', 'stillwater']
  season_tags text[] not null default '{}',          -- e.g. ['summer', 'winter']
  sort_priority integer not null default 0,          -- higher = shown first
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(brand_id, slug)
);

-- Click tracking (every affiliate link click)
create table affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references affiliate_products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  session_id text,                                   -- anonymous session tracking
  source text not null default 'compass' check (source in ('compass', 'gear_page', 'email', 'other')),
  context jsonb not null default '{}',               -- e.g. { conversation_id, tool_call_id, query }
  ip_hash text,                                      -- hashed IP for fraud detection
  user_agent text,
  clicked_at timestamptz not null default now()
);

-- Conversion tracking (reported by affiliate networks via webhook)
create table affiliate_conversions (
  id uuid primary key default gen_random_uuid(),
  click_id uuid references affiliate_clicks(id) on delete set null,
  product_id uuid not null references affiliate_products(id) on delete cascade,
  network_id uuid references affiliate_networks(id) on delete set null,
  network_transaction_id text,                       -- ID from the affiliate network
  order_amount_cents integer,                        -- total order value
  commission_cents integer not null,                 -- our commission
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid')),
  converted_at timestamptz not null default now(),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Monthly aggregate for dashboard (materialized by cron or on-demand)
create table affiliate_revenue_monthly (
  id uuid primary key default gen_random_uuid(),
  period text not null,                              -- YYYY-MM
  network_id uuid references affiliate_networks(id) on delete set null,
  brand_id uuid references affiliate_brands(id) on delete set null,
  clicks integer not null default 0,
  conversions integer not null default 0,
  revenue_cents integer not null default 0,
  created_at timestamptz not null default now(),
  unique(period, network_id, brand_id)
);

-- Indexes for query performance
create index idx_affiliate_products_category on affiliate_products(category) where is_active;
create index idx_affiliate_products_tags on affiliate_products using gin(tags) where is_active;
create index idx_affiliate_products_species on affiliate_products using gin(species_tags) where is_active;
create index idx_affiliate_products_water on affiliate_products using gin(water_type_tags) where is_active;
create index idx_affiliate_clicks_product on affiliate_clicks(product_id);
create index idx_affiliate_clicks_user on affiliate_clicks(user_id);
create index idx_affiliate_clicks_date on affiliate_clicks(clicked_at);
create index idx_affiliate_conversions_product on affiliate_conversions(product_id);
create index idx_affiliate_conversions_status on affiliate_conversions(status);
create index idx_affiliate_revenue_period on affiliate_revenue_monthly(period);

-- RLS policies
alter table affiliate_networks enable row level security;
alter table affiliate_brands enable row level security;
alter table affiliate_products enable row level security;
alter table affiliate_clicks enable row level security;
alter table affiliate_conversions enable row level security;
alter table affiliate_revenue_monthly enable row level security;

-- Products are publicly readable (Compass AI needs them)
create policy "Anyone can view active products"
  on affiliate_products for select
  using (is_active = true);

create policy "Anyone can view active brands"
  on affiliate_brands for select
  using (is_active = true);

-- Clicks: users can insert their own, service role manages all
create policy "Authenticated users can record clicks"
  on affiliate_clicks for insert
  to authenticated
  with check (user_id = auth.uid());

-- Admin-only for everything else (networks, conversions, revenue)
-- Managed via service role / admin client

-- Updated_at triggers
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on affiliate_networks
  for each row execute function update_updated_at_column();

create trigger set_updated_at before update on affiliate_brands
  for each row execute function update_updated_at_column();

create trigger set_updated_at before update on affiliate_products
  for each row execute function update_updated_at_column();
