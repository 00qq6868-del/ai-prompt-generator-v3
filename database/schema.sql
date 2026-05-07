CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_idea TEXT NOT NULL,
  target_model_id TEXT NOT NULL,
  modality TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  version_type TEXT NOT NULL CHECK (version_type IN ('optimized', 'synthetic')),
  prompt_text TEXT NOT NULL,
  decision_status TEXT NOT NULL CHECK (decision_status IN ('candidate', 'accepted', 'rejected', 'needs_review')),
  quality_gate JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(prompt_id, version_number)
);

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  prompt_version_id UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
  user_score NUMERIC(5,2) NOT NULL,
  star_rating INT NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
  preference TEXT NOT NULL CHECK (preference IN ('new_better', 'old_better', 'blend_needed', 'both_bad')),
  user_notes TEXT NOT NULL DEFAULT '',
  needs_optimization BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  prompt_version_id UUID REFERENCES prompt_versions(id) ON DELETE SET NULL,
  original_prompt TEXT NOT NULL,
  optimized_prompt TEXT NOT NULL,
  target_model_id TEXT NOT NULL,
  external_score NUMERIC(5,2),
  system_score NUMERIC(5,2) NOT NULL,
  pass BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS model_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL UNIQUE,
  target_model_id TEXT NOT NULL,
  generator_model_ids TEXT[] NOT NULL DEFAULT '{}',
  evaluator_model_ids TEXT[] NOT NULL DEFAULT '{}',
  image_judge_model_ids TEXT[] NOT NULL DEFAULT '{}',
  is_locked BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL CHECK (source IN ('auto', 'manual', 'imported')),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS test_run_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  test_run_id UUID NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
  image_role TEXT NOT NULL CHECK (image_role IN ('reference', 'generated', 'thumbnail', 'other')),
  original_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes BIGINT NOT NULL CHECK (size_bytes <= 15728640),
  sha256 TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_ref TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dataset_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_path TEXT NOT NULL,
  item_count INT NOT NULL,
  privacy_findings JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quality_gate_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_version_id UUID REFERENCES prompt_versions(id) ON DELETE CASCADE,
  total_score NUMERIC(5,2) NOT NULL,
  intent_fidelity NUMERIC(4,2) NOT NULL,
  hallucination_resistance NUMERIC(4,2) NOT NULL,
  pass BOOLEAN NOT NULL,
  needs_review BOOLEAN NOT NULL DEFAULT false,
  failed_dimensions TEXT[] NOT NULL DEFAULT '{}',
  deductions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
