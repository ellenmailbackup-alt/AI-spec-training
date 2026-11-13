import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./adminlte-custom.css";

console.log("App initialized:", new Date().toISOString());
createRoot(document.getElementById("root")!).render(<App />);
