// Path: src\components\screens\calendar\calendarEvents.jsx
import moment from "moment"
import React, {useContext, useEffect, useState} from "react"
import {BiSolidBellRing} from "react-icons/bi"
import {FaChildren, FaNoteSticky} from "react-icons/fa6"
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

export default function CalendarEvents({
      selectedDate,
      setEventToEdit = (event) => {},
      showSearchResults = false,
      holidayOptions = {show: false, returnType: "none"},
}) {
      const {state, setState} = useContext(globalState)
      const {theme, refreshKey} = state

      // HOOKS
      const {currentUser} = useCurrentUser()
      const {eventsOfDay} = useEventsOfDay(selectedDate)
      const {calendarEvents} = useCalendarEvents()
      const {searchResults, setQuery} = useCalendarSearch(calendarEvents)
      const {holidays} = useHolidays(currentUser, holidayOptions.returnType)

      // STATE
      const [eventsToIterate, setEventsToIterate] = useState([])

      const GetRowDotColor = (dayDate) => {
            const arr = showSearchResults ? searchResults : eventsOfDay
            const dayEvents = arr.filter((x) => x.startDate === dayDate)
            let dotObjects = []
            for (let event of dayEvents) {
                  const isCurrentUserDot = event?.owner?.key === currentUser?.key
                  if (event?.isHoliday && !event?.fromVisitationSchedule && !Manager.IsValid(event?.owner?.key)) {
                        dotObjects.push({
                              className: "holiday-event-dot",
                              id: event?.id,
                              date: event?.startDate,
                        })
                  }
                  if (
                        event?.title?.toLowerCase()?.includes("pay") ||
                        event?.title?.toLowerCase()?.includes("paid") ||
                        event?.title?.toLowerCase()?.includes("salary") ||
                        event?.title?.toLowerCase()?.includes("expense") ||
                        event?.title?.toLowerCase()?.includes("refund") ||
                        event?.title?.toLowerCase()?.includes("payment ") ||
                        event?.title?.toLowerCase()?.includes("purchase") ||
                        event?.title?.toLowerCase()?.includes("budget")
                  ) {
                        dotObjects.push({
                              className: "financial-dot",
                              id: event?.id,
                              date: event?.startDate,
                        })
                  }
                  if (isCurrentUserDot) {
                        dotObjects.push({
                              className: "current-user-event-dot",
                              id: event?.id,
                              date: event?.startDate,
                        })
                  }
                  if (!isCurrentUserDot) {
                        dotObjects.push({
                              className: "coParent-event-dot",
                              id: event?.id,
                              date: event?.startDate,
                        })
                  }
            }
            dotObjects = DatasetManager.getUniqueArray(dotObjects, true)
            return dotObjects
      }

      const HandleEventRowClick = async (clickedEvent) => {
            if (clickedEvent.isHoliday) {
                  return false
            }
            if (clickedEvent?.owner?.key !== currentUser?.key && clickedEvent?.fromVisitationSchedule) {
                  return false
            }
            setTimeout(() => {
                  setState({...state, dateToEdit: clickedEvent.startDate})
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
            console.log(holidayOptions.returnType)
            // Reset search results
            if (!showSearchResults) {
                  setQuery("")
            }

            // Search Results
            if (showSearchResults && Manager.IsValid(searchResults)) {
                  console.log("if")
                  setEventsToIterate(searchResults)
                  setTimeout(() => {
                        DomManager.ToggleAnimation("add", "event-row", DomManager.AnimateClasses.names.fadeInUp, 120)
                  }, 10)
            }

            // Holidays
            else if (holidayOptions?.show && Manager.IsValid(holidays)) {
                  console.log("else if 1", holidays)
                  console.log(holidays)
                  setEventsToIterate(holidays)
                  setTimeout(() => {
                        DomManager.ToggleAnimation("add", "event-row", DomManager.AnimateClasses.names.fadeInUp, 120)
                  }, 10)
            }

            // Events of Day
            else if (!showSearchResults && !holidayOptions?.show) {
                  console.log("else")
                  if (Manager.IsValid(eventsOfDay) && Manager.IsValid(selectedDate)) {
                        setEventsToIterate(eventsOfDay)
                        setTimeout(() => {
                              DomManager.ToggleAnimation("add", "event-row", DomManager.AnimateClasses.names.fadeInUp, 120)
                        }, 10)
                  }
            }

            return () => {
                  setEventsToIterate([])
            }
      }, [eventsOfDay, searchResults, selectedDate, showSearchResults, holidayOptions?.returnType])

      return (
            <div className="events">
                  <Spacer height={5} />

                  <div id={"search-input-wrapper"} className={`${showSearchResults ? "active" : ""}`}>
                        <InputField
                              inputType={InputTypes.search}
                              key={refreshKey}
                              placeholder={"Begin typing an event name..."}
                              onChange={(e) => setQuery(e.target.value)}
                              className={"search"}
                              wrapperClasses={"white-bg"}
                        />

                        <Spacer height={10} />
                  </div>

                  {/* NO EVENTS */}
                  {!Manager.IsValid(eventsOfDay) && <p className="no-apiResults-fallback-text">No Events</p>}

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
                                          className={`row ${event?.fromVisitationSchedule ? "event-row visitation flex" : "event-row flex"} ${dotObject?.className}
                `}>
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