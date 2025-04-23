import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router";
import ReactDOM from "react-dom/client";
import { EnokiFlowProvider } from "@mysten/enoki/react";
import { UserProvider } from './UserContext';
ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <EnokiFlowProvider apiKey={"enoki_public_7d28353ed51b320d4a6ef76f926a4765"}>
      <UserProvider>
        <App />
      </UserProvider>
    </EnokiFlowProvider>
  </BrowserRouter>
);
