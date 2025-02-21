// Path: src\components\screens\calendar\calendarEvents.jsx
import moment from 'moment'
import React, { useContext, useState } from 'react'
import { Fade } from 'react-awesome-reveal'
import globalState from '../../../context.js'
import DatasetManager from '../../../managers/datasetManager.coffee'
import DateFormats from '/src/constants/dateFormats'
import Manager from '/src/managers/manager'
import StringManager from '/src/managers/stringManager'

export default function CalendarEvents({ eventsOfActiveDay, setEventToEdit = (event) => {} }) {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser, authUser } = state
  const [holidays, setHolidays] = useState([])
  const [showHolidays, setShowHolidays] = useState(false)
  const [searchResults, setSearchResults] = useState([])

  const getRowDotColor = (dayDate) => {
    const arr = [...eventsOfActiveDay, ...holidays]
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

  return (
    <>
      <div className="events">
        <Fade direction={'up'} delay={0} duration={800} className={'calendar-events-fade-wrapper'} cascade={false} triggerOnce={true}>
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
                  onClick={(e) => handleEventRowClick(event)}
                  data-from-date={startDate}
                  className={`row ${event?.fromVisitationSchedule ? 'event-row visitation flex' : 'event-row flex'} ${dotObject.className} ${
                    index === eventsOfActiveDay.length - 2 ? 'last-child' : ''
                  }`}>
                  <div className="text flex space-between">
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
                        {Manager.isValid(searchResults) && (
                          <span className="start-date" id="subtitle">
                            {moment(startDate).format(DateFormats.readableMonthAndDay)}
                          </span>
                        )}
                        {/* FROM DATE */}
                        {!Manager.isValid(searchResults) && !Manager.contains(startDate, 'Invalid') && startDate?.length > 0 && (
                          <span className="start-date" id="subtitle">
                            {moment(startDate).format(showHolidays ? DateFormats.readableMonthAndDay : DateFormats.readableDay)}
                          </span>
                        )}
                        {/* TO WORD */}
                        {!Manager.contains(event?.endDate, 'Invalid') && event?.endDate?.length > 0 && event?.endDate !== startDate && (
                          <span className="end-date" id="subtitle">
                            &nbsp;to&nbsp;
                          </span>
                        )}
                        {/* TO DATE */}
                        {!Manager.contains(event?.endDate, 'Invalid') && event?.endDate?.length > 0 && event?.endDate !== startDate && (
                          <span id="subtitle">{moment(event?.endDate).format(DateFormats.readableDay)}</span>
                        )}
                        {/* ALL DAY */}
                        {event &&
                          !Manager.isValid(event?.startTime) &&
                          (!Manager.isValid(event?.endDate) || event?.endDate.indexOf('Invalid') > -1) &&
                          event?.endDate !== event?.startDate && (
                            <span id="subtitle" className="end-date">
                              &nbsp;- ALL DAY
                            </span>
                          )}
                        {/* TIMES */}
                        {!Manager.contains(event?.startTime, 'Invalid') && event?.startTime?.length > 0 && (
                          <span id="subtitle" className="from-time">
                            <span>&nbsp;-</span> {event?.startTime}
                          </span>
                        )}
                        {!Manager.contains(event?.endTime, 'Invalid') && event?.endTime?.length > 0 && event?.endTime !== event?.startTime && (
                          <span id="subtitle" className="to-time">
                            &nbsp;-&nbsp;{event?.endTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
        </Fade>
      </div>
    </>
  )
}