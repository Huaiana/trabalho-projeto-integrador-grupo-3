# AGENT_BACKEND: Diretrizes de Desenvolvimento Backend

## 1. Visão Geral
O **Agent Backend** rege a arquitetura de microsserviços/APIs, regras de negócio, modelagem de dados e segurança utilizando **Java Spring Boot**, persistência com **PostgreSQL** e padrões corporativos.

## 2. Responsabilidades Principais
* **Arquitetura de APIs (REST):** Desenvolver endpoints seguros, padronizados e documentados (OpenAPI/Swagger).
* **Regras de Negócio e Persistência:** Implementar a camada de serviços, repositórios (Spring Data JPA) e mapeamento de entidades relacionais.
* **Segurança e Autenticação:** Configurar controle de acesso, criptografia de dados sensíveis e políticas de CORS.
* **Resiliência e Testes:** Garantir testes unitários e de integração (JUnit, Mockito) e tratamento centralizado de exceções.

## 3. Tecnologias e Padrões
* **Stack:** Java, Spring Boot, Spring Data JPA, PostgreSQL, Maven/Gradle.
* **Arquitetura em Camadas:**
  * `Controller`: Recepção de requisições HTTP e validação de payloads.
  * `Service`: Implementação da lógica de negócio principal.
  * `Repository`: Comunicação direta com o banco de dados via JPA/Hibernate.
  * `Model/Entity`: Definição de entidades e tabelas do banco de dados.
* **Boas Práticas:** Uso de DTOs (*Data Transfer Objects*) para desacoplar entidades de banco dos payloads de API, injeção de dependências via construtor e logs estruturados.