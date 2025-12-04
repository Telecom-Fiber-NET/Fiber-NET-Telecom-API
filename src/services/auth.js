const login = async (email, password) => {
    // Lógica de autenticação compartilhada
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

if (!response.ok) {
    throw new Error('Falha na autenticação');
}

return response.json();
};
export { login };