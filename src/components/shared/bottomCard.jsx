import React, { useContext } from 'react'
import globalState from '../../context'
import '../../prototypes'
import Manager from '@manager'
import { useSwipeable } from 'react-swipeable'

export default function BottomCard({ onClose, children, title, subtitle = '', showCard = false, className = '' }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, alertType } = state

  const isMobile = window.screen.width < 800

  const cardClasses = () => {
    let classes = currentUser?.settings?.theme + ' ' + className
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
    <div {...handlers} id="bottom-card" className={`${cardClasses()} ${alertType}`}>
      <div id="swipe-line"></div>
      {className.contains('error') && (
        <p id="title">
          Error <span className="material-icons-round">notification_important</span>
        </p>
      )}
      {!className.contains('error') && <p id="title">{title}</p>}
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