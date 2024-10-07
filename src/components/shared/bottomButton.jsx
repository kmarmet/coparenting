import React, { useState, useEffect, useContext } from 'react'

function BottomButton({ onClick, phoneDataAttribute = '', type = 'submit', text = 'SUBMIT', iconName = 'check', elClass, bottom = '' }) {
  return (
    <button
      data-phone={phoneDataAttribute}
      style={bottom ? { bottom: `${bottom}px` } : {}}
      className={`${type} ${elClass} button bottom`}
      onClick={onClick}>
      <span className="material-icons-round">{iconName}</span>
    </button>
  )
}

export default BottomButton
