import React from 'react'
import ButtonThemes from '../../constants/buttonThemes'
import Manager from '../../managers/manager'

const CardButton = ({text, onClick, classes, buttonType = ButtonThemes.white, children}) => {
  return (
    <button className={`${classes} ${buttonType} card-button`} onClick={onClick}>
      {Manager.IsValid(children) && children}
      {!Manager.IsValid(children) && text}
    </button>
  )
}

export default CardButton