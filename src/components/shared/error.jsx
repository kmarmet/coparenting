import React, { useState, useEffect, useContext } from "react";
import globalState from "../../context";

export default function Error({ errorMessage, canClose = true, className }) {
  const { state, setState } = useContext(globalState);
  const { showError } = state;

  const hide = () => {
    setState({ ...state, showError: false });
  };

  return (
    <div id="error-container" className={`${className} ${showError ? "show" : ""}`}>
      <p>
        <ion-icon name="warning"></ion-icon>
        {errorMessage}
      </p>
      {canClose === true && (
        <button className="button red close" onClick={hide}>
          OKAY <ion-icon name="checkmark-outline"></ion-icon>
        </button>
      )}
    </div>
  );
}
