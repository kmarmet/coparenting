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
import DatasetManager from "../../../managers/datasetManager.coffee"
import DomManager from "../../../managers/domManager"
import Manager from "../../../managers/manager"
import StringManager from "../../../managers/stringManager"
import InputField from "../../shared/inputField"
import Spacer from "../../shared/spacer"

export default function CalendarEvents({setEventToEdit = (event) => {}, holidayOptions = {show: false, returnType: "none"}}) {
      const {state, setState} = useContext(globalState)
      const {selectedCalendarDate, refreshKey, currentScreen} = state

      // HOOKS
      const {currentUser} = useCurrentUser()
      const {eventsOfDay} = useEventsOfDay()
      const {calendarEvents} = useCalendarEvents()
      const {calendarSearchResults, setQuery} = useCalendarSearch(calendarEvents)
      const {holidays} = useHolidays(currentUser, holidayOptions.returnType)

      // STATE
      const [eventsToIterate, setEventsToIterate] = useState([])
      const [searchQuery, setSearchQuery] = useState("")

      const GetRowDotColor = (dayDate) => {
            const eventsToUse = Manager.IsValid(calendarSearchResults) ? calendarSearchResults : eventsOfDay
            const dayEvents = eventsToUse.filter((e) => e.startDate === dayDate)
            if (!dayEvents?.length) return []

            const financialKeywords = ["pay", "paid", "salary", "expense", "refund", "payment ", "purchase", "budget"]

            const dotObjects = dayEvents.flatMap((event) => {
                  const dots = []
                  const title = event?.title?.toLowerCase() || ""
                  const isCurrentUserDot = event?.owner?.key === currentUser?.key

                  // Holiday dot
                  if (event?.isHoliday && !event?.fromVisitationSchedule && !Manager.IsValid(event?.owner?.key)) {
                        dots.push({
                              className: "holiday-event-dot",
                              id: event?.id,
                              date: event?.startDate,
                        })
                  }

                  // Financial dot
                  if (financialKeywords.some((keyword) => title.includes(keyword))) {
                        dots.push({
                              className: "financial-dot",
                              id: event?.id,
                              date: event?.startDate,
                        })
                  }

                  // User ownership dots
                  dots.push({
                        className: isCurrentUserDot ? "current-user-event-dot" : "coParent-event-dot",
                        id: event?.id,
                        date: event?.startDate,
                  })
                  return dots
            })

            return DatasetManager.getUniqueArray(dotObjects, true)
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

      useEffect(() => {
            const animateEvents = () => {
                  setTimeout(() => {
                        DomManager.ToggleAnimation("add", "event-row", DomManager.AnimateClasses.names.fadeInUp, 120)
                  }, 200)
            }

            let nextEvents = []

            // ✅ Priority 1: Search Results
            if (Manager.IsValid(calendarSearchResults)) {
                  console.log("pri 1")
                  nextEvents = calendarSearchResults
            }

            // ✅ Priority 2: Holidays
            else if (holidayOptions?.show && Manager.IsValid(holidays) && !Manager.IsValid(calendarSearchResults)) {
                  nextEvents = holidays
            }

            // ✅ Priority 3: Normal Events of Day
            else if (
                  !holidayOptions?.show &&
                  Manager.IsValid(eventsOfDay) &&
                  Manager.IsValid(selectedCalendarDate) &&
                  !Manager.IsValid(calendarSearchResults)
            ) {
                  nextEvents = eventsOfDay
            }

            // console.log(holidayOptions, holidays, eventsOfDay, selectedCalendarDate, calendarSearchResults)

            // ✅ If no valid events → clear
            if (!Manager.IsValid(nextEvents)) {
                  setEventsToIterate([])
                  return
            }

            // ✅ Set + animate
            setEventsToIterate(nextEvents)
            animateEvents()
      }, [calendarSearchResults, holidayOptions?.show, holidays, eventsOfDay, selectedCalendarDate, currentScreen])

      return (
            <div className="events">
                  <div id={"search-input-wrapper"}>
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
                                    className={"search"}
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

                  {/* NO EVENTS */}
                  {!Manager.IsValid(eventsOfDay) && <p className="no-data-fallback-text">No Events</p>}

                  {/* EVENTS */}
                  {Manager.IsValid(eventsToIterate) &&
                        DatasetManager.getUniqueByPropValue(eventsToIterate, "title").map((event, index) => {
                              let startDate = event?.startDate
                              if (event?.isDateRange) {
                                    startDate = event?.staticStartDate
                              }
                              let dotObjects = GetRowDotColor(event?.startDate)
                              const dotObject = dotObjects?.find((x) => x.id === event?.id)
                              const isBirthdayEvent =
                                    event?.title?.toLowerCase()?.includes("birthday") || event?.title?.toLowerCase()?.includes("bday")
                              return (
                                    <div
                                          onClick={() => HandleEventRowClick(event).then((r) => r)}
                                          key={index}
                                          data-event-id={event?.id}
                                          data-from-date={startDate}
                                          className={`row ${event?.fromVisitationSchedule ? "event-row visitation flex" : "event-row flex"} ${dotObject?.className}`}>
                                          <div className="text flex">
                                                {/* EVENT NAME */}
                                                <p className="flex row-title" data-event-id={event?.id}>
                                                      <span className={`${dotObject?.className} event-type-dot`}></span>
                                                      <span className={"title-text"}>
                                                            {isBirthdayEvent && `${StringManager.FormatTitle(event?.title)} 🎂`}
                                                      </span>
                                                      <span className={"title-text"}>
                                                            {" "}
                                                            {!isBirthdayEvent && StringManager.FormatTitle(event?.title)}
                                                      </span>
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
      )
}