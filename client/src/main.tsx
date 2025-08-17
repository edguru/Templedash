import { createRoot } from "react-dom/client";
import "./polyfills";
import App from "./App";
import "./index.css";

// Add global error handlers to prevent unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection:', event.reason);
  // Prevent the error from being logged to console as an error
  event.preventDefault();
});

// Handle any runtime errors
window.addEventListener('error', (event) => {
  if (event.message.includes('A listener indicated an asynchronous response')) {
    // Suppress this specific error which is typically from browser extensions
    event.preventDefault();
    return;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
