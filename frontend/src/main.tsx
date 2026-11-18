import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./app/App";
import "./index.css";

// Fail loudly with a clear message instead of a vague "null" error.
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('index.html is missing <div id="root">');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
