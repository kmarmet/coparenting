import React, {useContext, useEffect} from 'react'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
import Overlay from './overlay'

const ScreenActionsMenu = ({children, centeredActionItem}) => {
  const {state, setState} = useContext(globalState)
  const {theme, showScreenActions} = state

  useEffect(() => {
    const pageContainer = document.querySelector('.page-container')

    if (showScreenActions) {
      DomManager.ToggleAnimation('add', 'action-item', DomManager.AnimateClasses.names.fadeInRight, 30)
    } else {
      DomManager.ToggleAnimation('remove', 'action-item', DomManager.AnimateClasses.names.fadeInRight, 50)
    }

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
      <div
        className={`bottom-menu-wrapper screen-actions ${showScreenActions ? 'active' : ''} ${showScreenActions ? 'animate__animated animate__fadeInUp' : 'animate__animated animate__fadeOutDown'}`}>
        <div className={centeredActionItem ? 'centered action-items' : 'action-items'}>
          <p className="bottom-menu-title">Actions</p>
          <hr />
          {children}
        </div>
      </div>
    </Overlay>
  )
}

export default ScreenActionsMenu