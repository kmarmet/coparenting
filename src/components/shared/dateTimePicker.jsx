// Path: src\components\shared\dateTimePicker.jsx
import moment from "moment"
import React, {useContext, useEffect, useState} from "react"
import {BsCalendarWeek, BsCalendarWeekFill} from "react-icons/bs"
import {TbClockHour4, TbClockHour4Filled} from "react-icons/tb"
import ButtonThemes from "../../constants/buttonThemes"
import DatetimeFormats from "../../constants/datetimeFormats"
import globalState from "../../context"
import DateManager from "../../managers/dateManager"
import CardButton from "./cardButton"
import Datepicker from "./datepicker"
import TimePicker from "./timePicker"

function DateTimePicker({defaultValue, show, callback = (datetime) => {}}) {
    const {state, setState} = useContext(globalState)
    const {currentUser} = state

    // STATE
    const [time, setTime] = useState()
    const [date, setDate] = useState()
    const [view, setView] = useState("date")
    const [dateTime, setDateTime] = useState()

    const ComposeDateTime = () => {
        const formattedDate = moment(date).format(DatetimeFormats.dateForDb)
        const formattedTime = moment(time, "h:mma").format(DatetimeFormats.timeForDb)
        let dateTime = moment(`${formattedDate} ${formattedTime}`, `${DatetimeFormats.dateForDb} ${DatetimeFormats.timeForDb}`).format(
            DatetimeFormats.timestamp
        )
        setDateTime(dateTime)
    }

    const ExecuteCallback = () => {
        const formattedDate = moment(date).format(DatetimeFormats.dateForDb)
        const formattedTime = moment(time, "h:mma").format(DatetimeFormats.timeForDb)
        let dateTime = moment(`${formattedDate} ${formattedTime}`, `${DatetimeFormats.dateForDb} ${DatetimeFormats.timeForDb}`).format(
            DatetimeFormats.timestamp
        )
        callback({date: formattedDate, time: formattedTime, datetime: dateTime})
    }

    useEffect(() => {
        ComposeDateTime()
    }, [date, time])

    return (
        <div className={`date-time-picker${show ? " active" : ""}`}>
            <div className={`views-selector ${view}`}>
                <p className={view === "date" ? "active" : ""} onClick={() => setView("date")}>
                    Date
                    {view === "date" && <BsCalendarWeekFill className={"calendar"} />}
                    {view !== "date" && <BsCalendarWeek className={"calendar"} />}
                </p>
                <p className={view === "time" ? "active" : ""} onClick={() => setView("time")}>
                    Time
                    {view === "time" && <TbClockHour4Filled />}
                    {view !== "time" && <TbClockHour4 />}
                </p>
            </div>
            <p className="selected-datetime">
                {DateManager.ParseAnyDate(dateTime)?.moment?.format(DatetimeFormats.timestamp).replace(" 12:00am", "")}
            </p>
            <div className="content">
                <Datepicker defaultValue={defaultValue} show={view === "date"} callback={(date) => setDate(date)} />
                <TimePicker defaultValue={defaultValue} show={view === "time"} callback={(time) => setTime(time)} />
            </div>
            <div className="card-buttons">
                <CardButton text={"Save Date & Time"} buttonTheme={ButtonThemes.green} onClick={ExecuteCallback} />
                <CardButton text={"Remove Time"} buttonTheme={ButtonThemes.yellow} onClick={() => setTime(null)} />
            </div>
        </div>
    )
}

export default DateTimePicker