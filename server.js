import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Criar/abrir banco SQLite
const db = new sqlite3.Database("./tasks.db", (err) => {
  if (err) {
    console.error("Erro ao abrir banco:", err.message);
  } else {
    console.log("Banco SQLite conectado.");

    // Criar tabela tasks se não existir
    db.run(
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT
      )`,
      (err) => {
        if (err) {
          console.error("Erro ao criar tabela:", err.message);
        }
      }
    );
  }
});

// GET /tasks - listar todas as tarefas
app.get("/tasks", (req, res) => {
  db.all("SELECT * FROM tasks ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST /tasks - criar nova tarefa
app.post("/tasks", (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    res.status(400).json({ error: "Title é obrigatório" });
    return;
  }
  const sql = "INSERT INTO tasks (title, description) VALUES (?, ?)";
  db.run(sql, [title, description || "Sem descrição"], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Retorna a tarefa criada com id
    res.json({ id: this.lastID, title, description: description || "Sem descrição" });
  });
});

// DELETE /tasks/:id - deletar tarefa
app.delete("/tasks/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM tasks WHERE id = ?", id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: "Tarefa não encontrada" });
      return;
    }
    res.json({ message: "Tarefa deletada com sucesso" });
  });
});

// PUT /tasks/:id - editar descrição da tarefa
app.put("/tasks/:id", (req, res) => {
  const id = req.params.id;
  const { description } = req.body;
  if (typeof description !== "string") {
    res.status(400).json({ error: "Description é obrigatório" });
    return;
  }
  db.run(
    "UPDATE tasks SET description = ? WHERE id = ?",
    [description, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: "Tarefa não encontrada" });
        return;
      }
      // Retornar tarefa atualizada
      db.get("SELECT * FROM tasks WHERE id = ?", id, (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json(row);
      });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});