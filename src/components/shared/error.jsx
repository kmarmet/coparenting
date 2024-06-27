import React, { useState, useEffect, useContext } from "react";
import globalState from "../../context";

export default function Error({ errorMessage, canClose = true, className = "" }) {
  const { state, setState } = useContext(globalState);
  const { showError } = state;

  const hide = () => {
    setState({ ...state, showError: false });
  };

  return (
    <div id="error-container" className={`${className} ${showError ? "show" : ""}`}>
      <p>
        <span className="material-icons-round">sentiment_dissatisfied</span>
        {errorMessage}
      </p>
      {canClose === true && (
        <button className="button red close" onClick={hide}>
          OKAY <span className="material-icons-round">check</span>
        </button>
      )}
    </div>
  );
}
