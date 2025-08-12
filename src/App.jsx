import { useState, useEffect } from "react";
import TaskForm from "./components/TaskForm";
import RenderTask from "./components/RenderTask";
import TaskDescription from "./pages/TaskDescripton";

function App() {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Requisição padrão para buscar tarefas
  const fetchTasks = () => {
    fetch("http://localhost:3001/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error("Erro ao buscar tarefas:", err));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Função genérica para requisições de escrita (POST, PUT, DELETE)
  const requestAndRefresh = (url, options) =>
    fetch(url, options)
      .then(fetchTasks)
      .catch((err) => console.error(err));

  // Criar tarefa
  const addTask = ({ task, description }) =>
    requestAndRefresh("http://localhost:3001/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: task, description }),
    });

  // Deletar tarefa
  const deleteTask = (id) =>
    requestAndRefresh(`http://localhost:3001/tasks/${id}`, {
      method: "DELETE",
    });

  // Editar descrição da tarefa
  const editTaskDescription = (id, newDescription) =>
    requestAndRefresh(`http://localhost:3001/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: newDescription }),
    });

  // Tarefa selecionada para o modal
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;

  return (
    <div className="app">
      {selectedTask ? (
        <TaskDescription
          task={selectedTask}
          changeVisibility={() => setSelectedTaskId(null)}
          editTaskDescription={editTaskDescription}
        />
      ) : (
        <>
          <TaskForm onTaskAdd={addTask} />
          <RenderTask
            seeDescription={(id) => setSelectedTaskId(id)}
            taskList={tasks}
            deleteTask={deleteTask}
          />
        </>
      )}
    </div>
  );
}

export default App;
