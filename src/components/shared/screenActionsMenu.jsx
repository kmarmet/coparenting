import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'

const ScreenActionsMenu = ({ children }) => {
  const { state, setState } = useContext(globalState)
  const { theme, showScreenActions } = state

  useEffect(() => {
    const pageContainer = document.querySelector('.page-container')

    if (pageContainer) {
      if (showScreenActions) {
        pageContainer.classList.add('disable-scroll')
      } else {
        pageContainer.classList.remove('disable-scroll')
      }
    }
  }, [showScreenActions])

  return (
    <div id="screen-actions-menu-wrapper" className={showScreenActions ? 'open' : 'closed'}>
      <div id="screen-actions-background"></div>
      {/* MENU ICON */}
      <div id="screen-actions-menu" className={showScreenActions ? 'open' : 'closed'}>
        {children}
      </div>
    </div>
  )
}

export default ScreenActionsMenu