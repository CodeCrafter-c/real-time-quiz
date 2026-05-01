import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_PATH;
const socket = io(BACKEND_URL, {
    withCredentials: true
});

export default socket;