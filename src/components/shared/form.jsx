// Path: src\components\shared\form.jsx
import Manager from '../../managers/manager'
import React, {useContext, useEffect} from 'react'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
import StringManager from '../../managers/stringManager'
import Overlay from './overlay'
import Spacer from './spacer'
import StringAsHtmlElement from './stringAsHtmlElement'

export default function Form({
  submitText,
  onSubmit,
  onDelete,
  onClose,
  children,
  title,
  subtitle = '',
  activeView = 'details',
  showCard = false,
  hasDelete = false,
  hasSubmitButton = true,
  wrapperClass = '',
  deleteButtonText = 'Delete',
  titleIcon = null,
  viewSelector,
  submitIcon = null,
  deleteIcon = null,
  cancelButtonText = 'Close',
  extraButtons = [],
}) {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey, creationFormToShow} = state

  const HideCard = () => {
    const modalWrapper = document.querySelector(`.${wrapperClass}.form-wrapper`)

    if (modalWrapper) {
      const form = modalWrapper.querySelector('#form')

      if (form) {
        setTimeout(() => {
          const labelWrappers = form.querySelectorAll('#label-wrapper')
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
    const header = document.querySelector('.form-title')
    header.scrollIntoView({behavior: 'smooth', block: 'end'})
  }

  useEffect(() => {
    let activeForm = document.querySelector(`.${wrapperClass}.form-wrapper.active`)

    if (showCard) {
      const allActiveFadeInUp = document.querySelectorAll('.animate__animated.animate__fadeInUp')
      if (Manager.IsValid(allActiveFadeInUp)) {
        setTimeout(() => {
          DomManager.ToggleAnimation('add', 'block', DomManager.AnimateClasses.names.fadeInUp, 85)
        }, 300)
      }
      if (Manager.IsValid(activeForm)) {
        const allWrappers = activeForm.querySelectorAll('.input-wrapper')
        if (Manager.IsValid(allWrappers)) {
          const firstWrapper = allWrappers[0]
          if (Manager.IsValid(firstWrapper)) {
            // firstWrapper.querySelector('input').focus()
          }
        }
      }
    }

    // Check if creationFormToShow is valid and if so, find the form wrapper
    if (Manager.IsValid(creationFormToShow, true)) {
      activeForm = document.querySelector(`.${creationFormToShow}.form-wrapper`)
    }
    if (activeForm) {
      const checkboxContainer = document.getElementById('share-with-checkbox-container')

      if (activeForm && StringManager.GetWordCount(title) >= 4) {
        const title = activeForm.querySelector('#form-title')
        if (title) {
          title.classList.add('long-title')
        }
      }

      // show or hide card
      if (Manager.IsValid(wrapperClass, true) && Manager.IsValid(activeForm)) {
        if (showCard) {
          ScrollToTop()
          const checkboxes = activeForm.querySelectorAll('.checkbox')
          if (Manager.IsValid(checkboxes)) {
            for (let checkbox of checkboxes) {
              checkbox.checked = false
            }
          }

          if (checkboxContainer) {
            checkboxContainer.classList.remove('active')
          }
        } else {
          DomManager.ToggleAnimation('remove', 'form-fade-wrapper', DomManager.AnimateClasses.names.fadeInUp, 50)
        }
      }

      // Set MUI datetime picker placeholders

      // const startTimeInput = document.querySelector('.input-wrapper.start-time .MuiInputBase-input')
      // const endTimeInput = document.querySelector('.input-wrapper.end-time .MuiInputBase-input')
      //
      // if (startTimeInput && endTimeInput) {
      //   startTimeInput.placeholder = 'Start time'
      //   endTimeInput.placeholder = 'End time'
      // }
    }
  }, [showCard])

  return (
    <Overlay show={showCard}>
      <div key={refreshKey} className={`form-wrapper ${theme} ${wrapperClass} ${showCard ? 'active' : ''}`}>
        <div
          style={DomManager.AnimateDelayStyle(1, 0.002)}
          className={`form-card ${DomManager.Animate.FadeInUp(showCard, '.form-fade-wrapper')} form-fade-wrapper ${activeView}`}>
          <div className="content-wrapper">
            <div className="header">
              <p className={'form-title'}>
                {titleIcon && <span className="svg-wrapper">{titleIcon}</span>}
                {title}
              </p>
              {Manager.IsValid(subtitle, true) && <StringAsHtmlElement classes={'subtitle'} text={subtitle} />}
            </div>

            {viewSelector}
            {Manager.IsValid(viewSelector) && <hr />}
            {!Manager.IsValid(viewSelector) && <Spacer height={10} />}
            <div className="content">{children}</div>
          </div>
        </div>
        <div className={`flex card-buttons`}>
          {hasSubmitButton && (
            <button className={`button card-button submit`} onClick={onSubmit}>
              {submitText}
            </button>
          )}

          {hasDelete && (
            <button className={'delete-button default card-button'} onClick={onDelete}>
              {deleteButtonText}
            </button>
          )}

          {/* EXTRA BUTTONS */}
          {Manager.IsValid(extraButtons) &&
            extraButtons.map((button) => {
              return button
            })}

          <button
            className="button card-button close"
            onClick={() => {
              onClose()
              HideCard()
            }}>
            {cancelButtonText}
          </button>
        </div>
      </div>
    </Overlay>
  )
}