// Path: src\components\shared\inputField.jsx
import moment from "moment"
import React, {useContext, useRef, useState} from "react"
import {DebounceInput} from "react-debounce-input"
import {ImSearch} from "react-icons/im"
import {MdEmail, MdNotes, MdOutlinePassword, MdOutlineTitle} from "react-icons/md"
import {PiLinkSimpleHorizontalBold} from "react-icons/pi"
import {RiPhoneFill} from "react-icons/ri"
import TextareaAutosize from "react-textarea-autosize"
import DatetimeFormats from "../../constants/datetimeFormats"
import DetailRowIcons from "../../constants/detailRowIcons"
import InputTypes from "../../constants/inputTypes"
import globalState from "../../context.js"
import useCurrentUser from "../../hooks/useCurrentUser"
import Manager from "../../managers/manager"
import Label from "./label"

function InputField({
    wrapperClasses = "",
    inputType = InputTypes.text,
    dataValue = "",
    onChange,
    defaultValue = null,
    inputClasses = "",
    onKeyUp = (e) => {},
    onDateOrTimeSelection = (e) => {},
    placeholder = "",
    inputName = "",
    labelClasses = "",
    children = null,
    timeValue = moment().format(DatetimeFormats.timeForDb),
    onClick = () => {},
}) {
    const {state, setState} = useContext(globalState)
    const {theme} = state

    // HOOKS
    const {currentUser} = useCurrentUser()

    // STATE
    const [resetKey, setResetKey] = useState("")

    // REFS
    const textareaRef = useRef(null)

    const AutoResize = () => {
        const el = textareaRef.current
        if (el) {
            el.style.height = "auto"
            el.style.height = `${el.scrollHeight + 30}px`
        }
    }

    const OnValueChange = (e) => {
        const _this = e.target
        const value = _this.value

        if (Manager.IsValid(value, true)) {
            const parent = _this.parentElement
            parent.classList.add("filled")
        } else {
            const parent = _this.parentElement
            parent.classList.remove("filled")
        }
        onChange(e)
    }

    const GetTimeValue = () => {
        if (Manager.IsValid(defaultValue)) {
            return moment(defaultValue).format(DatetimeFormats.timeForDb)
        } else if (Manager.IsValid(timeValue) && !Manager.IsValid(defaultValue)) {
            return timeValue
        } else {
            return ""
        }
    }

    return (
        <>
            <div
                onClick={(e) => {
                    const wrapper = e.currentTarget
                    if (wrapper) {
                        wrapper.classList.add("active")
                    }
                }}
                onBlur={(e) => {
                    const wrapper = e.currentTarget
                    wrapper.classList.remove("active")
                }}
                className={`input-field ${wrapperClasses} ${inputType}`}>
                {/* TEXT */}
                {inputType === InputTypes.text && (
                    <>
                        <div className={`label-and-icon${Manager.IsValid(defaultValue) ? " filled" : ""}`}>
                            <MdOutlineTitle className={"input-icon text"} />
                            <Label text={placeholder} classes={labelClasses} />
                        </div>

                        <DebounceInput
                            data-value={dataValue}
                            value={Manager.IsValid(defaultValue) ? defaultValue : ""}
                            placeholder={placeholder}
                            className={`${inputClasses} `}
                            onChange={OnValueChange}
                            name={inputName}
                            debounceTimeout={0}
                            key={resetKey}
                        />

                        {children}
                    </>
                )}

                {/* SEARCH */}
                {inputType === InputTypes.search && (
                    <>
                        <div className="label-and-icon">
                            <ImSearch className={"input-icon text"} />
                            <Label text={placeholder} classes={labelClasses} />
                        </div>
                        <DebounceInput
                            value={Manager.IsValid(defaultValue) ? defaultValue : ""}
                            placeholder={""}
                            className={`${inputClasses ? ` ${inputClasses}` : ""}`}
                            onChange={OnValueChange}
                            name={inputName}
                            debounceTimeout={0}
                            key={resetKey}
                        />
                    </>
                )}

                {/* NUMBER */}
                {inputType === InputTypes.number && (
                    <>
                        <div className="label-and-icon">
                            {DetailRowIcons.money}
                            <Label text={placeholder} classes={labelClasses} />
                        </div>
                        <input
                            type="tel"
                            id="number"
                            name={inputName}
                            placeholder={placeholder}
                            key={resetKey}
                            pattern="[0-9]"
                            defaultValue={defaultValue}
                            onChange={OnValueChange}
                        />
                    </>
                )}

                {/* PHONE */}
                {inputType === InputTypes.phone && (
                    <>
                        <div className="label-and-icon">
                            <RiPhoneFill className={"input-icon phone"} />
                            <Label text={placeholder} classes={labelClasses} />
                        </div>
                        <input
                            type="tel"
                            name={inputName}
                            maxLength={16}
                            className={`${inputClasses ? ` ${inputClasses}` : ""}`}
                            key={resetKey}
                            pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                            defaultValue={defaultValue}
                            onChange={(e) => {
                                let value = e.target.value
                                e.target.value = value.replace(/[^0-9+]/g, "")
                                OnValueChange(e)
                                onChange(e)
                            }}
                        />
                        {children}
                    </>
                )}

                {/* URL */}
                {inputType === InputTypes.url && (
                    <>
                        <div className="label-and-icon">
                            <PiLinkSimpleHorizontalBold className={"input-icon website"} />
                            <Label text={placeholder} classes={labelClasses} />
                        </div>
                        <input
                            type="url"
                            id="url"
                            placeholder={placeholder}
                            onChange={OnValueChange}
                            name={inputName}
                            className={`${inputClasses}  url`}
                            defaultValue={defaultValue}
                            key={resetKey}
                        />
                    </>
                )}

                {/* EMAIL */}
                {inputType === InputTypes.email && (
                    <>
                        <MdEmail className={"input-icon"} />
                        <input
                            type="email"
                            id="email"
                            placeholder={placeholder}
                            onChange={OnValueChange}
                            name={inputName}
                            className={`${inputClasses} `}
                            defaultValue={defaultValue}
                            key={resetKey}
                        />
                    </>
                )}

                {/* PASSWORD */}
                {inputType === InputTypes.password && (
                    <>
                        <MdOutlinePassword className={"input-icon"} />
                        <input
                            type="password"
                            id="password"
                            placeholder={placeholder}
                            onChange={OnValueChange}
                            className={`${inputClasses} `}
                            defaultValue={defaultValue}
                            key={resetKey}
                        />
                    </>
                )}

                {/* TEXTAREA */}
                {inputType === InputTypes.textarea && (
                    <>
                        <div className="label-and-icon">
                            <MdNotes className={"input-icon notes"} />
                            <Label text={placeholder} classes={labelClasses} />
                        </div>
                        <textarea
                            id="textarea"
                            placeholder={placeholder}
                            onChange={(e) => {
                                onChange(e)
                            }}
                            onKeyUp={onKeyUp}
                            className={`${inputClasses}  textarea`}
                            name={inputName}
                            defaultValue={defaultValue}
                            key={resetKey}
                        />
                    </>
                )}

                {/* CHAT */}
                {inputType === InputTypes.chat && (
                    <TextareaAutosize
                        className={inputClasses}
                        placeholder={placeholder}
                        onChange={(e) => {
                            onChange(e)
                            AutoResize()
                        }}
                        onKeyUp={onKeyUp}
                    />
                )}
            </div>
        </>
    )
}

export default InputField