import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import "./styles/bundle.scss";
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // const url = new URL("./serviceWorker.js", import.meta.url);
    navigator.serviceWorker
      .register("./serviceWorker.js")
      .then((registration) => {
        console.log("[SW] service Worker is registered", registration.scope);
      })
      .catch((err) => {
        console.error("[SW] service Worker registration failed:", err);
      });
  });
}
// window.addEventListener("visibilitychange", function () {
//   if (document.visibilityState === "visible") {
//     window.location.reload();
//   }
// });
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
