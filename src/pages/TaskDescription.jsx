import React, { useState, useEffect } from 'react';

function TaskDescription({ task, changeVisibility, editTaskDescription }) {
  const [screenDescription, setScreenDescription] = useState(task.description);
  const [isEditing, setIsEditing] = useState(false);
  const [tempDescription, setTempDescription] = useState(task.description);

  useEffect(() => {
    setScreenDescription(task.description);
    setTempDescription(task.description);
  }, [task]);

  const handleSave = () => {
    setScreenDescription(tempDescription);
    editTaskDescription(task.id, tempDescription); 
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col items-center h-screen bg-[rgba(0,0,0,0.5)]">
      <div className="w-[70dvw] md:w-[30dvw] flex flex-col justify-between bg-neutral-800 text-gray-100 p-4 mt-10 h-[70dvh] overflow-x-hidden overflow-y-auto rounded-lg">
        
        <div>
          <h1 className="text-2xl text-center mb-4 ">Descrição da Tarefa</h1>
          <h2 className="text-xl font-semibold md:text-2xl md:mx-10">{task.title}</h2>

          {isEditing ? (
            <textarea
              className="w-[50dvw] md:w-[25dvw] p-2 mt-2 bg-neutral-700 rounded resize-none min-h-[120px] md:text-xl md:mx-11"
              value={tempDescription}
              onChange={(e) => setTempDescription(e.target.value)}
            />
          ) : (
            <p className="text-sm text-gray-400 mt-2 md:text-xl md:mx-11 break-words whitespace-pre-line">{screenDescription}</p>
          )}
        </div>

        <div className="self-end gap-3 flex mt-4">
          {isEditing ? (
            <>
              <button
                className="bg-green-600 px-4 py-2 rounded hover:bg-green-500"
                onClick={handleSave}
              >
                Salvar
              </button>
              <button
                className="bg-gray-500 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => {
                  setIsEditing(false);
                  setTempDescription(screenDescription);
                }}
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              className="bg-neutral-400 px-4 py-2 rounded hover:bg-neutral-300"
              onClick={() => setIsEditing(true)}
            >
              Editar
            </button>
          )}
          {isEditing ? null : (<button
            className="bg-orange-600 px-4 py-2 rounded hover:bg-orange-500"
            onClick={() => changeVisibility("")}
          >
            Voltar
          </button>)}
          
        </div>
      </div>
    </div>
  );
}

export default TaskDescription;
