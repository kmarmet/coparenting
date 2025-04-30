// Path: src\components\screens\calendar\calendarEvents.jsx
import DatetimeFormats from '/src/constants/datetimeFormats'
import Manager from '/src/managers/manager'
import moment from 'moment'
import React, {useContext, useEffect} from 'react'
import {BiSolidBellRing} from 'react-icons/bi'
import {FaChildren} from 'react-icons/fa6'
import {MdAssistantNavigation, MdEventRepeat, MdLocalPhone} from 'react-icons/md'
import {PiLinkBold, PiNotepadDuotone} from 'react-icons/pi'
import globalState from '../../../context.js'
import useCurrentUser from '../../../hooks/useCurrentUser'
import DatasetManager from '../../../managers/datasetManager.coffee'
import DomManager from '../../../managers/domManager'
import StringManager from '../../../managers/stringManager'

export default function CalendarEvents({eventsOfActiveDay, setEventToEdit = (event) => {}}) {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state
  const {currentUser} = useCurrentUser()

  const GetRowDotColor = (dayDate) => {
    const arr = [...eventsOfActiveDay]
    const dayEvents = arr.filter((x) => x.startDate === dayDate)
    let dotObjects = []
    for (let event of dayEvents) {
      const isCurrentUserDot = event?.ownerKey === currentUser?.key
      if (event?.isHoliday && !event.fromVisitationSchedule && !Manager.isValid(event.ownerKey)) {
        dotObjects.push({
          className: 'holiday-event-dot',
          id: event.id,
          date: event.startDate,
        })
      }
      if (
        event?.title.toLowerCase().includes('pay') ||
        event?.title.toLowerCase().includes('paid') ||
        event?.title.toLowerCase().includes('salary') ||
        event?.title.toLowerCase().includes('expense')
      ) {
        dotObjects.push({
          className: 'financial-dot',
          id: event.id,
          date: event.startDate,
        })
      }
      if (isCurrentUserDot) {
        dotObjects.push({
          className: 'current-user-event-dot',
          id: event.id,
          date: event.startDate,
        })
      }
      if (!isCurrentUserDot) {
        dotObjects.push({
          className: 'coparent-event-dot',
          id: event.id,
          date: event.startDate,
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
    if (clickedEvent?.ownerKey !== currentUser?.key && clickedEvent?.fromVisitationSchedule) {
      return false
    }
    setTimeout(() => {
      setState({...state, dateToEdit: clickedEvent.startDate})
    }, 500)
    setEventToEdit(clickedEvent)
  }

  const HasRowIcons = (event) => {
    return !!(
      Manager.isValid(event?.reminderTimes) ||
      Manager.isValid(event?.notes) ||
      Manager.isValid(event?.websiteUrl) ||
      Manager.isValid(event?.phone) ||
      Manager.isValid(event?.location) ||
      Manager.isValid(event?.children) ||
      event?.isRecurring
    )
  }

  useEffect(() => {
    DomManager.ToggleAnimation('add', 'event-row', DomManager.AnimateClasses.names.fadeInRight, 110)
  }, [eventsOfActiveDay])

  return (
    <>
      <div className="events">
        {Manager.isValid(eventsOfActiveDay) &&
          DatasetManager.getUniqueByPropValue(eventsOfActiveDay, 'title').map((event, index) => {
            let startDate = event?.startDate
            if (event?.isDateRange) {
              startDate = event?.staticStartDate
            }
            let dotObjects = GetRowDotColor(event.startDate)
            const dotObject = dotObjects?.find((x) => x.id === event.id)
            const isBirthdayEvent = event?.title.toLowerCase().includes('birthday') || event?.title.toLowerCase().includes('bday')

            return (
              <div
                onClick={() => HandleEventRowClick(event).then((r) => r)}
                key={index}
                data-event-id={event?.id}
                data-from-date={startDate}
                className={`row ${event?.fromVisitationSchedule ? 'event-row visitation flex' : 'event-row flex'} ${dotObject.className} ${
                  index === eventsOfActiveDay.length - 2 ? 'last-child' : ''
                }`}>
                <div className="text flex space-between">
                  {/* EVENT NAME */}
                  <div className="flex space-between" id="title-wrapper">
                    <p className="title flex" id="title" data-event-id={event?.id}>
                      <span className={`${dotObject.className} event-type-dot`}></span>
                      {isBirthdayEvent && `${StringManager.FormatTitle(event?.title)} 🎂`}
                      {!isBirthdayEvent && StringManager.FormatTitle(event?.title)}
                    </p>
                  </div>

                  {/* DATE WRAPPER */}
                  <div id="subtitle" className="flex space-between calendar">
                    <div id="date-container">
                      {/* FROM DATE */}
                      {Manager.isValid(startDate, true) && (
                        <span className="start-date" id="subtitle">
                          {moment(startDate).format(DatetimeFormats.readableMonthAndDay)}
                        </span>
                      )}

                      {/* TO WORD */}
                      {Manager.isValid(event?.endDate, true) && event?.endDate !== startDate && (
                        <span className="end-date" id="subtitle">
                          &nbsp;to&nbsp;
                        </span>
                      )}

                      {/* TO DATE */}
                      {Manager.isValid(event?.endDate, true) && event?.endDate !== startDate && (
                        <span id="subtitle">{moment(event?.endDate).format(DatetimeFormats.readableDay)}</span>
                      )}

                      {/* START/END TIMES */}
                      {Manager.isValid(event?.endTime) && (
                        <span id="subtitle" className="from-time">
                          &nbsp;({event?.startTime} to {event?.endTime})
                        </span>
                      )}

                      {/* START TIME ONLY */}
                      {Manager.isValid(event?.startTime) && !Manager.isValid(event?.endTime) && (
                        <span id="subtitle" className="from-time">
                          &nbsp;({event?.startTime})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* ICONS */}
                {HasRowIcons(event) && (
                  <div id="icon-row">
                    {Manager.isValid(event?.reminderTimes) && <BiSolidBellRing />}
                    {Manager.isValid(event?.notes) && <PiNotepadDuotone />}
                    {Manager.isValid(event?.websiteUrl) && <PiLinkBold className="website-icon" />}
                    {Manager.isValid(event?.phone) && <MdLocalPhone />}
                    {Manager.isValid(event?.location) && <MdAssistantNavigation className="location-icon" />}
                    {Manager.isValid(event?.children) && <FaChildren />}
                    {event?.isRecurring && <MdEventRepeat />}
                  </div>
                )}
                <div className="delete-event-button">DELETE</div>
              </div>
            )
          })}
      </div>
    </>
  )
}