import { Route, Routes,BrowserRouter } from "react-router-dom";
import Dashboard from "./components/dashboard";
import Landing from "./components/landing";

function App() {
    return (
        <>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </BrowserRouter>
        </>
    )
}

export default App