# Guia de Integração Frontend com o IXC REST API Gateway

Este documento detalha como integrar sua aplicação frontend (SPA, mobile, etc.) com o backend IXC REST API Gateway que acabamos de configurar e deployar.

## 1. Visão Geral da Integração

Seu frontend não se comunicará diretamente com a API do IXC. Em vez disso, todas as requisições relacionadas aos dados do IXC serão direcionadas ao seu **IXC REST API Gateway** (o backend que você deployou no Vercel). O gateway atuará como um intermediário seguro, orquestrando as chamadas para a API do IXC e retornando os dados processados ao seu frontend.

O fluxo básico é:
1.  **Frontend envia credenciais de usuário** (email/senha do hotsite) para o Gateway.
2.  **Gateway autentica o usuário** contra a API do IXC (usando o `IXC_ADMIN_TOKEN` configurado).
3.  **Gateway busca dados adicionais** do IXC para o usuário autenticado.
4.  **Gateway retorna os dados agregados** ao frontend.
5.  (Opcional) **Gateway pode emitir um JWT** para o frontend, permitindo acesso a outras rotas protegidas do próprio Gateway sem reautenticar no IXC a cada requisição.

## 2. URL Base da API do Backend

A URL base para todas as suas requisições do frontend será o domínio do seu deploy no Vercel.
No seu caso: `https://api.centralfiber.online`

Todos os endpoints da sua API (ex: `/api/full-data`, `/api/login`, `/api/dashboard`) serão acessados prefixando esta URL base.

**Exemplos:**
-   `https://api.centralfiber.online/api/full-data`
-   `https://api.centralfiber.online/api/login`
-   `https://api.centralfiber.online/api/dashboard`

## 3. Fluxo de Autenticação e Obtenção de Dados Completos (`POST /api/full-data`)

Este é o ponto de partida para o seu frontend obter os dados iniciais do cliente.

### 3.1. Requisição de Login/Dados

Seu frontend deve enviar uma requisição `POST` para o endpoint `/api/full-data` com o email e a senha do hotsite do cliente no corpo da requisição.

-   **Método**: `POST`
-   **Endpoint**: `https://api.centralfiber.online/api/full-data`
-   **Headers**:
    -   `Content-Type: application/json`
-   **Corpo da Requisição (JSON)**:
    ```json
    {
        "email": "email_do_cliente@exemplo.com",
        "password": "senha_do_hotsite"
    }
    ```

### 3.2. Tratamento da Resposta de `full-data`

-   **Sucesso (Status 200 OK)**:
    -   O backend retornará um objeto JSON contendo todos os dados agregados do cliente (informações cadastrais, contratos, faturas, logins, etc.).
    -   Seu frontend deve processar esses dados para exibir a interface do usuário.
    -   **Importante**: Se o backend também retornar um JWT nesta resposta (para autenticação local do gateway), você deve armazená-lo.

-   **Erro (Status 4xx ou 5xx)**:
    -   O backend retornará um status de erro (ex: `401 Unauthorized` para credenciais inválidas, `500 Internal Server Error` para problemas no servidor).
    -   O corpo da resposta conterá um JSON com uma mensagem de erro (ex: `{ "message": "Credenciais inválidas." }`).
    -   Seu frontend deve capturar esses erros e exibir mensagens apropriadas ao usuário.

## 4. Acessando Outras Rotas Protegidas do Gateway (com JWT)

Se o seu backend emitir um JSON Web Token (JWT) após o login (ou na resposta de `full-data`), você pode usá-lo para acessar outras rotas protegidas do seu próprio Gateway (ex: `/api/dashboard`, `/api/trocar-senha`).

### 4.1. Armazenamento do JWT

Após receber um JWT do backend, você deve armazená-lo de forma segura no frontend. As opções comuns incluem:
-   `localStorage`: Persiste entre sessões do navegador.
-   `sessionStorage`: Persiste apenas durante a sessão atual do navegador.
-   Cookies HTTP-only: Mais seguro contra ataques XSS, mas requer configuração específica no backend.

Para a maioria das SPAs, `localStorage` ou `sessionStorage` são usados, mas esteja ciente das implicações de segurança (XSS).

### 4.2. Incluindo o JWT nas Requisições

Para acessar uma rota protegida, você deve incluir o JWT no cabeçalho `Authorization` de todas as requisições subsequentes.

-   **Headers**:
    -   `Authorization: Bearer SEU_JSON_WEB_TOKEN_AQUI`

**Exemplo de Requisição (JavaScript com `fetch`) para uma rota protegida:**

```javascript
async function getProtectedData(jwtToken) {
    const apiUrl = 'https://api.centralfiber.online/api/dashboard'; // Exemplo de rota protegida
    
    try {
        const response = await fetch(apiUrl, {
            method: 'GET', // Ou POST, PUT, DELETE, dependendo da rota
            headers: {
                'Authorization': `Bearer ${jwtToken}`, // Inclua o JWT aqui
                'Content-Type': 'application/json', // Se a rota esperar um corpo JSON
            },
            // body: JSON.stringify(se_houver_corpo_json),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao acessar dados protegidos.');
        }

        const data = await response.json();
        console.log('Dados protegidos:', data);
        return data;

    } catch (error) {
        console.error('Erro na requisição protegida:', error.message);
        // Trate o erro (ex: redirecionar para login se o token for inválido/expirado)
        throw error;
    }
}

// Exemplo de uso:
// const meuJwt = localStorage.getItem('jwtToken'); // Ou de onde você armazenou
// if (meuJwt) {
//     getProtectedData(meuJwt)
//         .then(data => { /* ... */ })
//         .catch(error => { /* ... */ });
// } else {
//     // Redirecionar para a página de login
// }
```

## 5. Tratamento de Erros no Frontend

É crucial implementar um tratamento de erros robusto no frontend:
-   **Erros de Rede**: Falha na conexão com o backend.
-   **Erros de Resposta da API**: Status HTTP 4xx (erros do cliente, ex: 401 Unauthorized, 403 Forbidden, 404 Not Found, 400 Bad Request) ou 5xx (erros do servidor).
-   **Mensagens de Erro**: Exiba mensagens de erro claras e amigáveis ao usuário, baseadas nas mensagens retornadas pelo backend.
-   **Redirecionamento**: Em caso de `401 Unauthorized` ou `403 Forbidden` (especialmente para JWTs inválidos/expirados), redirecione o usuário para a página de login.

## 6. Considerações de Segurança no Frontend

-   **HTTPS**: Certifique-se de que seu frontend sempre se comunica com o backend via HTTPS para proteger os dados em trânsito. (O Vercel já garante isso para seus deploys).
-   **Não Armazene Credenciais Sensíveis**: Nunca armazene o email e a senha do usuário em texto plano no frontend após o login. Apenas o JWT (se usado) deve ser armazenado.
-   **Proteção contra XSS**: Se você estiver armazenando JWTs em `localStorage`, esteja ciente dos riscos de Cross-Site Scripting (XSS). Garanta que seu frontend esteja protegido contra XSS.
-   **CORS**: O backend já está configurado com CORS para aceitar requisições do seu frontend.

Ao seguir estas diretrizes, você poderá integrar seu frontend de forma eficaz e segura com o IXC REST API Gateway.
