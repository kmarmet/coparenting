import React, { useContext, useEffect } from 'react'
import globalState from '../../context'
import Overlay from './overlay'

const ScreenActionsMenu = ({children, centeredActionItem}) => {
  const {state, setState} = useContext(globalState)
  const {theme, showScreenActions} = state

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
    <Overlay show={showScreenActions}>
      <div className={`${showScreenActions ? 'open' : 'closed'} bottom-menu-wrapper`}>
          <div className={centeredActionItem ? 'centered action-items' : 'action-items'}>
            <p className="bottom-menu-title">Actions</p>
            {children}
          </div>
      </div>
    </Overlay>
  )
}

export default ScreenActionsMenu