import React, { useContext } from 'react'
import globalState from '../../context'
import '../../prototypes'
import Manager from '@manager'
import { useSwipeable } from 'react-swipeable'

export default function BottomCard({ resetKey = 0, error = '', onClose, children, title, subtitle = '', showCard = false, className = '' }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, alertType, formToShow } = state
  const isMobile = window.screen.width < 800

  const cardClasses = () => {
    let classes = theme + ' ' + className
    if (showCard) {
      classes += ' active '
    }
    return classes
  }

  const handlers = useSwipeable({
    onSwipedDown: (eventData) => {
      console.log('User Swiped!', eventData)
      onClose()
    },
    preventScrollOnSwipe: true,
  })

  return (
    <div {...handlers} id="bottom-card" className={`${cardClasses()} ${alertType} `}>
      <div className="flex swipe-line-and-close">
        <div id="swipe-line"></div>
        <span
          className="material-icons-round"
          id="close-icon"
          onClick={() => {
            setState({ ...state, formToShow: '' })
            onClose()
          }}>
          close
        </span>
      </div>
      {className.contains('error') && (
        <p id="title">
          Error <span className="material-icons-round">notification_important</span>
        </p>
      )}
      {!className.contains('error') && <p id="title">{title}</p>}
      {error.length > 0 && (
        <p id="error" className="mb-10">
          {error}
        </p>
      )}
      {!className.contains('error') && subtitle.length > 0 && <p id="subtitle">{subtitle}</p>}
      {children}
      {!isMobile && (
        <span
          className="material-icons-round"
          id="close-icon"
          onClick={() => {
            if (onClose) {
              onClose()
            }
            Manager.toggleForModalOrNewForm('show')
          }}>
          expand_more
        </span>
      )}
    </div>
  )
}
