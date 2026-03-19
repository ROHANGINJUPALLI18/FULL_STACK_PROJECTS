import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";
//  wrap app:
// GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* implement GoogleOAuthProvider */}
    {/* todo 1:- implement GoogleOAuthProvider with clientId */}
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);
