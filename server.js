const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Habilita leitura JSON e arquivos estáticos da pasta public
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Garante que o index.html será carregado na rota "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para login ou cadastro
app.post('/login', (req, res) => {
  const { email, password, nickname } = req.body;

  if (!email || !password || !nickname) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }

  const db = readDB();

  let user = db.users.find(u => u.email === email);

  if (user) {
    if (user.password !== password) {
      return res.status(400).json({ error: 'Senha incorreta' });
    }
  } else {
    user = { email, password, nickname, tasks: [] };
    db.users.push(user);
    writeDB(db);
  }

  res.json({ email: user.email, nickname: user.nickname });
});

// Rota para buscar tarefas
app.get('/tasks/:email', (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.email === req.params.email);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user.tasks);
});

// Rota para adicionar nova tarefa
app.post('/tasks/:email', (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.email === req.params.email);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  user.tasks.push(req.body);
  writeDB(db);
  res.sendStatus(200);
});

// Rota para atualizar tarefa
app.put('/tasks/:email/:index', (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.email === req.params.email);
  if (!user || !db) return res.status(404).json({ error: 'Usuário não encontrado' });

  user.tasks[req.params.index].done = req.body.done;
  writeDB(db);
  res.sendStatus(200);
});

// Rota para deletar tarefa
app.delete('/tasks/:email/:index', (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.email === req.params.email);
  if (!user || !db) return res.status(404).json({ error: 'Usuário não encontrado' });

  user.tasks.splice(req.params.index, 1);
  writeDB(db);
  res.sendStatus(200);
});

// Funções de leitura e escrita
function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    return { users: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
