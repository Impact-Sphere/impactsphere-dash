-- Add generated search vector column for indexed full-text search on project fields
ALTER TABLE "project"
ADD COLUMN "searchVector" tsvector
GENERATED ALWAYS AS (
  to_tsvector('english',
    coalesce(title, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(category, '')
  )
) STORED;

-- GIN index for fast full-text lookups
CREATE INDEX "project_searchVector_idx"
ON "project"
USING GIN ("searchVector");
