import React, { useState, useEffect, useContext } from 'react'
import Manager from '@manager'

export default function AddNewButton({ onClick, icon, scopedClass }) {
  return (
    <button
      className={
        Manager.isValid(scopedClass, false, false, true) ? `add-new-button button bottom green ${scopedClass}` : 'add-new-button button bottom green'
      }
      onClick={(e) => {
        onClick()
        e.target.parentNode.classList.remove('close')
      }}>
      <span className="material-icons-round add-icon">{Manager.isValid(icon) ? icon : 'add'}</span>
    </button>
  )
}