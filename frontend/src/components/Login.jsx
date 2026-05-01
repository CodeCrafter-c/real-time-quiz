import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom";
function Login() {
    const [email, setEmail] = useState("ansh@gmail.com");
    const [password, setPassword] = useState("147852");
    const navigate=useNavigate()
    const  handleLogin = async() => {
        try{
            const BACKEND_URL = import.meta.env.VITE_BACKEND_PATH
            const response = await axios.post(`${BACKEND_URL}/api/v1/users/login`, {email, password},{withCredentials:true});
            console.log(response.data);
            navigate("/dashboard")
        }
        catch(err){
            console.log(err);
        }        
    }
    return (
        <>
        <header>
            <h1 className="text-3xl font-bold">Login</h1>
        </header>

        <section className="flex flex-col gap-4 mt-8">
            <input className="p-2 border border-gray-300 rounded" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="p-2 border border-gray-300 rounded" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="p-2 border border-gray-300 rounded" onClick={handleLogin}>Login</button>
        </section>
        </>
    )
}

export default Login