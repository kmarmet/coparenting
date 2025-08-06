import moment from "moment"
import React, {useContext, useEffect, useState} from "react"
import {FaAngleLeft, FaAngleRight} from "react-icons/fa6"
import globalState from "../../context"
import Manager from "../../managers/manager"

const Datepicker = ({show, setShow = (bool) => {}, setDate = (date) => {}}) => {
    const {state, setState} = useContext(globalState)
    const {theme, currentScreen, refreshKey, selectedCalendarDate} = state

    // STATE
    const [activeDate, setActiveDate] = useState(moment())

    const ChunkIntoWeeks = (daysArray) => {
        const weeks = []
        for (let i = 0; i < daysArray.length; i += 7) {
            weeks.push(daysArray.slice(i, i + 7))
        }
        return weeks
    }
    const Init = () => {
        const year = moment().year()
        const month = moment(activeDate).month()
        const calendar = document.querySelector(".datepicker")
        const daysWrapper = calendar.querySelector(".days")
        const days = []
        const date = moment([year, month]) // month is 0-indexed
        const firstDayOfWeek = moment([year, month, 1]).day() // 0 = Sunday
        calendar.classList.add("active")

        if (Manager.IsValid(daysWrapper)) {
            daysWrapper.innerHTML = ""
        }

        // Add empty slots before the 1st day
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null)
        }

        const daysInMonth = date.daysInMonth()

        console.log(daysInMonth)

        // Handle days before the first day of current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(moment([year, month, i]).format("MM/DD/yyyy"))
        }

        // Get weeks
        const weeks = ChunkIntoWeeks(days)
        const daysFromWeeks = []

        // Get days from weeks
        for (let week of weeks) {
            let weekDays = []
            for (let date of week) {
                weekDays.push(date)
            }
            daysFromWeeks.push(weekDays)
        }

        // Append days
        for (const week of daysFromWeeks) {
            for (const weekday of week) {
                const date = moment(weekday)
                const dayOfWeek = date.day()
                const newDayElement = document.createElement("span")
                newDayElement.classList.add("day")
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    newDayElement.classList.add("weekend-day")
                }
                newDayElement.setAttribute("date", moment(weekday).format("MM/DD/yyyy"))
                newDayElement.textContent = weekday ? moment(weekday).format("D") : ""

                daysWrapper.append(newDayElement)
            }
        }
    }

    const ResetCalendar = () => {
        const calendar = document.querySelector(".datepicker")
        const dayElements = document.querySelectorAll(".datepicker .day")
        calendar.classList.remove("active")

        if (Manager.IsValid(dayElements) && Manager.IsValid(dayElements[0])) {
            dayElements.forEach((day) => {
                day.classList.remove("active")
            })
            calendar.innerHTML = ""
        }
    }

    useEffect(() => {
        if (show) Init()
    }, [show])

    useEffect(() => {
        if (moment(activeDate).format("MM") !== moment().format("MM")) {
            ResetCalendar()
            Init()
        }
    }, [activeDate])

    return (
        <div
            className={`datepicker${show ? " active" : ""}`}
            onClick={(e) => {
                const dayElements = document.querySelectorAll(".datepicker .day")

                if (Manager.IsValid(dayElements)) {
                    dayElements.forEach((day) => {
                        day.classList.remove("active")
                    })
                }
                const clicked = e.target
                if (clicked?.classList.contains("day")) {
                    setDate(moment(clicked?.getAttribute("date")))
                    setActiveDate(moment(clicked?.getAttribute("date")))
                    clicked?.classList.add("active")
                    setShow(false)
                }
            }}>
            <div className="weekday-labels">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
            </div>
            <div className="days"></div>
            <div className="action-row">
                <span
                    className="previous-month month-button"
                    onClick={() => {
                        if (moment(activeDate).month() > 0) {
                            setActiveDate(moment(activeDate).subtract(1, "month"))
                        }
                    }}>
                    <FaAngleLeft className={"left"} /> {moment(activeDate).subtract(1, "month").format("MMM")}
                </span>

                <span
                    className="next-month month-button"
                    onClick={() => {
                        if (moment(activeDate).month() < 11) {
                            setActiveDate(moment(activeDate).add(1, "month"))
                        }
                    }}>
                    {moment(activeDate).add(1, "month").format("MMM")} <FaAngleRight className={"right"} />
                </span>
            </div>
        </div>
    )
}

export default Datepicker