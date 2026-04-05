# ✂️ NaLâmina API

> Backend de uma plataforma SaaS multi-tenant para gestão de barbearias — agendamentos, profissionais, serviços e pagamentos em uma única API.

---

## 📋 Sumário

- [Sobre o Projeto](#-sobre-o-projeto)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Como Rodar](#-como-rodar)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Endpoints](#-endpoints)
    - [Autenticação](#autenticação)
    - [Barbearia](#barbearia)
    - [Horário de Funcionamento](#horário-de-funcionamento)
    - [Serviços](#serviços)
    - [Profissionais](#profissionais)
    - [Agendamentos](#agendamentos)
    - [Pagamentos](#pagamentos)
    - [Endpoints Públicos](#endpoints-públicos)
- [Fluxo de Agendamento](#-fluxo-de-agendamento)
- [Multi-tenancy](#-multi-tenancy)
- [Roadmap](#-roadmap)

---

## 💈 Sobre o Projeto

O **NaLâmina** é uma plataforma SaaS voltada para barbearias independentes. Cada barbearia é um **tenant** isolado — dados, configurações e agendamentos são completamente separados entre estabelecimentos.

O sistema possui dois fluxos principais:

- **App do admin (Flutter)** — o dono da barbearia gerencia serviços, profissionais, agendamentos e pagamentos
- **Página web pública** — o cliente acessa via link único da barbearia, escolhe o serviço, data e horário, e agenda sem precisar criar conta

---

## 🛠 Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Linguagem | Java 21 |
| Framework | Spring Boot 3 |
| Segurança | Spring Security + JWT |
| Persistência | Spring Data JPA / Hibernate |
| Banco de dados | PostgreSQL |
| Migrations | Flyway |
| Build | Maven |
| Hospedagem | Railway |

---

## 🏗 Arquitetura

```
src/
├── config/          # Configurações (Security, CORS)
├── controller/      # Controllers REST
├── dto/             # DTOs de request e response
│   ├── auth/
│   ├── agendamento/
│   ├── pagamento/
│   ├── profissional/
│   ├── servico/
│   └── tenant/
├── entity/          # Entidades JPA
│   └── enums/       # Enums do domínio
├── repository/      # Repositórios Spring Data
├── security/        # JWT, filtros, TenantContextHolder
└── service/         # Regras de negócio
```

### Isolamento multi-tenant

Todos os dados são isolados por `tenant_id`. O tenant é extraído do JWT em cada requisição autenticada via `TenantContextHolder` (ThreadLocal) e aplicado em todas as queries automaticamente.

```
Authorization: Bearer <jwt>     → extrai tenantId do token
X-Tenant-ID: <uuid>             → identifica a barbearia
```

---

## 🚀 Como Rodar

### Pré-requisitos

- Java 21+
- Maven
- PostgreSQL

### Passos

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/nalamina-api.git
cd nalamina-api

# Configure as variáveis de ambiente (veja a seção abaixo)

# Execute as migrations e suba a aplicação
./mvnw spring-boot:run
```

A API estará disponível em `http://localhost:8080`.

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `application.yml` ou configure as variáveis de ambiente:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/nalamina
    username: seu_usuario
    password: sua_senha
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect

jwt:
  secret: sua_chave_secreta_longa
  access-token-expiration: 900000      # 15 minutos
  refresh-token-expiration: 604800000  # 7 dias
```

---

## 📡 Endpoints

### Autenticação

Todos os endpoints de auth são públicos (sem token).

#### `POST /auth/registro`
Cria uma nova barbearia e o usuário administrador.

```json
// Request
{
  "nome": "João Silva",
  "email": "joao@barbearia.com",
  "senha": "senha123",
  "nomeBarbearia": "Barbearia do João"
}

// Response 201
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "role": "ADMIN",
  "nome": "João Silva"
}
```

#### `POST /auth/login`

```json
// Request
{
  "email": "joao@barbearia.com",
  "senha": "senha123"
}

// Response 200
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "role": "ADMIN",
  "nome": "João Silva"
}
```

#### `POST /auth/refresh`

```json
// Request
{
  "refreshToken": "eyJ..."
}

// Response 200
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "role": "ADMIN",
  "nome": "João Silva"
}
```

---

### Barbearia

> Requer autenticação. Headers: `Authorization: Bearer <token>` e `X-Tenant-ID: <uuid>`

#### `GET /barbearia`
Retorna os dados da barbearia do tenant autenticado.

#### `PUT /barbearia/perfil`
Atualiza nome, telefone, CNPJ, email, endereço e descrição.

```json
{
  "nome": "Barbearia do João",
  "telefone": "21999990000",
  "cnpj": "00.000.000/0001-00",
  "email": "joao@barbearia.com",
  "endereco": "Rua das Flores, 100",
  "descricao": "A melhor barbearia do bairro"
}
```

---

### Horário de Funcionamento

#### `PUT /barbearia/horario`
Atualiza o horário de um dia específico. Suporta até dois turnos por dia.

```json
{
  "diaSemana": 1,
  "aberto": true,
  "horaInicio1": "09:00",
  "horaFim1": "12:00",
  "horaInicio2": "13:00",
  "horaFim2": "18:00"
}
```

> `diaSemana`: 0 = domingo, 1 = segunda … 6 = sábado

#### `PUT /barbearia/horario/todos`
Aplica o mesmo horário para todos os dias da semana.

```json
{
  "aberto": true,
  "horaInicio1": "09:00",
  "horaFim1": "18:00",
  "horaInicio2": null,
  "horaFim2": null
}
```

---

### Serviços

#### `GET /servicos`
Lista todos os serviços ativos da barbearia.

#### `POST /servicos`

```json
{
  "nome": "Corte simples",
  "descricao": "Corte na tesoura ou máquina",
  "duracaoMin": 30,
  "preco": 35.00
}
```

#### `PUT /servicos/{id}`
Atualiza um serviço. Body igual ao POST.

#### `DELETE /servicos/{id}`
Soft delete — desativa o serviço (não remove do banco).

---

### Profissionais

#### `GET /profissionais`
Lista todos os profissionais ativos da barbearia.

#### `POST /profissionais`

```json
{
  "nome": "Carlos Barbeiro",
  "fotoUrl": "https://..."
}
```

#### `PUT /profissionais/{id}`
Atualiza um profissional. Body igual ao POST.

#### `DELETE /profissionais/{id}`
Soft delete — desativa o profissional.

---

### Agendamentos

#### `GET /agendamentos`
Lista todos os agendamentos do tenant, ordenados por data e hora.

**Response**
```json
[
  {
    "id": "uuid",
    "servicoId": "uuid",
    "servicoNome": "Corte simples",
    "profissionalId": "uuid",
    "profissionalNome": "Carlos Barbeiro",
    "clienteNome": "João Silva",
    "clienteTel": "21999990000",
    "data": "2026-04-10",
    "horaInicio": "09:00",
    "horaFim": "09:30",
    "status": "PENDENTE",
    "observacao": null,
    "criadoEm": "2026-04-03T10:00:00"
  }
]
```

#### `POST /agendamentos`
Cria um agendamento pelo admin. Profissional é opcional. Se informado, valida conflito de horário.

```json
{
  "servicoId": "uuid",
  "profissionalId": null,
  "clienteNome": "João Silva",
  "clienteTel": "21999990000",
  "data": "2026-04-10",
  "horaInicio": "09:00",
  "horaFim": "09:30",
  "observacao": null
}
```

| Status | Situação |
|--------|----------|
| 201 | Criado com sucesso |
| 400 | `horaFim` antes ou igual ao `horaInicio` |
| 404 | Serviço ou profissional não encontrado |
| 409 | Conflito de horário com o profissional |

#### `PUT /agendamentos/{id}`
Atualiza um agendamento. Body igual ao POST.

#### `PATCH /agendamentos/{id}/status`
Atualiza apenas o status do agendamento.

```json
{
  "status": "CONFIRMADO"
}
```

> Status disponíveis: `PENDENTE` `CONFIRMADO` `CONCLUIDO` `CANCELADO`

#### `DELETE /agendamentos/{id}`
Cancela o agendamento (define status como `CANCELADO`). Retorna `204`.

---

### Pagamentos

#### `POST /agendamentos/{agendamentoId}/pagamentos`
Registra o pagamento de um agendamento. Calcula automaticamente a taxa percentual configurada na barbearia. Marca o agendamento como `CONCLUIDO`.

```json
// Request
{
  "metodo": "PIX"
}

// Response 201
{
  "id": "uuid",
  "agendamentoId": "uuid",
  "clienteNome": "João Silva",
  "servicoNome": "Corte simples",
  "valorServico": 35.00,
  "taxaPct": 10.00,
  "valorTaxa": 3.50,
  "valorTotal": 38.50,
  "metodo": "PIX",
  "status": "PAGO",
  "pagoEm": "2026-04-10T10:30:00",
  "criadoEm": "2026-04-10T10:30:00"
}
```

> Métodos disponíveis: `DINHEIRO` `PIX` `CARTAO_CREDITO` `CARTAO_DEBITO`

#### `GET /agendamentos/{agendamentoId}/pagamentos`
Retorna o pagamento de um agendamento.

---

### Endpoints Públicos

> Sem autenticação. Usados pela página web de agendamento do cliente.

#### `GET /public/{tenantId}/servicos`
Lista os serviços ativos da barbearia.

#### `GET /public/{tenantId}/profissionais`
Lista os profissionais ativos da barbearia.

#### `GET /public/{tenantId}/slots?data=2026-04-10&servicoId={uuid}`
Retorna os horários disponíveis para agendamento. Os slots são gerados automaticamente com base no horário de funcionamento e nos agendamentos já existentes. Retorna lista vazia se a barbearia estiver fechada no dia.

```json
[
  { "horaInicio": "09:00", "horaFim": "09:30" },
  { "horaInicio": "09:30", "horaFim": "10:00" },
  { "horaInicio": "10:30", "horaFim": "11:00" }
]
```

#### `POST /public/{tenantId}/agendamentos`
Cria um agendamento como cliente anônimo.

```json
{
  "servicoId": "uuid",
  "profissionalId": null,
  "clienteNome": "João Silva",
  "clienteTel": "21999990000",
  "data": "2026-04-10",
  "horaInicio": "09:00",
  "horaFim": "09:30",
  "observacao": null
}
```

---

## 🔄 Fluxo de Agendamento

### Cliente via web
```
1. GET /public/{tenantId}/servicos       → escolhe o serviço
2. GET /public/{tenantId}/profissionais  → escolhe o profissional (opcional)
3. GET /public/{tenantId}/slots          → vê os horários disponíveis
4. POST /public/{tenantId}/agendamentos  → confirma o agendamento
```

### Admin via app
```
1. GET  /agendamentos                    → visualiza agenda do dia
2. POST /agendamentos                    → cria agendamento manualmente
3. PATCH /agendamentos/{id}/status       → confirma ou conclui
4. POST /agendamentos/{id}/pagamentos    → registra o pagamento
```

---

## 🏢 Multi-tenancy

Cada barbearia cadastrada recebe um `tenantId` (UUID) único. Todos os dados são isolados por esse ID — nenhum tenant consegue acessar dados de outro.

O isolamento é garantido em duas camadas:

1. **JWT** — o `tenantId` é embutido no token no momento do login
2. **Queries** — todos os repositórios filtram por `tenantId` via `TenantContextHolder`

O link público da barbearia segue o formato:
```
https://nalamina.com.br/agendar/{tenantId}
```

---

## 🗺 Roadmap

- [x] Autenticação JWT com refresh token
- [x] Multi-tenancy por tenant_id
- [x] Gestão de serviços e profissionais
- [x] Agendamentos com detecção de conflito
- [x] Slots disponíveis baseados no horário de funcionamento
- [x] Pagamentos com cálculo de taxa percentual
- [x] Endpoints públicos para agendamento sem login
- [ ] Integração Pagar.me (PIX gerado + webhook)
- [ ] Notificações push (Firebase FCM)
- [ ] Cupons de desconto
- [ ] Programa de pontuação / fidelidade
- [ ] Planos de assinatura para clientes
- [ ] App Flutter (admin)
- [ ] CI/CD com GitHub Actions