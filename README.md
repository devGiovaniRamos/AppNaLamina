# NaLâmina — Documentação da API

Base URL: `http://localhost:8080`

Todos os endpoints autenticados exigem dois headers:
- `Authorization: Bearer <jwt-token>`
- `X-Tenant-ID: <tenant-uuid>`

Endpoints públicos (`/public/**`) não exigem headers.

---

## Sumário

1. [Autenticação](#1-autenticação)
2. [Barbearia](#2-barbearia)
3. [Horário de Funcionamento](#3-horário-de-funcionamento)
4. [Serviços](#4-serviços)
5. [Profissionais](#5-profissionais)
6. [Agendamentos (Admin)](#6-agendamentos-admin)
7. [Agendamentos (Público)](#7-agendamentos-público)

---

## 1. Autenticação

### Registrar

`POST /auth/register`

**Body**
```json
{
  "nome": "João Silva",
  "email": "joao@barbearia.com",
  "senha": "senha123",
  "telefone": "21999990000",
  "role": "OWNER"
}
```

**Response 201**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

### Login

`POST /auth/login`

**Body**
```json
{
  "email": "joao@barbearia.com",
  "senha": "senha123"
}
```

**Response 200**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

### Renovar token

`POST /auth/refresh`

**Body**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response 200**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

## 2. Barbearia

> Requer autenticação. Role: `ADMIN`.

### Buscar dados da barbearia

`GET /barbearia`

**Response 200**
```json
{
  "id": "uuid",
  "nome": "Barbearia do João",
  "telefone": "21999990000",
  "cnpj": "00.000.000/0001-00",
  "email": "joao@barbearia.com",
  "ativo": true
}
```

---

### Atualizar dados da barbearia

`PUT /barbearia`

**Body**
```json
{
  "nome": "Barbearia do João",
  "telefone": "21999990000",
  "cnpj": "00.000.000/0001-00"
}
```

**Response 200** — mesmo formato do GET.

---

## 3. Horário de Funcionamento

> Requer autenticação. Role: `ADMIN`.

### Listar horários

`GET /barbearia/horario`

**Response 200**
```json
[
  {
    "diaSemana": 1,
    "aberto": true,
    "horaInicio1": "09:00",
    "horaFim1": "12:00",
    "horaInicio2": "14:00",
    "horaFim2": "18:00"
  },
  {
    "diaSemana": 0,
    "aberto": false,
    "horaInicio1": null,
    "horaFim1": null,
    "horaInicio2": null,
    "horaFim2": null
  }
]
```

> `diaSemana`: 0 = domingo, 1 = segunda … 6 = sábado.

---

### Atualizar horário de um dia

`PUT /barbearia/horario/{diaSemana}`

**Body**
```json
{
  "aberto": true,
  "horaInicio1": "09:00",
  "horaFim1": "12:00",
  "horaInicio2": "14:00",
  "horaFim2": "18:00"
}
```

**Response 200** — horário atualizado.

---

## 4. Serviços

> Requer autenticação. Role: `ADMIN`.

### Listar serviços ativos

`GET /servicos`

**Response 200**
```json
[
  {
    "id": "2d816465-0814-46a4-9436-2b538492c8f0",
    "nome": "Corte simples",
    "descricao": "Corte na tesoura ou máquina",
    "duracaoMin": 30,
    "preco": 35.00,
    "ativo": true
  }
]
```

---

### Criar serviço

`POST /servicos`

**Body**
```json
{
  "nome": "Corte simples",
  "descricao": "Corte na tesoura ou máquina",
  "duracaoMin": 30,
  "preco": 35.00
}
```

**Response 201** — serviço criado.

---

### Atualizar serviço

`PUT /servicos/{id}`

**Body** — mesmo formato do POST.

**Response 200** — serviço atualizado.

---

### Desativar serviço

`DELETE /servicos/{id}`

**Response 204**

---

## 5. Profissionais

> Requer autenticação. Role: `ADMIN`.

### Listar profissionais ativos

`GET /profissionais`

**Response 200**
```json
[
  {
    "id": "uuid",
    "nome": "Carlos Barbeiro",
    "fotoUrl": "https://...",
    "ativo": true
  }
]
```

---

### Criar profissional

`POST /profissionais`

**Body**
```json
{
  "nome": "Carlos Barbeiro",
  "fotoUrl": "https://..."
}
```

**Response 201** — profissional criado.

---

### Atualizar profissional

`PUT /profissionais/{id}`

**Body** — mesmo formato do POST.

**Response 200** — profissional atualizado.

---

### Desativar profissional

`DELETE /profissionais/{id}`

**Response 204**

---

## 6. Agendamentos (Admin)

> Requer autenticação. Role: `ADMIN`.

### Listar agendamentos

`GET /agendamentos`

Retorna todos os agendamentos do tenant ordenados por data e hora.

**Response 200**
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

---

### Criar agendamento

`POST /agendamentos`

**Body**
```json
{
  "servicoId": "2d816465-0814-46a4-9436-2b538492c8f0",
  "profissionalId": null,
  "clienteNome": "João Silva",
  "clienteTel": "21999990000",
  "data": "2026-04-10",
  "horaInicio": "09:00",
  "horaFim": "09:30",
  "observacao": null
}
```

> `profissionalId` é opcional. Se informado, valida conflito de horário.

**Respostas**
| Status | Situação |
|--------|----------|
| 201 | Agendamento criado |
| 400 | `horaFim` antes ou igual ao `horaInicio` |
| 404 | Serviço ou profissional não encontrado |
| 409 | Profissional já possui agendamento no horário |

---

### Atualizar agendamento

`PUT /agendamentos/{id}`

**Body** — mesmo formato do POST.

**Response 200** — agendamento atualizado.

---

### Atualizar status

`PATCH /agendamentos/{id}/status`

**Body**
```json
{
  "status": "CONFIRMADO"
}
```

> Status possíveis: `PENDENTE`, `CONFIRMADO`, `CONCLUIDO`, `CANCELADO`.

**Response 200** — agendamento com status atualizado.

---

### Cancelar agendamento

`DELETE /agendamentos/{id}`

Define o status como `CANCELADO`.

**Response 204**

---

## 7. Agendamentos (Público)

> Sem autenticação. Usado pelo cliente via web. O `tenantId` identifica a barbearia.

### Listar slots disponíveis

`GET /public/{tenantId}/slots?data=2026-04-10&servicoId=uuid`

Retorna os horários livres do dia baseado no horário de funcionamento da barbearia e nos agendamentos já existentes. Os slots são gerados automaticamente com base na `duracaoMin` do serviço.

**Parâmetros**
| Parâmetro | Tipo | Obrigatório |
|-----------|------|-------------|
| `data` | `yyyy-MM-dd` | Sim |
| `servicoId` | UUID | Sim |

**Response 200**
```json
[
  { "horaInicio": "09:00", "horaFim": "09:30" },
  { "horaInicio": "09:30", "horaFim": "10:00" },
  { "horaInicio": "10:30", "horaFim": "11:00" }
]
```

> Retorna lista vazia se a barbearia estiver fechada no dia.

---

### Criar agendamento (cliente anônimo)

`POST /public/{tenantId}/agendamentos`

**Body**
```json
{
  "servicoId": "2d816465-0814-46a4-9436-2b538492c8f0",
  "profissionalId": null,
  "clienteNome": "João Silva",
  "clienteTel": "21999990000",
  "data": "2026-04-10",
  "horaInicio": "09:00",
  "horaFim": "09:30",
  "observacao": null
}
```

> O frontend deve preencher `horaFim` automaticamente somando `horaInicio + duracaoMin` do serviço selecionado.

**Respostas**
| Status | Situação |
|--------|----------|
| 201 | Agendamento criado |
| 400 | Horário inválido |
| 404 | Barbearia ou serviço não encontrado |
| 409 | Conflito de horário com profissional |

---

## Notas para o Frontend

### Flutter (app do owner)
- Autenticar via `POST /auth/login` e armazenar `accessToken` + `refreshToken`
- Renovar token automaticamente via `POST /auth/refresh` quando receber 401
- Passar `X-Tenant-ID` em todas as requisições (obtido do payload do JWT)

### JavaScript (página pública do cliente)
1. Carregar serviços via `GET /servicos` (ou endpoint público equivalente)
2. Cliente seleciona serviço → armazenar `duracaoMin`
3. Cliente seleciona data → chamar `GET /public/{tenantId}/slots?data=...&servicoId=...`
4. Cliente seleciona slot → `horaInicio` e `horaFim` preenchidos automaticamente
5. Submeter via `POST /public/{tenantId}/agendamentos`

### Regras de negócio importantes
- Agendamentos cancelados não travam horário — slot volta a ficar disponível
- Profissional é sempre opcional no agendamento
- Barbearia fechada no dia → nenhum slot retornado
- Barbearia pode ter até dois turnos por dia (ex: 09:00–12:00 e 14:00–18:00)