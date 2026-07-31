package com.nalamina.api.controller;

import com.nalamina.api.dto.agendamento.AgendamentoRequest;
import com.nalamina.api.dto.agendamento.AgendamentoResponse;
import com.nalamina.api.dto.agendamento.PublicAgendamentoRequest;
import com.nalamina.api.dto.agendamento.SlotDisponivel;
import com.nalamina.api.dto.assinaturacliente.AssinarRequest;
import com.nalamina.api.dto.assinaturacliente.AssinaturaResponse;
import com.nalamina.api.dto.assinaturacliente.AssinaturaStatusPublicoResponse;
import com.nalamina.api.dto.campeonato.CampeonatoResponse;
import com.nalamina.api.dto.campeonato.RankingPublicoItemResponse;
import com.nalamina.api.dto.cliente.ClienteConhecidoResponse;
import com.nalamina.api.dto.fila.EntrarFilaRequest;
import com.nalamina.api.dto.fila.FilaTicketResponse;
import com.nalamina.api.dto.planoassinatura.PlanoAssinaturaResponse;
import com.nalamina.api.dto.servico.ServicoResponse;
import com.nalamina.api.dto.tenant.BarbeariaPublicaResponse;
import com.nalamina.api.entity.TenantEntity;
import com.nalamina.api.repository.ServicoRepository;
import com.nalamina.api.repository.TenantRepository;
import com.nalamina.api.service.AgendamentoService;
import com.nalamina.api.service.AssinaturaClienteService;
import com.nalamina.api.service.CampeonatoService;
import com.nalamina.api.service.ClientePublicoService;
import com.nalamina.api.service.FilaEsperaService;
import com.nalamina.api.service.PlanoAssinaturaService;
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
    private final ProfissionalRepository profissionalRepository;
    private final TenantRepository tenantRepository;
    private final CampeonatoService campeonatoService;
    private final PlanoAssinaturaService planoAssinaturaService;
    private final AssinaturaClienteService assinaturaClienteService;
    private final ClientePublicoService clientePublicoService;
    private final FilaEsperaService filaEsperaService;

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
                        .precoAgendamento(s.getPrecoAgendamento())
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
    public ResponseEntity<AgendamentoResponse> criar(
            @PathVariable String slug,
            @Valid @RequestBody PublicAgendamentoRequest request) {

        UUID tenantId = resolverTenantId(slug);

        AgendamentoRequest agendamentoRequest = new AgendamentoRequest();
        agendamentoRequest.setClienteNome(request.getClienteNome());
        agendamentoRequest.setClienteTel(request.getClienteTel());
        agendamentoRequest.setServicoIds(List.of(request.getServicoId()));
        agendamentoRequest.setProfissionalId(request.getProfissionalId());
        agendamentoRequest.setData(request.getData());
        agendamentoRequest.setHoraInicio(request.getHoraInicio());
        agendamentoRequest.setHoraFim(request.getHoraFim());
        agendamentoRequest.setObservacao(request.getObservacao());

        return ResponseEntity.status(201).body(agendamentoService.criarPublico(tenantId, agendamentoRequest));
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

    @GetMapping("/planos")
    public ResponseEntity<List<PlanoAssinaturaResponse>> planos(@PathVariable String slug) {
        UUID tenantId = resolverTenantId(slug);
        return ResponseEntity.ok(planoAssinaturaService.listarPublico(tenantId));
    }

    @GetMapping("/assinatura-status")
    public ResponseEntity<AssinaturaStatusPublicoResponse> assinaturaStatus(
            @PathVariable String slug,
            @RequestParam String clienteTel) {
        UUID tenantId = resolverTenantId(slug);
        return ResponseEntity.ok(assinaturaClienteService.statusPublico(tenantId, clienteTel));
    }

    @PostMapping("/assinaturas")
    public ResponseEntity<AssinaturaResponse> assinar(
            @PathVariable String slug,
            @Valid @RequestBody AssinarRequest request) {
        TenantEntity tenant = resolverTenant(slug);
        return ResponseEntity.status(201).body(assinaturaClienteService.assinar(tenant, request));
    }

    @GetMapping("/cliente")
    public ResponseEntity<ClienteConhecidoResponse> cliente(
            @PathVariable String slug,
            @RequestParam String telefone) {
        UUID tenantId = resolverTenantId(slug);
        return ResponseEntity.ok(clientePublicoService.identificar(tenantId, telefone));
    }

    @PostMapping("/fila")
    public ResponseEntity<FilaTicketResponse> entrarNaFila(
            @PathVariable String slug,
            @Valid @RequestBody EntrarFilaRequest request) {
        UUID tenantId = resolverTenantId(slug);
        return ResponseEntity.status(201).body(filaEsperaService.entrar(tenantId, request));
    }

    @GetMapping("/fila/status")
    public ResponseEntity<FilaTicketResponse> statusFila(
            @PathVariable String slug,
            @RequestParam String clienteTel) {
        UUID tenantId = resolverTenantId(slug);
        return ResponseEntity.ok(filaEsperaService.statusPublico(tenantId, clienteTel));
    }

    @DeleteMapping("/fila/{id}")
    public ResponseEntity<Void> sairDaFila(
            @PathVariable String slug,
            @PathVariable UUID id,
            @RequestParam String clienteTel) {
        UUID tenantId = resolverTenantId(slug);
        filaEsperaService.sairDaFila(tenantId, id, clienteTel);
        return ResponseEntity.noContent().build();
    }
}