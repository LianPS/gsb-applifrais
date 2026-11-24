import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { getToken } from "./services/api";
import Layout from "./components/Layout";
import Login from "./components/Login";
import Liste from "./components/Liste";
import Detail from "./components/Detail";

// garde : pas de jeton → on renvoie au login
function Privee({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Privee><Layout /></Privee>}>
          <Route path="/" element={<Liste />} />
          <Route path="/fiches/:id" element={<Detail />} />
        </Route>
        <Route path="*" element={<p>404 — page introuvable</p>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);