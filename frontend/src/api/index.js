import api from './client';

// Auth
export const login = (data) => api.post('/auth/login', data).then(r => r.data);
export const registro = (data) => api.post('/auth/registro', data).then(r => r.data);

// Barbearia
export const getBarbearia = () => api.get('/barbearia').then(r => r.data);
export const atualizarPerfil = (data) => api.put('/barbearia/perfil', data).then(r => r.data);
export const atualizarHorario = (data) => api.put('/barbearia/horario', data).then(r => r.data);
export const atualizarTodosHorarios = (data) => api.put('/barbearia/horario/todos', data).then(r => r.data);
export const conectarMercadoPago = () => api.get('/barbearia/mercadopago/conectar').then(r => r.data);
export const desconectarMercadoPago = () => api.delete('/barbearia/mercadopago/desconectar').then(r => r.data);

// Agendamentos
export const listarAgendamentos = () => api.get('/agendamentos').then(r => r.data);
export const criarAgendamento = (data) => api.post('/agendamentos', data).then(r => r.data);
export const atualizarAgendamento = (id, data) => api.put(`/agendamentos/${id}`, data).then(r => r.data);
export const atualizarStatus = (id, status) => api.patch(`/agendamentos/${id}/status`, { status }).then(r => r.data);
export const cancelarAgendamento = (id, motivo) => api.delete(`/agendamentos/${id}`, { data: { motivo } }).then(r => r.data);

// Serviços
export const listarServicos = () => api.get('/servicos').then(r => r.data);
export const criarServico = (data) => api.post('/servicos', data).then(r => r.data);
export const atualizarServico = (id, data) => api.put(`/servicos/${id}`, data).then(r => r.data);
export const desativarServico = (id) => api.delete(`/servicos/${id}`).then(r => r.data);

// Profissionais
export const listarProfissionais = () => api.get('/profissionais').then(r => r.data);
export const criarProfissional = (data) => api.post('/profissionais', data).then(r => r.data);
export const atualizarProfissional = (id, data) => api.put(`/profissionais/${id}`, data).then(r => r.data);
export const desativarProfissional = (id) => api.delete(`/profissionais/${id}`).then(r => r.data);

// Pagamentos
export const listarPagamentos = (params) => api.get('/pagamentos', { params }).then(r => r.data);
export const registrarPagamento = (agendamentoId, data) => api.post(`/agendamentos/${agendamentoId}/pagamentos`, data).then(r => r.data);
export const buscarPagamento = (agendamentoId) => api.get(`/agendamentos/${agendamentoId}/pagamentos`).then(r => r.data);

// Financeiro (visão unificada: agendamentos + vendas PDV + mensalidades)
export const listarFinanceiro = (params) => api.get('/financeiro', { params }).then(r => r.data);
export const relatorioFinanceiro = (params) => api.get('/financeiro/relatorio', { params }).then(r => r.data);

// Estoque (produtos)
export const listarProdutos = (q) => api.get('/produtos', { params: q ? { q } : {} }).then(r => r.data);
export const criarProduto = (data) => api.post('/produtos', data).then(r => r.data);
export const atualizarProduto = (id, data) => api.put(`/produtos/${id}`, data).then(r => r.data);
export const desativarProduto = (id) => api.delete(`/produtos/${id}`).then(r => r.data);
export const ajustarEstoque = (produtoId, data) => api.post(`/produtos/${produtoId}/estoque/ajuste`, data).then(r => r.data);
export const listarMovimentosEstoque = (params) => api.get('/estoque/movimentos', { params }).then(r => r.data);
export const relatorioEstoque = (params) => api.get('/estoque/relatorio', { params }).then(r => r.data);

// Vendas (PDV)
export const listarVendas = (params) => api.get('/vendas', { params }).then(r => r.data);
export const buscarVenda = (id) => api.get(`/vendas/${id}`).then(r => r.data);
export const criarVenda = (data) => api.post('/vendas', data).then(r => r.data);
export const cancelarVenda = (id, motivo) => api.delete(`/vendas/${id}`, { data: { motivo } }).then(r => r.data);

// Notificações (admin)
export const listarNotificacoes = () => api.get('/notificacoes').then(r => r.data);
export const contarNotificacoesNaoLidas = () => api.get('/notificacoes/contagem').then(r => r.data);
export const marcarNotificacaoLida = (id) => api.post(`/notificacoes/${id}/lida`).then(r => r.data);
export const marcarTodasNotificacoesLidas = () => api.post('/notificacoes/marcar-todas-lidas').then(r => r.data);

// Campeonato (gamificação)
export const iniciarCampeonato = (data) => api.post('/campeonatos', data).then(r => r.data);
export const buscarCampeonatoAtivo = () => api.get('/campeonatos/ativo').then(r => r.data);
export const listarCampeonatos = () => api.get('/campeonatos').then(r => r.data);
export const encerrarCampeonato = (id) => api.post(`/campeonatos/${id}/encerrar`).then(r => r.data);
export const rankingCampeonato = (id) => api.get(`/campeonatos/${id}/ranking`).then(r => r.data);

// Planos de assinatura
export const listarPlanos = () => api.get('/planos').then(r => r.data);
export const criarPlano = (data) => api.post('/planos', data).then(r => r.data);
export const atualizarPlano = (id, data) => api.put(`/planos/${id}`, data).then(r => r.data);
export const alternarAtivoPlano = (id, ativo) => api.patch(`/planos/${id}/ativo`, { ativo }).then(r => r.data);

// Assinaturas de clientes (admin)
export const listarAssinaturas = () => api.get('/assinaturas').then(r => r.data);
export const renovarAssinatura = (id) => api.post(`/assinaturas/${id}/renovar`).then(r => r.data);

// Fila de espera (admin)
export const listarFila = () => api.get('/fila').then(r => r.data);
export const entrarNaFilaAdmin = (data) => api.post('/fila', data).then(r => r.data);
export const chamarDaFila = (id) => api.post(`/fila/${id}/chamar`).then(r => r.data);
export const finalizarFila = (id) => api.post(`/fila/${id}/finalizar`).then(r => r.data);
export const removerDaFila = (id) => api.post(`/fila/${id}/remover`).then(r => r.data);
