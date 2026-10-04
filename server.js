import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

/**
 * Função para gerar um CPF Válido com cálculo dos dígitos verificadores
 * @returns {Object} Objeto contendo o CPF numérico e o CPF formatado
 */
function gerarCPFValido() {
  const randomDigit = () => Math.floor(Math.random() * 9);
  
  // 1. Gera os 9 primeiros dígitos aleatórios
  const noveDigitos = Array.from({ length: 9 }, randomDigit);

  // 2. Calcula o primeiro dígito verificador
  const calcularDigito = (digitos, pesoInicial) => {
    const soma = digitos.reduce((acc, digit, idx) => acc + digit * (pesoInicial - idx), 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const digito1 = calcularDigito(noveDigitos, 10);
  
  // 3. Calcula o segundo dígito verificador
  const dezDigitos = [...noveDigitos, digito1];
  const digito2 = calcularDigito(dezDigitos, 11);

  // Array final com 11 dígitos válidos
  const cpfCompleto = [...dezDigitos, digito2];
  const cpfNumero = cpfCompleto.join('');

  // Formatação: 000.000.000-00
  const cpfFormatado = cpfNumero.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  return {
    cpf: cpfNumero,
    cpfFormatado: cpfFormatado
  };
}

// Mapeamento de tipos de conteúdo (MIME Types)
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json'
};

// Servidor HTTP
const server = http.createServer(async (req, res) => {
  // CORS Headers (permite requisições no navegador)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // -------------------------------------------------------------
  // ROTA 1: API Endpoint para gerar o CPF
  // -------------------------------------------------------------
  if (req.url === '/api/cpf' && req.method === 'GET') {
    const novoCPF = gerarCPFValido();
    
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(novoCPF));
    return;
  }

  // -------------------------------------------------------------
  // ROTA 2: Servidor de arquivos estáticos (Frontend do Site)
  // -------------------------------------------------------------
  try {
    let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath).toLowerCase();

    const data = await fs.readFile(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 - Página não encontrada');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 - Erro interno no servidor');
    }
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`📌 Rota da API para gerar CPF: http://localhost:${PORT}/api/cpf`);
});
