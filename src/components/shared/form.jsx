// Path: src\components\shared\form.jsx
import React, {cloneElement, useContext, useEffect, useState} from 'react'
import ButtonThemes from '../../constants/buttonThemes'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'
import CardButton from './cardButton'
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
    const [submitted, setSubmitted] = useState(false)

    const ScrollToTop = () => {
        const header = document.querySelector('.form-title')
        header.scrollIntoView({behavior: 'smooth', block: 'end'})
    }

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
            <div className={`form-card${showCard ? ' active' : ''}`}>
                <div className={`content-wrapper`}>
                    {Manager.IsValid(title) && (
                        <div className="header">
                            <p className={'form-title'} onClick={(e) => DomManager.ToggleActive(e.currentTarget)}>
                                {titleIcon && <span className="svg-wrapper">{titleIcon}</span>}
                                {StringManager.FormatTitle(title, true)}
                            </p>
                            <Spacer height={5} />
                            {Manager.IsValid(subtitle, true) && <StringAsHtmlElement classes={'subtitle'} text={subtitle} />}
                        </div>
                    )}

                    {viewDropdown}
                    {children}
                </div>
            </div>

            {/* CARD BUTTONS */}
            <div className={`flex card-buttons`}>
                {hasSubmitButton && (
                    <CardButton
                        buttonTheme={ButtonThemes.green}
                        text={submitText}
                        classes="card-button"
                        onClick={() => {
                            if (submitted === false) {
                                onSubmit()
                                setSubmitted(true)
                            }
                            setTimeout(() => {
                                setSubmitted(false)
                            }, 500)
                        }}
                    />
                )}

                {/* DELETE BUTTON */}
                {hasDelete && <CardButton text={deleteButtonText} buttonTheme={ButtonThemes.red} classes="card-button" onClick={onDelete} />}

                {/* EXTRA BUTTONS */}
                {Manager.IsValid(extraButtons) &&
                    extraButtons.map((button, index) => {
                        return cloneElement(button, {key: index})
                    })}

                {/* CANCEL/CLOSE BUTTON */}
                <CardButton
                    text={cancelButtonText}
                    buttonTheme={ButtonThemes.white}
                    classes="card-button"
                    onClick={() => {
                        onClose()
                        setSubmitted(false)
                        setRefreshKey(Manager.GetUid())
                        setState({...state, showOverlay: false, isLoading: false, creationFormToShow: null})
                    }}
                />
            </div>
        </div>
    )
}