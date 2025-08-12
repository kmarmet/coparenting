import moment from "moment"
import React, {useContext, useEffect, useState} from "react"
import {FaAngleLeft, FaAngleRight} from "react-icons/fa6"
import DatetimeFormats from "../../constants/datetimeFormats"
import globalState from "../../context"
import Manager from "../../managers/manager"

const Datepicker = ({defaultValue, show, callback = (date) => {}, startOrEnd = "start", multipleDaySelection = false}) => {
    const {state, setState} = useContext(globalState)
    const {theme, currentScreen, refreshKey, selectedCalendarDate} = state

    // STATE
    const [activeDate, setActiveDate] = useState(startOrEnd === "start" ? selectedCalendarDate : "")
    const [multipleDaySelectionDates, setMultipleDaySelectionDates] = useState([])

    const ChunkIntoWeeks = (daysArray) => {
        const weeks = []
        for (let i = 0; i < daysArray.length; i += 7) {
            weeks.push(daysArray.slice(i, i + 7))
        }
        return weeks
    }

    const BuildCalendarUI = (direction) => {
        let updatedDate

        if (direction && direction === "previous") {
            updatedDate = moment(moment(activeDate).subtract(1, "month"))
        }

        if (direction && direction === "next") {
            updatedDate = moment(moment(activeDate).add(1, "month"))
        }
        setActiveDate(updatedDate)
        const year = moment().year()
        const month = moment(updatedDate).month()
        const calendar = document.querySelector(".datepicker.active")
        const daysWrapper = calendar.querySelector(".days")
        const days = []
        const date = moment([year, month]) // month is 0-indexed
        const daysInMonth = date.daysInMonth()
        const firstDayOfWeek = moment([year, month, 1]).day() // 0 = Sunday

        if (Manager.IsValid(daysWrapper)) daysWrapper.innerHTML = ""

        // Add empty slots before the 1st day
        for (let i = 0; i < firstDayOfWeek; i++) days.push(null)

        // Handle days past and including the first day of current month
        for (let i = 1; i <= daysInMonth; i++) days.push(moment([year, month, i]).format("MM/DD/yyyy"))

        // Get weeks
        const weeks = ChunkIntoWeeks(days)
        const daysFromWeeks = []

        // Get days from weeks
        for (let week of weeks) {
            let weekDays = []
            for (let date of week) weekDays.push(date)
            daysFromWeeks.push(weekDays)
        }

        // Append days
        for (const week of daysFromWeeks) {
            for (const weekday of week) {
                const date = moment(weekday)
                const today = moment().format("MM/DD/yyyy")
                const dayOfWeek = date.day().toString()
                const newDayElement = document.createElement("span")
                newDayElement.classList.add("day")

                // TODAY
                if (moment(date).format("MM/DD/yyyy") === today && !Manager.IsValid(defaultValue, true)) {
                    newDayElement.classList.add("today", "active")
                }

                // HAS DEFAULT VALUE
                if (Manager.IsValid(defaultValue, true) && moment(date).format("MM/DD/yyyy") === defaultValue) {
                    newDayElement.classList.add("active")
                }
                if (dayOfWeek === "0" || dayOfWeek === "6") {
                    newDayElement.classList.add("weekend-day")
                }
                newDayElement.setAttribute("date", moment(weekday).format("MM/DD/yyyy"))
                newDayElement.textContent = weekday ? moment(weekday).format("D") : ""
                daysWrapper.append(newDayElement)
            }
        }
    }

    const HandleCalendarClick = (e, direction = "next") => {
        const clicked = e.target
        const dayDate = clicked?.getAttribute("date")

        const allDays = document.querySelectorAll(".day")

        if (!multipleDaySelection) {
            for (let day of allDays) day.classList.remove("active")
        }

        clicked?.classList?.toggle("active")

        if (clicked?.classList?.contains("day")) {
            if (multipleDaySelection) {
                setMultipleDaySelectionDates([...multipleDaySelectionDates, dayDate])
            } else {
                callback(moment(dayDate))
                setActiveDate(moment(dayDate).format(DatetimeFormats.dateForDb))
            }
        }
    }

    useEffect(() => {
        if (multipleDaySelection) {
            const today = document.querySelector(".day.today")
            today?.classList?.remove("active")
        }
    }, [multipleDaySelection])

    useEffect(() => {
        if (show) BuildCalendarUI()
    }, [show])

    return (
        <div className={`datepicker${show ? " active" : ""} view`} onClick={HandleCalendarClick}>
            {/* ACTION ROW */}
            <div className="action-row">
                {/* PREVIOUS MONTH */}
                <span
                    className={`previous-month month-button${moment(activeDate).month() === 0 ? " disabled" : ""}`}
                    onClick={() => BuildCalendarUI("previous")}>
                    <FaAngleLeft className={"left"} /> {moment(activeDate).subtract(1, "month").format("MMM")}
                </span>

                {/* ACTIVE MONTH */}
                <span className="active-month">{moment(activeDate).format("MMMM")}</span>

                {/* NEXT MONTH */}
                <span
                    className={`next-month month-button${moment(activeDate).month() === 11 ? " disabled" : ""}`}
                    onClick={() => BuildCalendarUI("next")}>
                    {moment(activeDate).add(1, "month").format("MMM")} <FaAngleRight className={"right"} />
                </span>
            </div>

            {/* WEEKDAY HEADERS */}
            <div className="weekday-labels">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
            </div>

            {/* DAYS WRAPPER */}
            <div className="days"></div>
        </div>
    )
}

export default Datepicker