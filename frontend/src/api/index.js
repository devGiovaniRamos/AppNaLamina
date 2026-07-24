import api from './client';

// Auth
export const login = (data) => api.post('/auth/login', data).then(r => r.data);
export const registro = (data) => api.post('/auth/registro', data).then(r => r.data);

// Barbearia
export const getBarbearia = () => api.get('/barbearia').then(r => r.data);
export const atualizarPerfil = (data) => api.put('/barbearia/perfil', data).then(r => r.data);
export const atualizarHorario = (data) => api.put('/barbearia/horario', data).then(r => r.data);
export const atualizarTodosHorarios = (data) => api.put('/barbearia/horario/todos', data).then(r => r.data);

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
export const relatorioPagamentos = (params) => api.get('/pagamentos/relatorio', { params }).then(r => r.data);
export const registrarPagamento = (agendamentoId, data) => api.post(`/agendamentos/${agendamentoId}/pagamentos`, data).then(r => r.data);
export const buscarPagamento = (agendamentoId) => api.get(`/agendamentos/${agendamentoId}/pagamentos`).then(r => r.data);

// Estoque (produtos)
export const listarProdutos = () => api.get('/produtos').then(r => r.data);
export const criarProduto = (data) => api.post('/produtos', data).then(r => r.data);
export const atualizarProduto = (id, data) => api.put(`/produtos/${id}`, data).then(r => r.data);
export const desativarProduto = (id) => api.delete(`/produtos/${id}`).then(r => r.data);
export const ajustarEstoque = (produtoId, data) => api.post(`/produtos/${produtoId}/estoque/ajuste`, data).then(r => r.data);
export const listarMovimentosEstoque = (params) => api.get('/estoque/movimentos', { params }).then(r => r.data);
export const relatorioEstoque = (params) => api.get('/estoque/relatorio', { params }).then(r => r.data);
