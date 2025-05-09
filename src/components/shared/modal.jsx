// Path: src\components\shared\modal.jsx
import Manager from '/src/managers/manager.js'
import React, {useContext, useEffect} from 'react'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
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
  const {theme, refreshKey, creationFormToShow} = state

  const HideCard = () => {
    const modalWrapper = document.querySelector(`.${wrapperClass}#modal-wrapper`)

    if (modalWrapper) {
      const modal = modalWrapper.querySelector('#modal')

      if (modal) {
        setTimeout(() => {
          const labelWrappers = modal.querySelectorAll('#label-wrapper')
          if (Manager.IsValid(labelWrappers)) {
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
    if (Manager.IsValid(creationFormToShow, true)) {
      modalWrapper = document.querySelector(`.${creationFormToShow}#modal-wrapper`)
    }
    if (modalWrapper) {
      const checkboxContainer = document.getElementById('share-with-checkbox-container')

      if (modalWrapper && StringManager.GetWordCount(title) >= 4) {
        const title = modalWrapper.querySelector('#modal-title')
        if (title) {
          title.classList.add('long-title')
        }
      }

      // show or hide card
      if (Manager.IsValid(wrapperClass, true) && Manager.IsValid(modalWrapper)) {
        if (showCard) {
          ScrollToTop()
          const checkboxes = modalWrapper.querySelectorAll('.checkbox')
          if (Manager.IsValid(checkboxes)) {
            for (let checkbox of checkboxes) {
              checkbox.checked = false
            }
          }

          if (checkboxContainer) {
            checkboxContainer.classList.remove('active')
          }
        } else {
          DomManager.ToggleAnimation('remove', 'modal-fade-wrapper', DomManager.AnimateClasses.names.fadeInUp, 50)
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
  }, [showCard])

  return (
    <Overlay show={showCard}>
      <div key={refreshKey} id="modal-wrapper" className={`${theme} ${wrapperClass} ${showCard ? 'active' : ''}`}>
        {viewSelector}
        <div
          style={DomManager.AnimateDelayStyle(1, 0.002)}
          id="modal-card"
          className={`${DomManager.Animate.FadeInUp(showCard, '.modal-fade-wrapper')} modal-fade-wrapper`}>
          <div id="modal">
            <div id="modal-title-and-text" className={Manager.IsValid(subtitle, true) ? 'with-subtitle' : ''}>
              <p id="modal-title">
                {title}
                {titleIcon && <span className="svg-wrapper">{titleIcon}</span>}
              </p>
              <Spacer height={3} />
              {Manager.IsValid(subtitle, true) && <p id="subtitle">{subtitle}</p>}
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
            <button className={'Delete-button default warning card-button'} onClick={onDelete}>
              {deleteButtonText}
            </button>
          )}

          <button
            id="cancel-button"
            onClick={() => {
              onClose()
              HideCard()
            }}>
            Close
          </button>
        </div>
      </div>
    </Overlay>
  )
}