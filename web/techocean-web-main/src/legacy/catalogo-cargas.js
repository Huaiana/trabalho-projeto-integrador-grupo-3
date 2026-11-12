// Tipos de carga de referência. Os IDs (CRG-...) já existentes são mantidos.
export const catalogoCargas = [
  { tipoCarga: "Carga Geral", descricao: "Caixas, sacas ou pallets.", informacoes: "Eletrônicos, roupas e alimentos industrializados.", conteineres: ["Dry Box 20'", "Dry Box 40'"] },
  { tipoCarga: "Granéis Sólidos", descricao: "Mercadorias não embaladas, movimentadas em grandes quantidades.", informacoes: "Soja, milho, minério de ferro e fertilizantes.", conteineres: ["Dry Box 20'", "Dry Box 40'"] },
  { tipoCarga: "Granéis Líquidos", descricao: "Substâncias fluídas.", informacoes: "Petróleo, combustíveis, óleos vegetais e produtos químicos, transportados por tubulações.", conteineres: ["Isotank 20'"] },
  { tipoCarga: "Carga Conteinerizada", descricao: "Mercadorias dentro de contêineres padronizados, otimizando o transporte de produtos variados, de peças a bens de consumo.", informacoes: "", conteineres: ["Dry Box 20'", "Dry Box 40'", "High Cube (HC) 40'", "Reefer 20'", "Reefer 40' HC", "Open Top 20'", "Open Top 40'", "Flat Rack 20'", "Flat Rack 40'"] },
];

// Nomes antigos substituídos pelos quatro tipos acima.
export const cargasAntigas = ["Cargas secas gerais", "Caixas", "Paletes", "Sacarias", "Cargas secas volumosas e leves", "Cargas muito altas ou leves que exigem mais volume", "Cargas refrigeradas ou congeladas", "Frutas", "Carnes", "Grandes volumes de cargas perecíveis", "Cargas farmacêuticas", "Cargas altas carregadas por cima com guindastes", "Máquinas pesadas", "Equipamentos com excesso de altura", "Cargas pesadas e com excesso de largura ou altura", "Veículos pesados", "Barcos", "Turbinas", "Grandes estruturas", "Líquidos a granel", "Produtos químicos", "Óleos", "Gases"];
