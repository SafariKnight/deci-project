import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./routes.tsx";
import { AuthProvider } from "./context/AuthProvider.tsx";
import "./main.css";

const MINUTE = 60 * 1000;
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * MINUTE,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
