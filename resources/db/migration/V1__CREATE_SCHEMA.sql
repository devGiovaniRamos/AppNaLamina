CREATE TABLE tenant (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

nome VARCHAR(100) NOT NULL,

telefone VARCHAR(20),

cnpj VARCHAR(18) UNIQUE,

email VARCHAR(100) NOT NULL UNIQUE,

ativo BOOLEAN NOT NULL DEFAULT TRUE,

criado_em TIMESTAMP NOT NULL DEFAULT NOW());



CREATE TABLE usuario (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,

nome VARCHAR(100) NOT NULL,

email VARCHAR(100) NOT NULL,

senha_hash VARCHAR(255) NOT NULL,

telefone VARCHAR(20),

role VARCHAR(20) NOT NULL DEFAULT 'CLIENTE',

ativo BOOLEAN NOT NULL DEFAULT TRUE,

criado_em TIMESTAMP NOT NULL DEFAULT NOW(),

UNIQUE(tenant_id, email));



CREATE TABLE profissional (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,

usuario_id UUID REFERENCES usuario(id) ON DELETE SET NULL,

nome VARCHAR(100) NOT NULL,

foto_url VARCHAR(255),

ativo BOOLEAN NOT NULL DEFAULT TRUE,

criado_em TIMESTAMP NOT NULL DEFAULT NOW());





CREATE TABLE servico (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,

nome VARCHAR(100) NOT NULL,

descricao TEXT,

duracao_min INTEGER NOT NULL,

preco DECIMAL(10,2) NOT NULL,

ativo BOOLEAN NOT NULL DEFAULT TRUE,

criado_em TIMESTAMP NOT NULL DEFAULT NOW(),

atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()

);



CREATE TABLE agendamento (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,

cliente_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,

profissional_id UUID NOT NULL REFERENCES profissional(id) ON DELETE CASCADE,

servico_id UUID NOT NULL REFERENCES servico(id) ON DELETE CASCADE,

data DATE NOT NULL,

hora_inicio TIME NOT NULL,

hora_fim TIME NOT NULL,

status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',

observacao TEXT,

criado_em TIMESTAMP NOT NULL DEFAULT NOW());



CREATE TABLE pagamento (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

agendamento_id UUID NOT NULL REFERENCES agendamento(id) ON DELETE CASCADE,

usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,

valor DECIMAL(10,2) NOT NULL,

metodo VARCHAR(30) NOT NULL,

status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',

pagarme_id VARCHAR(100) UNIQUE,

pix_qrcode TEXT,

pago_em TIMESTAMP,

criado_em TIMESTAMP NOT NULL DEFAULT NOW(),

atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()

);



CREATE TABLE plano_assinatura (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,

nome VARCHAR(100) NOT NULL,

descricao TEXT,

preco_mensal DECIMAL(10,2) NOT NULL,

max_agendamentos INTEGER,

ativo BOOLEAN NOT NULL DEFAULT TRUE,

criado_em TIMESTAMP NOT NULL DEFAULT NOW(),

atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()

);





CREATE TABLE assinatura_cliente (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,

plano_id UUID NOT NULL REFERENCES plano_assinatura(id) ON DELETE CASCADE,

status VARCHAR(20) NOT NULL DEFAULT 'ATIVA',

pagarme_subscription_id VARCHAR(100) UNIQUE,

inicio DATE NOT NULL,

fim DATE,

criado_em TIMESTAMP NOT NULL DEFAULT NOW(),

atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()

);



CREATE TABLE cupom (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,

codigo VARCHAR(50) NOT NULL,

tipo VARCHAR(20) NOT NULL,

valor DECIMAL(10,2) NOT NULL,

uso_maximo INTEGER,

uso_atual INTEGER NOT NULL DEFAULT 0,

validade DATE,

ativo BOOLEAN NOT NULL DEFAULT TRUE,

criado_em TIMESTAMP NOT NULL DEFAULT NOW(),

UNIQUE(tenant_id, codigo)

);



CREATE TABLE cupom_uso (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

cupom_id UUID NOT NULL REFERENCES cupom(id) ON DELETE CASCADE,

usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,

agendamento_id UUID NOT NULL REFERENCES agendamento(id) ON DELETE CASCADE,

usado_em TIMESTAMP NOT NULL DEFAULT NOW(),

UNIQUE(cupom_id, usuario_id)

);





CREATE TABLE pontuacao (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,

tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,

pontos_total INTEGER NOT NULL DEFAULT 0,

nivel INTEGER NOT NULL DEFAULT 1,

atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),

UNIQUE(usuario_id, tenant_id)

);





CREATE TABLE pontuacao_historico (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,

agendamento_id UUID REFERENCES agendamento(id) ON DELETE SET NULL,

pontos INTEGER NOT NULL,

motivo VARCHAR(100) NOT NULL,

criado_em TIMESTAMP NOT NULL DEFAULT NOW()

);





CREATE TABLE notificacao (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,

agendamento_id UUID REFERENCES agendamento(id) ON DELETE SET NULL,

tipo VARCHAR(50) NOT NULL,

titulo VARCHAR(100) NOT NULL,

mensagem TEXT NOT NULL,

status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',

agendada_para TIMESTAMP NOT NULL,

enviada_em TIMESTAMP,

criado_em TIMESTAMP NOT NULL DEFAULT NOW()

);



-- ÍNDICES

-- ============================================================

CREATE INDEX idx_usuario_tenant ON usuario(tenant_id);

CREATE INDEX idx_profissional_tenant ON profissional(tenant_id);

CREATE INDEX idx_servico_tenant ON servico(tenant_id);

CREATE INDEX idx_agendamento_tenant ON agendamento(tenant_id);

CREATE INDEX idx_agendamento_cliente ON agendamento(cliente_id);

CREATE INDEX idx_agendamento_data ON agendamento(data);

CREATE INDEX idx_pagamento_status ON pagamento(status);

CREATE INDEX idx_notificacao_status ON notificacao(status);

CREATE INDEX idx_notificacao_agendada ON notificacao(agendada_para);