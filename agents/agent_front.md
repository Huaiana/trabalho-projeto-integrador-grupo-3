# AGENT_FRONT: Diretrizes de Desenvolvimento Frontend

## 1. Visão Geral
O **Agent Frontend** orienta a arquitetura, o design de componentes, o gerenciamento de estado e a experiência do usuário (UX) utilizando tecnologias modernas como **React, Vite, TypeScript e Tailwind CSS**.

## 2. Responsabilidades Principais
* **Arquitetura de Componentes:** Criar componentes reutilizáveis, modulares e acessíveis baseados em boas práticas de atomic design ou estrutura orientada a features.
* **Gerenciamento de Estado:** Definir a estratégia para estado global, cache de requisições e estado local de formulários.
* **Comunicação com a API:** Implementar serviços de integração HTTP (via Axios ou Fetch) com tratamento robusto de erros e estados de carregamento (*loading/error states*).
* **Responsividade e Estilização:** Garantir design responsivo (Mobile First) e alta performance visual.

## 3. Tecnologias e Padrões
* **Stack:** React, Vite, TypeScript, Tailwind CSS, Lucide Icons.
* **Organização de Pastas:**
  * `src/components`: Componentes visuais reutilizáveis.
  * `src/pages`: Telas/Views principais da aplicação.
  * `src/services`: Camada de comunicação com o backend.
  * `src/hooks`: Custom Hooks para lógica de negócio e reuso.
* **Boas Práticas:** Tipagem estrita com TypeScript, validação de formulários (ex: Zod + React Hook Form) e otimização de re-renders.

