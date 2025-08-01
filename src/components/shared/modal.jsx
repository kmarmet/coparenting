import React from "react"
import CardButton from "./cardButton"

const Modal = ({show, hide = () => {}, children, title = "", icon = null, scopedClass = ""}) => {
    return (
        <div className={`modal${show ? " active" : ""}${scopedClass ? ` ${scopedClass}` : ""}`}>
            <div className={`modal-content${show ? " active" : ""}`}>
                <p className="modal-title">
                    {title}
                    {icon ? icon : ""}
                </p>
                {children}
            </div>
            <div id={"modal-card-buttons"} className="card-buttons">
                <CardButton text={"Close"} onClick={hide} classes={"close-modal-button"} />
            </div>
        </div>
    )
}

export default Modal