import React, { useContext, useEffect } from 'react'
import globalState from '../../context'
import '../../prototypes'
import { PiTrashSimpleDuotone } from 'react-icons/pi'
import { CgClose } from 'react-icons/cg'

export default function BottomCard({
  submitText,
  submitIcon,
  submitButtonColor = '',
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
  wrapperClass = '',
}) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, alertType, formToShow } = state
  const isMobile = window.screen.width < 800

  useEffect(() => {
    const pageContainer = document.querySelector('.page-container')
    const pageOverlay = document.getElementById('page-overlay')
    const body = document.body
    const bottomCard = document.querySelector(`.${wrapperClass}#bottom-card`)
    if (wrapperClass.length > 0) {
      const fadeInUp = 'animate__fadeInUp'
      const fadeOutDown = 'animate__fadeOutDown'
      // Toggle pageOverlay
      if (showCard && bottomCard) {
        body.style.position = 'fixed'
        bottomCard.classList.add(fadeInUp)
        if (showOverlay) {
          if (pageOverlay) {
            pageOverlay.classList.add('active')
          }
        }
      } else {
        if (bottomCard) {
          bottomCard.classList.add(fadeOutDown)

          setTimeout(() => {
            bottomCard.classList.remove(fadeInUp)
            bottomCard.classList.remove(fadeOutDown)
          }, 500)
        }
        body.style.position = 'inherit'
        if (pageOverlay) {
          pageOverlay.classList.remove('active')
        }
      }

      // Disable scroll on page container
      if (pageContainer) {
        if (showCard && bottomCard) {
          pageContainer.classList.add('disable-scroll')
          bottomCard.scrollTop = 0
        } else {
          pageContainer.classList.remove('disable-scroll')
        }
      }
    }
  }, [showCard])

  const hideCard = () => {
    const bottomCard = document.querySelector(`.${wrapperClass}#bottom-card`)
    const fadeOutDown = 'animate__fadeOutDown'
    const fadeInUp = 'animate__fadeInUp'

    bottomCard.classList.add(fadeOutDown)

    setTimeout(() => {
      bottomCard.classList.remove(fadeInUp)
      bottomCard.classList.remove(fadeOutDown)
    }, 500)
  }

  return (
    <div id="bottom-card" className={`${theme} ${wrapperClass} ${className} ${alertType} animate__animated`}>
      <div id="relative-wrapper">
        <div className="flex" id="title-wrapper">
          <div id="large-title" dangerouslySetInnerHTML={{ __html: title }}></div>
          <CgClose
            className="close-icon"
            onClick={() => {
              onClose()
              hideCard()
            }}
          />
        </div>
        <div id="content">
          {subtitle.length > 0 && <p id="subtitle">{subtitle}</p>}
          {children}
        </div>
      </div>
      {hasSubmitButton ||
        (hasDelete && (
          <div className={`flex buttons`}>
            {hasSubmitButton && (
              <button className={`button card-button submit ${submitButtonColor}`} onClick={onSubmit}>
                {submitText} {submitIcon}
              </button>
            )}
            {hasDelete && <PiTrashSimpleDuotone className={'delete-icon'} onClick={onDelete} />}
          </div>
        ))}
    </div>
  )
}