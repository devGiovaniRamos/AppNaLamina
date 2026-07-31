import api from './publicClient';

export const getBarbearia = (slug) => api.get(`/public/${slug}/barbearia`).then(r => r.data);
export const listarServicos = (slug) => api.get(`/public/${slug}/servicos`).then(r => r.data);
export const listarProfissionais = (slug) => api.get(`/public/${slug}/profissionais`).then(r => r.data);
export const listarSlots = (slug, data, servicoId) =>
  api.get(`/public/${slug}/slots`, { params: { data, servicoId } }).then(r => r.data);
export const criarAgendamento = (slug, data) => api.post(`/public/${slug}/agendamentos`, data).then(r => r.data);
export const identificarCliente = (slug, telefone) =>
  api.get(`/public/${slug}/cliente`, { params: { telefone } }).then(r => r.data);
export const listarPlanos = (slug) => api.get(`/public/${slug}/planos`).then(r => r.data);
export const assinaturaStatus = (slug, clienteTel) =>
  api.get(`/public/${slug}/assinatura-status`, { params: { clienteTel } }).then(r => r.data);
export const assinar = (slug, data) => api.post(`/public/${slug}/assinaturas`, data).then(r => r.data);
export const entrarNaFila = (slug, data) => api.post(`/public/${slug}/fila`, data).then(r => r.data);
export const statusFila = (slug, clienteTel) =>
  api.get(`/public/${slug}/fila/status`, { params: { clienteTel } }).then(r => r.data);
export const sairDaFila = (slug, id, clienteTel) =>
  api.delete(`/public/${slug}/fila/${id}`, { params: { clienteTel } }).then(r => r.data);
