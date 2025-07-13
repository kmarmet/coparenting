import React from 'react'
import ButtonThemes from '../../constants/buttonThemes'
import Manager from '../../managers/manager'

const Button = ({icon, text = '', classes = '', theme = ButtonThemes.white, onClick = (e) => {}}) => {
    return (
        <button className={`button ${theme} ${classes}`} onClick={onClick}>
            {text}
            {Manager.IsValid(icon) ? icon : ''}
        </button>
    )
}

export default Button