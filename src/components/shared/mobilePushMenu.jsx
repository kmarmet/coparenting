import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import { FaAngleLeft } from 'react-icons/fa6'
import { Fade } from 'react-awesome-reveal'

const MobilePushMenu = ({ children, hide = true }) => {
  const { state, setState } = useContext(globalState)
  const { theme } = state
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    const pageContainer = document.querySelector('.page-container')
    const pageOverlay = document.getElementById('page-overlay')
    if (pageContainer) {
      if (showActions) {
        pageOverlay.classList.add('active')
        pageContainer.classList.add('disable-scroll', 'pushed')
      } else {
        pageOverlay.classList.remove('active')
        pageContainer.classList.remove('disable-scroll', 'pushed')
      }

      if (hide) {
        pageOverlay.classList.remove('active')
        pageContainer.classList.remove('disable-scroll', 'pushed')
        setShowActions(false)
      }
    }
  }, [showActions, hide])

  return (
    <div id="mobile-push-menu-wrapper">
      {/* MENU ICON */}
      <div className={`${showActions ? 'close' : ''} menu-icon-wrapper`}>
        {showActions ? (
          <FaAngleLeft className={'menu-icon close'} onClick={() => setShowActions(false)} />
        ) : (
          <FaAngleLeft className={'menu-icon'} onClick={() => setShowActions(true)} />
        )}
      </div>
      <div id="mobile-push-menu" className={showActions ? 'open' : 'closed'}>
        {children}
      </div>
    </div>
  )
}

export default MobilePushMenu