import React, { useContext } from 'react'
import globalState from '../../context'
import '../../prototypes'
// Icons

export default function BottomCard({ onClose, children, title, subtitle = '', showCard = false, className = '' }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, alertType, formToShow } = state
  const isMobile = window.screen.width < 800

  const cardClasses = () => {
    let classes = theme + ' ' + className
    const navbar = document.getElementById('navbar')
    const pageContainer = document.querySelector('.page-container')
    if (showCard) {
      if (navbar && pageContainer) {
        navbar.classList.add('hide')
        setTimeout(() => {
          pageContainer.classList.add('disable-scroll')
        }, 500)
      }
      classes += ' active '
    } else {
      if (navbar && pageContainer) {
        pageContainer.classList.remove('disable-scroll')
        navbar.classList.remove('hide')
      }
    }
    return classes
  }

  return (
    <div id="bottom-card" className={`${cardClasses()} ${alertType} `}>
      <div id="title" dangerouslySetInnerHTML={{ __html: title }}></div>

      <div id="content" className="mt-15">
        {subtitle.length > 0 && <p id="subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
