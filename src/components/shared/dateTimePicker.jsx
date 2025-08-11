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
import StringAsHtmlElement from "./stringAsHtmlElement"
import TimePicker from "./timePicker"

function DateTimePicker({defaultValue, show, callback = (datetime) => {}, hide = () => {}}) {
    const {state, setState} = useContext(globalState)
    const {currentUser} = state

    // STATE
    const [startTime, setStartTime] = useState()
    const [endTime, setEndTime] = useState()
    const [startDate, setStartDate] = useState()
    const [endDate, setEndDate] = useState()
    const [timeResetKey, setTimeResetKey] = useState("0")

    const [view, setView] = useState("start-date")
    const [displayDateTime, setDisplayDateTime] = useState()

    const ThrowError = (title, message = "") => {
        setState({...state, isLoading: false, bannerTitle: title, bannerMessage: message, bannerType: "error"})
        return false
    }

    const ComposeDateTime = () => {
        const formattedStartDate = moment(startDate).format(DatetimeFormats.readableMonthAndDayShort)
        const formattedEndDate = Manager.IsValid(endDate) ? moment(endDate).format(DatetimeFormats.readableMonthAndDayShort) : null
        const formattedStartTime = Manager.IsValid(startTime) ? moment(startTime, "h:mma").format(DatetimeFormats.timeForDb) : null
        const formattedEndTime = Manager.IsValid(endTime) ? moment(endTime, "h:mma").format(DatetimeFormats.timeForDb) : null
        let startDateTime = `${formattedStartDate}`
        let endDateTime = ""

        // START TIME
        if (Manager.IsValid(formattedStartTime, true)) startDateTime += ` ${formattedStartTime}`

        // END DATE
        if (Manager.IsValid(endDate) && Manager.IsValid(formattedEndDate)) endDateTime += ` ${formattedEndDate}`

        // END TIME
        if (Manager.IsValid(endDate) && Manager.IsValid(formattedEndTime)) endDateTime += ` ${formattedEndTime}`

        // Get Raw Dates/Times
        const rawStartDate = moment(startDate).format(DatetimeFormats.dateForDb)
        const rawEndDate = Manager.IsValid(endDate) ? moment(endDate).format(DatetimeFormats.dateForDb) : null
        const rawStartTime = Manager.IsValid(startTime) ? moment(startTime, "h:mma").format(DatetimeFormats.timeForDb) : null
        const rawEndTime = Manager.IsValid(endTime) ? moment(endTime, "h:mma").format(DatetimeFormats.timeForDb) : null
        // Compose & Set "toDisplay"
        let toDisplay = moment(startDate).format(DatetimeFormats.readableMonthAndDayShort)
        if (Manager.IsValid(formattedStartTime)) toDisplay += ` ${formattedStartTime}`
        if (Manager.IsValid(formattedEndDate)) toDisplay += ` - ${formattedEndDate}`
        if (Manager.IsValid(formattedEndTime)) toDisplay += ` ${formattedEndTime}`
        setDisplayDateTime(toDisplay)

        return {
            startDate: rawStartDate,
            endDate: rawEndDate,
            startTime: rawStartTime,
            endTime: rawEndTime,
        }
    }

    const ExecuteCallback = () => {
        const updated = ComposeDateTime()
        const {startTime, endTime, startDate, endDate} = updated

        callback({startTime, endTime, startDate, endDate})
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

    // Check for past date -> Compose DateTime if valid
    useEffect(() => {
        if (Manager.IsValid(startDate) && Manager.IsValid(endDate)) {
            const isPastDate = DateManager.IsPastDate(startDate, endDate)
            if (isPastDate) {
                ThrowErrorFromUseEffect(
                    "End Date is not After Start Date",
                    `Please choose a date that is after ${moment(startDate).format(DatetimeFormats.dateForDb)}`
                )
            } else {
                ComposeDateTime()
            }
        } else {
            ComposeDateTime()
        }
    }, [startDate, startTime, endDate, endTime])

    return (
        <div className={`date-time-picker${show ? " active" : ""}`}>
            <StringAsHtmlElement text={displayDateTime} classes={"selected-datetime"} />

            {/* CONTENT -> PICKERS */}
            <div className="content">
                <Datepicker startOrEnd={"start"} defaultValue={defaultValue} show={view === "start-date"} callback={(date) => setStartDate(date)} />
                <Datepicker startOrEnd={"end"} defaultValue={defaultValue} show={view === "end-date"} callback={(date) => setEndDate(date)} />
                <TimePicker
                    timeResetKey={timeResetKey}
                    defaultValue={defaultValue}
                    show={view === "start-time"}
                    callback={(time) => setStartTime(time)}
                />
                <TimePicker
                    timeResetKey={timeResetKey}
                    defaultValue={defaultValue}
                    show={view === "end-time"}
                    callback={(time) => setEndTime(time)}
                />
            </div>

            {/* VIEW SELECTOR */}
            <div className={`views-selector ${view}`}>
                <div className="date-wrapper">
                    <p
                        className={`${view === "start-date" ? "active start-date" : "start-date"} view-button`}
                        onClick={() => UpdateView("start-date")}>
                        Start Date
                    </p>
                    <p
                        className={`${Manager.IsValid(startTime, true) ? "" : "disabled "}${view === "end-date" ? "active end-date" : "end-date"} view-button`}
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
                        }}
                    />
                )}
                <CardButton text={"Close"} buttonTheme={ButtonThemes.red} onClick={hide} />
            </div>
        </div>
    )
}

export default DateTimePicker