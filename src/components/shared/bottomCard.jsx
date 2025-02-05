import React, { useContext, useEffect } from 'react'
import globalState from '../../context'
import { PiTrashSimpleDuotone } from 'react-icons/pi'
import { CgClose } from 'react-icons/cg'
import Manager from '../../managers/manager.js'

export default function BottomCard({
  submitText,
  submitIcon,
  submitButtonColor = '',
  onSubmit,
  onDelete,
  onClose,
  children,
  title,
  subtitle = '',
  showCard = false,
  className = '',
  hasDelete = false,
  hasSubmitButton = true,
  showOverlay = true,
  wrapperClass = '',
}) {
  const { state, setState } = useContext(globalState)
  const { currentScreen, theme } = state

  const hideCard = () => {
    const pageOverlay = document.getElementById('page-overlay')
    const bottomCard = document.querySelector(`.${wrapperClass}#bottom-card`)
    const fadeOutDown = 'animate__fadeOutDown'
    const fadeInUp = 'animate__fadeInUp'
    if (bottomCard) {
      bottomCard.classList.add(fadeOutDown)
      setState({ ...state, refreshKey: Manager.getUid(), menuIsOpen: false })

      setTimeout(() => {
        const labelWrappers = bottomCard.querySelectorAll('#label-wrapper')
        labelWrappers.forEach((label) => {
          label.classList.remove('active')
        })
        pageOverlay.classList.remove('active')
        bottomCard.classList.remove(fadeInUp)
        bottomCard.classList.remove(fadeOutDown)
      }, 500)
    }
  }

  useEffect(() => {
    const pageContainer = document.querySelector('.page-container')
    const pageOverlay = document.getElementById('page-overlay')
    const body = document.body
    const bottomCard = document.querySelector(`.${wrapperClass}#bottom-card`)
    const checkboxContainer = document.getElementById('share-with-checkbox-container')
    if (wrapperClass.length > 0) {
      const fadeInUp = 'animate__fadeInUp'
      const fadeOutDown = 'animate__fadeOutDown'
      // Toggle pageOverlay
      if (showCard && bottomCard) {
        body.style.position = 'fixed'
        bottomCard.classList.add(fadeInUp)

        if (checkboxContainer) {
          checkboxContainer.classList.remove('active')
        }

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
    }
    const startTimeInput = document.querySelector('#input-wrapper.start-time .MuiInputBase-input')
    const endTimeInput = document.querySelector('#input-wrapper.end-time .MuiInputBase-input')
    if (startTimeInput && endTimeInput) {
      startTimeInput.placeholder = 'Start time'
      endTimeInput.placeholder = 'End time'
    }
  }, [showCard])

  return (
    <div id="bottom-card" className={`${theme} ${wrapperClass} ${className} animate__animated`}>
      <div id="relative-wrapper">
        <div className="flex" id="title-wrapper">
          <div id="large-title" dangerouslySetInnerHTML={{ __html: title }}></div>
          <CgClose
            className="close-icon"
            onClick={() => {
              const pageOverlay = document.getElementById('page-overlay')
              if (pageOverlay) {
                pageOverlay.classList.remove('active')
              }
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
      {(hasSubmitButton || hasDelete) && (
        <div className={`flex buttons`}>
          {hasSubmitButton && (
            <button className={`button card-button submit ${submitButtonColor}`} onClick={onSubmit}>
              {submitText} {submitIcon}
            </button>
          )}
          {hasDelete && <PiTrashSimpleDuotone className={'delete-icon'} onClick={onDelete} />}
        </div>
      )}
    </div>
  )
}