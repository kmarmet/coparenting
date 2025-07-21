import React from "react"
import ButtonThemes from "../../constants/buttonThemes"
import Manager from "../../managers/manager"

const Button = ({icon, text = "", classes = "", color = "primary", theme = ButtonThemes.white, onClick = (e) => {}}) => {
      return (
            <button
                  style={{cursor: "pointer", color: color}}
                  className={`button ${theme} ${classes} ${Manager.IsValid(color, true) ? `color-${color}` : ``}`}
                  onClick={onClick}>
                  {text}
                  {Manager.IsValid(icon) ? icon : ""}
            </button>
      )
}

export default Button