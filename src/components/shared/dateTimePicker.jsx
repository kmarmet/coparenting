// Path: src\components\shared\dateTimePicker.jsx
import moment from "moment"
import React, {useContext, useEffect, useState} from "react"
import {BsCalendarWeekFill} from "react-icons/bs"
import {TbClockHour4Filled} from "react-icons/tb"
import ButtonThemes from "../../constants/buttonThemes"
import DatetimeFormats from "../../constants/datetimeFormats"
import globalState from "../../context"
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

    const [view, setView] = useState("start-date")
    const [dateTime, setDateTime] = useState()
    const [displayDateTime, setDisplayDateTime] = useState()

    const ComposeDateTime = () => {
        const formattedStartDate = moment(startDate).format(DatetimeFormats.dateForDb)
        const formattedEndDate = moment(endDate).format(DatetimeFormats.dateForDb)
        const formattedStartTime = moment(startTime, "h:mma").format(DatetimeFormats.timeForDb)
        const formattedEndTime = moment(endTime, "h:mma").format(DatetimeFormats.timeForDb)
        let startDateTime = `${formattedStartDate} ${formattedStartTime}`
        let endDateTime = `${formattedEndDate} ${formattedEndTime}`
        console.log("end date", endDate)
        console.log("Formatted End Date", formattedEndDate)

        let forDisplay = `${formattedStartDate}`

        // START TIME
        if (Manager.IsValid(formattedStartTime, true)) {
            forDisplay += ` @ ${formattedStartTime}`
        }

        // END DATE
        if (Manager.IsValid(endDate, true) && Manager.IsValid(formattedEndDate, true)) {
            forDisplay += ` to ${formattedEndDate}`
        }

        // END TIME
        if (Manager.IsValid(endDate, true) && Manager.IsValid(formattedEndTime, true)) {
            forDisplay += ` @ ${formattedEndTime}`
        }

        // Strip out "12:00am" unless it was explicitly chosen
        forDisplay = forDisplay.replaceAll("12:00am", "").replace("to", "<br/>to<br/>").trim()
        console.log(forDisplay)

        setDateTime(startDateTime)
        setDisplayDateTime(forDisplay)

        return {
            startDateTime,
            endDateTime,
            forDisplay,
        }
    }

    const ExecuteCallback = () => {
        const updated = ComposeDateTime()
        const {startDateTime, endDateTime, forDisplay} = updated

        callback({startDateTime, endDateTime, forDisplay})
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

    useEffect(() => {
        console.log("End Date", endDate)
        ComposeDateTime()
    }, [startDate, startTime, endDate, endTime])

    return (
        <div className={`date-time-picker${show ? " active" : ""}`}>
            <StringAsHtmlElement text={displayDateTime} classes={"selected-datetime"} />
            <div className="content">
                <Datepicker startOrEnd={"start"} defaultValue={defaultValue} show={view === "start-date"} callback={(date) => setStartDate(date)} />
                <Datepicker startOrEnd={"end"} defaultValue={defaultValue} show={view === "end-date"} callback={(date) => setEndDate(date)} />
                <TimePicker defaultValue={defaultValue} show={view === "start-time"} callback={(time) => setStartTime(time)} />
                <TimePicker defaultValue={defaultValue} show={view === "end-time"} callback={(time) => setEndTime(time)} />
            </div>
            <div className={`views-selector ${view}`}>
                <div className="date-wrapper">
                    <p className="selector-icon">
                        <BsCalendarWeekFill className={"calendar"} />
                    </p>
                    <p
                        className={`${view === "start-date" ? "active start-date" : "start-date"} view-button`}
                        onClick={() => UpdateView("start-date")}>
                        Start Date
                    </p>
                    <p className={`${view === "end-date" ? "active end-date" : "end-date"} view-button`} onClick={() => UpdateView("end-date")}>
                        End Date
                    </p>
                </div>
                <div className="time-wrapper">
                    <p className="selector-icon">
                        <TbClockHour4Filled />
                    </p>
                    <p
                        className={`${view === "start-time" ? "active start-time" : "start-time"} view-button`}
                        onClick={() => UpdateView("start-time")}>
                        Start Time
                    </p>
                    <p className={`${view === "end-time" ? "active end-time" : "end-time"} view-button`} onClick={() => UpdateView("end-time")}>
                        End Time
                    </p>
                </div>
            </div>
            <div className="card-buttons">
                <CardButton text={"Save"} buttonTheme={ButtonThemes.green} onClick={ExecuteCallback} />
                {Manager.IsValid(startTime, true) && (
                    <CardButton
                        text={"Remove Time"}
                        buttonTheme={ButtonThemes.yellow}
                        onClick={() => {
                            setStartTime(null)
                            setEndTime(null)
                        }}
                    />
                )}
                <CardButton text={"Close"} buttonTheme={ButtonThemes.red} onClick={hide} />
            </div>
        </div>
    )
}

export default DateTimePicker