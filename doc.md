# Documentação Detalhada do Projeto IXC REST API Gateway

## 1. Visão Geral e Objetivo

O `ixc-rest-api-gateway` é um projeto que atua como um SDK e um gateway de API, projetado para simplificar a interação com a API do ERP IXC. Seu objetivo principal é fornecer uma camada de abstração e segurança para que aplicações cliente (como um frontend de central do assinante) possam acessar dados do IXC de forma orquestrada e segura, sem expor diretamente as credenciais administrativas do IXC.

O fluxo de dados central envolve um cliente (frontend) que envia credenciais de email/senha. O gateway utiliza um token administrativo (`IXC_ADMIN_TOKEN`) para consultar a API do IXC, autenticar o cliente e, em seguida, buscar e agregar diversas informações (cadastrais, contratos, logins, financeiro) em uma única resposta.

## 2. Arquitetura do Projeto

O projeto segue uma arquitetura de gateway de API, onde o backend atua como um proxy inteligente entre o cliente e a API externa (IXC).

-   **Cliente (Frontend)**: Interage apenas com o `ixc-rest-api-gateway`. Envia credenciais de usuário para autenticação e faz requisições para dados agregados.
-   **IXC REST API Gateway (Este Projeto)**:
    -   Recebe requisições do cliente.
    -   Autentica o cliente localmente (verificando senha contra dados do IXC).
    -   Usa `IXC_ADMIN_TOKEN` para fazer chamadas à API do IXC.
    -   Orquestra múltiplas chamadas à API do IXC para coletar todos os dados necessários.
    -   Processa e agrega os dados do IXC.
    -   Retorna uma resposta consolidada ao cliente.
-   **API do IXC**: A fonte de dados original. O gateway se comunica com ela usando o `IXC_ADMIN_TOKEN`.

## 3. Componentes Chave do Projeto

### 3.1. `src/index.ts`

Este arquivo serve como o ponto de entrada principal para o SDK/serviço IXC. Ele exporta a classe `Ixc`, que encapsula a lógica de interação com os diferentes recursos da API do IXC (clientes, contratos, financeiro, logins).

### 3.2. `api/index.ts`

É o ponto de entrada da aplicação Express.
-   Configura o servidor Express, incluindo middlewares como `cors` e `express.json()`.
-   Lê as variáveis de ambiente (`IXC_API_URL`, `IXC_ADMIN_TOKEN`, `JWT_SECRET`).
-   Instancia o serviço `Ixc` com as credenciais lidas do `.env`.
-   Define rotas da API, utilizando o `apiRouter` criado em `src/api/routes.ts`.
-   Inclui dados mockados (`MOCKED_CONSUMPTION_HISTORY`, `DEV_DASHBOARD_DATA`) para facilitar o desenvolvimento e testes.

### 3.3. `src/api/routes.ts`

Define as rotas da API Express.
-   Contém a lógica para as rotas de autenticação (`/login`), dashboard (`/dashboard`) e ações específicas (`/trocar-senha`, `/desbloqueio-confianca`, `/logins/:id/:action`).
-   A rota mais importante para o fluxo de dados principal é `POST /api/full-data`.
-   Utiliza o middleware `verifyToken` para proteger rotas que exigem autenticação local.

### 3.4. `src/resources/base.ts`

Esta é a classe base (`QueryBase`) para todos os recursos da API do IXC.
-   Gerencia a configuração de autenticação (`apiKey` - o `IXC_ADMIN_TOKEN`) e a `baseUrl` da API do IXC.
-   Define o método `performRequest`, que é responsável por:
    -   Construir a URL completa da requisição.
    -   Adicionar cabeçalhos comuns (`Content-Type`, `Authorization`, `ixcsoft`).
    -   Executar a requisição `fetch`.
    -   Realizar tratamento de erros, incluindo a verificação do `Content-Type` da resposta (`application/json` ou `text/x-json`) para garantir que a resposta seja JSON.
    -   Lançar erros detalhados em caso de falha.
-   Fornece métodos genéricos para `request` (para listagens/consultas), `create`, `update` e `remove`.

### 3.5. `src/resources/clientes`, `src/resources/contratos`, `src/resources/financeiro`, `src/resources/logins`

Cada um desses diretórios contém a lógica específica para interagir com um recurso correspondente na API do IXC.
-   Eles estendem a classe `QueryBase` e implementam métodos como `filtrarClientes`, `filtrarContratos`, etc.
-   Definem os `resourceName` específicos para cada endpoint (ex: `cliente`, `cliente_contrato`, `fn_areceber`, `radusuarios`).
-   Contêm as definições de tipos (`types.ts`) para os dados retornados por cada recurso.

### 3.6. `src/middleware/authMiddleware.ts`

Contém o middleware `verifyToken` que é usado para proteger rotas da API local.
-   Verifica a presença e validade de um token JWT no cabeçalho `Authorization` da requisição.
-   Decodifica o token usando o `JWT_SECRET` configurado.
-   Anexa os dados do usuário decodificados ao objeto `req` para uso posterior nas rotas.

## 4. Fluxo de Dados Detalhado (`POST /api/full-data`)

Este é o fluxo central para obter todos os dados de um cliente:

1.  **Requisição do Cliente**: O frontend envia uma requisição `POST` para `/api/full-data` com `email` e `password` no corpo.
2.  **Busca do Cliente no IXC**:
    -   O gateway utiliza o `IXC_ADMIN_TOKEN` para chamar `ixc.clientes.filtrarClientes` com o `email` fornecido, buscando pelo campo `cliente.hotsite_email`.
    -   Espera-se que a API do IXC retorne um único cliente correspondente.
3.  **Verificação de Senha**:
    -   A `password` fornecida pelo cliente é comparada com o campo `senha` do objeto `cliente` retornado pelo IXC.
    -   É assumido que `cliente.senha` está em texto plano (devido a `senha_hotsite_md5: "N"` no IXC).
    -   Se a senha não corresponder, a requisição é rejeitada com um erro de autenticação.
4.  **Coleta de Dados Adicionais (se autenticado)**:
    -   Se a autenticação for bem-sucedida, o gateway prossegue para buscar outros dados do cliente usando o `id` do cliente:
        -   `ixc.contratos.filtrarContratos` (para contratos do cliente).
        -   `ixc.logins.filtrarLogins` (para logins de internet associados ao cliente).
        -   `ixc.financeiro.filtrarFaturas` (para faturas do cliente).
        -   Dados de consumo (atualmente mockados, mas com placeholders para integração futura).
5.  **Agregação e Resposta**: Todos os dados coletados são agregados em um único objeto de resposta e enviados de volta ao cliente.

## 5. Autenticação e Segurança

-   **IXC API**: Todas as chamadas do gateway para a API do IXC são autenticadas usando o `IXC_ADMIN_TOKEN`. Este token deve ser um valor Base64 encodado no formato `ID:TOKEN` (ex: `MjE6NDAxMTJiM2Q2ZGIyNDVkYmYwYWM0MDM3OTg5NmYyNmMxYzdlZmMxMDBlZDBhNDdmYTQ1NzM5ZTg1YzU5NzFjMQ==`).
-   **Gateway Local**: O gateway pode emitir tokens JWT para o cliente após uma autenticação bem-sucedida contra o IXC. Esses JWTs são usados para proteger rotas subsequentes no próprio gateway, garantindo que apenas clientes autenticados possam acessar dados sensíveis. O `JWT_SECRET` é usado para assinar e verificar esses tokens.

## 6. Variáveis de Ambiente

As seguintes variáveis de ambiente são essenciais para o funcionamento do projeto e devem ser configuradas no arquivo `.env` (para desenvolvimento local) e nas configurações de deploy (para produção, como Vercel):

-   `IXC_API_URL`: A URL base da API do IXC (ex: `https://centralfiber.online/webservice/v1`).
-   `IXC_ADMIN_TOKEN`: O token de autenticação para a API do IXC, **Base64 encodado**.
-   `IXC_IXCSOFT_HEADER`: O valor para o cabeçalho `ixcsoft` nas requisições do IXC (geralmente `listar`).
-   `JWT_SECRET`: Uma string secreta forte e única para assinar e verificar os tokens JWT emitidos pelo gateway.

## 7. Testes

O projeto utiliza `jest` para testes unitários.
-   Os testes estão localizados nos diretórios `src/resources/*/tests/`.
-   `npm test`: Executa todos os testes.
-   `npm run test:watch`: Executa testes em modo de observação.
-   `npm run test:coverage`: Gera um relatório de cobertura de testes.

## 8. Deploy

O deploy é configurado para a plataforma Vercel.
-   O arquivo `vercel.json` na raiz do projeto define as regras de `rewrites` para direcionar as requisições da API para o ponto de entrada `api/index.ts`.
-   As variáveis de ambiente devem ser configuradas diretamente nas configurações do projeto Vercel.

## 9. Próximos Passos e Melhorias Futuras

-   **Implementação de Consumo, PIX e Boleto**: Atualmente, alguns dados (como histórico de consumo, geração de PIX e boletos) são mockados. A integração real com os endpoints correspondentes da API do IXC precisa ser implementada.
-   **Tratamento de Erros Aprimorado**: Melhorar a granularidade e a mensagem dos erros retornados ao cliente.
-   **Cache**: Implementar cache para respostas da API do IXC para melhorar a performance e reduzir a carga na API externa.
-   **Rate Limiting**: Adicionar controle de taxa para proteger o gateway e a API do IXC contra abusos.
-   **Documentação da API (Swagger/OpenAPI)**: Gerar documentação interativa para os endpoints do gateway.
-   **Tipagem Completa**: Garantir que todos os dados de resposta da API do IXC sejam totalmente tipados para robustez.
