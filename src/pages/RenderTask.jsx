
import { FaTrash } from "react-icons/fa";

const RenderTask = ({ taskList = [], deleteTask, seeDescription }) => {
  return (
    <div
      className={`mt-7 w-[70dvw] mx-auto flex flex-col items-center ${
        taskList.length > 6 ? "md:grid md:grid-cols-2 place-items-center" : ""
      }`}
    >
      {taskList.map((task, index) => (
        <div
          key={task.id || index}
          className={`${
            taskList.length > 6 ? "md:w-[95%]" : ""
          } bg-neutral-800 text-gray-100 md:w-[40dvw] w-[70dvw] p-4 my-2 flex justify-between items-center break-words whitespace-pre-line`}
        >
          {task.title || task.task}
          <div className="flex items-center">
            <button
              onClick={() => seeDescription(task.id)}
              className="bg-gray-600 hover:bg-gray-500 text-white rounded px-4 py-1 ml-2 border border-gray-500 hover:text-gray-700"
            >
              Ver 
            </button>
            <button
              onClick={() => deleteTask(task.id)}
              className="bg-orange-600 hover:bg-orange-500 text-white rounded px-3 py-2 ml-2 hover:text-gray-700"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RenderTask;
