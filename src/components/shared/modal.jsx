import React, { useContext } from "react";

const Modal = ({ children, onClose, elClass = "", hasClose = true }) => {
  return (
    <div className={`modal ${elClass} active`}>
      <div className="modal-content  animate__animated animate__fadeInUp">{children}</div>
      {hasClose === true && <ion-icon onClick={onClose} class="close" name="close-outline"></ion-icon>}
    </div>
  );
};

export default Modal;
