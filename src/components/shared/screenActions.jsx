import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import { FaAngleLeft } from 'react-icons/fa6'
import { Fade } from 'react-awesome-reveal'

const ScreenActions = ({ children }) => {
  const { state, setState } = useContext(globalState)
  const { theme, showBottomMenu } = state

  useEffect(() => {
    const pageContainer = document.querySelector('.page-container')
    const pageOverlay = document.getElementById('page-overlay')

    if (pageContainer) {
      if (showBottomMenu) {
        pageOverlay.classList.add('active')
        pageContainer.classList.add('disable-scroll')
      } else {
        pageOverlay.classList.remove('active')
        pageContainer.classList.remove('disable-scroll')
      }
    }
  }, [showBottomMenu])

  return (
    <div id="screen-actions-wrapper" className={showBottomMenu ? 'open' : 'closed'}>
      {/* MENU ICON */}
      <div id="screen-actions" className={showBottomMenu ? 'open' : 'closed'}>
        {children}
      </div>
    </div>
  )
}

export default ScreenActions