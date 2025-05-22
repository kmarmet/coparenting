import React, {useContext, useEffect} from 'react'
import {useSwipeable} from 'react-swipeable'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
import Overlay from './overlay'
import Spacer from './spacer'

const ScreenActionsMenu = ({children, centeredActionItem, title = 'Parent'}) => {
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
      DomManager.ToggleAnimation('add', 'action-item', DomManager.AnimateClasses.names.fadeInUp, 30)
    } else {
      DomManager.ToggleAnimation('remove', 'action-item', DomManager.AnimateClasses.names.fadeInUp, 50)
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
          style={DomManager.AnimateDelayStyle(1, 0.1)}
          className={`bottom-menu-wrapper screen-actions ${DomManager.Animate.FadeInUp(showScreenActions, '.fade-up-wrapper')}`}>
          <div className={centeredActionItem ? 'centered action-items' : 'action-items'}>
            <p className="slide-up-header">{title}</p>
            <Spacer height={10} />
            {children}
          </div>
        </div>
      </div>
    </Overlay>
  )
}

export default ScreenActionsMenu