import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import socket from "../socket.js"  
function Login() {
  const [email, setEmail] = useState("ansh@gmail.com")
  const [password, setPassword] = useState("147852")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleLogin = async () => {
    setError("")
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_PATH
      await axios.post(
        `${BACKEND_URL}/api/v1/users/login`,
        { email, password },
        { withCredentials: true }
      )
      
      socket.connect() 
      navigate("/dashboard")
    } catch (err) {
      setError(err.response?.data?.message || "Login failed")
    }
  }

  return (
    <>
      <header>
        <h1 className="text-3xl font-bold">Login</h1>
      </header>
      <section className="flex flex-col gap-4 mt-8">
        <input
          className="p-2 border border-gray-300 rounded"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="p-2 border border-gray-300 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          className="p-2 border border-gray-300 rounded"
          onClick={handleLogin}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        >
          Login
        </button>
      </section>
    </>
  )
}

export default Login