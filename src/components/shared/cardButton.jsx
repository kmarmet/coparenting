import React from 'react'
import ButtonThemes from '../../constants/buttonThemes'
import Manager from '../../managers/manager'

const CardButton = ({text, onClick, classes, buttonTheme = ButtonThemes.white, children}) => {
  return (
    <button className={`${classes} ${buttonTheme} card-button`} onClick={onClick}>
      {Manager.IsValid(children) && children}
      {!Manager.IsValid(children) && text}
    </button>
  )
}

export default CardButton