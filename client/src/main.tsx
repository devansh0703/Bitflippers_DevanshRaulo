import { createRoot } from "react-dom/client";
// TomTom CSS is imported in index.html
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);