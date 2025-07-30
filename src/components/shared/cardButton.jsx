import React from "react"
import ButtonThemes from "../../constants/buttonThemes"
import Manager from "../../managers/manager"
import InlineLoadingSpinner from "./inlineLoadingSpinner"

const CardButton = ({text, onClick, classes, buttonTheme = ButtonThemes.white, children, icon, showLoadingSpinner = false}) => {
    return (
        <button className={`${classes} ${buttonTheme} card-button`} onClick={onClick}>
            {!showLoadingSpinner && (
                <>
                    {Manager.IsValid(children) && children}
                    {!Manager.IsValid(children) && !Manager.IsValid(icon) && <span dangerouslySetInnerHTML={{__html: text}}></span>}
                    {!Manager.IsValid(children) && Manager.IsValid(icon) && <span dangerouslySetInnerHTML={{__html: text}}></span>}
                    {Manager.IsValid(icon) && icon}
                </>
            )}
            {showLoadingSpinner && <InlineLoadingSpinner show={showLoadingSpinner} theme={"dark"} />}
        </button>
    )
}

export default CardButton