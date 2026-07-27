package com.nalamina.api.controller;

import com.nalamina.api.dto.agendamento.AgendamentoBuscaPublicaResponse;
import com.nalamina.api.dto.agendamento.AgendamentoPublicoResponse;
import com.nalamina.api.dto.agendamento.AgendamentoRequest;
import com.nalamina.api.dto.agendamento.AgendamentoResponse;
import com.nalamina.api.dto.agendamento.CancelamentoPublicoRequest;
import com.nalamina.api.dto.agendamento.PublicAgendamentoRequest;
import com.nalamina.api.dto.agendamento.SlotDisponivel;
import com.nalamina.api.dto.campeonato.CampeonatoResponse;
import com.nalamina.api.dto.campeonato.RankingPublicoItemResponse;
import com.nalamina.api.dto.pagamento.PagamentoResponse;
import com.nalamina.api.dto.servico.ServicoResponse;
import com.nalamina.api.dto.tenant.BarbeariaPublicaResponse;
import com.nalamina.api.entity.TenantEntity;
import com.nalamina.api.repository.ServicoRepository;
import com.nalamina.api.repository.TenantRepository;
import com.nalamina.api.service.AgendamentoService;
import com.nalamina.api.service.CampeonatoService;
import com.nalamina.api.service.PagamentoService;
import com.nalamina.api.service.SlotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.nalamina.api.dto.profissional.ProfissionalResponse;
import com.nalamina.api.repository.ProfissionalRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/public/{slug}")
@RequiredArgsConstructor
public class PublicController {

    private final ServicoRepository servicoRepository;
    private final SlotService slotService;
    private final AgendamentoService agendamentoService;
    private final PagamentoService pagamentoService;
    private final ProfissionalRepository profissionalRepository;
    private final TenantRepository tenantRepository;
    private final CampeonatoService campeonatoService;

    private UUID resolverTenantId(String slug) {
        return resolverTenant(slug).getId();
    }

    private TenantEntity resolverTenant(String slug) {
        return tenantRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbearia não encontrada"));
    }

    @GetMapping("/barbearia")
    public ResponseEntity<BarbeariaPublicaResponse> barbearia(@PathVariable String slug) {
        TenantEntity tenant = resolverTenant(slug);
        return ResponseEntity.ok(BarbeariaPublicaResponse.builder()
                .nome(tenant.getNome())
                .telefone(tenant.getTelefone())
                .endereco(tenant.getEndereco())
                .descricao(tenant.getDescricao())
                .mensagemBoasVindas(tenant.getMensagemBoasVindas())
                .sinalObrigatorio(tenant.getSinalObrigatorio())
                .sinalPercentual(tenant.getSinalPercentual())
                .janelaCancelamentoHoras(tenant.getJanelaCancelamentoHoras())
                .build());
    }

    @GetMapping("/servicos")
    public ResponseEntity<List<ServicoResponse>> listarServicos(@PathVariable String slug) {
        UUID tenantId = resolverTenantId(slug);
        List<ServicoResponse> servicos = servicoRepository
                .findByTenantEntity_IdAndAtivoTrue(tenantId)
                .stream()
                .map(s -> ServicoResponse.builder()
                        .id(s.getId())
                        .nome(s.getNome())
                        .descricao(s.getDescricao())
                        .duracaoMin(s.getDuracaoMin())
                        .preco(s.getPreco())
                        .ativo(s.getAtivo())
                        .build())
                .toList();
        return ResponseEntity.ok(servicos);
    }

    @GetMapping("/slots")
    public ResponseEntity<List<SlotDisponivel>> listarSlots(
            @PathVariable String slug,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam UUID servicoId) {
        UUID tenantId = resolverTenantId(slug);
        return ResponseEntity.ok(slotService.listarSlots(tenantId, data, servicoId));
    }

    @PostMapping("/agendamentos")
    public ResponseEntity<AgendamentoPublicoResponse> criar(
            @PathVariable String slug,
            @Valid @RequestBody PublicAgendamentoRequest request) {

        TenantEntity tenant = resolverTenant(slug);
        UUID tenantId = tenant.getId();

        if (Boolean.TRUE.equals(tenant.getSinalObrigatorio()) && request.getMetodoSinal() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Forma de pagamento do sinal é obrigatória");
        }

        AgendamentoRequest agendamentoRequest = new AgendamentoRequest();
        agendamentoRequest.setClienteNome(request.getClienteNome());
        agendamentoRequest.setClienteTel(request.getClienteTel());
        agendamentoRequest.setServicoIds(List.of(request.getServicoId()));
        agendamentoRequest.setProfissionalId(request.getProfissionalId());
        agendamentoRequest.setData(request.getData());
        agendamentoRequest.setHoraInicio(request.getHoraInicio());
        agendamentoRequest.setHoraFim(request.getHoraFim());
        agendamentoRequest.setObservacao(request.getObservacao());

        AgendamentoResponse agendamento = agendamentoService.criarPublico(tenantId, agendamentoRequest);

        PagamentoResponse sinal = null;
        if (Boolean.TRUE.equals(tenant.getSinalObrigatorio())) {
            sinal = pagamentoService.registrarSinal(tenantId, agendamento.getId(), request.getMetodoSinal());
        }

        return ResponseEntity.status(201).body(AgendamentoPublicoResponse.builder()
                .agendamento(agendamento)
                .sinal(sinal)
                .build());
    }

    @GetMapping("/agendamentos")
    public ResponseEntity<List<AgendamentoBuscaPublicaResponse>> buscarPorTelefone(
            @PathVariable String slug,
            @RequestParam String telefone) {
        UUID tenantId = resolverTenantId(slug);
        return ResponseEntity.ok(agendamentoService.buscarPorTelefone(tenantId, telefone));
    }

    @PostMapping("/agendamentos/{id}/cancelar")
    public ResponseEntity<Void> cancelar(
            @PathVariable String slug,
            @PathVariable UUID id,
            @Valid @RequestBody CancelamentoPublicoRequest request) {
        UUID tenantId = resolverTenantId(slug);
        agendamentoService.cancelarPublico(tenantId, id, request.getTelefone());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/profissionais")
    public ResponseEntity<List<ProfissionalResponse>> listarProfissionais(@PathVariable String slug) {
        UUID tenantId = resolverTenantId(slug);
        List<ProfissionalResponse> profissionais = profissionalRepository
                .findByTenantEntity_IdAndAtivoTrue(tenantId)
                .stream()
                .map(p -> ProfissionalResponse.builder()
                        .id(p.getId())
                        .nome(p.getNome())
                        .fotoUrl(p.getFotoUrl())
                        .ativo(p.getAtivo())
                        .build())
                .toList();
        return ResponseEntity.ok(profissionais);
    }

    @GetMapping("/campeonato")
    public ResponseEntity<CampeonatoResponse> campeonatoAtivo(@PathVariable String slug) {
        UUID tenantId = resolverTenantId(slug);
        return ResponseEntity.ok(campeonatoService.buscarAtivoPublico(tenantId));
    }

    @GetMapping("/ranking")
    public ResponseEntity<List<RankingPublicoItemResponse>> ranking(@PathVariable String slug) {
        UUID tenantId = resolverTenantId(slug);
        return ResponseEntity.ok(campeonatoService.rankingPublico(tenantId));
    }
}