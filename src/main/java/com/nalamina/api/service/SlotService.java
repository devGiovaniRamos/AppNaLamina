package com.nalamina.api.service;

import com.nalamina.api.dto.agendamento.SlotDisponivel;
import com.nalamina.api.entity.AgendamentoEntity;
import com.nalamina.api.entity.HorarioFuncionamentoEntity;
import com.nalamina.api.entity.enums.StatusAgendamento;
import com.nalamina.api.repository.AgendamentoRepository;
import com.nalamina.api.repository.HorarioFuncionamentoRepository;
import com.nalamina.api.repository.ServicoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SlotService {

    private final HorarioFuncionamentoRepository horarioRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final ServicoRepository servicoRepository;

    public List<SlotDisponivel> listarSlots(UUID tenantId, LocalDate data, UUID servicoId) {

        // 1. Busca duração do serviço
        int duracaoMin = servicoRepository
                .findByIdAndTenantEntity_Id(servicoId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado"))
                .getDuracaoMin();

        // 2. Converte DayOfWeek para 0=domingo ... 6=sábado
        int diaSemana = data.getDayOfWeek().getValue() % 7;

        // 3. Busca horário de funcionamento do dia
        HorarioFuncionamentoEntity horario = horarioRepository
                .findByTenantEntity_IdAndDiaSemana(tenantId, diaSemana)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Horário de funcionamento não configurado"));

        if (!horario.getAberto()) {
            return List.of();
        }

        // 4. Busca agendamentos ativos do dia
        List<AgendamentoEntity> agendamentos = agendamentoRepository
                .findAgendamentosAtivos(tenantId, data, StatusAgendamento.CANCELADO);

        // 5. Gera slots para turno 1 e turno 2
        List<SlotDisponivel> slots = new ArrayList<>();

        if (horario.getHoraInicio1() != null && horario.getHoraFim1() != null) {
            slots.addAll(gerarSlots(
                    horario.getHoraInicio1(),
                    horario.getHoraFim1(),
                    duracaoMin,
                    agendamentos));
        }

        if (horario.getHoraInicio2() != null && horario.getHoraFim2() != null) {
            slots.addAll(gerarSlots(
                    horario.getHoraInicio2(),
                    horario.getHoraFim2(),
                    duracaoMin,
                    agendamentos));
        }

        return slots;
    }

    private List<SlotDisponivel> gerarSlots(
            LocalTime inicio,
            LocalTime fim,
            int duracaoMin,
            List<AgendamentoEntity> agendamentos) {

        List<SlotDisponivel> slots = new ArrayList<>();
        LocalTime cursor = inicio;

        while (!cursor.plusMinutes(duracaoMin).isAfter(fim)) {
            LocalTime slotFim = cursor.plusMinutes(duracaoMin);

            if (!temConflito(cursor, slotFim, agendamentos)) {
                slots.add(SlotDisponivel.builder()
                        .horaInicio(cursor)
                        .horaFim(slotFim)
                        .build());
            }

            cursor = cursor.plusMinutes(duracaoMin);
        }

        return slots;
    }

    private boolean temConflito(
            LocalTime inicio,
            LocalTime fim,
            List<AgendamentoEntity> agendamentos) {

        return agendamentos.stream().anyMatch(a ->
                inicio.isBefore(a.getHoraFim()) && fim.isAfter(a.getHoraInicio())
        );
    }
}