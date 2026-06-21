-- DachProfi AI — Supabase Schema
-- Ausführen in: Supabase Dashboard → SQL Editor

-- ─────────────────────────────────────────────────────────────
-- TABELLEN
-- ─────────────────────────────────────────────────────────────

-- Projekte (eine Besichtigung = ein Projekt)
CREATE TABLE projekte (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stammdaten
  kunde       TEXT NOT NULL,
  adresse     TEXT NOT NULL,
  
  -- KI-Ergebnis
  protokoll   JSONB,          -- Vollständiges Claude-Protokoll
  
  -- Status
  status      TEXT NOT NULL DEFAULT 'entwurf'
              CHECK (status IN ('entwurf', 'bearbeitet', 'freigegeben')),
  
  -- Zeitstempel
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Positionen (bearbeitbare Angebotszeilen)
CREATE TABLE positionen (
  id            BIGSERIAL PRIMARY KEY,
  projekt_id    UUID NOT NULL REFERENCES projekte(id) ON DELETE CASCADE,
  
  nr            TEXT,               -- z.B. "1.1"
  kategorie     TEXT,               -- z.B. "Ziegel & Deckung"
  bezeichnung   TEXT NOT NULL,
  einheit       TEXT NOT NULL,
  menge         DECIMAL(10,2) NOT NULL DEFAULT 0,
  ep            DECIMAL(10,2) NOT NULL DEFAULT 0,  -- Einheitspreis netto
  
  sort_order    INT NOT NULL DEFAULT 0,
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fotos (Pfade im Supabase Storage)
CREATE TABLE fotos (
  id          BIGSERIAL PRIMARY KEY,
  projekt_id  UUID NOT NULL REFERENCES projekte(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- Jeder Dachdecker sieht nur seine eigenen Projekte
-- ─────────────────────────────────────────────────────────────

ALTER TABLE projekte  ENABLE ROW LEVEL SECURITY;
ALTER TABLE positionen ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos      ENABLE ROW LEVEL SECURITY;

-- Projekte: nur eigene
CREATE POLICY "Eigene Projekte" ON projekte
  FOR ALL USING (auth.uid() = user_id);

-- Positionen: nur wenn Projekt dem User gehört
CREATE POLICY "Eigene Positionen" ON positionen
  FOR ALL USING (
    projekt_id IN (
      SELECT id FROM projekte WHERE user_id = auth.uid()
    )
  );

-- Fotos: nur wenn Projekt dem User gehört
CREATE POLICY "Eigene Fotos" ON fotos
  FOR ALL USING (
    projekt_id IN (
      SELECT id FROM projekte WHERE user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- STORAGE BUCKET für Fotos
-- ─────────────────────────────────────────────────────────────

-- In Supabase Dashboard → Storage → New Bucket: "fotos"
-- Private Bucket (kein public access)
-- Policies: nur authentifizierte User können eigene Fotos hochladen

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: updated_at automatisch setzen
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON projekte
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
