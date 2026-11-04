package com.git.techocean.service;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.git.techocean.model.Cliente;
import com.git.techocean.model.Mensagem;
import com.git.techocean.model.Operacao;
import com.git.techocean.model.Solicitacao;
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

    public BackupService(ClienteRepository clienteRepository, 
                         OrcamentoRepository orcamentoRepository, 
                         SolicitacaoRepository solicitacaoRepository,
                         OperacaoRepository operacaoRepository, 
                         MensagemRepository mensagemRepository, 
                         UsuarioAdminRepository usuarioAdminRepository) {
        this.clienteRepository = clienteRepository;
        this.orcamentoRepository = orcamentoRepository;
        this.solicitacaoRepository = solicitacaoRepository;
        this.operacaoRepository = operacaoRepository;
        this.mensagemRepository = mensagemRepository;
        this.usuarioAdminRepository = usuarioAdminRepository;
    }

    // Backup automático agendado diariamente à meia-noite
    @Scheduled(cron = "0 0 0 * * *")
    public void executarBackupAutomatico() {
        gerarBackupAdministrativo();
    }

    // 1. Backup Administrativo Completo (Acesso exclusivo e total do Administrador)
    public String gerarBackupAdministrativo() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
        String diretorioPath = "./backups/admin/";
        criarDiretorio(diretorioPath);

        try {
            salvarEmFicheiro(diretorioPath + "clientes_" + timestamp + ".json", clienteRepository.findAll().toString());
            salvarEmFicheiro(diretorioPath + "orcamentos_" + timestamp + ".json", orcamentoRepository.findAll().toString());
            salvarEmFicheiro(diretorioPath + "solicitacoes_" + timestamp + ".json", solicitacaoRepository.findAll().toString());
            salvarEmFicheiro(diretorioPath + "operacoes_" + timestamp + ".json", operacaoRepository.findAll().toString());
            salvarEmFicheiro(diretorioPath + "mensagens_" + timestamp + ".json", mensagemRepository.findAll().toString());
            salvarEmFicheiro(diretorioPath + "admins_" + timestamp + ".json", usuarioAdminRepository.findAll().toString());

            return "Backup administrativo total gerado com sucesso em: " + timestamp;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao gerar backup administrativo: " + e.getMessage());
        }
    }

    // 2. Backup Operacional (Acessível ao Funcionário e TAMBÉM ao Administrador)
    public String gerarBackupOperacional() {
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

            return "Backup operacional (atendimento) gerado com sucesso em: " + timestamp;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao gerar backup operacional: " + e.getMessage());
        }
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