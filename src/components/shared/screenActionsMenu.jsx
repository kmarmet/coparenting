import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'

const ScreenActionsMenu = ({ children }) => {
  const { state, setState } = useContext(globalState)
  const { theme, showScreenActions } = state

  useEffect(() => {
    const pageContainer = document.querySelector('.page-container')
    const pageOverlay = document.getElementById('page-overlay')

    if (pageContainer) {
      if (showScreenActions) {
        pageOverlay.classList.add('active')
        pageContainer.classList.add('disable-scroll')
      } else {
        pageOverlay.classList.remove('active')
        pageContainer.classList.remove('disable-scroll')
      }
    }
  }, [showScreenActions])

  return (
    <div id="screen-actions-menu-wrapper" className={showScreenActions ? 'open' : 'closed'}>
      {/* MENU ICON */}
      <div
        id="screen-actions-menu"
        onClick={() => setState({ ...state, showScreenActions: false })}
        className={showScreenActions ? 'open' : 'closed'}>
        {children}
      </div>
    </div>
  )
}

export default ScreenActionsMenu