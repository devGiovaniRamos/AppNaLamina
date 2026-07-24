-- Produtos de estoque (revenda, uso interno ou ambos)
CREATE TABLE produto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    categoria VARCHAR(20) NOT NULL,
    tipo_uso VARCHAR(20) NOT NULL,
    unidade_medida VARCHAR(10) NOT NULL,
    estoque_atual DECIMAL(10,2) NOT NULL DEFAULT 0,
    estoque_minimo DECIMAL(10,2) NOT NULL DEFAULT 0,
    preco_venda DECIMAL(10,2),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_produto_tenant ON produto(tenant_id);

-- Histórico de entradas/saídas de estoque
CREATE TABLE movimento_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID NOT NULL REFERENCES produto(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL,
    saldo_apos DECIMAL(10,2) NOT NULL,
    observacao TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movimento_estoque_produto ON movimento_estoque(produto_id);
CREATE INDEX idx_movimento_estoque_criado_em ON movimento_estoque(criado_em);
