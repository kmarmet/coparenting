// Path: src\components\shared\form.jsx
import React, {cloneElement, useContext, useEffect, useState} from 'react'
import ButtonThemes from '../../constants/buttonThemes'
import globalState from '../../context'
import useDetectElement from '../../hooks/useDetectElement'
import DomManager from '../../managers/domManager'
import DropdownManager from '../../managers/dropdownManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'
import CardButton from './cardButton'
import StringAsHtmlElement from './stringAsHtmlElement'

export default function Form({
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
  viewDropdown,
  cancelButtonText = 'Close',
  extraButtons = [],
}) {
  const {state, setState} = useContext(globalState)
  const {theme, creationFormToShow} = state
  const [refreshKey, setRefreshKey] = useState(Manager.GetUid())

  const ScrollToTop = () => {
    const header = document.querySelector('.form-title')
    header.scrollIntoView({behavior: 'smooth', block: 'end'})
  }

  // Detect when dropdown is opened
  useDetectElement('[class*="q5-menu"]', (e) => {
    const activeFormCard = document.querySelector(`.form-card.active`)
    const closeDropdownButton = activeFormCard.querySelector('.close-dropdown-button')

    if (Manager.IsValid(closeDropdownButton)) {
      DropdownManager.ToggleHiddenOnInputs('add')
      closeDropdownButton.classList.add('active')
    }
  })

  useEffect(() => {
    let activeForm = document.querySelector(`.${wrapperClass}.form-wrapper.active`)

    // Check if creationFormToShow is valid -> find the form wrapper
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

      // Show or hide card
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
        }
      }
    }
  }, [showCard])

  return (
    <div key={refreshKey} className={`form-wrapper${showCard ? ` active` : ''} ${wrapperClass}`}>
      <div className={`form-card${showCard ? ` active` : ''}`}>
        <div className="content-wrapper">
          {Manager.IsValid(title) && (
            <div className="header">
              <p className={'form-title'} onClick={(e) => DomManager.ToggleActive(e.currentTarget)}>
                {titleIcon && <span className="svg-wrapper">{titleIcon}</span>}
                {StringManager.FormatTitle(title, true)}
              </p>
              {Manager.IsValid(subtitle, true) && <StringAsHtmlElement classes={'subtitle'} text={subtitle} />}
            </div>
          )}

          {viewDropdown}
          {children}
        </div>
      </div>
      <div className={`flex card-buttons`}>
        {hasSubmitButton && (
          <CardButton
            buttonTheme={ButtonThemes.green}
            text={submitText}
            classes="card-button"
            onClick={() => {
              onSubmit()
            }}
          />
        )}

        {hasDelete && <CardButton text={deleteButtonText} buttonTheme={ButtonThemes.red} classes="card-button" onClick={onDelete} />}

        {/* EXTRA BUTTONS */}
        {Manager.IsValid(extraButtons) &&
          extraButtons.map((button, index) => {
            return cloneElement(button, {key: index})
          })}

        <CardButton
          text={cancelButtonText}
          buttonTheme={ButtonThemes.white}
          classes="card-button"
          onClick={() => {
            onClose()
            DropdownManager.ToggleHiddenOnInputs('remove')
            setRefreshKey(Manager.GetUid())
          }}
        />
      </div>
    </div>
  )
}