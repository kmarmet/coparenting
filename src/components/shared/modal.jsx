// Path: src\components\shared\modal.jsx
import React, {useContext, useEffect} from 'react'
import globalState from '../../context'
import Manager from '/src/managers/manager.js'
import StringManager from '../../managers/stringManager'
import Overlay from './overlay'
import Spacer from './spacer'

export default function Modal({
  submitText,
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
  titleIcon = null,
  viewSelector,
}) {
  const {state, setState} = useContext(globalState)
  const {theme, authUser, creationFormToShow} = state

  const HideCard = () => {
    const modalWrapper = document.querySelector(`.${wrapperClass}#modal-wrapper`)

    if (modalWrapper) {
      const modal = modalWrapper.querySelector('#modal')
      const appContentWithSidebar = document.querySelector('#app-content-with-sidebar')
      const pageContainer = document.querySelector('.page-container')

      if (modal) {
        // DB_UserScoped.getCurrentUser(authUser?.email).then((user) => {
        //   setState({...state, refreshKey: Manager.getUid(), menuIsOpen: false, currentUser: user, showBottomMenu: false, creationFormToShow: ''})
        // })

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
        }, 1200)
      }
    }
  }

  const ScrollToTop = () => {
    const header = document.getElementById('modal-title')
    header.scrollIntoView({behavior: 'smooth', block: 'end'})
  }

  useEffect(() => {
    let modalWrapper = document.querySelector(`.${wrapperClass}#modal-wrapper.active`)

    // Check if creationFormToShow is valid and if so, find the modal wrapper
    if (Manager.isValid(creationFormToShow, true)) {
      modalWrapper = document.querySelector(`.${creationFormToShow}#modal-wrapper`)
    }
    if (modalWrapper) {
      const checkboxContainer = document.getElementById('share-with-checkbox-container')
      const appContentWithSidebar = document.querySelector('#app-content-with-sidebar')
      const pageContainer = document.querySelector('.page-container')

      if (modalWrapper && StringManager.GetWordCount(title) >= 4) {
        const title = modalWrapper.querySelector('#modal-title')
        if (title) {
          title.classList.add('long-title')
        }
      }

      // show or hide card
      if (Manager.isValid(wrapperClass, true) && Manager.isValid(modalWrapper)) {
        // show card

        if (showCard) {
          ScrollToTop()
          const checkboxes = modalWrapper.querySelectorAll('.checkbox')
          if (Manager.isValid(checkboxes)) {
            for (let checkbox of checkboxes) {
              checkbox.checked = false
            }
          }
          document.body.classList.add('disable-scroll')
          appContentWithSidebar.classList.add('disable-scroll')

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
    }
    if (!showCard) {
      const appContentWithSidebar = document.querySelector('#app-content-with-sidebar')
      const pageContainer = document.querySelector('.page-container')
      document.body.classList.remove('disable-scroll')
      if (appContentWithSidebar) {
        appContentWithSidebar.classList.remove('disable-scroll')
      }
      if (pageContainer) {
        pageContainer.classList.remove('disable-scroll')
      }
    }
  }, [showCard])

  return (
    <Overlay show={showCard}>
      <div id="modal-wrapper" className={`${theme} ${wrapperClass} ${showCard ? 'active' : ''}`}>
        {viewSelector}
        <div id="modal-content">
          <div id="modal">
            <div id="modal-title-and-text" className={Manager.isValid(subtitle, true) ? 'with-subtitle' : ''}>
              <p id="modal-title">
                {title}
                {titleIcon && <span className="svg-wrapper">{titleIcon}</span>}
              </p>
              <Spacer height={3} />
              {Manager.isValid(subtitle, true) && <p id="subtitle">{subtitle}</p>}
            </div>
            <div id="relative-wrapper">
              <div id="content">{children}</div>
            </div>
          </div>
        </div>

        <div className={`flex buttons`}>
          {hasSubmitButton && (
            <button className={`button card-button submit`} onClick={onSubmit}>
              {submitText}
            </button>
          )}
          {hasDelete && (
            <button className={'delete-button default warning card-button'} onClick={onDelete}>
              {deleteButtonText}
            </button>
          )}

          <button
            id="close-icon-bg"
            onClick={() => {
              onClose()
              HideCard()
            }}>
            Cancel
          </button>
        </div>
      </div>
    </Overlay>
  )
}