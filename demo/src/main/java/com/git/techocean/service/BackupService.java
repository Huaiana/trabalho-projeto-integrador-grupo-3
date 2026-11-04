package com.git.techocean.service;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.git.techocean.model.BackupRecord;
import com.git.techocean.model.Cliente;
import com.git.techocean.model.Mensagem;
import com.git.techocean.model.Operacao;
import com.git.techocean.model.Solicitacao;
import com.git.techocean.repository.BackupRecordRepository;
import com.git.techocean.repository.ClienteRepository;
import com.git.techocean.repository.MensagemRepository;
import com.git.techocean.repository.OperacaoRepository;
import com.git.techocean.repository.OrcamentoRepository;
import com.git.techocean.repository.SolicitacaoRepository;
import com.git.techocean.repository.UsuarioAdminRepository;

@Service
public class BackupService {

    private final ClienteRepository clienteRepository;
    private final OrcamentoRepository orcamentoRepository;
    private final SolicitacaoRepository solicitacaoRepository;
    private final OperacaoRepository operacaoRepository;
    private final MensagemRepository mensagemRepository;
    private final UsuarioAdminRepository usuarioAdminRepository;
    private final BackupRecordRepository backupRecords;

    public BackupService(ClienteRepository clienteRepository, 
                         OrcamentoRepository orcamentoRepository, 
                         SolicitacaoRepository solicitacaoRepository,
                         OperacaoRepository operacaoRepository, 
                         MensagemRepository mensagemRepository, 
                         UsuarioAdminRepository usuarioAdminRepository,
                         BackupRecordRepository backupRecords) {
        this.clienteRepository = clienteRepository;
        this.orcamentoRepository = orcamentoRepository;
        this.solicitacaoRepository = solicitacaoRepository;
        this.operacaoRepository = operacaoRepository;
        this.mensagemRepository = mensagemRepository;
        this.usuarioAdminRepository = usuarioAdminRepository;
        this.backupRecords = backupRecords;
    }

    // Backup automático agendado diariamente com horários distintos: meio-dia, 15:00 horas, 19:00 horas e meia-noite
    @Scheduled(cron = "0 0 0,12,15,19 * * *")
    public void executarBackupAutomatico() {
        gerarBackupAdministrativo(null);
    }

    // 1. Backup Administrativo Completo (Acesso exclusivo e total do Administrador)
    public BackupRecord gerarBackupAdministrativo(Long actorId) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
        String diretorioPath = "./backups/admin/";
        criarDiretorio(diretorioPath);

        try {
            List<Cliente> clientes = clienteRepository.findAll();
            var orcamentos = orcamentoRepository.findAll();
            List<Solicitacao> solicitacoes = solicitacaoRepository.findAll();
            List<Operacao> operacoes = operacaoRepository.findAll();
            List<Mensagem> mensagens = mensagemRepository.findAll();
            var administradores = usuarioAdminRepository.findAll();
            salvarEmFicheiro(diretorioPath + "clientes_" + timestamp + ".json", clientes.toString());
            salvarEmFicheiro(diretorioPath + "orcamentos_" + timestamp + ".json", orcamentos.toString());
            salvarEmFicheiro(diretorioPath + "solicitacoes_" + timestamp + ".json", solicitacoes.toString());
            salvarEmFicheiro(diretorioPath + "operacoes_" + timestamp + ".json", operacoes.toString());
            salvarEmFicheiro(diretorioPath + "mensagens_" + timestamp + ".json", mensagens.toString());
            salvarEmFicheiro(diretorioPath + "admins_" + timestamp + ".json", administradores.toString());
            return saveRecord("ADMINISTRATIVO", actorId, clientes.size(), orcamentos.size(), solicitacoes.size(),
                    operacoes.size(), mensagens.size(), administradores.size());
        } catch (IOException e) {
            throw backupError("administrativo", e);
        }
    }

    // 2. Backup Operacional (Acessível ao Funcionário e TAMBÉM ao Administrador)
    public BackupRecord gerarBackupOperacional(Long actorId) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
        String diretorioPath = "./backups/operacional/";
        criarDiretorio(diretorioPath);

        try {
            List<Cliente> clientes = clienteRepository.findAll();
            List<Solicitacao> solicitacoes = solicitacaoRepository.findAll();
            List<Operacao> operacoes = operacaoRepository.findAll();
            List<Mensagem> mensagens = mensagemRepository.findAll();

            salvarEmFicheiro(diretorioPath + "clientes_atendimento_" + timestamp + ".json", clientes.toString());
            salvarEmFicheiro(diretorioPath + "solicitacoes_atendimento_" + timestamp + ".json", solicitacoes.toString());
            salvarEmFicheiro(diretorioPath + "operacoes_andamento_" + timestamp + ".json", operacoes.toString());
            salvarEmFicheiro(diretorioPath + "mensagens_chat_" + timestamp + ".json", mensagens.toString());

            return saveRecord("OPERACIONAL", actorId, clientes.size(), 0, solicitacoes.size(),
                    operacoes.size(), mensagens.size(), 0);
        } catch (IOException e) {
            throw backupError("operacional", e);
        }
    }

    public List<BackupRecord> historico() {
        return backupRecords.findAll(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
    }

    @SuppressWarnings("null")
    private BackupRecord saveRecord(String type, Long actorId, int clientes, int orcamentos, int solicitacoes,
            int operacoes, int mensagens, int administradores) {
        BackupRecord record = new BackupRecord();
        record.setBackupCode("BKP-" + java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")
                .format(java.time.LocalDateTime.now()) + "-" + java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        record.setType(type);
        record.setActorId(actorId);
        usuarioAdminRepository.findById(java.util.Objects.requireNonNullElse(actorId, -1L)).ifPresent(actor -> {
            record.setActorName(actor.getNome());
            record.setActorRole(actor.getCargo());
        });
        record.setCreatedAt(Instant.now());
        record.setClientes(clientes);
        record.setOrcamentos(orcamentos);
        record.setSolicitacoes(solicitacoes);
        record.setOperacoes(operacoes);
        record.setMensagens(mensagens);
        record.setAdministradores(administradores);
        record.setTotalRegistros(clientes + orcamentos + solicitacoes + operacoes + mensagens + administradores);
        return backupRecords.save(record);
    }

    private ResponseStatusException backupError(String type, IOException cause) {
        return new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Erro ao gerar backup " + type + ": " + cause.getMessage(), cause);
    }

    private void criarDiretorio(String path) {
        File diretorio = new File(path);
        if (!diretorio.exists()) {
            diretorio.mkdirs();
        }
    }

    private void salvarEmFicheiro(String caminho, String conteudo) throws IOException {
        try (FileWriter writer = new FileWriter(caminho)) {
            writer.write(conteudo);
        }
    }
}