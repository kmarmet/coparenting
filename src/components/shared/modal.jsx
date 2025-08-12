import React from "react"
import CardButton from "./cardButton"
import StringAsHtmlElement from "./stringAsHtmlElement"

const Modal = ({show, hide = () => {}, children, title = "", icon = null, scopedClass = ""}) => {
    return (
        <div className={`modal${show ? " active" : ""}${scopedClass ? ` ${scopedClass}` : ""}`}>
            <div className={`modal-content${show ? " active" : ""}`}>
                <StringAsHtmlElement elementType={"p"} text={`${title}${icon ? icon : ""}`} classes="modal-title" />
                {children}
            </div>
            <div id={"modal-card-buttons"} className="card-buttons">
                <CardButton text={"Dismiss"} onClick={hide} classes={"close-modal-button"} />
            </div>
        </div>
    )
}

export default Modal