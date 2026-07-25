ALTER TABLE produto ADD COLUMN IF NOT EXISTS sku VARCHAR(30);
ALTER TABLE produto ADD COLUMN IF NOT EXISTS ean VARCHAR(14);

-- Backfill de SKU para produtos já cadastrados sem SKU (sequência por tenant)
WITH numerados AS (
    SELECT id, 'PRD-' || LPAD((ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY criado_em))::text, 4, '0') AS novo_sku
    FROM produto
    WHERE sku IS NULL
)
UPDATE produto SET sku = numerados.novo_sku
FROM numerados
WHERE produto.id = numerados.id;

ALTER TABLE produto ALTER COLUMN sku SET NOT NULL;

ALTER TABLE produto ADD CONSTRAINT uq_produto_tenant_sku UNIQUE (tenant_id, sku);
ALTER TABLE produto ADD CONSTRAINT uq_produto_tenant_ean UNIQUE (tenant_id, ean);
