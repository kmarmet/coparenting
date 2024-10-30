import React, { useContext } from 'react'
import globalState from '../../context'
import '../../prototypes'
// Icons
import { CgClose } from 'react-icons/cg'

export default function BottomCard({ onClose, children, title, subtitle = '', showCard = false, className = '' }) {
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

  return (
    <div id="bottom-card" className={`${cardClasses()} ${alertType} `}>
      <CgClose id="close-icon" className={'fs-35'} onClick={onClose} />
      <div id="title" dangerouslySetInnerHTML={{ __html: title }}></div>

      <div id="content" className="mt-15">
        {subtitle.length > 0 && <p id="subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
