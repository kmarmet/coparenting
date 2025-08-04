// Path: src\components\screens\calendar\calendarEvents.jsx
import moment from "moment"
import React, {useContext, useEffect, useState} from "react"
import {BiSolidBellRing} from "react-icons/bi"
import {FaChildren, FaEraser, FaNoteSticky} from "react-icons/fa6"
import {MdAssistantNavigation, MdEventRepeat, MdLocalPhone} from "react-icons/md"
import {PiLinkBold} from "react-icons/pi"
import DatetimeFormats from "../../../constants/datetimeFormats"
import InputTypes from "../../../constants/inputTypes"
import globalState from "../../../context.js"
import useCalendarEvents from "../../../hooks/useCalendarEvents"
import useCalendarSearch from "../../../hooks/useCalendarSearch"
import useCurrentUser from "../../../hooks/useCurrentUser"
import useEventsOfDay from "../../../hooks/useEventsOfDay"
import useHolidays from "../../../hooks/useHolidays"
import CalendarManager from "../../../managers/calendarManager"
import DatasetManager from "../../../managers/datasetManager.coffee"
import DomManager from "../../../managers/domManager"
import Manager from "../../../managers/manager"
import StringManager from "../../../managers/stringManager"
import InputField from "../../shared/inputField"
import Spacer from "../../shared/spacer"

export default function CalendarEvents({
    setEventToEdit = (event) => {},
    showSearchInput = false,
    holidayOptions = {show: false, returnType: "none"},
}) {
    const {state, setState} = useContext(globalState)
    const {selectedCalendarDate, refreshKey, currentScreen} = state

    // HOOKS
    const {currentUser} = useCurrentUser()
    const {allEventsOfDay, eventsOfDayAreLoading} = useEventsOfDay(selectedCalendarDate)
    const {calendarEvents} = useCalendarEvents()
    const {calendarSearchResults, setQuery} = useCalendarSearch(calendarEvents)
    const {holidays} = useHolidays(currentUser, holidayOptions.returnType)

    // STATE
    const [eventsToIterate, setEventsToIterate] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [comparisonDate, setComparisonDate] = useState(selectedCalendarDate)

    const GetRowDotColor = (event) => {
        const eventsToUse = Manager.IsValid(calendarSearchResults) ? calendarSearchResults : allEventsOfDay
        if (!eventsToUse?.length) return []

        const financialKeywords = ["pay", "paid", "salary", "expense", "refund", "payment ", "purchase", "budget"]

        const title = event?.title?.toLowerCase() || ""
        const isCurrentUserDot = event?.owner?.key === currentUser?.key

        // Holiday dot
        if (event?.isHoliday && !event?.fromVisitationSchedule && !Manager.IsValid(event?.owner?.key)) return "holiday-event-dot"

        // Financial dot
        if (financialKeywords.some((keyword) => title.toLowerCase().includes(keyword))) return "financial-dot"

        return isCurrentUserDot ? "current-user-event-dot" : "coParent-event-dot"
    }

    const HandleEventRowClick = async (clickedEvent) => {
        if (clickedEvent.isHoliday) {
            return false
        }
        if (clickedEvent?.owner?.key !== currentUser?.key && clickedEvent?.fromVisitationSchedule) {
            return false
        }
        setTimeout(() => {
            setState({...state, selectedCalendarDate: clickedEvent.startDate})
        }, 300)
        setEventToEdit(clickedEvent)
    }

    const HasRowIcons = (event) => {
        return !!(
            Manager.IsValid(event?.reminderTimes) ||
            Manager.IsValid(event?.notes) ||
            Manager.IsValid(event?.websiteUrl) ||
            Manager.IsValid(event?.phone) ||
            Manager.IsValid(event?.address) ||
            Manager.IsValid(event?.children) ||
            event?.isRecurring
        )
    }

    const GetParentCategoryIcon = (category) => {
        if (!Manager.IsValid(category)) return
        return [...category.matchAll(/\p{Emoji_Presentation}/gu)].pop()?.[0]
    }

    useEffect(() => {
        let updatedSelectedCalendarDate = selectedCalendarDate

        if (comparisonDate !== selectedCalendarDate) {
            updatedSelectedCalendarDate = comparisonDate
        }

        let nextEvents = []

        // ✅ Priority 1: Search Results
        if (Manager.IsValid(calendarSearchResults)) nextEvents = calendarSearchResults
        // ✅ Priority 2: Holidays
        else if (holidayOptions?.show && Manager.IsValid(holidays) && !Manager.IsValid(calendarSearchResults)) nextEvents = holidays
        // ✅ Priority 3: Normal Events of Day
        else if (
            !holidayOptions?.show &&
            Manager.IsValid(allEventsOfDay) &&
            Manager.IsValid(updatedSelectedCalendarDate) &&
            !Manager.IsValid(calendarSearchResults)
        ) {
            nextEvents = allEventsOfDay
        }

        // ✅ If no valid events → clear
        if (!Manager.IsValid(nextEvents)) {
            setEventsToIterate([])
            return
        }

        // ✅ Set + animate
        setEventsToIterate(nextEvents)
        setComparisonDate(selectedCalendarDate)
    }, [calendarSearchResults, holidayOptions?.show, selectedCalendarDate, allEventsOfDay])

    useEffect(() => {
        console.log("change")
        const animateEvents = () => {
            setTimeout(() => {
                DomManager.ToggleAnimation("add", "event-row", DomManager.AnimateClasses.names.fadeInUp, 120)
            }, 200)
        }
        animateEvents()
    }, [eventsToIterate])

    return (
        <>
            <div id={"search-input-wrapper"} className={`${showSearchInput ? " active" : ""}`}>
                <Spacer height={3} />
                <div id="input-row">
                    <InputField
                        defaultValue={searchQuery}
                        inputType={InputTypes.search}
                        key={refreshKey}
                        placeholder={"Find events..."}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setSearchQuery(e.target.value)
                        }}
                        className={`search`}
                        wrapperClasses={"white-bg calendar-search"}
                    />
                    {Manager.IsValid(searchQuery, true) && (
                        <FaEraser
                            id={"eraser-icon"}
                            onClick={(e) => {
                                const searchInputWrapper = e.currentTarget.previousSibling
                                const searchInput = searchInputWrapper.querySelector("input")
                                setQuery("")
                                searchInput.value = ""
                                searchInput.blur()
                                searchInputWrapper.classList.remove("active")
                                searchInput.textContent = ""
                                setSearchQuery("")
                            }}
                        />
                    )}
                </div>

                <Spacer height={10} />
            </div>
            <div className="events">
                {/* NO EVENTS */}
                {!Manager.IsValid(allEventsOfDay) && <p className="no-data-fallback-text">No Events</p>}

                {/* EVENTS */}
                {Manager.IsValid(eventsToIterate) &&
                    DatasetManager.GetUniqueByPropValue(eventsToIterate, "title").map((event, index) => {
                        let startDate = event?.startDate
                        if (event?.isDateRange) {
                            startDate = event?.staticStartDate
                        }
                        const isBirthdayEvent = event?.title?.toLowerCase()?.includes("birthday") || event?.title?.toLowerCase()?.includes("bday")
                        return (
                            <div
                                onClick={() => HandleEventRowClick(event).then((r) => r)}
                                key={index}
                                data-event-id={event?.id}
                                data-from-date={startDate}
                                className={`row ${event?.fromVisitationSchedule ? "event-row visitation flex" : "event-row flex"} ${GetRowDotColor(event)}`}>
                                <div className="text flex">
                                    {/* EVENT NAME */}
                                    <p className="flex row-title" data-event-id={event?.id}>
                                        <span className={`${GetRowDotColor(event)} event-type-dot`}></span>
                                        <span className={"title-text"}>{isBirthdayEvent && `${StringManager.FormatTitle(event?.title)} 🎂`}</span>
                                        <span className={"title-text"}>{!isBirthdayEvent && StringManager.FormatTitle(event?.title)}</span>
                                    </p>

                                    {/* DATE WRAPPER */}
                                    <div className="date-wrapper">
                                        <div className="date-container">
                                            {/* FROM DATE */}
                                            {Manager.IsValid(startDate, true) && (
                                                <span className="start-date row-subtitle">
                                                    {moment(startDate).format(DatetimeFormats.readableMonthAndDay)}
                                                </span>
                                            )}

                                            {/* TO WORD */}
                                            {Manager.IsValid(event?.endDate, true) && event?.endDate !== startDate && (
                                                <span className="end-date row-subtitle">&nbsp;to&nbsp;</span>
                                            )}

                                            {/* TO DATE */}
                                            {Manager.IsValid(event?.endDate, true) && event?.endDate !== startDate && (
                                                <span className="row-subtitle">
                                                    {moment(event?.endDate).format(DatetimeFormats.readableMonthAndDay)}
                                                </span>
                                            )}

                                            {/* START/END TIMES */}
                                            {Manager.IsValid(event?.endTime) && (
                                                <span className="row-subtitle from-time">
                                                    &nbsp;({event?.startTime} to {event?.endTime})
                                                </span>
                                            )}

                                            {/* START TIME ONLY */}
                                            {Manager.IsValid(event?.startTime) && !Manager.IsValid(event?.endTime) && (
                                                <span className="row-subtitle from-time">&nbsp;({event?.startTime})</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* CATEGORIES */}
                                    {Manager.IsValid(event?.categories) && event?.categories?.length > 0 && (
                                        <div className="categories">
                                            {(() => {
                                                const seen = new Set()
                                                return event?.categories?.map((category, index) => {
                                                    const parentCategory = CalendarManager.MapCategoryToParent(category)
                                                    const emoji = GetParentCategoryIcon(parentCategory)

                                                    if (seen.has(parentCategory)) return null
                                                    seen.add(parentCategory)

                                                    return (
                                                        <span key={index} className="emoji-only">
                                                            {emoji}
                                                        </span>
                                                    )
                                                })
                                            })()}
                                        </div>
                                    )}
                                </div>
                                {/* ICONS */}
                                {HasRowIcons(event) && (
                                    <div className="icon-row">
                                        {Manager.IsValid(event?.reminderTimes) && <BiSolidBellRing className={"reminders-icon"} />}
                                        {Manager.IsValid(event?.notes) && <FaNoteSticky className="notes-icon" />}
                                        {Manager.IsValid(event?.websiteUrl) && <PiLinkBold className="website-icon" />}
                                        {Manager.IsValid(event?.phone) && <MdLocalPhone className="phone-icon" />}
                                        {Manager.IsValid(event?.address) && <MdAssistantNavigation className="address-icon" />}
                                        {Manager.IsValid(event?.children) && <FaChildren className="children-icon" />}
                                        {event?.isRecurring && <MdEventRepeat />}
                                    </div>
                                )}
                            </div>
                        )
                    })}
            </div>
        </>
    )
}