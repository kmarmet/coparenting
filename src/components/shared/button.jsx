import React from 'react'
import ButtonThemes from '../../constants/buttonThemes'

const Button = ({text = '', classes = '', theme = ButtonThemes.white, onClick = (e) => {}}) => {
    return (
        <button className={`button ${theme} ${classes}`} onClick={onClick}>
            {text}
        </button>
    )
}

export default Button