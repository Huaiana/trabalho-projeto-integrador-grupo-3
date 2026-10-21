# AGENT_FRONT: Diretrizes de Desenvolvimento Frontend

## 1. Visão Geral

O **Agent Frontend** orienta a arquitetura, a organização de componentes visuais, a manipulação do DOM e a experiência do usuário (UX) utilizando tecnologias nativas e fundamentais da web: **HTML5, CSS3 e JavaScript (Vanilla)**.

## 2. Responsabilidades Principais

* **Estruturação de Componentes e Páginas:** Criar estruturas HTML semânticas, modulares e acessíveis, garantindo a separação limpa entre conteúdo e layout.
* **Manipulação e Comportamento (DOM):** Implementar lógica interativa, manipulação dinâmica do DOM e escuta de eventos utilizando JavaScript moderno (ES6+).
* **Comunicação com a API:** Implementar requisições assíncronas (via `fetch` nativo) com tratamento robusto de erros e estados de carregamento (*loading/error states*).
* **Estilização e Responsividade:** Desenvolver folhas de estilo em CSS puro (utilizando variáveis CSS, Flexbox e Grid Layout) com abordagem *Mobile First*.

## 3. Tecnologias e Padrões

* **Stack:** HTML5, CSS3, JavaScript (ES6+), Web APIs nativas.
* **Organização de Pastas:**
* `src/pages` ou `/views`: Arquivos HTML principais das telas da aplicação.
* `src/css` ou `/styles`: Folhas de estilo modulares (organizadas por componentes ou seções).
* `src/js/components`: Componentes ou módulos de interface reutilizáveis em JS vanilla.
* `src/js/services`: Camada de comunicação HTTP com o backend.
* `src/js/utils`: Funções utilitárias e helpers reutilizáveis.


* **Boas Práticas:** Código limpo e modular, uso de JavaScript assíncrono (`async/await`), validação nativa de formulários, semântica HTML rigorosa para acessibilidade (a11y) e organização de estilos com variáveis CSS para padronização de cores e tipografia.