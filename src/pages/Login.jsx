import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginOrSignup, setLoginOrSignup] = useState("login");
  const [error, setError] = useState("");
  const navigate = useNavigate();


  const axiosInstance = axios.create({ withCredentials: true });

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Tentando autenticar:", { username, password, loginOrSignup });

    try {
      const url =
        loginOrSignup === "login"
          ? "http://localhost:3001/login"
          : "http://localhost:3001/signup";
      
      const res = await axiosInstance.post(url, { username, password });
      
     
      if (res.status === 200 || res.status === 201) {
        navigate("/home");
        console.log("Autenticação bem-sucedida, redirecionando para /home");
      }

    } catch (err) {
      setError(err.response?.data?.error || "Erro ao autenticar");
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className="flex flex-col items-center py-10 gap-4 bg-neutral-800 w-[70dvw] md:w-[40dvw] mx-auto mt-10"
    >
      <h2 className="text-gray-300 text-2xl">Iniciar sessão</h2>
      <input
        onChange={(e) => setUsername(e.target.value)}
        className="border border-gray-300 text-gray-100 rounded w-[70%] pl-2"
        type="text"
        placeholder="Insira seu usuário"
      />
      <input
        onChange={(e) => setPassword(e.target.value)}
        className="border border-gray-300 text-gray-100 rounded w-[70%] pl-2"
        type="password"
        placeholder="Insira sua senha"
      />
      <div className="flex gap-4 mt-4">
        <button
          onClick={() => setLoginOrSignup("login")}
          className="bg-orange-600 hover:bg-orange-500 text-gray-100 rounded px-4 py-2 hover:text-gray-700"
          type="submit"
        >
          Entrar
        </button>
        <button
          onClick={() => setLoginOrSignup("signup")}
          className="bg-gray-600 hover:bg-gray-500 text-gray-100 rounded px-4 py-2 hover:text-gray-700"
        >
          Registrar
        </button>
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </form>
  );
};

export default Login;