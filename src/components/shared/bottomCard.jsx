import React, { useContext, useEffect } from 'react'
import globalState from '../../context'
import '../../prototypes'
import { PiTrashSimpleDuotone } from 'react-icons/pi'
import { IoIosCloseCircle } from 'react-icons/io'

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
}) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, alertType, formToShow } = state
  const isMobile = window.screen.width < 800

  useEffect(() => {
    const pageContainer = document.querySelector('.page-container')
    if (showCard) {
      document.getElementById('page-overlay').classList.add('active')
    } else {
      document.getElementById('page-overlay').classList.remove('active')
    }
    if (pageContainer) {
      if (showCard) {
        document.getElementById('bottom-card').scrollTop = 0
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
      <div id="title" dangerouslySetInnerHTML={{ __html: title }}></div>
      <div id="content" className="mt-15">
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
        <IoIosCloseCircle className="close-icon" onClick={onClose} />
      </div>
    </div>
  )
}
