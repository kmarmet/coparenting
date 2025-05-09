import React from 'react'
import Manager from '../managers/manager'

export default function AddNewButton({onClick, icon, scopedClass}) {
  return (
    <button
      className={Manager.IsValid(scopedClass) ? `add-new-button button bottom green ${scopedClass}` : 'add-new-button button bottom green'}
      onClick={(e) => {
        onClick()
        e.target.parentNode.classList.remove('close')
      }}>
      <span className="material-icons-round add-icon">{Manager.IsValid(icon) ? icon : 'add'}</span>
    </button>
  )
}