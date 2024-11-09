import React, { useContext, useEffect } from 'react'
import globalState from '../../context'
import '../../prototypes'
// Icons

export default function BottomCard({ onClose, children, title, subtitle = '', showCard = false, className = '' }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, alertType, formToShow } = state
  const isMobile = window.screen.width < 800

  useEffect(() => {
    const pageContainer = document.querySelector('.page-container')
    if (pageContainer) {
      if (showCard) {
        pageContainer.classList.add('disable-scroll')
        document.getElementById('bottom-card').scrollTop = 0
      } else {
        pageContainer.classList.remove('disable-scroll')
      }
    }
  }, [showCard])

  const cardClasses = () => {
    let classes = theme + ' ' + className

    if (showCard) {
      classes += ' active '
    }
    return classes
  }

  return (
    <div id="bottom-card" className={`${cardClasses()} ${alertType} `}>
      <div id="title" dangerouslySetInnerHTML={{ __html: title }}></div>
      <hr id="title-hr" />

      <div id="content" className="mt-15">
        {subtitle.length > 0 && <p id="subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
