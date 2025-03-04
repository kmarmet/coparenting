// Path: src\components\shared\bottomCard.jsx
import React, { useContext, useEffect } from 'react'
import globalState from '../../context'
import { PiTrashSimpleDuotone } from 'react-icons/pi'
import { CgClose } from 'react-icons/cg'
import Manager from '/src/managers/manager.js'
import DB_UserScoped from '../../database/db_userScoped'
import StringManager from '../../managers/stringManager'
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
  const { theme, authUser } = state

  const hideCard = () => {
    const pageOverlay = document.getElementById('page-overlay')
    const bottomCard = document.querySelector(`.${wrapperClass}#bottom-card`)
    const fadeOutDown = 'animate__fadeOutDown'
    const fadeInUp = 'animate__fadeInUp'
    if (bottomCard) {
      bottomCard.classList.add(fadeOutDown)

      DB_UserScoped.getCurrentUser(authUser?.email).then((user) => {
        setState({ ...state, refreshKey: Manager.getUid(), menuIsOpen: false, currentUser: user })
      })

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
    const pageOverlay = document.getElementById('page-overlay')
    const body = document.body
    const bottomCard = document.querySelector(`.${wrapperClass}#bottom-card`)
    const checkboxContainer = document.getElementById('share-with-checkbox-container')
    if (StringManager.wordCount(title) >= 4) {
      const title = bottomCard.querySelector('#large-title')
      if (title) {
        title.classList.add('long-title')
      }
    }
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

    // Set MUI datetime picker placeholders
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