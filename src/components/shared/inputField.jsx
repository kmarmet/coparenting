// Path: src\components\shared\inputField.jsx
import {MobileDatePicker, MobileDateRangePicker, MobileTimePicker, SingleInputDateRangeField} from "@mui/x-date-pickers-pro"
import moment from "moment"
import React, {useContext, useEffect, useRef, useState} from "react"
import {DebounceInput} from "react-debounce-input"
import {BsCalendar2WeekFill} from "react-icons/bs"
import {ImSearch} from "react-icons/im"
import {MdEmail, MdNotes, MdOutlinePassword, MdOutlineTitle} from "react-icons/md"
import {PiArrowBendLeftUpFill, PiLinkSimpleHorizontalBold} from "react-icons/pi"
import {RiPhoneFill} from "react-icons/ri"
import {WiTime4} from "react-icons/wi"
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
    timeViews = ["hours", "minutes"],
    placeholder = "",
    dateFormat = DatetimeFormats.readableMonthAndDay,
    inputName = "",
    labelClasses = "",
    children = null,
    isCurrency = false,
}) {
    const {state, setState} = useContext(globalState)
    const {refreshKey, theme} = state
    const {currentUser} = useCurrentUser()
    const [holidayRetrievalError, setError] = useState("")

    const textareaRef = useRef(null)

    const autoResize = () => {
        const el = textareaRef.current
        if (el) {
            el.style.height = "auto"
            el.style.height = `${el.scrollHeight + 30}px`
        }
    }

    useEffect(() => {
        DomManager.AddThemeToDatePickers(currentUser)
    }, [refreshKey])

    return (
        <>
            {Manager.IsValid(defaultValue) && inputType !== InputTypes.search && (
                <Label text={placeholder} classes={`always-show filled-input-label${labelClasses ? ` ${labelClasses}` : ""}`} />
            )}
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
                className={`input-field ${wrapperClasses} ${inputType} ${Manager.IsValid(defaultValue) ? "show-label" : ""}`}>
                {/* DATE */}
                {inputType === InputTypes.date && (
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
                        label={placeholder}
                        onOpen={() => DomManager.AddThemeToDatePickers(currentUser)}
                        views={["month", "day"]}
                        name={inputName}
                        className={`${theme} ${inputClasses} date-picker`}
                        value={Manager.IsValid(defaultValue) ? moment(defaultValue) : null}
                        key={refreshKey}
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
                        onAccept={onDateOrTimeSelection}
                    />
                )}

                {/* DATE RANGE */}
                {inputType === InputTypes.dateRange && (
                    <MobileDateRangePicker
                        onAccept={onDateOrTimeSelection}
                        defaultValue={Manager.IsValid(defaultValue) ? moment(defaultValue) : null}
                        slots={{field: SingleInputDateRangeField}}
                        key={refreshKey}
                        onOpen={() => DomManager.AddThemeToDatePickers(currentUser)}
                        label={labelText}
                        name="allowedRange"
                    />
                )}

                {/* TIME */}
                {inputType === InputTypes.time && (
                    <MobileTimePicker
                        slotProps={{
                            actionBar: {actions: ["clear", "accept"]},
                            textField: {
                                label: (
                                    <span>
                                        <WiTime4 />
                                        {placeholder}
                                    </span>
                                ),
                            },
                            paper: {
                                className: "time-picker",
                            },
                        }}
                        name={"time-picker"}
                        views={timeViews}
                        value={Manager.IsValid(defaultValue) ? moment(defaultValue, DatetimeFormats.timeForDb) : null}
                        label={placeholder}
                        minutesStep={5}
                        onOpen={() => DomManager.AddThemeToDatePickers(currentUser)}
                        key={refreshKey}
                        format={"h:mma"}
                        onAccept={onDateOrTimeSelection}
                    />
                )}

                {/* TEXT */}
                {inputType === InputTypes.text && (
                    <>
                        <MdOutlineTitle className={"input-icon text"} />

                        <div className="input-and-children">
                            <DebounceInput
                                data-value={dataValue}
                                value={Manager.IsValid(defaultValue) ? defaultValue : ""}
                                placeholder={placeholder}
                                className={`${inputClasses} with-icon`}
                                onChange={onChange}
                                name={inputName}
                                debounceTimeout={0}
                                key={refreshKey}
                            />
                            {children}
                        </div>
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
                            key={refreshKey}
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
                            key={refreshKey}
                            pattern="[0-9]"
                            defaultValue={defaultValue}
                            onChange={onChange}
                        />
                    </>
                )}

                {/* PHONE */}
                {inputType === InputTypes.phone && (
                    <>
                        <RiPhoneFill className={"input-icon phone"} />
                        <div className={"input-and-children"}>
                            <input
                                type="tel"
                                id="phone"
                                name={inputName}
                                maxLength={16}
                                className={`${inputClasses} with-icon`}
                                placeholder={placeholder}
                                key={refreshKey}
                                pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                                defaultValue={defaultValue}
                                onChange={(e) => {
                                    let value = e.target.value
                                    e.target.value = value.replace(/[^0-9+]/g, "")
                                    onChange(e)
                                }}
                            />
                            {children}
                        </div>
                    </>
                )}

                {/* URL */}
                {inputType === InputTypes.url && (
                    <>
                        <PiLinkSimpleHorizontalBold className={"input-icon website"} />
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
                            key={refreshKey}
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
                            key={refreshKey}
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
                            key={refreshKey}
                        />
                    </>
                )}

                {/* TEXTAREA */}
                {inputType === InputTypes.textarea && (
                    <>
                        <MdNotes className={"input-icon notes"} />
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
                            key={refreshKey}
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
                            autoResize()
                        }}
                        onKeyUp={onKeyUp}
                    />
                )}
            </div>
            {Manager.IsValid(holidayRetrievalError, true) && (
                <p className="input-field-holidayRetrievalError">
                    <PiArrowBendLeftUpFill />
                    {holidayRetrievalError}
                </p>
            )}
        </>
    )
}

export default InputField