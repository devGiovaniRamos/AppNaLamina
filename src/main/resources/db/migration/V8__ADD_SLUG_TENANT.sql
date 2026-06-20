CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE tenant ADD COLUMN slug VARCHAR(100);

UPDATE tenant SET slug =
    LOWER(REGEXP_REPLACE(unaccent(nome), '[^a-zA-Z0-9]+', '-', 'g'))
    || '-' || SUBSTRING(id::text, 1, 8);

ALTER TABLE tenant ALTER COLUMN slug SET NOT NULL;
ALTER TABLE tenant ADD CONSTRAINT tenant_slug_key UNIQUE (slug);