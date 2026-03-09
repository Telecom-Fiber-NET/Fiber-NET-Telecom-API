
import axios from 'axios';

async function testLoginAndDashboard() {
  const PORT = 3001;
  const BASE_URL = `http://localhost:${PORT}/api`;
  const credentials = {
    email: 'carlos847@gmail.com',
    password: '123456'
  };

  try {
    console.log('--- TESTANDO LOGIN ---');
    console.log(`URL: ${BASE_URL}/auth/login`);
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, credentials);
    const { token, user } = loginRes.data;
    console.log('Login Sucesso!');
    console.log('User:', JSON.stringify(user, null, 2));

    console.log('\n--- TESTANDO DASHBOARD ---');
    const dashboardRes = await axios.get(`${BASE_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Dashboard capturado com sucesso!');
    
    // Testando outras rotas importantes
    console.log('\n--- TESTANDO FINANCEIRO RESUMO ---');
    const finRes = await axios.get(`${BASE_URL}/financeiro/resumo`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const results = {
      user,
      dashboard: dashboardRes.data,
      financeiro_resumo: finRes.data
    };

    const fs = require('fs');
    fs.writeFileSync('scripts/output_teste_real.json', JSON.stringify(results, null, 2));
    console.log('Dados salvos em scripts/output_teste_real.json');

  } catch (error: any) {
    if (error.response) {
      console.error('Erro no teste:', error.response.status, error.response.data);
    } else {
      console.error('Erro no teste:', error.message);
    }
  }
}

// Aguarda o servidor subir
console.log('Aguardando 3 segundos para o servidor iniciar...');
setTimeout(testLoginAndDashboard, 3000);
