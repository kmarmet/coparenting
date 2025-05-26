import React from 'react'
import ButtonTypes from '../../constants/buttonTypes'

const CardButton = ({text, onClick, classes, buttonType = ButtonTypes.default}) => {
  return (
    <button className={`${classes} ${buttonType} default card-button`} onClick={onClick}>
      {text}
    </button>
  )
}

export default CardButton