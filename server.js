import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express(); // 'app' deve ser inicializado primeiro

const PORT = process.env.PORT || 3001;
const TOKEN_SECRET = process.env.TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

app.use(express.json());
app.use(cookieParser());

// Configuração do CORS
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

// Conexão com o banco de dados de usuários
const dbUsers = new sqlite3.Database("./database/users.db", (err) => {
  if (err) return console.error("SQLite erro:", err.message);
  console.log("Conectado ao banco de dados de usuários");
  dbUsers.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT
    )`
  );
});

// Conexão com o banco de dados de tarefas
const dbTasks = new sqlite3.Database("./database/tasks.db", (err) => {
  if (err) return console.error("SQLite erro:", err.message);
  console.log("Conectado ao banco de dados de tarefas");
  dbTasks.run(
    `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`
  );
});

// Função para gerar o token de acesso
function generateAccessToken(payload) {
  return jwt.sign(payload, TOKEN_SECRET, { expiresIn: "1h" });
}

// Função para gerar o refresh token
function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
}

// Middleware para autenticar o token de acesso
function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Token necessário" });

  jwt.verify(token, TOKEN_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = payload;
    next();
  });
}

// Rota de registro de usuário
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  dbUsers.run(
    "INSERT INTO users (username, password_hash) VALUES (?, ?)",
    [username, hash],
    function (err) {
      if (err) return res.status(400).json({ error: "Usuário já existe" });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Rota de login de usuário
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  dbUsers.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err || !user)
        return res.status(400).json({ error: "Usuário não encontrado" });
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(400).json({ error: "Senha incorreta" });

      const accessToken = generateAccessToken({ userId: user.id });
      const refreshToken = generateRefreshToken({ userId: user.id });

      res.cookie("token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      });

      res.json({ message: "Autenticado com sucesso" });
    }
  );
});

// Rota para obter um novo token de acesso usando o refresh token
app.post("/refresh-token", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: "Token necessário" });

  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: "Token inválido" });

    const accessToken = generateAccessToken({ userId: payload.userId });
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    res.json({ message: "Novo token de acesso gerado" });
  });
});

// Rota de logout
app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.clearCookie("refreshToken");
  res.json({ message: "Desconectado com sucesso" });
});

app.get("/me", authenticateToken, (req, res) => {
  res.status(200).json({ message: "Autenticado" });
});

// Rota para obter as tarefas do usuário autenticado
app.get("/tasks", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  dbTasks.all(
    "SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Rota para criar uma nova tarefa
app.post("/tasks", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: "Título é obrigatório" });

  dbTasks.run(
    "INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)",
    [userId, title, description || "Sem descrição"],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        id: this.lastID,
        user_id: userId,
        title,
        description: description || "Sem descrição",
      });
    }
  );
});

// Rota para editar a descrição de uma tarefa
app.put("/tasks/:id", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { description } = req.body;
  const id = req.params.id;
  if (typeof description !== "string")
    return res.status(400).json({ error: "Descrição é obrigatória" });

  dbTasks.run(
    "UPDATE tasks SET description = ? WHERE id = ? AND user_id = ?",
    [description, id, userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res
          .status(404)
          .json({ error: "Tarefa não encontrada ou não pertence ao usuário" });

      dbTasks.get("SELECT * FROM tasks WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
      });
    }
  );
});

// Rota para deletar uma tarefa
app.delete("/tasks/:id", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const id = req.params.id;
  dbTasks.run(
    "DELETE FROM tasks WHERE id = ? AND user_id = ?",
    [id, userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res
          .status(404)
          .json({ error: "Tarefa não encontrada ou não pertence ao usuário" });
      res.json({ message: "Tarefa deletada com sucesso" });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});