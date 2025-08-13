import React, { useState } from "react";

const TaskForm = ({ onTaskAdd }) => {
  const [task, setTask] = useState("");
  const [taskDescription, setTaskDescription] = useState("");


  const handleSubmit = (e) => {
    e.preventDefault();
    const taskTrim = task.trim();
    const taskDescriptionTrim = taskDescription.trim();

    if (!taskTrim) {
      alert("Por favor, insira o nome da tarefa.");
      return;
    }
    if (taskTrim.length > 30) {
      alert("O nome da tarefa deve ter no máximo 30 caracteres.");
      setTask("");
      return;
    }
    if (taskDescriptionTrim.length > 200) {
      alert("A descrição da tarefa deve ter no máximo 200 caracteres.");
      setTaskDescription("");
      return;
    }

    const taskObj = {
      task: taskTrim, 
      description: taskDescriptionTrim || "Sem descrição",
    };
    

    onTaskAdd(taskObj);
    setTask("");
    setTaskDescription("");
  };

  return (
    <form
      onSubmit={(e) => handleSubmit(e)}
      className="flex flex-col items-center py-10 gap-4 bg-neutral-800 w-[70dvw] md:w-[40dvw] mx-auto mt-10"
    >
      <h2 className="text-gray-300 text-2xl">Criar Tarefa</h2>
      <input
        type="text"
        placeholder="Nome da tarefa"
        className="border border-gray-300 text-gray-100 rounded w-[70%] pl-2"
        value={task}
        onChange={(e) => setTask(e.target.value)}
      />
      <input
        type="text"
        placeholder="Descrição da tarefa"
        className="border border-gray-300 text-gray-100 rounded w-[70%] pl-2"
        value={taskDescription}
        onChange={(e) => setTaskDescription(e.target.value)}
      />
      <button
        type="submit"
        className="bg-gray-600 text-gray-200 border border-gray-400 hover:bg-gray-500 hover:text-gray-700 rounded px-4 py-2 mt-2"
      >
        Adicionar
      </button>
    </form>
  );
};

export default TaskForm;
