import { useState, useEffect } from "react";
import TaskForm from "./TaskForm.jsx";
import RenderTask from "./RenderTask.jsx";
import TaskDescription from "./TaskDescription.jsx";
import Cookies from "js-cookie";

function Home() {
  const getAuthToken = () => Cookies.get("token");

  const getAuthHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const fetchTasks = () => {
    fetch("http://localhost:3001/tasks", {
      headers: getAuthHeaders(),
      credentials: "include",
    })
      .then((res) => {
        // Se a resposta não for OK, lança um erro para o .catch
        if (!res.ok) {
          throw new Error("Falha na requisição. Status: " + res.status);
        }
        return res.json();
      })
      .then((data) => {
        // Garante que o estado 'tasks' seja sempre um array
        if (Array.isArray(data)) {
          setTasks(data);
        } else {
          // Se a resposta não for um array, redefine para um array vazio e loga o erro
          console.error("Resposta da API não é um array:", data);
          setTasks([]);
        }
      })
      .catch((err) => {
        // Em caso de qualquer erro (rede ou resposta da API), redefine para um array vazio
        console.error("Erro ao buscar tarefas:", err);
        setTasks([]);
      });
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const requestAndRefresh = (url, options) =>
    fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...getAuthHeaders(),
      },
      credentials: "include",
    })
      .then(fetchTasks)
      .catch((err) => console.error(err));

  const addTask = ({ task, description }) =>
    requestAndRefresh("http://localhost:3001/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: task, description }),
    });

  const deleteTask = (id) =>
    requestAndRefresh(`http://localhost:3001/tasks/${id}`, {
      method: "DELETE",
    });

  const editTaskDescription = (id, newDescription) =>
    requestAndRefresh(`http://localhost:3001/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: newDescription }),
    });

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

export default Home;