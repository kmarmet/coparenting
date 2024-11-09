import React, { useContext, useEffect, useState } from 'react'
import DB from '@db'
import AppManager from '@managers/appManager'
import DateManager from '@managers/dateManager'
import Manager from '@manager'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import flatpickr from 'flatpickr'
import moment from 'moment'
import { DebounceInput } from 'react-debounce-input'
import globalState from '../../context'
import CalendarMapper from 'mappers/calMapper'
import CalendarManager from 'managers/calendarManager'
import BottomCard from 'components/shared/bottomCard'
import DateFormats from '../../constants/dateFormats'
import { useSwipeable } from 'react-swipeable'
import { LuCalendarSearch } from 'react-icons/lu'
import SecurityManager from '../../managers/securityManager'
import { FaChildren } from 'react-icons/fa6'
import { MdOutlineEditOff } from 'react-icons/md'

import { CgClose } from 'react-icons/cg'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFirstWord,
  isAllUppercase,
  oneButtonAlert,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  successAlert,
  throwError,
  toCamelCase,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../globalFunctions'
import NewCalendarEvent from '../forms/newCalendarEvent'
import EditCalEvent from '../forms/editCalEvent'
import { TbLocation } from 'react-icons/tb'
import { PiBellSimpleRinging, PiCalendarPlusDuotone, PiGlobeDuotone } from 'react-icons/pi'
import { GiPartyPopper } from 'react-icons/gi'
import NavBar from '../navBar'

export default function EventCalendar() {
  const { state, setState } = useContext(globalState)
  const { theme, menuIsOpen, currentUser, selectedNewEventDay, navbarButton } = state
  const [existingEvents, setExistingEvents] = useState([])
  const [showHolidaysCard, setShowHolidaysCard] = useState(false)
  const [allEventsFromDb, setAllEventsFromDb] = useState([])
  const [showNewEventCard, setShowNewEventCard] = useState(false)
  const [showEditCard, setShowEditCard] = useState(false)
  const [eventToEdit, setEventToEdit] = useState(null)
  const [showSearchCard, setShowSearchCard] = useState(false)
  const [showHolidays, setShowHolidays] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  // HANDLE SWIPE
  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      //console.log("User Swiped!", eventData);
      // setState({ ...state, showMenuButton: true, currentScreen: ScreenNames.cal })
      // Manager.showPageContainer('show')
      document.querySelector('.flatpickr-prev-month').click()
      console.log('swiped')
    },
    onSwipedLeft: () => {
      document.querySelector('.flatpickr-next-month').click()
    },
  })

  const formatEvents = (events) => {
    let dateArr = []
    events.forEach((event, index) => {
      if (dateArr.findIndex((x) => x.some((d) => d.startDate === event?.startDate || d.startDate === event?.startDate)) === -1) {
        dateArr.push([event])
      } else {
        const arrIndex = dateArr.findIndex((x) => x.some((d) => d.date === event?.date || d.startDate === event?.date))
        dateArr[arrIndex].push(event)
      }
    })
    return dateArr
  }

  const getSecuredEvents = async (selectedDay, selectedMonth) => {
    let securedEvents = await SecurityManager.getCalendarEvents(currentUser)

    securedEvents = DateManager.sortCalendarEvents(securedEvents, 'startDate', 'startTime')
    const eventsToAddDotsTo = securedEvents.sort((a, b) => {
      return a.startTime + b.startTime
    })

    setAllEventsFromDb(securedEvents)
    // Sort desc
    securedEvents = securedEvents.sort((a, b) => {
      if (a.startTime < b.startTime) {
        return -1
      }
      if (a.startTime > b.startTime) {
        return 1
      }
      return 0
    })
    if (selectedDay) {
      securedEvents = securedEvents.filter((x) => {
        if (x.startDate === selectedDay.toString()) {
          return x
        }
      })
      let datesWithTime = []
      let datesWithoutTime = []

      // Sort dates with time
      securedEvents.forEach((event) => {
        if (Manager.isValid(event?.startTime, false, false, true)) {
          datesWithTime.push(event)
        } else {
          datesWithoutTime.push(event)
        }
      })

      // Sort
      datesWithTime = datesWithTime.sort((a, b) => moment(a.startTime, DateFormats.timeForDb).diff(moment(b.startTime, DateFormats.timeForDb)))
      securedEvents = datesWithoutTime.concat(datesWithTime)
    }
    let eventsWithMultipleDays = []
    eventsToAddDotsTo.forEach((event, index) => {
      if (event?.startDate && event?.endDate && event?.startDate !== event?.endDate) {
        if (eventsWithMultipleDays.filter((x) => x.startDate === event?.startDate).length === 0) {
          const eventDaysCount = moment(event?.endDate).diff(event?.startDate, 'days')
          const randomColor = Math.floor(Math.random() * 16777215).toString(16)
          eventsWithMultipleDays.push({ eventObj: event, daysCount: eventDaysCount, color: randomColor })
        }
      }
    })

    // Support showing each event for multi-day events
    eventsWithMultipleDays.forEach((event) => {
      let dateRange = []
      for (let i = 1; i <= event?.daysCount; i++) {
        let formattedDay = moment(event?.eventObj.startDate).add(i, 'day').format(DateFormats.dateForDb)
        dateRange.push(formattedDay)
      }
      if (dateRange.includes(selectedDay)) {
        const eventToAdd = {
          id: event?.eventObj.id,
          title: event?.eventObj.title,
          startDate: event?.eventObj.startDate,
          endDate: event?.eventObj.endDate,
          startTime: event?.eventObj.startTime,
          endTime: event?.eventObj.endTime,
          children: event?.eventObj.children,
        }
        if (!securedEvents.includes(eventToAdd)) {
          securedEvents.push(eventToAdd)
        }
      }
    })

    addDayIndicators(selectedMonth, eventsToAddDotsTo, eventsWithMultipleDays)

    // Filter out dupes by event title
    let formattedDateArr = formatEvents(securedEvents)
    setExistingEvents(formattedDateArr.flat())
    setTimeout(() => {
      addEventRowAnimation()
    }, 100)
  }

  const addDayIndicators = (selectedMonth, events, eventsWithMultipleDays) => {
    // Remove existing icons/dots before adding them again
    document.querySelectorAll('.dot-wrapper').forEach((wrapper) => wrapper.remove())
    document.querySelectorAll('.payday-emoji').forEach((emoji) => emoji.remove())
    document.querySelectorAll('.holiday-emoji').forEach((emoji) => emoji.remove())
    if (selectedMonth) {
      selectedMonth = moment().add(1, 'M').format('MM')
    }
    // Loop through all calendar UI days
    document.querySelectorAll('.flatpickr-day').forEach((day, outerIndex) => {
      let formattedDay = moment(day.getAttribute('aria-label')).format(DateFormats.dateForDb)
      const dayOfWeek = moment(formattedDay).format('ddd')
      const weekendDays = ['Sat', 'Sun']
      if (weekendDays.includes(dayOfWeek)) {
        day.classList.add('weekend-day')
      }
      let holidayDate = moment(day.getAttribute('aria-label')).format('MM/DD')
      if (selectedMonth) {
        formattedDay = moment(formattedDay).format(DateFormats.dateForDb)
      }

      const dayHasEvent = events.filter((x) => x?.startDate === formattedDay || x?.endDate === formattedDay).length > 0

      // IF DAY HAS EVENT(S)
      if (dayHasEvent) {
        const dotWrapper = document.createElement('span')
        dotWrapper.classList.add('dot-wrapper')
        // Add holiday emoji
        if (events.filter((x) => x.startDate === formattedDay && x.isHoliday === true).length > 0) {
          const hoildayEmoji = document.createElement('span')
          hoildayEmoji.classList.add('holiday-emoji')
          switch (true) {
            case holidayDate === '01/01':
              hoildayEmoji.innerText = '🥳'
              break
            case holidayDate === '04/20':
              hoildayEmoji.innerText = '🐇'
              break
            case holidayDate === '05/26':
              hoildayEmoji.innerText = '🎖️'
              break
            case holidayDate === '05/11':
              hoildayEmoji.innerText = '👩‍👧‍👦'
              break
            case holidayDate === '06/15':
              hoildayEmoji.innerText = '👨‍👧‍👦'
              break
            case holidayDate === '07/04':
              hoildayEmoji.innerText = '🎇'
              break
            case holidayDate === '11/28':
              hoildayEmoji.innerText = '🦃'
              break
            case holidayDate === '10/31':
              hoildayEmoji.innerText = '🎃'
              break
            case holidayDate === '12/25':
              hoildayEmoji.innerText = '🎄'
              break
            case holidayDate === '12/24':
              hoildayEmoji.innerText = '🎄'
              break
            case holidayDate === '12/31':
              hoildayEmoji.innerText = '🥳'
              break
            default:
              hoildayEmoji.innerText = '✨'
          }
          day.append(hoildayEmoji)
        }
        // Add payday emoji
        const paycheckStrings = ['payday', 'paycheck', 'pay', 'salary', 'paid']
        const showPaydayEmoji = (title) => {
          let exists = false
          paycheckStrings.forEach((word) => {
            if (title.toLowerCase().includes(word)) {
              exists = true
            }
          })
          return exists
        }

        // PAYDAY EMOJI
        if (events.filter((x) => x.startDate === formattedDay && showPaydayEmoji(x.title)).length > 0) {
          const paydayEmoji = document.createElement('span')
          paydayEmoji.classList.add('payday-emoji')

          paydayEmoji.innerText = '$'
          day.append(paydayEmoji)
        }

        // VISITATION DOT
        const currentUserName = formatNameFirstNameOnly(currentUser.name)
        if (
          events.filter((x) => x.startDate === formattedDay && x.fromVisitationSchedule === true && contains(x?.title, currentUserName)).length > 0
        ) {
          const visitationDot = document.createElement('span')
          visitationDot.classList.add('current-user-visitation-dot')
          visitationDot.classList.add('dot')
          dotWrapper.append(visitationDot)
        }

        if (
          events.filter((x) => x.startDate === formattedDay && x.fromVisitationSchedule === true && !contains(x?.title, currentUserName)).length > 0
        ) {
          const visitationDot = document.createElement('span')
          visitationDot.classList.add('coparent-visitation-dot')
          visitationDot.classList.add('dot')
          dotWrapper.append(visitationDot)
        }

        // STANDARD EVENT DOT
        if (events.filter((x) => x.startDate === formattedDay)) {
          const standardEventDot = document.createElement('span')
          standardEventDot.classList.add('standard-event-dot')
          standardEventDot.classList.add('dot')
          dotWrapper.append(standardEventDot)
        }
        day.append(dotWrapper)
      } else {
        // Add margin top spacer
        const invisibleDots = document.createElement('span')
        invisibleDots.classList.add('invisible-dots')
        day.append(invisibleDots)
      }
      // Apply colors to multi-day events
      eventsWithMultipleDays.forEach((eventParentObj, index) => {
        if (eventParentObj.eventObj.startDate === formattedDay) {
          for (let i = 0; i <= eventParentObj.daysCount; i++) {
            document.querySelectorAll('.flatpickr-day').forEach((calDay) => {
              let formattedDay = moment(day.getAttribute('aria-label')).add(i, 'day').format(DateFormats.dateForDb)
              const daySquare = calDay.getAttribute('aria-label')
              if (moment(daySquare).format(DateFormats.dateForDb) === formattedDay) {
                calDay.classList.add('multi')
                calDay.classList.add(index.toString())
                // Style first/last day of multi-range
                if (i === 0) {
                  calDay.classList.add('first')
                }
                if (i === eventParentObj.daysCount) {
                  calDay.classList.add('last')
                }
              }
            })
          }
        }
      })
    })
  }

  const addEventRowAnimation = () => {
    document.querySelectorAll('.event-row').forEach((eventRow, i) => {
      setTimeout(() => {
        eventRow.classList.add('active')
      }, 200 * i)
    })
  }

  // ADD FLATPICKR CALENDAR
  const addFlatpickrCalendar = async () => {
    const dbRef = ref(getDatabase())
    flatpickr('#calendar-ui-container', {
      inline: true,
      defaultDate: new Date(),
      onReady: () => {
        onValue(child(dbRef, DB.tables.calendarEvents), async (snapshot) => {
          await getSecuredEvents(moment().format(DateFormats.dateForDb).toString(), moment().format('MM'))
        })
      },
      static: true,
      nextArrow: '<span class="calendar-arrow right material-icons-round">arrow_forward_ios</span>',
      prevArrow: '<span class="calendar-arrow left material-icons-round">arrow_back_ios</span>',
      appendTo: document.getElementById('calendar-ui-container'),
      // On month change
      onMonthChange: (selectedDates, dateStr, instance) => {
        onValue(child(dbRef, DB.tables.calendarEvents), async (snapshot) => {
          await getSecuredEvents(
            moment(`${instance.currentMonth + 1}/01/${instance.currentYear}`).format(DateFormats.dateForDb),
            instance.currentMonth + 1
          )
        })
      },
      // Firebase onValue change / date selection/click
      onChange: async (e) => {
        document.querySelectorAll('.event-row').forEach((eventRow, i) => {
          eventRow.classList.remove('active')
        })
        const date = moment(e[0]).format(DateFormats.dateForDb).toString()
        onValue(child(dbRef, DB.tables.calendarEvents), async (snapshot) => {
          await getSecuredEvents(date, moment(e[0]).format('MM'))
          setState({
            ...state,
            selectedNewEventDay: moment(e[0]).format(DateFormats.dateForDb).toString(),
          })
        })
      },
    })
  }

  const showAllHolidays = async () => {
    const allEvents = Manager.convertToArray(await DB.getTable(DB.tables.calendarEvents))
    const _holidays = allEvents.filter((x) => x.isHoliday === true).filter((x) => !contains(x?.title.toLowerCase(), 'visitation'))
    setShowHolidaysCard(!showHolidaysCard)
    setExistingEvents(_holidays)
    setShowHolidays(true)
    setTimeout(() => {
      addEventRowAnimation()
    }, 200)
  }

  const showVisitationHolidays = async () => {
    const allEvents = Manager.convertToArray(await DB.getTable(DB.tables.calendarEvents))
    let userVisitationHolidays = allEvents.filter(
      (x) => x.isHoliday === true && x.ownerPhone === currentUser.phone && contains(x.title.toLowerCase(), 'holiday')
    )
    console.log(userVisitationHolidays)
    userVisitationHolidays.forEach((holiday) => {
      holiday.title += ` (${holiday.holidayName})`
    })
    setExistingEvents(userVisitationHolidays)
    setShowHolidaysCard(!showHolidaysCard)
    setShowHolidays(true)
    setTimeout(() => {
      addEventRowAnimation()
    }, 200)
  }

  const viewAllEvents = async () => {
    setShowHolidaysCard(false)
    setShowSearchCard(false)
  }

  const handleEventRowClick = async (e, event) => {
    if (e.currentTarget.id === 'more-button') {
      return false
    }
    const shouldShowEditCard = !event?.isHoliday && e.target.tagName !== 'A' && e.target.id !== 'more-button'
    const hasEditAccess = AppManager.getAccountType(currentUser) === 'parent' && event.ownerPhone === currentUser.phone
    if (shouldShowEditCard && hasEditAccess) {
      setEventToEdit(event)
      setShowEditCard(true)
    } else {
      if (!hasEditAccess) {
        const owner = await Manager.getNamesFromPhone([event.ownerPhone])
        oneButtonAlert('Cannot Edit', `${owner[0].name} is the creator of this event, please ask them to edit it.`, 'warning')
      }
    }
  }

  useEffect(() => {
    if (showHolidays) {
      const rows = document.querySelectorAll('.event-row')

      if (rows && rows[0]) {
        rows[0].scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      const flatpickrCal = document.querySelector('.flatpickr-calendar ')
      if (flatpickrCal) {
        document.querySelector('.flatpickr-calendar ').scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [showHolidays])

  // ON PAGE LOAD
  useEffect(() => {
    setTimeout(() => {
      addFlatpickrCalendar().then((r) => r)
    }, 300)
    Manager.showPageContainer('show')
  }, [])

  return (
    <>
      {/* CARDS */}
      <>
        {/* HOLIDAYS CARD */}
        <BottomCard className={`${theme} view-holidays`} onClose={viewAllEvents} showCard={showHolidaysCard} title={'View Holidays ✨'}>
          <div className="flex buttons">
            <button className="card-button" id="view-all-holidays-item" onClick={showAllHolidays}>
              All
            </button>
            <button className="card-button" id="view-visitation-holidays-item" onClick={showVisitationHolidays}>
              Visitation
            </button>
            <button className="card-button cancel" onClick={() => setShowHolidaysCard(false)}>
              Close
            </button>
          </div>
        </BottomCard>

        {/* SEARCH CARD */}
        <BottomCard className="form search-card" title={'Find Events'} onClose={async () => setShowSearchCard(false)} showCard={showSearchCard}>
          <div className={'mb-5 flex form search-card'} id="search-container">
            <DebounceInput
              placeholder="Enter an event name..."
              minLength={2}
              className={'search-input'}
              debounceTimeout={500}
              onChange={async (e) => {
                const inputValue = e.target.value
                if (inputValue.length > 3) {
                  let results = []
                  if (Manager.isValid(allEventsFromDb, true)) {
                    results = allEventsFromDb.filter((x) => x?.title?.toLowerCase().indexOf(inputValue.toLowerCase()) > -1)
                  }
                  if (results.length > 0) {
                    setExistingEvents(results)
                    const rows = document.querySelectorAll('.event-row')

                    if (rows) {
                      rows[0].scrollIntoView({ behavior: 'smooth' })
                    }
                  }
                } else {
                  if (inputValue.length === 0) {
                    setShowSearchCard(false)
                    document.querySelector('.flatpickr-calendar').scrollIntoView({ behavior: 'smooth' })
                    await getSecuredEvents(moment().format(DateFormats.dateForDb).toString())
                  }
                }
              }}
            />
            <div className="buttons">
              <button
                className="card-button cancel"
                onClick={async () => {
                  document.querySelector('.flatpickr-calendar').scrollIntoView({ behavior: 'smooth', block: 'start' })
                  await getSecuredEvents(moment().format(DateFormats.dateForDb).toString())
                  setShowSearchCard(false)
                }}>
                Close
              </button>
            </div>
          </div>
        </BottomCard>

        {/* NEW EVENT */}
        <BottomCard
          className={`${theme} new-event-form new-calendar-event`}
          onClose={() => setShowNewEventCard(false)}
          showCard={showNewEventCard}
          title={'Add New Event'}>
          <NewCalendarEvent hideCard={() => setShowNewEventCard(false)} />
        </BottomCard>

        {/* EDIT EVENT */}
        <BottomCard
          title={'Edit Event'}
          showCard={showEditCard}
          className="edit-calendar-event"
          onClose={async (e) => {
            await getSecuredEvents(moment().format(DateFormats.dateForDb).toString())
            setShowEditCard(false)
          }}>
          <EditCalEvent
            event={eventToEdit}
            hideCard={async (e) => {
              await getSecuredEvents(moment().format(DateFormats.dateForDb).toString())
              setShowEditCard(false)
            }}
          />
        </BottomCard>
      </>

      {/* PAGE CONTAINER */}
      <div id="calendar-container" className={`page-container calendar ${theme} `}>
        <p className="screen-title">Calendar</p>
        {/* CALENDAR UI */}
        <div id="calendar-ui-container" className={`${theme}`} {...handlers}></div>
        {/* BELOW CALENDAR */}
        {!showHolidays && !showSearchCard && (
          <div id="below-calendar" className={`${theme} mt-10`}>
            <div className="flex">
              <p onClick={() => setShowHolidaysCard(!showHolidaysCard)} id="filter-button">
                Holidays
                <GiPartyPopper id={'filter-icon'} />
              </p>

              {/* SEARCH ICON */}
              <LuCalendarSearch
                className="search-icon"
                onClick={() => {
                  setShowSearchCard(true)
                  setTimeout(() => {
                    document.querySelector('.search-input').focus()
                  }, 100)
                }}
              />
            </div>
          </div>
        )}
        {/* MAP/LOOP EVENTS */}
        <div className="events">
          {Manager.isValid(existingEvents, true) &&
            existingEvents.map((event, index) => {
              let readableReminderTimes = []
              event?.reminderTimes?.forEach((time) => {
                if (time && time !== undefined) {
                  readableReminderTimes.push(`<span>${CalendarMapper.readableReminderBeforeTimeframes(time)}</span>`)
                }
              })
              let eventType = 'standard'
              if (event?.fromVisitationSchedule) {
                if (contains(event?.createdBy?.toLowerCase(), currentUser.name.toLowerCase())) {
                  eventType = 'current-user-visitation'
                } else {
                  eventType = 'coparent-visitation'
                }
              }
              return (
                <>
                  <div
                    onClick={(e) => handleEventRowClick(e, event)}
                    key={index}
                    data-from-date={event?.startDate}
                    className={`${event?.fromVisitationSchedule ? 'event-row visitation flex' : 'event-row flex'} ${eventType}`}>
                    <div className="text">
                      <div className="top">
                        {/* DATE CONTAINER */}
                        <div id="date-container">
                          {/* FROM DATE */}
                          {!contains(event?.startDate, 'Invalid') && event?.startDate?.length > 0 && (
                            <span className="start-date">
                              {moment(event?.startDate).format(showHolidays ? DateFormats.readableMonthAndDay : DateFormats.readableDay)}
                            </span>
                          )}
                          {/* TO WORD */}
                          {!contains(event?.endDate, 'Invalid') && event?.endDate?.length > 0 && event?.endDate !== event?.startDate && (
                            <span className="end-date">&nbsp;to&nbsp; </span>
                          )}
                          {/* TO DATE */}
                          {!contains(event?.endDate, 'Invalid') && event?.endDate?.length > 0 && event?.endDate !== event?.startDate && (
                            <span>{moment(event?.endDate).format(DateFormats.readableDay)}</span>
                          )}
                          {/* ALL DAY */}
                          {event &&
                            !Manager.isValid(event?.startTime) &&
                            (!Manager.isValid(event?.endDate) || event?.endDate.indexOf('Invalid') > -1) &&
                            event?.endDate !== event?.startDate && <span className="end-date">&nbsp;- ALL DAY</span>}
                          {/* TIMES */}
                          <span id="times">
                            {!contains(event?.startTime, 'Invalid') && event?.startTime?.length > 0 && (
                              <span className="from-time">
                                <span className="at-symbol">&nbsp;@</span> {event?.startTime}
                              </span>
                            )}
                            {!contains(event?.endTime, 'Invalid') && event?.endTime?.length > 0 && event?.endTime !== event?.startTime && (
                              <span className="to-time"> - {event?.endTime}</span>
                            )}
                          </span>
                          {/* DIRECTIONS LINK */}
                          {event?.location && event?.location.length > 0 && (
                            <div className="flex" id="nav-website">
                              {event?.websiteUrl && true && event?.websiteUrl.length > 0 && (
                                <div className="website flex">
                                  <PiGlobeDuotone />
                                  <a target="_blank" href={event?.websiteUrl} className="website-url fs-14" rel="noreferrer">
                                    Website
                                  </a>
                                </div>
                              )}
                              <div className="directions">
                                <TbLocation />
                                <a href={Manager.getDirectionsLink(event?.location)} target="_blank">
                                  Nav
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* TITLE */}
                        <p className="title" data-event-id={event?.id}>
                          <b className={`event-title ${eventType}`}>{CalendarManager.formatEventTitle(event?.title)}</b>
                        </p>
                      </div>

                      {/* NOTES */}
                      {Manager.isValid(event?.notes) && event?.notes.length > 0 && (
                        <p className={showNotes ? 'active notes pb-10' : 'notes 0'}>{event?.notes}</p>
                      )}
                      <div className="flex reminders">
                        {/* REMINDERS */}
                        {Manager.isValid(readableReminderTimes, true) && (
                          <>
                            <PiBellSimpleRinging className={'event-icon'} />
                            <p
                              className="flex reminder-times"
                              dangerouslySetInnerHTML={{
                                __html: `${readableReminderTimes.join('|').replaceAll('|', '<span class="divider">|</span>').replaceAll(' minutes before', 'mins').replaceAll('At time of event', 'Event Time').replaceAll(' hour before', 'hr')}`,
                              }}></p>
                          </>
                        )}
                      </div>
                      {event.ownerPhone !== currentUser.phone && <MdOutlineEditOff className={'no-edit-access-icon'} />}
                      <div className={`flex ${event?.notes?.length > 0 || event?.children?.length > 0 ? 'pt-5' : ''}`} id="more-children">
                        <div id="children">
                          {/* CHILDREN */}
                          {event?.children && event?.children.length > 0 && (
                            <div className="children flex">
                              <FaChildren />
                              <p
                                className="fs-14 "
                                dangerouslySetInnerHTML={{
                                  __html: `${event?.children.join('|').replaceAll('|', '<span class="divider">|</span>')}`,
                                }}></p>
                            </div>
                          )}
                        </div>

                        {event?.notes && event?.notes.length > 0 && (
                          <>
                            {!showNotes && (
                              <p onClick={() => setShowNotes(true)} id="more-button">
                                SHOW MORE
                              </p>
                            )}
                            {showNotes && (
                              <p onClick={() => setShowNotes(false)} id="more-button">
                                SHOW LESS
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <hr className="event-hr" />
                </>
              )
            })}
        </div>
      </div>
      {!showNewEventCard && !showSearchCard && !showEditCard && !showHolidaysCard && !showHolidays && (
        <NavBar navbarClass={'calendar'}>
          <PiCalendarPlusDuotone className={'new-event'} id={'add-new-button'} onClick={() => setShowNewEventCard(true)} />
        </NavBar>
      )}
      {showHolidays && (
        <NavBar navbarClass={'calendar close-holiday'}>
          <CgClose
            id={'add-new-button'}
            onClick={async () => {
              document.querySelector('.flatpickr-calendar').scrollIntoView({ behavior: 'smooth' })
              await getSecuredEvents(moment().format(DateFormats.dateForDb).toString())
              setShowHolidays(false)
            }}
          />
        </NavBar>
      )}
    </>
  )
}
