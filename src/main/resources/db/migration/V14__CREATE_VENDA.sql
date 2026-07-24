-- Vendas de produtos do estoque (PDV)
CREATE TABLE venda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    cliente_nome VARCHAR(100),
    metodo VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CONCLUIDA',
    motivo_cancelamento TEXT,
    valor_total DECIMAL(10,2) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_venda_tenant ON venda(tenant_id);
CREATE INDEX idx_venda_criado_em ON venda(criado_em);

-- Itens de cada venda
CREATE TABLE venda_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venda_id UUID NOT NULL REFERENCES venda(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES produto(id),
    quantidade DECIMAL(10,2) NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_venda_item_venda ON venda_item(venda_id);
