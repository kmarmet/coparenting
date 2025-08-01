// Path: src\components\screens\calendar\calendar.jsx
import {StaticDatePicker} from "@mui/x-date-pickers-pro"
import moment from "moment"
import React, {useContext, useEffect, useState} from "react"
import {BsStars} from "react-icons/bs"
import {FaMinus, FaPlus} from "react-icons/fa6"
import {LuCalendarSearch, LuListFilter} from "react-icons/lu"
import {MdSearchOff} from "react-icons/md"
import {PiCalendarDotsFill, PiCalendarXDuotone} from "react-icons/pi"
import EditCalEvent from "../../../components/forms/editCalEvent"
import NavBar from "../../../components/navBar.jsx"
import Form from "../../../components/shared/form"
import ButtonThemes from "../../../constants/buttonThemes"
import DatetimeFormats from "../../../constants/datetimeFormats"
import EventFilters from "../../../constants/eventFilters"
import FinancialKeywords from "../../../constants/financialKeywords"
import ScreenNames from "../../../constants/screenNames"
import globalState from "../../../context.js"
import useCalendarEvents from "../../../hooks/useCalendarEvents"
import useCurrentUser from "../../../hooks/useCurrentUser"
import useDetectElement from "../../../hooks/useDetectElement"
import useHolidays from "../../../hooks/useHolidays"
import DatasetManager from "../../../managers/datasetManager"
import DateManager from "../../../managers/dateManager"
import DomManager from "../../../managers/domManager"
import Manager from "../../../managers/manager"
import Button from "../../shared/button"
import InputField from "../../shared/inputField"
import Modal from "../../shared/modal.jsx"
import Screen from "../../shared/screen"
import ScreenHeader from "../../shared/screenHeader"
import Spacer from "../../shared/spacer"
import CalendarEvents from "./calendarEvents.jsx"
import CalendarLegend from "./calendarLegend.jsx"
import DesktopLegend from "./desktopLegend.jsx"

export default function EventCalendar() {
    const {state, setState} = useContext(globalState)
    const {theme, currentScreen, refreshKey, selectedCalendarDate} = state

    // MONTHS FOR DATE PICKER DROPDOWN
    const months = [
        {name: "January", number: 1},
        {name: "February", number: 2},
        {name: "March", number: 3},
        {name: "April", number: 4},
        {name: "May", number: 5},
        {name: "June", number: 6},
        {name: "July", number: 7},
        {name: "August", number: 8},
        {name: "September", number: 9},
        {name: "October", number: 10},
        {name: "November", number: 11},
        {name: "December", number: 12},
    ]

    // STATE
    const [eventToEdit, setEventToEdit] = useState(null)
    const [contentIsLoaded, setContentIsLoaded] = useState(false)
    const [dateValue, setDateValue] = React.useState(moment(selectedCalendarDate))
    const [holidayReturnType, setHolidayReturnType] = useState("all")
    const [showMonthDropdown, setShowMonthDropdown] = useState(false)
    const [showFilterModal, setShowFilterModal] = useState(false)
    const [activeFilter, setActiveFilter] = useState("all")

    // CARD STATE
    const [showEditCard, setShowEditCard] = useState(false)
    const [showHolidaysCard, setShowHolidaysCard] = useState(false)
    const [showSearchInput, setShowSearchInput] = useState(false)
    const [showHolidays, setShowHolidays] = useState(false)

    // HOOKS
    const {currentUser, currentUserIsLoading} = useCurrentUser()
    const {calendarEvents} = useCalendarEvents()
    const {holidays} = useHolidays(currentUser, "all")

    const AddDayIndicators = async () => {
        // Clear existing indicators
        document.querySelectorAll(".dot-wrapper, .payday-emoji, .holiday-emoji").forEach((el) => el.remove())

        const dayElements = document.querySelectorAll(".MuiPickersDay-root")

        const holidayEmojiMap = {
            "01/01": "🥳",
            "04/20": "🐇",
            "05/11": "👩‍👧‍👦",
            "05/26": "🎖️",
            "06/15": "👨‍👧‍👦",
            "06/19": "✨",
            "07/04": "🎇",
            "09/11": "🗽",
            "10/31": "🎃",
            "11/28": "🦃",
            "12/24": "🎄",
            "12/25": "🎄",
            "12/31": "🥳",
        }

        for (const dayElement of dayElements) {
            const dayMs = dayElement.dataset.timestamp
            const formattedDay = moment(DateManager.msToDate(dayMs)).format(DatetimeFormats.dateForDb)
            const dayEvent = calendarEvents.find((event) => moment(event?.startDate).format(DatetimeFormats.dateForDb) === formattedDay)
            let dayEvents = calendarEvents.filter((e) => e?.startDate === formattedDay)

            switch (true) {
                case activeFilter === EventFilters.all:
                    break
                case activeFilter === EventFilters.holidays:
                    dayEvents = dayEvents.filter((e) => e?.isHoliday === true)
                    break
                case activeFilter === EventFilters.shared:
                    const sharedEvents = dayEvents.filter((e) => e?.owner?.key !== currentUser?.key && e?.shareWith?.includes(currentUser?.key))
                    dayEvents = [...sharedEvents]
                    break
                case activeFilter === EventFilters.visitationHolidays:
                    dayEvents = dayEvents.filter(
                        (e) => e?.isHoliday === true && !e?.shareWith?.includes(currentUser?.key) && e?.fromVisitationSchedule === true
                    )
                    break
                case activeFilter === EventFilters.currentUser:
                    dayEvents = dayEvents.filter((e) => e?.owner?.key === currentUser?.key && !e?.shareWith?.includes(currentUser?.key))
                    break

                default:
                    break
            }

            const {dotClasses, payEvents} = GetEventDotClasses(dayEvent, dayEvents, holidays)

            // Filter out non-holiday events when visitationHolidays filter is active
            if (activeFilter === EventFilters.visitationHolidays && dayEvent?.isHoliday !== true) {
                continue
            }

            const dotWrapper = document.createElement("span")
            dotWrapper.classList.add("dot-wrapper")

            if (!Manager.IsValid(calendarEvents) || !Manager.IsValid(dayEvent)) {
                dayElement.append(dotWrapper)
                continue
            }

            // 🔹 Holiday Emoji
            const matchingHoliday = holidays.find((h) => h?.startDate === dayEvent?.startDate && Manager.IsValid(h))

            if (matchingHoliday) {
                const emoji = document.createElement("span")
                emoji.classList.add("holiday-emoji")

                const dateKey = moment(matchingHoliday.startDate).format("MM/DD")
                emoji.innerText = holidayEmojiMap[dateKey] || "✨"
                dayElement.append(emoji)
            }

            // 🔹 Event Dots
            dotClasses.forEach((cls) => {
                const dot = document.createElement("span")
                dot.classList.add(cls, "dot")
                dotWrapper.append(dot)
            })

            // 🔹 Payday Dot
            if (payEvents.includes(dayEvent.startDate)) {
                const paydayDot = document.createElement("span")
                paydayDot.classList.add("payday-dot", "dot")
                dotWrapper.append(paydayDot)
            }

            dayElement.append(dotWrapper)
        }
        setContentIsLoaded(true)
    }

    const ShowAllHolidays = async () => {
        setHolidayReturnType("all")
        setShowHolidaysCard(false)
        setShowHolidays(true)
    }

    const ShowVisitationHolidays = async () => {
        setHolidayReturnType("visitation")
        setShowHolidaysCard(!showHolidaysCard)
        setShowHolidays(true)
    }

    const ViewAllEvents = () => {
        setShowHolidaysCard(false)
        setShowSearchInput(false)
        setHolidayReturnType("all")
    }

    const GetEventDotClasses = (dayEvent, dayEvents) => {
        const payEvents = []
        let dotClasses = []
        const dayEventsOfAllTypes = DatasetManager.CombineArrays(dayEvents, holidays)
        const holidayDates = holidays?.map((holiday) => moment(holiday?.startDate).format(DatetimeFormats.dateForDb))
        for (const event of dayEventsOfAllTypes) {
            if (!Manager.IsValid(event) || !Manager.IsValid(event?.startDate)) continue

            if (event?.startDate === dayEvent?.startDate) {
                const title = event.title?.toLowerCase() || ""
                const isPayEvent = FinancialKeywords.some((keyword) => title.includes(keyword))
                const currentUserEvent = event.owner?.key === currentUser?.key
                const coParentOrChildEvent = !Manager.IsValid(event.owner) || event.owner?.key !== currentUser?.key
                const isHoliday = event?.isHoliday || holidayDates.includes(event?.startDate)

                if (isPayEvent) payEvents.push(event.startDate)

                switch (true) {
                    case isHoliday:
                        dotClasses.push("holiday-event-dot")
                        break
                    case currentUserEvent && !isHoliday && !coParentOrChildEvent:
                        dotClasses.push("current-user-event-dot")
                        break
                    case coParentOrChildEvent && !isHoliday && !currentUserEvent:
                        dotClasses.push("coParent-event-dot")
                        break
                }
            }
        }
        dotClasses = DatasetManager.GetValidArray(dotClasses, true)
        return {
            dotClasses,
            payEvents,
        }
    }

    useDetectElement("#static-calendar", (el) => {
        setTimeout(() => {
            void AddDayIndicators()
        }, 300)
    })

    // SHOW HOLIDAYS -> SCROLL INTO VIEW
    useEffect(() => {
        if (DomManager.isMobile()) {
            if (showHolidays) {
                const rows = document.querySelectorAll(".event-row")

                if (rows && rows[0]) {
                    rows[0].scrollIntoView({behavior: "smooth"})
                }
            }
        }
    }, [showHolidays])

    // APPEND HOLIDAYS/SEARCH CAL BUTTONS
    useEffect(() => {
        setHolidayReturnType("none")
        setShowHolidaysCard(false)
        setShowHolidays(false)
        if (!currentUserIsLoading) {
            const belowCalendarWrapper = document.querySelector(".MuiDialogActions-root")
            const todayButton = belowCalendarWrapper.querySelector(".MuiButtonBase-root")
            const legendButton = document.getElementById("legend-button")
            const monthSelector = document.getElementById("month-selector")
            const filterButton = document.getElementById("filter-button-wrapper")
            const searchButton = document.getElementById("search-button-wrapper")

            if (belowCalendarWrapper) {
                belowCalendarWrapper.appendChild(filterButton)
                belowCalendarWrapper.appendChild(searchButton)
                belowCalendarWrapper.appendChild(legendButton)
                belowCalendarWrapper.appendChild(todayButton)
                belowCalendarWrapper.appendChild(monthSelector)
            }

            if (legendButton) {
                legendButton.addEventListener("click", () => {
                    legendButton.classList.toggle("active")
                })
            }
        }
    }, [currentScreen, currentUserIsLoading, showSearchInput])

    useEffect(() => {
        void AddDayIndicators()
    }, [activeFilter])

    const HandleFilterCheckboxSelection = (target) => {
        const filterRow = target.currentTarget

        // CLear All Filters and their active classes
        const filterRows = document.querySelectorAll(".filter-row")
        filterRows.forEach((row) => {
            const filterCheckbox = row.querySelector(".filter-checkbox")
            row.classList.remove("active")
            filterCheckbox.classList.remove("active")
        })

        const dataFilter = filterRow.getAttribute("data-filter")
        setShowFilterModal(false)
        setActiveFilter(dataFilter)
    }

    return (
        <Screen loadingByDefault={true} stopLoadingBool={contentIsLoaded} activeScreen={ScreenNames.calendar} classes={"calendar"}>
            {/* FILTERS MODAL */}
            <Modal
                title={"Event Filters"}
                show={showFilterModal}
                hide={() => {
                    setShowFilterModal(false)
                    setActiveFilter("all")
                }}
                className={`${theme}`}>
                <p className="view-text">
                    View
                    <u>
                        <b>only</b>
                    </u>
                    events that match any of the following filter
                </p>
                <div key={refreshKey} className="filter-rows">
                    <div
                        data-filter={EventFilters.holidays}
                        className={`filter-row holidays${activeFilter === EventFilters.holidays ? " active" : ""}`}
                        onClick={HandleFilterCheckboxSelection}>
                        <div className="filter-checkbox"></div>
                        <span>Holidays</span>
                    </div>
                    <div
                        data-filter={EventFilters.visitationHolidays}
                        className={`filter-row visitation-holidays${activeFilter === EventFilters.visitationHolidays ? " active" : ""}`}
                        onClick={HandleFilterCheckboxSelection}>
                        <div className="filter-checkbox"></div>
                        <span>Visitation Holidays</span>
                    </div>
                    <div
                        data-filter={EventFilters.currentUser}
                        className={`filter-row your-events${activeFilter === EventFilters.currentUser ? " active" : ""}`}
                        onClick={HandleFilterCheckboxSelection}>
                        <div className="filter-checkbox"></div>
                        <span>Your Events</span>
                    </div>
                    <div
                        data-filter={EventFilters.shared}
                        className={`filter-row shared-events${activeFilter === EventFilters.shared ? " active" : ""}`}
                        onClick={HandleFilterCheckboxSelection}>
                        <div className="filter-checkbox"></div>
                        <span>Shared with You</span>
                    </div>
                    <div
                        data-filter={EventFilters.all}
                        className={`filter-row all-events${activeFilter === EventFilters.all ? " active" : ""}`}
                        onClick={HandleFilterCheckboxSelection}>
                        <div className="filter-checkbox active"></div>
                        <span>All Events</span>
                    </div>
                </div>
            </Modal>

            <Modal
                scopedClass={"month-options"}
                show={showMonthDropdown}
                hide={() => setShowMonthDropdown(false)}
                className={`${theme}`}
                title={"Select Month"}>
                <div id="month-options" className={`${showMonthDropdown ? "active" : ""}`}>
                    {months?.map((month, index) => (
                        <div
                            className={`chip${month.name === moment(dateValue, DatetimeFormats.dateForDb).format("MMMM") ? " active" : ""}`}
                            key={index}
                            onClick={() => {
                                setDateValue(moment(`${month.number}/01/${moment().format("YYYY")}`))
                                setShowMonthDropdown(false)
                            }}>
                            {month.name}
                        </div>
                    ))}
                </div>
            </Modal>

            {/* CARDS */}
            <>
                {/* HOLIDAYS CARD */}
                <Form
                    hasSubmitButton={false}
                    className={`${theme} view-holidays`}
                    wrapperClass={`view-holidays`}
                    onClose={ViewAllEvents}
                    showCard={showHolidaysCard}
                    title={"View Holidays ✨"}>
                    <div className="holiday-card-buttons">
                        <Button
                            text={"All"}
                            color={"white"}
                            theme={ButtonThemes.green}
                            classes={"view-all-holidays-item"}
                            onClick={ShowAllHolidays}
                        />
                        <Spacer height={3} />
                        <Button
                            text={"Visitation"}
                            theme={ButtonThemes.white}
                            color={"blend"}
                            classes={"view-visitation-holidays-item"}
                            onClick={ShowVisitationHolidays}
                        />
                    </div>
                </Form>

                {/* EDIT EVENT */}
                <EditCalEvent showCard={showEditCard} hideCard={() => setShowEditCard(false)} event={eventToEdit} />
            </>

            {/* PAGE CONTAINER */}
            <div id="calendar-container" className={`page-container calendar ${theme}`}>
                <ScreenHeader title={"Calendar"} activeScreen={currentScreen} wrapperClass={"calendar-header"} titleIcon={<PiCalendarDotsFill />} />
                <div className="screen-content calendar">
                    {/* STATIC CALENDAR */}
                    <div id="static-calendar" className={`${theme}`}>
                        <StaticDatePicker
                            slotProps={{
                                actionBar: {
                                    actions: ["today"],
                                },
                            }}
                            orientation="landscape"
                            value={dateValue}
                            views={["month", "day"]}
                            showDaysOutsideCurrentMonth={true}
                            minDate={moment(`${moment().year()}-01-01`)}
                            maxDate={moment(`${moment().year()}-12-31`)}
                            onMonthChange={async (month) => {
                                const formattedMonth = moment(month).format("MM")
                                const formattedYear = moment(month).format("YYYY")
                                const formattedDate = `${formattedMonth}/01/${formattedYear}`
                                setDateValue(moment(formattedDate))
                                setState({...state, selectedCalendarDate: moment(formattedDate).format(DatetimeFormats.dateForDb)})
                            }}
                            onChange={(day) => {
                                setDateValue(day)
                                setState({...state, selectedCalendarDate: moment(day).format(DatetimeFormats.dateForDb)})
                            }}
                        />
                    </div>

                    <Spacer height={1} />

                    {/* BELOW CALENDAR */}
                    <div id="below-calendar" className={`${theme} flex`} style={{border: "1px solid red !important"}}>
                        <div
                            className={`${activeFilter !== EventFilters.all ? "active" : ""}`}
                            id="filter-button-wrapper"
                            onClick={() => setShowFilterModal(true)}>
                            <LuListFilter />
                        </div>
                        <div id="search-button-wrapper">
                            {showSearchInput ? (
                                <MdSearchOff className={"red"} onClick={() => setShowSearchInput(false)} />
                            ) : (
                                <LuCalendarSearch className={"search"} onClick={() => setShowSearchInput(true)} />
                            )}
                        </div>
                        {/* LEGEND BUTTON */}
                        <p id="legend-button" className="animated-button">
                            Legend
                        </p>

                        {/* HOLIDAY BUTTON */}
                        {/*<p id="holidays-button">Holidays</p>*/}

                        <p id="month-selector" onClick={() => setShowMonthDropdown(!showMonthDropdown)}>
                            {moment(dateValue).format("MMMM")}
                            {showMonthDropdown ? <FaMinus /> : <FaPlus />}
                        </p>
                    </div>

                    {/* LEGEND */}
                    <CalendarLegend />

                    {/* SCREEN CONTENT - MAP/LOOP CALENDAR EVENTS (CalendarEvents) */}

                    <CalendarEvents
                        activeFilter={activeFilter}
                        showSearchInput={showSearchInput}
                        selectedDate={dateValue}
                        setEventToEdit={(ev) => {
                            setEventToEdit(ev)
                            setShowEditCard(true)
                        }}
                    />
                </div>

                {/* HIDE BUTTONS */}
                <Button
                    text={"Hide Holidays"}
                    onClick={() => {
                        setShowHolidays(false)
                        setHolidayReturnType("none")
                    }}
                    classes={`${showHolidays ? "active" : ""} bottom-right smaller"`}
                />
            </div>

            {/* DESKTOP SIDEBAR */}
            {!DomManager.isMobile() && (
                <div id="calendar-sidebar">
                    {/*<p className="item" id="new-event" onClick={() => setShowNewEventCard(true)}>*/}
                    {/*  <PiCalendarPlusDuotone className={'new-event'} id={'Add-new-button'} /> New Event*/}
                    {/*</p>*/}
                    {!showHolidays && (
                        <p className="item" id="holidays-button" onClick={() => setShowHolidaysCard(true)}>
                            <BsStars />
                            Holidays
                        </p>
                    )}
                    {showHolidays && (
                        <p
                            className="item"
                            onClick={async () => {
                                setShowHolidays(false)
                            }}>
                            <PiCalendarXDuotone /> Hide Holidays
                        </p>
                    )}

                    {/* DESKTOP LEGEND WRAPPER */}
                    <DesktopLegend />

                    {/* DESKTOP SIDEBAR */}
                    <InputField
                        labelText="Find events..."
                        refreshKey={refreshKey}
                        onChange={async (e) => {
                            const inputValue = e.target.value
                            if (inputValue.length > 3) {
                                let results = []
                                if (Manager.IsValid(calendarEvents)) {
                                    results = calendarEvents.filter((x) => x?.title?.toLowerCase().indexOf(inputValue.toLowerCase()) > -1)
                                }
                            } else {
                                if (inputValue.length === 0) {
                                    setShowSearchInput(false)
                                    e.target.value = ""
                                }
                            }
                        }}
                    />
                </div>
            )}

            {/* NAV BARS */}
            <NavBar />
        </Screen>
    )
}