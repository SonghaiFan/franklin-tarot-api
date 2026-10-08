import React from "react";
import { createRoot } from "react-dom/client";
import ApiDocsPage from "./ApiDocsPage";
import "./index.css";
createRoot(document.getElementById("root")!).render(<React.StrictMode><ApiDocsPage /></React.StrictMode>);
