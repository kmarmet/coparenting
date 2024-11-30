import React, { useContext, useEffect } from 'react'
import globalState from '../../context'
import '../../prototypes'
import { PiTrashSimpleDuotone } from 'react-icons/pi'
import { useSwipeable } from 'react-swipeable'
import { CgClose } from 'react-icons/cg'

export default function BottomCard({
  submitText,
  submitIcon,
  onSubmit,
  onDelete,
  onClose,
  children,
  title,
  refreshKey = 0,
  subtitle = '',
  showCard = false,
  className = '',
  hasDelete = false,
  hasSubmitButton = true,
  showOverlay = true,
}) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, alertType, formToShow } = state
  const isMobile = window.screen.width < 800

  const handlers = useSwipeable({
    onSwipedDown: (e) => {
      onClose()
    },
    preventScrollOnSwipe: true,
    delta: { down: 300 },
  })

  useEffect(() => {
    const pageContainer = document.querySelector('.page-container')
    const body = document.body
    if (showCard) {
      body.style.position = 'fixed'
      if (showOverlay) {
        document.getElementById('page-overlay').classList.add('active')
      }
    } else {
      body.style.position = 'inherit'
      document.getElementById('page-overlay').classList.remove('active')
    }
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
    <div key={refreshKey} id="bottom-card" className={`${cardClasses()} ${alertType} `}>
      <div id="relative-wrapper">
        <div className="flex" id="title-wrapper">
          <div id="large-title" dangerouslySetInnerHTML={{ __html: title }}></div>
          <CgClose className="close-icon" onClick={onClose} />
        </div>
        <div id="content">
          {subtitle.length > 0 && <p id="subtitle">{subtitle}</p>}
          {children}
        </div>
        <div className={` flex buttons`}>
          {hasSubmitButton && (
            <button className="button card-button submit" onClick={onSubmit}>
              {submitText} {submitIcon}
            </button>
          )}
          {hasDelete && <PiTrashSimpleDuotone className={'delete-icon'} onClick={onDelete} />}
        </div>
      </div>
    </div>
  )
}