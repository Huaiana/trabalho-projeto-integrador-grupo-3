export type UsuarioAdmin = {
  id: number;
  nome: string;
  email: string;
  cargo: string;
};

export type NovoUsuarioAdmin = Omit<UsuarioAdmin, "id"> & {
  senha: string;
};
