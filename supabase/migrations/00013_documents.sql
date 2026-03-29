-- Phase 9: Documents & E-Signatures
-- Landowners can require liability waivers / access agreements that anglers must sign before their trip

-- Document templates created by landowners
CREATE TABLE IF NOT EXISTS document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,              -- Markdown/plain text with variable substitution
  required boolean NOT NULL DEFAULT true,  -- Must be signed before trip
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_templates_property
  ON document_templates(property_id, active, sort_order);

-- Signed documents — immutable record of angler acceptance
CREATE TABLE IF NOT EXISTS signed_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES document_templates(id) ON DELETE RESTRICT,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  signer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  signer_name text NOT NULL,       -- Typed name at time of signing
  signer_email text NOT NULL,      -- Email at time of signing
  template_snapshot text NOT NULL,  -- Full text of the template at signing time (immutable)
  template_title text NOT NULL,     -- Title at signing time
  ip_address text,
  user_agent text,
  signed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signed_documents_booking
  ON signed_documents(booking_id);

CREATE INDEX IF NOT EXISTS idx_signed_documents_signer
  ON signed_documents(signer_id, signed_at DESC);

-- Prevent double-signing same template for same booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_signed_documents_unique
  ON signed_documents(template_id, booking_id, signer_id);

-- RLS
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE signed_documents ENABLE ROW LEVEL SECURITY;

-- Document templates: owners can manage, anyone can read active templates for published properties
CREATE POLICY "Owners can manage own templates"
  ON document_templates FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Anyone can view active templates for published properties"
  ON document_templates FOR SELECT
  USING (
    active = true AND EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = document_templates.property_id
      AND properties.status = 'published'
    )
  );

-- Signed documents: signer can view own, property owner can view for their properties
CREATE POLICY "Signers can view own signed documents"
  ON signed_documents FOR SELECT
  USING (signer_id = auth.uid());

CREATE POLICY "Signers can create signed documents"
  ON signed_documents FOR INSERT
  WITH CHECK (signer_id = auth.uid());

CREATE POLICY "Property owners can view signed documents for their properties"
  ON signed_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM document_templates dt
      WHERE dt.id = signed_documents.template_id
      AND dt.owner_id = auth.uid()
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all templates"
  ON document_templates FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can view all signed documents"
  ON signed_documents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
