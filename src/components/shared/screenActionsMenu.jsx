import React, {useContext, useEffect} from 'react'
import {IoClose} from 'react-icons/io5'
import {useSwipeable} from 'react-swipeable'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
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
    DomManager.ToggleDisableScrollClass(showScreenActions ? 'disable-scroll' : '')
  }, [showScreenActions])

  return (
    <div className={`screen-actions-menu-wrapper${showScreenActions ? ' active' : ''}`}>
      {showScreenActions && <IoClose className="close-overlay-icon" onClick={() => setState({...state, showScreenActions: false})} />}
      <div className={'screen-actions-menu-overlay'}>
        <div className={'screen-actions-card-wrapper'}>
          <div {...handlers} className={`screen-actions-card`}>
            <div className="swipe-bar"></div>
            <Spacer height={3} />
            <div className={centeredActionItem ? 'centered action-items' : 'action-items'}>
              <p className="screen-actions-menu-title">{title}</p>
              <Spacer height={10} />
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScreenActionsMenu