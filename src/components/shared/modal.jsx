// Path: src\components\shared\modal.jsx
import React, { useContext, useEffect } from 'react'
import globalState from '../../context'
import Manager from '/src/managers/manager.js'
import DB_UserScoped from '../../database/db_userScoped'
import StringManager from '../../managers/stringManager'
import { useSwipeable } from 'react-swipeable'
import { MdDelete } from 'react-icons/md'
import { IoClose } from 'react-icons/io5'

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
    const modal = document.querySelector(`.${wrapperClass}#modal`)
    const fadeOutDown = 'animate__fadeOutDown'
    const fadeInUp = 'animate__fadeInUp'

    if (modal) {
      modal.classList.add(fadeOutDown)

      DB_UserScoped.getCurrentUser(authUser?.email).then((user) => {
        setState({ ...state, refreshKey: Manager.getUid(), menuIsOpen: false, currentUser: user })
      })

      setTimeout(() => {
        const labelWrappers = modal.querySelectorAll('#label-wrapper')
        labelWrappers.forEach((label) => {
          label.classList.remove('active')
        })
        pageOverlay.classList.remove('active')
        modal.classList.remove(fadeInUp)
        modal.classList.remove(fadeOutDown)
      }, 500)
    }
  }

  // Swipe
  const handlers = useSwipeable({
    onSwipedDown: async () => {
      // const pageOverlay = document.getElementById('page-overlay')
      // if (pageOverlay) {
      //   pageOverlay.classList.remove('active')
      // }
      // onClose()
      // hideCard()
    },
    delta: { down: 180 },
    // swipeDuration: 180,
    // preventScrollOnSwipe: true,
  })

  useEffect(() => {
    const pageOverlay = document.getElementById('page-overlay')
    const body = document.body
    const modal = document.querySelector(`.${wrapperClass}#modal`)
    const checkboxContainer = document.getElementById('share-with-checkbox-container')

    if (StringManager.wordCount(title) >= 4) {
      const title = modal.querySelector('#large-title')
      if (title) {
        title.classList.add('long-title')
      }
    }
    if (wrapperClass.length > 0) {
      const fadeInUp = 'animate__fadeInUp'
      const fadeOutDown = 'animate__fadeOutDown'
      // Toggle pageOverlay
      if (showCard && modal) {
        console.log(modal)
        body.style.position = 'fixed'
        // modal.classList.add(fadeInUp)
        modal.classList.add('active')

        if (checkboxContainer) {
          checkboxContainer.classList.remove('active')
        }

        if (showOverlay) {
          if (pageOverlay) {
            pageOverlay.classList.add('active')
          }
        }
      } else {
        console.log('else')
        if (modal) {
          // modal.classList.add(fadeOutDown)

          modal.classList.remove('active')
          setTimeout(() => {
            modal.classList.remove(fadeInUp)
            modal.classList.remove(fadeOutDown)
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

  {
    /* animate__animated */
  }
  return (
    <div id="modal" className={`${theme} ${wrapperClass} ${className} `} {...handlers}>
      {/*{DomManager.isMobile() && <div id="swipe-down-bar"></div>}*/}
      <div id="modal-background">
        <div id="modal">
          <div className="flex" id="title-wrapper">
            <div id="large-title" dangerouslySetInnerHTML={{ __html: title }}></div>
          </div>
          <div id="relative-wrapper">
            <div id="content">
              {subtitle.length > 0 && <p id="subtitle">{subtitle}</p>}

              {children}
            </div>
          </div>
          <div className={`flex buttons`}>
            {hasSubmitButton && (
              <button className={`button card-button submit  ${submitButtonColor}`} onClick={onSubmit}>
                {submitText} {submitIcon}
              </button>
            )}
            {hasDelete && (
              <button className={'delete-button default red card-button'} onClick={onDelete}>
                Delete <MdDelete />
              </button>
            )}
            <div id="close-icon-wrapper">
              <div id="close-icon-bg">
                <IoClose
                  className={'close-icon'}
                  onClick={() => {
                    onClose()
                    hideCard()
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}