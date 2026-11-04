export type Carga = {
  id: number;
  descricao: string;
  peso: number;
  volume: number;
  tipoCarga: string;
  origem: string;
  destino: string;
};

export type NovaCarga = Omit<Carga, "id">;
