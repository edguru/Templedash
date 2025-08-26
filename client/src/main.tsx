// CRITICAL: Emergency debug logging
console.log('🚨 MAIN.TSX LOADING - React app starting...');

import { createRoot } from "react-dom/client";
import "./polyfills";
import App from "./App";
import "./index.css";

console.log('✅ IMPORTS LOADED - All imports successful');

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

console.log('🚀 REACT RENDER START - Creating root and rendering App...');

try {
  const rootElement = document.getElementById("root");
  console.log('📍 ROOT ELEMENT FOUND:', !!rootElement);
  
  const root = createRoot(rootElement!);
  console.log('✅ ROOT CREATED - React root initialized');
  
  root.render(<App />);
  console.log('✅ APP RENDERED - React app rendered successfully');
} catch (error) {
  console.error('❌ REACT RENDER ERROR:', error);
  // Fallback: show error in DOM
  const errorMessage = error instanceof Error ? error.message : String(error);
  document.body.innerHTML = `<div style="color:red;padding:20px;">
    <h1>React App Failed to Load</h1>
    <p>Error: ${errorMessage}</p>
    <p>Check console for details</p>
  </div>`;
}
