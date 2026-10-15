import { Package, Users, Container, MessageSquare, Settings2, FileText, UserCog, Wrench, ClipboardList, type LucideIcon } from "lucide-react";

export type Secao = {
  slug: string;
  nome: string;
  descricao: string;
  icone: LucideIcon;
  colunas: string[];
  exemplos: string[][];
};

// Dados de exemplo — serão substituídos pelo back-end.
export const secoes: Secao[] = [
  { slug: "carga", nome: "Carga", descricao: "Cadastro e consulta de cargas.", icone: Package, colunas: ["Código", "Descrição", "Peso", "Volume", "Tipo de carga", "Origem", "Destino"], exemplos: [] },
  { slug: "cliente", nome: "Cliente", descricao: "Clientes cadastrados.", icone: Users, colunas: ["Nome", "E-mail", "Telefone"], exemplos: [["Logística Atlântica", "contato@atlantica.com", "(13) 99999-0000"]] },
  { slug: "conteiner", nome: "Contêiner", descricao: "Contêineres em operação.", icone: Container, colunas: ["Número", "Tipo", "Porto", "Situação"], exemplos: [["MSCU1234567", "40' HC", "Santos", "Em carregamento"]] },
  { slug: "mensagens", nome: "Mensagens", descricao: "Mensagens recebidas pelo Fale conosco.", icone: MessageSquare, colunas: [], exemplos: [] },
  { slug: "operacao", nome: "Operação", descricao: "Operações em andamento.", icone: Settings2, colunas: ["Operação", "Navio", "Data", "Status"], exemplos: [["OP-118", "MSC Aurora", "08/10/2026", "Agendada"]] },
  { slug: "orcamento", nome: "Orçamento", descricao: "Crie e envie orçamentos por cliente.", icone: FileText, colunas: [], exemplos: [] },
  { slug: "usuario", nome: "Usuário", descricao: "Área administrativa de usuários.", icone: UserCog, colunas: ["Nome", "E-mail", "Perfil"], exemplos: [["Administrador", "admin@techocean.com", "Admin"]] },
  { slug: "servico", nome: "Serviço", descricao: "Serviços oferecidos.", icone: Wrench, colunas: ["Serviço", "Descrição"], exemplos: [["Consultoria operacional", "Planejamento de amarração"]] },
  { slug: "solicitacao", nome: "Solicitação", descricao: "Solicitações e agendamentos recebidos.", icone: ClipboardList, colunas: ["Cliente", "Data", "Tipo", "Status"], exemplos: [["Logística Atlântica", "10/10/2026", "Visita", "Pendente"]] },
];
