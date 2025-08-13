// Path: src\components\shared\dateTimePicker.jsx
import moment from "moment"
import React, {useContext, useEffect, useState} from "react"
import ButtonThemes from "../../constants/buttonThemes"
import DatetimeFormats from "../../constants/datetimeFormats"
import globalState from "../../context"
import DateManager from "../../managers/dateManager"
import Manager from "../../managers/manager"
import CardButton from "./cardButton"
import Datepicker from "./datepicker"
import Label from "./label"
import StringAsHtmlElement from "./stringAsHtmlElement"
import TimePicker from "./timePicker"
import ToggleButton from "./toggleButton"

function DateTimePicker({defaultValue, show, callback = (datetime) => {}, hide = () => {}}) {
    const {state, setState} = useContext(globalState)
    const {currentUser} = state

    // STATE
    const [startTime, setStartTime] = useState(moment(defaultValue, DateManager.GetMomentFormat(defaultValue)).format(DatetimeFormats.timeForDb))
    const [endTime, setEndTime] = useState()
    const [startDate, setStartDate] = useState()
    const [endDate, setEndDate] = useState()
    const [timeResetKey, setTimeResetKey] = useState("0")
    const [view, setView] = useState("start-date")
    const [displayDateTime, setDisplayDateTime] = useState("")
    const [multipleDateSelection, setMultipleDateSelection] = useState(false)

    const ThrowError = (title, message = "") => {
        setState({...state, isLoading: false, bannerTitle: title, bannerMessage: message, bannerType: "error"})
        return false
    }

    const ExecuteCallback = () => {
        const updated = DateManager.ComposeDateTime({startTime, endTime, startDate, endDate})
        callback({...updated})
    }

    const ResetViews = () => {
        const allViewElements = document.querySelectorAll(".date-time-picker.active .view")
        allViewElements.forEach((element) => element.classList.remove("active"))
    }

    const ResetViewButtons = () => {
        const allViewElements = document.querySelectorAll(".date-time-picker .view-button")
        allViewElements.forEach((element) => element.classList.remove("active"))
    }

    const UpdateView = (view) => {
        ResetViews()
        ResetViewButtons()
        setView(view)
    }

    const ThrowErrorFromUseEffect = (title, message) => ThrowError(title, message)

    // Set Default Value
    useEffect(() => {
        if (Manager.IsValid(defaultValue, true)) setStartDate(defaultValue)
    }, [defaultValue])

    // Check for past date -> Compose DateTime if valid
    useEffect(() => {
        if (Manager.IsValid(startDate) && Manager.IsValid(endDate)) {
            const isPastDate = DateManager.IsPastDate(startDate, endDate)
            if (isPastDate) {
                ThrowErrorFromUseEffect(
                    "End Date is not After Start Date",
                    `Please choose a date that is after ${moment(startDate).format(DatetimeFormats.dateForDb)}`
                )
            }
        }
        const composed = DateManager.ComposeDateTime({startDate, endDate, startTime, endTime})
        const {displayDatetime} = composed

        // Set Readable displayDatetime
        setDisplayDateTime(displayDatetime.replace("@ 12:00am", ""))
    }, [startDate, startTime, endDate, endTime, defaultValue])

    return (
        <div className={`date-time-picker${show ? " active" : ""}`}>
            <StringAsHtmlElement text={displayDateTime} classes={"selected-datetime"} />

            {/* CONTENT -> PICKERS */}
            <div className="datetime-picker-content">
                <Datepicker
                    multipleDaySelection={multipleDateSelection}
                    startOrEnd={"start"}
                    defaultValue={defaultValue}
                    show={view === "start-date"}
                    callback={(date) => setStartDate(date)}
                />
                <Datepicker
                    multipleDaySelection={multipleDateSelection}
                    startOrEnd={"end"}
                    defaultValue={defaultValue}
                    show={view === "end-date"}
                    callback={(date) => setEndDate(date)}
                />
                <TimePicker
                    // timeResetKey={timeResetKey}
                    defaultValue={defaultValue}
                    show={view === "start-time"}
                    callback={(time) => setStartTime(time)}
                />
                <TimePicker
                    // timeResetKey={timeResetKey}
                    defaultValue={defaultValue}
                    show={view === "end-time"}
                    callback={(time) => setEndTime(time)}
                />
            </div>
            {/* VIEW SELECTOR */}
            <div className={`views-selector ${view}`}>
                <div className="multi-day-toggle-wrapper">
                    <Label text={"Multiple Days"} />
                    <ToggleButton onCheck={() => setMultipleDateSelection(true)} onUncheck={() => setMultipleDateSelection(false)} />
                </div>
                <div className="date-wrapper">
                    <p
                        className={`${view === "start-date" ? "active start-date" : "start-date"} view-button`}
                        onClick={() => UpdateView("start-date")}>
                        Start Date
                    </p>
                    <p
                        className={`${Manager.IsValid(startDate, true) ? "" : "disabled "}${view === "end-date" ? "active end-date" : "end-date"} view-button`}
                        onClick={() => UpdateView("end-date")}>
                        End Date (optional)
                    </p>
                </div>
                <div className="time-wrapper">
                    <p
                        className={`${view === "start-time" ? "active start-time" : "start-time"} view-button`}
                        onClick={() => UpdateView("start-time")}>
                        Start Time
                    </p>

                    <p
                        className={`${Manager.IsValid(startTime, true) ? "" : "disabled "}${view === "end-time" ? "active end-time" : "end-time"} view-button`}
                        onClick={() => UpdateView("end-time")}>
                        End Time (optional)
                    </p>
                </div>
            </div>
            <div className="card-buttons">
                <CardButton text={"Save"} buttonTheme={ButtonThemes.green} onClick={ExecuteCallback} />
                {Manager.IsValid(startTime) && (
                    <CardButton
                        text={"Remove Time"}
                        buttonTheme={ButtonThemes.yellow}
                        onClick={() => {
                            setStartTime(null)
                            setEndTime(null)
                            setTimeResetKey(Manager.GetUid())
                            setTimeout(() => {
                                const composed = DateManager.ComposeDateTime({startDate, endDate, startTime, endTime})
                                const {displayDatetime} = composed

                                // Set Readable displayDatetime
                                setDisplayDateTime(displayDatetime.replace("@ 12:00am", ""))
                            }, 500)
                        }}
                    />
                )}
                <CardButton text={"Dismiss"} buttonTheme={ButtonThemes.red} onClick={hide} />
            </div>
        </div>
    )
}

export default DateTimePicker