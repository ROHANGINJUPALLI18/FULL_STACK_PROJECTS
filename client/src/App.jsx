import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ChatPage, LoginPage } from "@/pages";

const isAuthenticated = () => Boolean(localStorage.getItem("token"));

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  return isAuthenticated() ? <Navigate to="/chat" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated() ? "/chat" : "/login"} replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
