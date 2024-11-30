// Importações de pacotes
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

// Inicialização do app e banco de dados
const app = express();
const db = new sqlite3.Database("./database/reports.db"); // Banco de dados na pasta 'database'

// Middlewares
app.use(cors()); // Habilitar CORS
app.use(express.json()); // Processar JSON no body das requisições

// Criação da tabela reports (se não existir)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pendente',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error("Erro ao criar a tabela:", err.message);
    } else {
      console.log("Tabela 'reports' verificada/criada com sucesso.");
    }
  });
});

// Rotas

/**
 * Rota: POST /reports
 * Função: Criar um novo reporte
 */
app.post("/reports", (req, res) => {
  const { latitude, longitude, address, description } = req.body;

  // Validação dos dados
  if (!latitude || !longitude || !address || !description) {
    return res.status(400).json({ error: "Dados incompletos. Todos os campos são obrigatórios." });
  }

  // Inserir no banco de dados
  const query = `INSERT INTO reports (latitude, longitude, address, description) VALUES (?, ?, ?, ?)`;
  db.run(query, [latitude, longitude, address, description], function (err) {
    if (err) {
      console.error("Erro ao salvar no banco de dados:", err.message);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }

    // Sucesso
    console.log("Reporte salvo com sucesso:", { id: this.lastID, latitude, longitude, address, description });
    res.status(201).json({ message: "Reporte criado com sucesso!", id: this.lastID });
  });
});

/**
 * Rota: GET /reports
 * Função: Listar todos os reportes
 */
app.get("/reports", (req, res) => {
  const query = `SELECT * FROM reports ORDER BY created_at DESC`;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar os reportes:", err.message);
      return res.status(500).json({ error: "Erro ao buscar os reportes." });
    }

    console.log("Reportes retornados com sucesso.");
    res.json(rows);
  });
});

// Iniciar o servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
