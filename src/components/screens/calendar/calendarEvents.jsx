// Path: src\components\screens\calendar\calendarEvents.jsx
import moment from 'moment'
import React, {useContext, useEffect} from 'react'
import {BiSolidBellRing} from 'react-icons/bi'
import {FaChildren, FaNoteSticky} from 'react-icons/fa6'
import {MdAssistantNavigation, MdEventRepeat, MdLocalPhone} from 'react-icons/md'
import {PiLinkBold} from 'react-icons/pi'
import DatetimeFormats from '../../../constants/datetimeFormats'
import globalState from '../../../context.js'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useEventsOfDay from '../../../hooks/useEventsOfDay'
import DatasetManager from '../../../managers/datasetManager.coffee'
import DomManager from '../../../managers/domManager'
import Manager from '../../../managers/manager'
import StringManager from '../../../managers/stringManager'

export default function CalendarEvents({selectedDate, setEventToEdit = (event) => {}}) {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state
  const {currentUser} = useCurrentUser()
  const {eventsOfDay} = useEventsOfDay(selectedDate)

  const GetRowDotColor = (dayDate) => {
    const arr = [...eventsOfDay]
    const dayEvents = arr.filter((x) => x.startDate === dayDate)
    let dotObjects = []
    for (let event of dayEvents) {
      const isCurrentUserDot = event?.owner?.key === currentUser?.key
      if (event?.isHoliday && !event?.fromVisitationSchedule && !Manager.IsValid(event?.owner?.key)) {
        dotObjects.push({
          className: 'holiday-event-dot',
          id: event?.id,
          date: event?.startDate,
        })
      }
      if (
        event?.title?.toLowerCase()?.includes('pay') ||
        event?.title?.toLowerCase()?.includes('paid') ||
        event?.title?.toLowerCase()?.includes('salary') ||
        event?.title?.toLowerCase()?.includes('expense') ||
        event?.title?.toLowerCase()?.includes('refund') ||
        event?.title?.toLowerCase()?.includes('payment ') ||
        event?.title?.toLowerCase()?.includes('purchase') ||
        event?.title?.toLowerCase()?.includes('budget')
      ) {
        dotObjects.push({
          className: 'financial-dot',
          id: event?.id,
          date: event?.startDate,
        })
      }
      if (isCurrentUserDot) {
        dotObjects.push({
          className: 'current-user-event-dot',
          id: event?.id,
          date: event?.startDate,
        })
      }
      if (!isCurrentUserDot) {
        dotObjects.push({
          className: 'coParent-event-dot',
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
    if (Manager.IsValid(eventsOfDay) && Manager.IsValid(selectedDate)) {
      DomManager.ToggleAnimation('add', 'event-row', DomManager.AnimateClasses.names.fadeInUp, 120)
    }
  }, [eventsOfDay])

  return (
    <div className="events">
      {Manager.IsValid(eventsOfDay) &&
        DatasetManager.getUniqueByPropValue(eventsOfDay, 'title').map((event, index) => {
          let startDate = event?.startDate
          if (event?.isDateRange) {
            startDate = event?.staticStartDate
          }
          let dotObjects = GetRowDotColor(event?.startDate)
          const dotObject = dotObjects?.find((x) => x.id === event?.id)
          const isBirthdayEvent = event?.title?.toLowerCase()?.includes('birthday') || event?.title?.toLowerCase()?.includes('bday')

          return (
            <div
              onClick={() => HandleEventRowClick(event).then((r) => r)}
              key={index}
              data-event-id={event?.id}
              data-from-date={startDate}
              className={`row ${event?.fromVisitationSchedule ? 'event-row visitation flex' : 'event-row flex'} ${dotObject.className}
                `}>
              <div className="text flex">
                {/* EVENT NAME */}
                <p className="flex row-title" data-event-id={event?.id}>
                  <span className={`${dotObject.className} event-type-dot`}></span>
                  {isBirthdayEvent && `${StringManager.FormatTitle(event?.title)} 🎂`}
                  {!isBirthdayEvent && StringManager.FormatTitle(event?.title)}
                </p>

                {/* DATE WRAPPER */}
                <div className="date-wrapper">
                  <div id="date-container">
                    {/* FROM DATE */}
                    {Manager.IsValid(startDate, true) && (
                      <span className="start-date row-subtitle">{moment(startDate).format(DatetimeFormats.readableMonthAndDay)}</span>
                    )}

                    {/* TO WORD */}
                    {Manager.IsValid(event?.endDate, true) && event?.endDate !== startDate && (
                      <span className="end-date row-subtitle">&nbsp;to&nbsp;</span>
                    )}

                    {/* TO DATE */}
                    {Manager.IsValid(event?.endDate, true) && event?.endDate !== startDate && (
                      <span className="row-subtitle">{moment(event?.endDate).format(DatetimeFormats.readableMonthAndDay)}</span>
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
                <div id="icon-row">
                  {Manager.IsValid(event?.reminderTimes) && <BiSolidBellRing className={'reminders-icon'} />}
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