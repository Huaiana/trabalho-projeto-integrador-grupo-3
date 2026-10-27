export type Cliente = {
  id: number;
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
};

export type NovoCliente = {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  senha: string;
};
