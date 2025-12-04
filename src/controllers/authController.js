const login = (req, res) => {
    const { email, password } = req.body;

    if (email === 'admin' && password === 'password') {
        return res.json({
            message: 'Login bem-sucedido!',
            token: 'dummy-token' // Placeholder for a real token
        });
    }

    res.status(401).json({ message: 'Credenciais inválidas' });
};

module.exports = {
    login,
};
