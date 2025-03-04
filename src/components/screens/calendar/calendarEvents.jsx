// Path: src\components\screens\calendar\calendarEvents.jsx
import moment from 'moment'
import React, { useContext } from 'react'
import { Fade } from 'react-awesome-reveal'
import globalState from '../../../context.js'
import DatasetManager from '../../../managers/datasetManager.coffee'
import DateFormats from '/src/constants/dateFormats'
import Manager from '/src/managers/manager'
import StringManager from '/src/managers/stringManager'
import { CgDetailsMore } from 'react-icons/cg'
import { FaChildren } from 'react-icons/fa6'
import { LiaMapMarkedAltSolid } from 'react-icons/lia'
import { MdLocalPhone } from 'react-icons/md'
import { PiBellSimpleRingingDuotone, PiGlobeDuotone } from 'react-icons/pi'
import { useSwipeable } from 'react-swipeable'
import DomManager from '../../../managers/domManager'
import AlertManager from '../../../managers/alertManager'
import DB from '../../../database/DB'
import SecurityManager from '../../../managers/securityManager'
import CalendarManager from '../../../managers/calendarManager'

export default function CalendarEvents({ eventsOfActiveDay, setEventToEdit = (event) => {} }) {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser, authUser } = state
  // const [holidays, setHolidays] = useState([])
  // const [showHolidays, setShowHolidays] = useState(false)
  //
  // const [searchResults, setSearchResults] = useState([])

  const handlers = useSwipeable({
    onSwipedLeft: async (eventData) => {
      const element = eventData.event.target
      const eventRow = element.closest('.event-row')
      const deleteButton = eventRow.querySelector('.delete-event-button')
      const eventId = eventRow.getAttribute('data-event-id')
      const allEvents = await SecurityManager.getCalendarEvents(currentUser)
      const event = allEvents.find((x) => x.id === eventId)
      const multipleEvents = event.isCloned || event.isDateRange || event.isRecurring || event.isRepeating
      let alertMessage = 'Are you sure you want to delete this event?'
      if (multipleEvents) {
        alertMessage = 'Are you sure you want to delete all events with these details?'
      }
      if (event?.ownerKey !== currentUser?.key && event?.fromVisitationSchedule) {
        return false
      }
      deleteButton.addEventListener('click', () => {
        AlertManager.confirmAlert(alertMessage, "I'm Sure", true, async () => {
          const eventId = eventRow.getAttribute('data-event-id')
          await deleteEvent(eventId)
          AlertManager.successAlert('Event Deleted')
        })
      })
      DomManager.toggleActive(deleteButton)
    },
    onSwipedRight: (eventData) => {
      const element = eventData.event.target
      const eventRow = element.closest('.event-row')
      const deleteButton = eventRow.querySelector('.delete-event-button')
      DomManager.toggleActive(deleteButton)
    },
  })

  const deleteEvent = async (eventId) => {
    const dbPath = `${DB.tables.calendarEvents}/${currentUser?.key}`
    const allEvents = await SecurityManager.getCalendarEvents(currentUser).then((r) => r)
    const event = allEvents.find((x) => x.id === eventId)
    const eventCount = allEvents.filter((x) => x.title === event?.title).length
    if (eventCount === 1) {
      await CalendarManager.deleteEvent(currentUser, eventId)
    } else {
      let clonedEvents = await DB.getTable(`${dbPath}`)
      if (Manager.isValid(clonedEvents)) {
        clonedEvents = clonedEvents.filter((x) => x.title === event?.title)
        await CalendarManager.deleteMultipleEvents(clonedEvents, currentUser)
      }
    }
  }

  const getRowDotColor = (dayDate) => {
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

  const handleEventRowClick = async (clickedEvent) => {
    if (clickedEvent.isHoliday) {
      return false
    }
    if (clickedEvent?.ownerKey !== currentUser?.key && clickedEvent?.fromVisitationSchedule) {
      return false
    }
    setEventToEdit(clickedEvent)
  }

  const hasRowIcons = (event) => {
    return !!(
      Manager.isValid(event?.reminderTimes) ||
      Manager.isValid(event?.notes) ||
      Manager.isValid(event?.websiteUrl) ||
      Manager.isValid(event?.phone) ||
      Manager.isValid(event?.location) ||
      Manager.isValid(event?.children)
    )
  }

  return (
    <>
      <div className="events">
        <Fade direction={'up'} delay={0} duration={800} className={'calendar-events-fade-wrapper'} triggerOnce={true}>
          {!Manager.isValid(eventsOfActiveDay) && <p id="no-events-text">No events on this day</p>}
          {Manager.isValid(eventsOfActiveDay) &&
            eventsOfActiveDay.map((event, index) => {
              let startDate = event?.startDate
              if (event?.isDateRange) {
                startDate = event?.staticStartDate
              }
              let dotObjects = getRowDotColor(event.startDate)
              const dotObject = dotObjects?.filter((x) => x.id === event.id)[0]
              return (
                <div
                  key={index}
                  onClick={(e) => {
                    if (!e.target.classList.contains('delete-event-button')) {
                      handleEventRowClick(event).then((r) => r)
                    }
                  }}
                  data-event-id={event?.id}
                  data-from-date={startDate}
                  className={`row ${event?.fromVisitationSchedule ? 'event-row visitation flex' : 'event-row flex'} ${dotObject.className} ${
                    index === eventsOfActiveDay.length - 2 ? 'last-child' : ''
                  }`}>
                  <div className="text flex space-between" {...handlers}>
                    {/* EVENT NAME */}
                    <div className="flex space-between" id="title-wrapper">
                      <p className="title flex" id="title" data-event-id={event?.id}>
                        <span className={`${dotObject.className} event-type-dot`}></span>
                        {StringManager.formatEventTitle(event?.title)}
                      </p>
                    </div>
                    {/* DATE CONTAINER */}
                    <div id="subtitle" className="flex space-between calendar">
                      <div id="date-container">
                        {/* FROM DATE */}
                        {Manager.isValid(startDate, true) && (
                          <span className="start-date" id="subtitle">
                            {moment(startDate).format(DateFormats.readableMonthAndDay)}
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
                          <span id="subtitle">{moment(event?.endDate).format(DateFormats.readableDay)}</span>
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
                    {/* ICONS */}
                    {hasRowIcons(event) && (
                      <div className="flex" id="icon-row">
                        {Manager.isValid(event?.reminderTimes) && <PiBellSimpleRingingDuotone />}
                        {Manager.isValid(event?.notes) && <CgDetailsMore />}
                        {Manager.isValid(event?.websiteUrl) && <PiGlobeDuotone />}
                        {Manager.isValid(event?.phone) && <MdLocalPhone />}
                        {Manager.isValid(event?.location) && <LiaMapMarkedAltSolid />}
                        {Manager.isValid(event?.children) && <FaChildren />}
                      </div>
                    )}
                  </div>
                  <div className="delete-event-button">DELETE</div>
                </div>
              )
            })}
        </Fade>
      </div>
    </>
  )
}