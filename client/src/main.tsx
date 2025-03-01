import { createRoot } from "react-dom/client";
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);