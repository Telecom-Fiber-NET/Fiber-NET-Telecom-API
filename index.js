require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.get('/', (req, res) => {
    res.send('API Fiber NET Telecom está funcionando !');
});

app.post('/api/auth/login'(req, res) => {
    const { email, password } = req.body;

    if (email === 'admin' && password === 'password') {
    return res.json({
        message: 'Login bem-sucessido!',
        token: ''
    })
    }
})