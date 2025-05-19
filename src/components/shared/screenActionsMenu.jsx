import React, {useContext, useEffect} from 'react'
import {useSwipeable} from 'react-swipeable'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
import Overlay from './overlay'
import Spacer from './spacer'

const ScreenActionsMenu = ({children, centeredActionItem}) => {
  const {state, setState} = useContext(globalState)
  const {theme, showScreenActions} = state

  const handlers = useSwipeable({
    swipeDuration: 300,
    preventScrollOnSwipe: true,
    onSwipedDown: () => {
      setState({...state, showScreenActions: false})
    },
  })

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
      <div className="slide-up-card-wrapper">
        <div className="swipe-bar"></div>
        <div
          {...handlers}
          className={`bottom-menu-wrapper screen-actions ${showScreenActions ? 'active' : ''} ${showScreenActions ? 'animate__animated animate__fadeInUp' : 'animate__animated animate__fadeOutDown'}`}>
          <div className={centeredActionItem ? 'centered action-items' : 'action-items'}>
            <Spacer height={4} />
            {children}
          </div>
        </div>
      </div>
    </Overlay>
  )
}

export default ScreenActionsMenu