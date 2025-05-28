import React from 'react'
import ButtonTypes from '../../constants/buttonTypes'

const Button = ({text = '', color = ButtonTypes.white, onClick = (e) => {}}) => {
  return (
    <button className={`button ${color}`} onClick={onClick}>
      {text}
    </button>
  )
}

export default Button