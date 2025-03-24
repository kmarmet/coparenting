// Path: src\components\shared\modal.jsx
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import Manager from '/src/managers/manager.js'
import DB_UserScoped from '../../database/db_userScoped'
import StringManager from '../../managers/stringManager'
import { IoClose } from 'react-icons/io5'
import { Fade } from 'react-awesome-reveal'

export default function Modal({
  submitText,
  submitButtonColor = '',
  onSubmit,
  onDelete,
  onClose,
  children,
  title,
  subtitle = '',
  showCard = false,
  hasDelete = false,
  hasSubmitButton = true,
  wrapperClass = '',
  deleteButtonText = 'Delete',
}) {
  const { state, setState } = useContext(globalState)
  const { theme, authUser, creationFormToShow } = state
  const [contentHeight, setContentHeight] = useState(0)

  const hideCard = () => {
    const modalWrapper = document.querySelector(`.${wrapperClass}#modal-wrapper`)

    if (modalWrapper) {
      const modal = modalWrapper.querySelector('#modal')
      const appContentWithSidebar = document.querySelector('#app-content-with-sidebar')
      const pageContainer = document.querySelector('.page-container')
      const fadeOutDown = 'animate__fadeOutDown'
      const fadeInUp = 'animate__fadeInUp'

      if (modal) {
        modal.classList.add(fadeOutDown)
        DB_UserScoped.getCurrentUser(authUser?.email).then((user) => {
          setState({ ...state, refreshKey: Manager.getUid(), menuIsOpen: false, currentUser: user, showBottomMenu: false, creationFormToShow: '' })
        })

        // Remove disable-scroll class
        if (pageContainer) {
          pageContainer.classList.remove('disable-scroll')
        }

        document.body.classList.remove('disable-scroll')
        appContentWithSidebar.classList.remove('disable-scroll')

        setTimeout(() => {
          const labelWrappers = modal.querySelectorAll('#label-wrapper')
          if (Manager.isValid(labelWrappers)) {
            labelWrappers.forEach((label) => {
              label.classList.remove('active')
            })
          }
          modal.classList.remove(fadeInUp)
          modal.classList.remove(fadeOutDown)
        }, 1200)
      }
    }
  }

  useEffect(() => {
    let modalWrapper = document.querySelector(`.${wrapperClass}#modal-wrapper`)

    // Check if creationFormToShow is valid and if so, find the modal wrapper
    if (Manager.isValid(creationFormToShow, true)) {
      modalWrapper = document.querySelector(`.${creationFormToShow}#modal-wrapper`)
    }

    if (modalWrapper) {
      const modal = modalWrapper.querySelector('#modal')
      const checkboxContainer = document.getElementById('share-with-checkbox-container')
      const appContentWithSidebar = document.querySelector('#app-content-with-sidebar')
      const pageContainer = document.querySelector('.page-container')
      const fadeOutDown = 'animate__fadeOutDown'
      const fadeInUp = 'animate__fadeInUp'

      if (modalWrapper && StringManager.wordCount(title) >= 4) {
        const title = modalWrapper.querySelector('#large-title')
        if (title) {
          title.classList.add('long-title')
        }
      }

      // show or hide card
      if (Manager.isValid(wrapperClass, true) && Manager.isValid(modalWrapper)) {
        // show card

        if (showCard) {
          document.body.classList.add('disable-scroll')
          appContentWithSidebar.classList.add('disable-scroll')
          console.log(modalWrapper)
          if (modalWrapper) {
            modal.classList.add(fadeInUp)
            console.log(modal)
            setTimeout(() => {
              modal.classList.remove(fadeOutDown)
            }, 500)
          }

          if (checkboxContainer) {
            checkboxContainer.classList.remove('active')
          }

          if (pageContainer) {
            pageContainer.classList.add('disable-scroll')
          }
        }

        // hide card
        else {
          document.body.classList.remove('disable-scroll')
          appContentWithSidebar.classList.remove('disable-scroll')
          modal.classList.remove(fadeInUp)
          if (pageContainer) {
            pageContainer.classList.remove('disable-scroll')
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

      // Add bottom padding to content based on height
      if (modalWrapper) {
        const relativeWrapper = modalWrapper.querySelector('#relative-wrapper')
        if (relativeWrapper) {
          setContentHeight(relativeWrapper.offsetHeight)
        }
      }
    }
  }, [showCard])

  return (
    <div id="modal-wrapper" className={`${theme} ${wrapperClass} ${showCard ? 'active' : ''}`}>
      <div id="modal-background"></div>
      <div>
        <div className="flex" id="title-wrapper">
          <div id="large-title" dangerouslySetInnerHTML={{ __html: title }}></div>
        </div>
        <Fade direction={'up'} duration={600} delay={2000} triggerOnce={true} className={'modal-fade-wrapper'}>
          <div id="modal" className="animate__animated">
            <div id="relative-wrapper">
              <div id="content" className={contentHeight >= 200 ? 'with-bottom-padding' : ''}>
                {subtitle.length > 0 && <p id="subtitle">{subtitle}</p>}

                {children}
              </div>
            </div>
          </div>
        </Fade>
      </div>
      <div className={`flex buttons`}>
        {hasSubmitButton && (
          <button className={`button card-button submit ${submitButtonColor}`} onClick={onSubmit}>
            {submitText}
          </button>
        )}
        {hasDelete && (
          <button className={'delete-button default warning card-button'} onClick={onDelete}>
            {deleteButtonText}
          </button>
        )}

        <div
          id="close-icon-bg"
          onClick={() => {
            onClose()
            hideCard()
          }}>
          <IoClose className={'close-icon'} />
        </div>
      </div>
    </div>
  )
}