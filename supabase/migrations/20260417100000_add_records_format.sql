ALTER TABLE records
  ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT 'mxf';

ALTER TABLE records
  ADD CONSTRAINT records_format_check CHECK (format IN ('mxf', 'mp4'));
