// Path: src\components\screens\calendar\calendarEvents.jsx
import moment from 'moment'
import React, { useContext } from 'react'
import { Fade } from 'react-awesome-reveal'
import globalState from '../../../context.js'
import DatasetManager from '../../../managers/datasetManager.coffee'
import DateFormats from '/src/constants/dateFormats'
import Manager from '/src/managers/manager'
import { FaChildren } from 'react-icons/fa6'
import { MdLocalPhone } from 'react-icons/md'
import { PiBellSimpleRingingDuotone, PiGlobeDuotone, PiNotepadDuotone } from 'react-icons/pi'
import { TbLocationFilled } from 'react-icons/tb'
import StringManager from '../../../managers/stringManager'

export default function CalendarEvents({eventsOfActiveDay, setEventToEdit = (event) => {}}) {
  const {state, setState} = useContext(globalState)
  const {theme, currentUser, refreshKey} = state


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
      <div className="events" key={refreshKey}>
        <Fade
          direction={'right'}
          delay={0}
          duration={800}
          triggerOnce={false}
          cascade={true}
          damping={0.2}
          className={'calendar-events-fade-wrapper'}>
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
                  onClick={() =>  handleEventRowClick(event).then((r) => r)
                  }
                  key={event?.id}
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
                        {event?.title.toLowerCase().includes("birthday") && `${StringManager.formatTitle(event?.title)} 🎂`}
                        {!event?.title.toLowerCase().includes("birthday") && StringManager.formatTitle(event?.title)}
                      </p>
                    </div>

                    {/* DATE WRAPPER */}
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
                  </div>
                  {/* ICONS */}
                  {hasRowIcons(event) && (
                    <div id="icon-row">
                      {Manager.isValid(event?.reminderTimes) && <PiBellSimpleRingingDuotone />}
                      {Manager.isValid(event?.notes) && <PiNotepadDuotone />}
                      {Manager.isValid(event?.websiteUrl) && <PiGlobeDuotone />}
                      {Manager.isValid(event?.phone) && <MdLocalPhone />}
                      {Manager.isValid(event?.location) && <TbLocationFilled className="location-icon" />}
                      {Manager.isValid(event?.children) && <FaChildren />}
                    </div>
                  )}
                  <div className="delete-event-button">DELETE</div>
                </div>
              )
            })}
        </Fade>
      </div>
    </>
  )
}