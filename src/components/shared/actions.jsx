import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import { IoClose } from 'react-icons/io5'
import { FaAngleLeft } from 'react-icons/fa6'

export default function Actions({ children, onOpen, shouldHide }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [showActions, setShowActions] = useState(false)

  const toggleMenuIconAnimations = (showOrHide) => {
    document.querySelectorAll('#floating-actions .action-item').forEach((menuItem, i) => {
      setTimeout(() => {
        if (showOrHide === 'show') menuItem.classList.add('visible')
        if (showOrHide === 'hide') menuItem.classList.remove('visible')
      }, 55 * i)
    })
  }

  useEffect(() => {
    const actionItems = document.getElementById('action-items')
    toggleMenuIconAnimations(actionItems.classList.contains('open') ? 'show' : 'hide')
    actionItems.classList.toggle('open')
  }, [showActions])

  useEffect(() => {
    if (shouldHide) {
      setShowActions(false)
    }
  }, [shouldHide])

  useEffect(() => {
    onOpen()
  }, [])

  return (
    <div id={'floating-actions'} className={showActions ? 'open' : ''}>
      <div id="action-items" className={showActions ? 'open' : 'hide'}>
        {children}
      </div>
      {/* MENU ICON */}
      <div className={`${showActions ? 'close' : ''} menu-icon-wrapper`}>
        {showActions ? (
          <IoClose className={'menu-icon close'} onClick={() => setShowActions(false)} />
        ) : (
          <FaAngleLeft className={'menu-icon'} onClick={() => setShowActions(true)} />
        )}
      </div>
    </div>
  )
}