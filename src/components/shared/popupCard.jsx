import React, { useEffect } from 'react'
import Manager from '../../managers/manager'
import { IoIosArrowUp } from 'react-icons/io'

function PopupCard({ onOpen, children, title, subtitle = '', className = '', onClose, closeable = true }) {
  useEffect(() => {
    if (!Manager.contains(className, 'active')) {
      Manager.showPageContainer('show')
    } else {
      Manager.showPageContainer('hide')
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
        <IoIosArrowUp
          id={'close-icon'}
          onClick={() => {
            onClose()
            Manager.showPageContainer('show')
          }}
        />
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