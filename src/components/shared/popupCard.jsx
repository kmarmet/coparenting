import React, { useState, useEffect, useContext } from 'react'
import globalState from '../../context'
import Manager from '@manager'

function PopupCard({ onOpen, children, title, subtitle = '', className = '', onClose, closeable = true }) {
  useEffect(() => {
    // @ts-ignore
    if (!className.contains('active')) {
      Manager.toggleForModalOrNewForm('show')
    } else {
      Manager.toggleForModalOrNewForm('hide')
    }
  }, [className])

  useEffect(() => {
    if (onOpen) {
      onOpen()
    }
  }, [])

  return (
    <div className={`${className} `} id="popup-card-container">
      {closeable && (
        <span
          className="material-icons-round"
          id="close-icon"
          onClick={() => {
            onClose()
            Manager.toggleForModalOrNewForm('show')
          }}>
          expand_more
        </span>
      )}
      <div id="card">
        <div id="title" className="flex">
          <p dangerouslySetInnerHTML={{ __html: title }}></p>
        </div>
        <p id="subtitle">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}

export default PopupCard
