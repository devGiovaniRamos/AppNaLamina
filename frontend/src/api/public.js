import api from './publicClient';

export const getBarbearia = (slug) => api.get(`/public/${slug}/barbearia`).then(r => r.data);
export const listarServicos = (slug) => api.get(`/public/${slug}/servicos`).then(r => r.data);
export const listarProfissionais = (slug) => api.get(`/public/${slug}/profissionais`).then(r => r.data);
export const listarSlots = (slug, data, servicoId) =>
  api.get(`/public/${slug}/slots`, { params: { data, servicoId } }).then(r => r.data);
export const criarAgendamento = (slug, data) => api.post(`/public/${slug}/agendamentos`, data).then(r => r.data);
export const buscarAgendamentosPorTelefone = (slug, telefone) =>
  api.get(`/public/${slug}/agendamentos`, { params: { telefone } }).then(r => r.data);
export const cancelarAgendamentoPublico = (slug, id, telefone) =>
  api.post(`/public/${slug}/agendamentos/${id}/cancelar`, { telefone }).then(r => r.data);
