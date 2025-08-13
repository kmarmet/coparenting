// Path: src\components\shared\form.jsx
import React, {cloneElement, useContext, useEffect, useState} from "react"
import ButtonThemes from "../../constants/buttonThemes"
import globalState from "../../context"
import Manager from "../../managers/manager"
import StringManager from "../../managers/stringManager"
import CardButton from "./cardButton"
import StringAsHtmlElement from "./stringAsHtmlElement"

export default function Form({
    submitText,
    onSubmit,
    onDelete,
    onClose,
    children,
    title,
    subtitle = "",
    subtitleClasses = "",
    showCard = false,
    hasDelete = false,
    hasSubmitButton = true,
    wrapperClass = "",
    deleteButtonText = "Delete",
    titleIcon = null,
    viewDropdown,
    cardButtonsClasses = "",
    cancelButtonText = "Dismiss",
    showLoadingSpinner,
    extraButtons = [],
    onOpen = () => {},
}) {
    const {state, setState} = useContext(globalState)
    const {creationFormToShow} = state
    const [submitted, setSubmitted] = useState(false)
    const [resetKey, setResetKey] = useState("")
    const [startDateSubtitle, setStartDateSubtitle] = useState("")
    const [endDateSubtitle, setEndDateSubtitle] = useState("")
    const [startTimeSubtitle, setStartTimeSubtitle] = useState("")
    const [endTimeSubtitle, setEndTimeSubtitle] = useState("")

    const ScrollToTop = () => {
        const header = document.querySelector(".form-title")
        header.scrollIntoView({behavior: "smooth", block: "end"})
    }

    useEffect(() => {
        const activeForm = document.querySelector(`.form-wrapper.active`)
        // On Open
        if (showCard && Manager.IsValid(activeForm)) {
            if (Manager.IsValid(onOpen)) {
                onOpen()
            }
        }
    }, [showCard])

    useEffect(() => {
        Manager.ResetForm("form-card.active")
        let activeForm = document.querySelector(`.${wrapperClass}.form-wrapper.active`)
        // Check if creationFormToShow is valid -> find the form wrapper
        if (Manager.IsValid(creationFormToShow, true)) {
            activeForm = document.querySelector(`.${creationFormToShow}.form-wrapper`)
        }
        if (activeForm) {
            const checkboxContainer = document.getElementById("share-with-checkbox-container")

            if (activeForm && StringManager.GetWordCount(title) >= 4) {
                const title = activeForm.querySelector("#form-title")
                if (title) {
                    title.classList.add("long-title")
                }
            }

            // Show or hide card
            if (Manager.IsValid(wrapperClass, true) && Manager.IsValid(activeForm)) {
                if (showCard) {
                    ScrollToTop()
                    const checkboxes = activeForm.querySelectorAll(".checkbox")
                    if (Manager.IsValid(checkboxes)) {
                        for (let checkbox of checkboxes) {
                            checkbox.checked = false
                        }
                    }

                    if (checkboxContainer) {
                        checkboxContainer.classList.remove("active")
                    }
                }
            }
        }

        if (!showCard) {
            setStartDateSubtitle(null)
            setEndDateSubtitle(null)
        }
    }, [showCard])

    return (
        <div key={resetKey} className={`form-wrapper${showCard ? ` active` : ""} ${wrapperClass}`}>
            <div className={`form-card${showCard ? " active" : ""}`}>
                <div className={`content-wrapper`}>
                    {Manager.IsValid(title) && (
                        // HEADER
                        <div className="header">
                            <div className="flex">
                                <div
                                    className={`form-title${StringManager.GetWordCount(title) >= 3 ? " long-title" : ""}`}
                                    dangerouslySetInnerHTML={{__html: StringManager.FormatTitle(title, true)}}></div>
                                {titleIcon && <span className="svg-wrapper">{titleIcon}</span>}
                            </div>

                            {/* SUBTITLE */}
                            {Manager.IsValid(subtitle, true) && (
                                <div className="subtitle-wrapper">
                                    <StringAsHtmlElement
                                        classes={`subtitle in-form${Manager.IsValid(subtitleClasses, true) ? ` ${subtitleClasses}` : ""}`}
                                        text={subtitle}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {viewDropdown}
                    {children}
                </div>
            </div>

            {/* CARD BUTTONS */}
            <div className={`flex card-buttons${Manager.IsValid(cardButtonsClasses, true) ? ` ${cardButtonsClasses}` : ""}`}>
                {hasSubmitButton && (
                    <CardButton
                        buttonTheme={ButtonThemes.green}
                        text={submitText}
                        showLoadingSpinner={showLoadingSpinner}
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
                        setState({...state, showOverlay: false, isLoading: false, creationFormToShow: null})
                    }}
                />
            </div>
        </div>
    )
}