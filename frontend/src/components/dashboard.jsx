import { useEffect } from "react"
import socket from "../socket.js";
function Dashboard() {
    useEffect(() => {
  if (socket.connected) {
    console.log("connected to server", socket.id);
  }

  socket.on("connect", () => {
    console.log("connected to server", socket.id);
  });

  return () => {
    socket.off("connect"); // cleanup listener
    socket.disconnect();
  };
}, []);
    return (
        <>
        <header>
            <h1 className="text-3xl font-bold">Dashboard</h1>
        </header>

        <section>
            <p>Dashboard</p>
            <div className="flex gap-4">
                <input className="p-2 border border-gray-300 rounded" type="text" placeholder="Room ID" />
                <button className="p-2 border border-gray-300 rounded" >Join Room</button>
            </div>
            
            <div className="flex gap-4">
                <button className="p-2 border border-gray-300 rounded" >Create Quiz</button>
            </div>

            <div className="flex gap-4">
                <button className="p-2 border border-gray-300 rounded" >Create Poll</button>
            </div>


            
        </section>
        </>
    )
}

export default Dashboard