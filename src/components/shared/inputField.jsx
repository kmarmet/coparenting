// Path: src\components\shared\inputField.jsx
import {MobileDatePicker, MobileDateRangePicker, SingleInputDateRangeField} from "@mui/x-date-pickers-pro"
import moment from "moment"
import React, {useContext, useRef, useState} from "react"
import {DebounceInput} from "react-debounce-input"
import {BsCalendar2CheckFill, BsCalendar2WeekFill} from "react-icons/bs"
import {ImSearch} from "react-icons/im"
import {IoTime} from "react-icons/io5"
import {MdEmail, MdNotes, MdOutlinePassword, MdOutlineTitle} from "react-icons/md"
import {PiLinkSimpleHorizontalBold} from "react-icons/pi"
import {RiPhoneFill} from "react-icons/ri"
import TextareaAutosize from "react-textarea-autosize"
import DatetimeFormats from "../../constants/datetimeFormats"
import InputTypes from "../../constants/inputTypes"
import globalState from "../../context.js"
import useCurrentUser from "../../hooks/useCurrentUser"
import DomManager from "../../managers/domManager"
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
    dateFormat = DatetimeFormats.readableMonthAndDay,
    inputName = "",
    labelClasses = "",
    children = null,
    isCurrency = false,
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

    const GetTimeValue = () => {
        if (Manager.IsValid(defaultValue)) {
            return moment(defaultValue).format(DatetimeFormats.timeForDb)
        } else if (Manager.IsValid(timeValue) && !Manager.IsValid(defaultValue)) {
            return timeValue
        } else {
            return ""
        }
    }

    const OnFocus = (e) => {
        const labelAndIcon = e.target.previousSibling
        if (labelAndIcon) {
            labelAndIcon.classList.add("filled")
        }
    }

    const OnBlur = (e) => {
        const labelAndIcon = e?.target?.previousSibling
        const inputValue = e?.target?.value
        if (labelAndIcon && !Manager.IsValid(inputValue, true)) {
            labelAndIcon.classList.remove("filled")
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
                onFocus={(e) => {
                    const wrapper = e.currentTarget
                    const inputValue = wrapper.querySelector("input")?.value
                    const textareaValue = wrapper.querySelector("textarea")?.value
                    const labelAndIcon = wrapper.querySelector(".label-and-icon")
                    if (Manager.IsValid(inputValue, true)) {
                        labelAndIcon.classList.add("filled")
                    }
                    if (Manager.IsValid(textareaValue, true)) {
                        labelAndIcon.classList.add("filled")
                    }
                }}
                onBlur={(e) => {
                    const wrapper = e.currentTarget
                    const inputValue = wrapper.querySelector("input")?.value
                    const textareaValue = wrapper.querySelector("textarea")?.value
                    const labelAndIcon = wrapper.querySelector(".label-and-icon")
                    if (Manager.IsValid(inputValue, true)) {
                        labelAndIcon?.classList?.add("filled")
                    }
                    if (Manager.IsValid(textareaValue, true)) {
                        labelAndIcon?.classList?.add("filled")
                    }
                    wrapper.classList.remove("active")
                }}
                className={`input-field ${wrapperClasses} ${inputType} ${Manager.IsValid(defaultValue) ? "show-label" : ""}`}>
                {/* DATE */}
                {inputType === InputTypes.date && (
                    <>
                        <div className={`label-and-icon${Manager.IsValid(defaultValue) ? " filled" : ""}`}>
                            <BsCalendar2CheckFill className={"input-icon text"} />
                            <Label text={placeholder} classes={`always-show filled-input-label${labelClasses ? ` ${labelClasses}` : ""}`} />
                        </div>
                        <MobileDatePicker
                            slotProps={{
                                actionBar: {actions: ["clear", "accept"]},
                                textField: {
                                    label: (
                                        <span>
                                            <BsCalendar2WeekFill className={"input-icon date"} fontSize="small" />
                                            {placeholder}
                                        </span>
                                    ),
                                },
                                mobilePaper: {
                                    className: "date-picker", // ✅ this will be added to MuiPaper-root
                                },
                            }}
                            showDaysOutsideCurrentMonth={true}
                            label={""}
                            minDate={moment()}
                            onOpen={() => DomManager.AddThemeToDatePickers(currentUser)}
                            views={["month", "day"]}
                            name={inputName}
                            className={`${theme} ${inputClasses} date-picker`}
                            value={Manager.IsValid(defaultValue) ? moment(defaultValue) : null}
                            key={resetKey}
                            multiple={false}
                            onMonthChange={(e) => {
                                const newMonth = moment(e).format("MMMM")
                                const activePicker = document.querySelector(`.MuiPaper-root.date-picker`)

                                if (!activePicker) return
                                const pickerMonth = activePicker.querySelector("h4.MuiTypography-root.MuiDatePickerToolbar-title")

                                if (!pickerMonth) return

                                pickerMonth.textContent = newMonth
                            }}
                            format={dateFormat}
                            onAccept={(e) => {
                                console.log(e)
                                onDateOrTimeSelection(e)
                            }}
                        />
                    </>
                )}

                {/* DATE RANGE */}
                {inputType === InputTypes.dateRange && (
                    <MobileDateRangePicker
                        onAccept={onDateOrTimeSelection}
                        defaultValue={Manager.IsValid(defaultValue) ? moment(defaultValue) : null}
                        slots={{field: SingleInputDateRangeField}}
                        key={resetKey}
                        onOpen={() => DomManager.AddThemeToDatePickers(currentUser)}
                        label={labelText}
                        name="allowedRange"
                    />
                )}

                {/* TIME */}
                {inputType === InputTypes.time && (
                    <>
                        <div className={`label-and-icon${Manager.IsValid(timeValue, true) ? " filled" : ""}`}>
                            <IoTime />
                            <Label text={placeholder} classes={`always-show filled-input-label${labelClasses ? ` ${labelClasses}` : ""}`} />
                        </div>
                        <input
                            key={resetKey}
                            onClick={onClick}
                            name={"time-picker"}
                            value={GetTimeValue()}
                            onChange={() => {}}
                            placeholder={placeholder}
                        />
                    </>
                )}

                {/* TEXT */}
                {inputType === InputTypes.text && (
                    <>
                        <div className={`label-and-icon${Manager.IsValid(defaultValue) ? " filled" : ""}`}>
                            <MdOutlineTitle className={"input-icon text"} />
                            <Label text={placeholder} classes={`always-show filled-input-label${labelClasses ? ` ${labelClasses}` : ""}`} />
                        </div>

                        <DebounceInput
                            onFocus={OnFocus}
                            onBlur={OnBlur}
                            data-value={dataValue}
                            value={Manager.IsValid(defaultValue) ? defaultValue : ""}
                            placeholder={placeholder}
                            className={`${inputClasses} with-icon`}
                            onChange={onChange}
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
                        <ImSearch className={"input-icon text"} />
                        <DebounceInput
                            value={Manager.IsValid(defaultValue) ? defaultValue : ""}
                            placeholder={placeholder}
                            className={`${inputClasses} with-icon`}
                            onChange={onChange}
                            name={inputName}
                            debounceTimeout={0}
                            key={resetKey}
                        />
                    </>
                )}

                {/* NUMBER */}
                {inputType === InputTypes.number && (
                    <>
                        {isCurrency && <span className="currency input-icon">$</span>}
                        <input
                            type="tel"
                            id="number"
                            name={inputName}
                            placeholder={isCurrency ? "0" : placeholder}
                            key={resetKey}
                            pattern="[0-9]"
                            defaultValue={defaultValue}
                            onChange={onChange}
                        />
                    </>
                )}

                {/* PHONE */}
                {inputType === InputTypes.phone && (
                    <>
                        <div className="label-and-icon">
                            <RiPhoneFill className={"input-icon phone"} />
                            <Label text={placeholder} classes={`always-show filled-input-label${labelClasses ? ` ${labelClasses}` : ""}`} />
                        </div>
                        <input
                            type="tel"
                            id="phone"
                            name={inputName}
                            maxLength={16}
                            className={`${inputClasses} with-icon`}
                            placeholder={placeholder}
                            key={resetKey}
                            pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                            defaultValue={defaultValue}
                            onChange={(e) => {
                                let value = e.target.value
                                e.target.value = value.replace(/[^0-9+]/g, "")
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
                            <Label text={placeholder} classes={`always-show filled-input-label${labelClasses ? ` ${labelClasses}` : ""}`} />
                        </div>
                        <input
                            type="url"
                            id="url"
                            placeholder={placeholder}
                            onChange={(e) => {
                                onChange(e)
                            }}
                            name={inputName}
                            className={`${inputClasses} with-icon url`}
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
                            onChange={onChange}
                            name={inputName}
                            className={`${inputClasses} with-icon`}
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
                            onChange={onChange}
                            className={`${inputClasses} with-icon`}
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
                            <Label text={placeholder} classes={`always-show filled-input-label${labelClasses ? ` ${labelClasses}` : ""}`} />
                        </div>
                        <textarea
                            id="textarea"
                            placeholder={placeholder}
                            onChange={(e) => {
                                onChange(e)
                            }}
                            onKeyUp={onKeyUp}
                            className={`${inputClasses} with-icon textarea`}
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