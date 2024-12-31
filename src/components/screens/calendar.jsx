import React, { useContext, useEffect, useState } from 'react'
import DB from '@db'
import DateManager from '@managers/dateManager'
import Manager from '@manager'
import moment from 'moment'
import globalState from '../../context'
import CalendarMapper from 'mappers/calMapper'
import CalendarManager from 'managers/calendarManager'
import BottomCard from 'components/shared/bottomCard'
import DateFormats from '../../constants/dateFormats'
import { LuCalendarSearch } from 'react-icons/lu'
import SecurityManager from '../../managers/securityManager'
import { PiCalendarPlusDuotone, PiCalendarXDuotone } from 'react-icons/pi'
import { StaticDatePicker } from '@mui/x-date-pickers-pro'
import AlertManager from '../../managers/alertManager'
import { CgClose } from 'react-icons/cg'
import { contains, formatNameFirstNameOnly } from '../../globalFunctions'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import NewCalendarEvent from '../forms/newCalendarEvent'
import EditCalEvent from '../forms/editCalEvent'
import NavBar from '../navBar'
import InputWrapper from '../shared/inputWrapper'
import { GiPartyPopper } from 'react-icons/gi'
import DomManager from '../../managers/domManager'
import { Fade } from 'react-awesome-reveal'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import { TfiClose } from 'react-icons/tfi'

export default function EventCalendar() {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser, userIsLoggedIn } = state
  const [existingEvents, setExistingEvents] = useState([])
  const [showHolidaysCard, setShowHolidaysCard] = useState(false)
  const [allEventsFromDb, setAllEventsFromDb] = useState([])
  const [showNewEventCard, setShowNewEventCard] = useState(false)
  const [showEditCard, setShowEditCard] = useState(false)
  const [eventToEdit, setEventToEdit] = useState(null)
  const [showSearchCard, setShowSearchCard] = useState(false)
  const [showHolidays, setShowHolidays] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNewEventDay, setSelectedNewEventDay] = useState(moment())
  const [loadingDisabled, setLoadingDisabled] = useState(false)
  const [showLegend, setShowLegend] = useState(false)

  // GET EVENTS
  const getSecuredEvents = async (selectedDay, selectedMonth) => {
    let securedEvents = await SecurityManager.getCalendarEvents(currentUser)
    const eventsToAddDotsTo = securedEvents.sort((a, b) => {
      return a.startTime + b.startTime
    })

    setAllEventsFromDb(securedEvents)

    if (selectedDay) {
      securedEvents = securedEvents.filter((x) => x.startDate === moment(selectedDay).format(DateFormats.dateForDb))
    } else {
      securedEvents = securedEvents.filter((x) => x.startDate === moment().format(DateFormats.dateForDb))
    }

    // Sort
    securedEvents = DateManager.sortCalendarEvents(securedEvents, 'startDate', 'startTime')

    // ADD DAY INDICATORS
    await addDayIndicators(eventsToAddDotsTo)
    setExistingEvents(securedEvents)
  }

  const addDayIndicators = async (events) => {
    const paycheckStrings = ['payday', 'paycheck', 'pay', 'salary', 'paid']
    // Remove existing icons/dots before adding them again
    document.querySelectorAll('.dot-wrapper').forEach((wrapper) => wrapper.remove())
    document.querySelectorAll('.payday-emoji').forEach((emoji) => emoji.remove())
    document.querySelectorAll('.holiday-emoji').forEach((emoji) => emoji.remove())

    // Loop through all calendar UI days
    const days = document.querySelectorAll('.MuiPickersDay-root')
    for (const day of days) {
      const dayAsMs = day.getAttribute('data-timestamp')
      let formattedDay = moment(DateManager.msToDate(dayAsMs)).format(DateFormats.dateForDb)
      const dayEvent = await DB.find(events, ['startDate', formattedDay], false)

      if (!dayEvent) {
        continue
      }
      const daysEvents = events.filter((x) => x.startDate === formattedDay)

      // Apply weekend day class
      const dayOfWeek = moment(formattedDay).isoWeekday()
      if (dayOfWeek === 6 || dayOfWeek === 7) {
        day.classList.add('weekend-day')
      }
      if (dayEvent.startDate === formattedDay) {
        const dotWrapper = document.createElement('span')
        dotWrapper.classList.add('dot-wrapper')

        // HOLIDAYS
        if (events.filter((x) => x.startDate === formattedDay && x.isHoliday === true).length > 0) {
          let holidayDate = moment(formattedDay).format('MM/DD')

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

        // PAYDAY ICON
        const showPaydayEmoji = (title) => {
          let exists = false
          paycheckStrings.forEach((word) => {
            if (title.toLowerCase().includes(word)) {
              exists = true
            }
          })
          return exists
        }
        if (events.filter((x) => x.startDate === formattedDay && showPaydayEmoji(x.title)).length > 0) {
          const payDayIcon = document.createElement('span')
          payDayIcon.classList.add('payday-emoji')
          payDayIcon.innerText = '$'
          day.append(payDayIcon)
        }

        // ADD DOTS
        let alreadyAdded = []
        for (let _event of daysEvents) {
          const eventType = getRowDotColor(_event)

          if (!alreadyAdded.includes(eventType)) {
            if (eventType === 'standard-dot') {
              const standardEventDot = document.createElement('span')
              standardEventDot.classList.add('standard-event-dot', 'dot')
              dotWrapper.append(standardEventDot)
              alreadyAdded.push(eventType)
            }
            if (eventType === 'current-user-dot') {
              const currentUserDot = document.createElement('span')
              currentUserDot.classList.add('current-user-event-dot', 'dot')
              dotWrapper.append(currentUserDot)
              alreadyAdded.push(eventType)
            }
            if (eventType === 'coparent-dot') {
              const coparentDot = document.createElement('span')
              coparentDot.classList.add('coparent-event-dot', 'dot')
              dotWrapper.append(coparentDot)
              alreadyAdded.push(eventType)
            }
          }
        }

        day.append(dotWrapper)
      } else {
        // Add margin top spacer
        const invisibleDots = document.createElement('span')
        invisibleDots.classList.add('invisible-dots')
        if (day.innerHTML.indexOf('invisible') === -1) {
          day.append(invisibleDots)
        }
      }
    }
  }

  const showAllHolidays = async () => {
    const allEvents = Manager.convertToArray(await DB.getTable(DB.tables.calendarEvents))
    const _holidays = allEvents.filter((x) => x.isHoliday === true).filter((x) => !contains(x?.title.toLowerCase(), 'visitation'))
    setShowHolidaysCard(!showHolidaysCard)
    setExistingEvents(_holidays)
    setShowHolidays(true)
  }

  const showVisitationHolidays = async () => {
    const allEvents = Manager.convertToArray(await DB.getTable(DB.tables.calendarEvents))
    let userVisitationHolidays = []
    if (currentUser.accountType === 'parent') {
      userVisitationHolidays = allEvents.filter(
        (x) => x.isHoliday === true && x.ownerPhone === currentUser?.phone && contains(x.title.toLowerCase(), 'holiday')
      )
    }
    if (currentUser.accountType === 'child') {
      // const parentNumbers = (currentUser?.parents?.userVisitationHolidays = allEvents.filter(
      //   (x) => x.isHoliday === true && x.ownerPhone === currentUser?.phone && contains(x.title.toLowerCase(), 'holiday')
      // ))
    }
    userVisitationHolidays.forEach((holiday) => {
      holiday.title += ` (${holiday.holidayName})`
    })
    setExistingEvents(userVisitationHolidays)
    setShowHolidaysCard(!showHolidaysCard)
    setShowHolidays(true)
  }

  const viewAllEvents = () => {
    setShowHolidaysCard(false)
    setSearchQuery('')
    setShowSearchCard(false)
    getSecuredEvents(moment().format(DateFormats.dateForDb).toString()).then((r) => r)
    Manager.scrollIntoView('#static-calendar')
  }

  const handleEventRowClick = async (e, event) => {
    if (e.currentTarget.id === 'more-button') {
      return false
    }
    if (event.isHoliday) {
      return false
    }
    const shouldShowEditCard = !event?.isHoliday && e.target.tagName !== 'A' && e.target.id !== 'more-button'
    const hasEditAccess = event.ownerPhone === currentUser?.phone
    if (shouldShowEditCard && hasEditAccess) {
      setEventToEdit(event)
      setShowEditCard(true)
    } else {
      if (!hasEditAccess) {
        const owner = await Manager.getNamesFromPhone([event.ownerPhone])
        AlertManager.oneButtonAlert('Cannot Edit', `${owner[0].name} is the creator of this event, please ask them to edit it.`, 'warning')
      }
    }
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, `${DB.tables.calendarEvents}`), async (snapshot) => {
      await getSecuredEvents(moment(selectedNewEventDay).format(DateFormats.dateForDb), moment().format('MM')).then((r) => r)
    })
  }

  const onActivityChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, `${DB.tables.activities}/${currentUser?.phone}`), async (snapshot) => {
      const activities = Manager.convertToArray(snapshot.val())
      setState({ ...state, activityCount: activities.length, isLoading: false })
    })
  }

  useEffect(() => {
    if (!loadingDisabled && currentUser?.hasOwnProperty('email')) {
      onActivityChange().then((r) => r)
      setLoadingDisabled(true)
    }
  }, [currentUser])

  // SHOW HOLIDAYS
  useEffect(() => {
    if (DomManager.isMobile()) {
      if (showHolidays) {
        const rows = document.querySelectorAll('.event-row')

        if (rows && rows[0]) {
          rows[0].scrollIntoView({ behavior: 'smooth' })
        }
      } else {
        Manager.scrollIntoView('#static-calendar ')
      }
    }
  }, [showHolidays])

  // ON PAGE LOAD
  useEffect(() => {
    // Append Holidays/Search Cal Buttons
    const staticCalendar = document.querySelector('.MuiDialogActions-root')
    const holidaysButton = document.getElementById('holidays-button')
    const searchButton = document.getElementById('search-button')
    const legendButtonWrapper = document.getElementById('legend-wrapper')
    if (staticCalendar && holidaysButton && searchButton && legendButtonWrapper) {
      staticCalendar.prepend(holidaysButton)
      staticCalendar.prepend(searchButton)
      staticCalendar.prepend(legendButtonWrapper)

      legendButtonWrapper.addEventListener('click', () => {
        setShowLegend(true)
      })
      holidaysButton.addEventListener('click', () => {
        setShowHolidaysCard(!showHolidaysCard)
      })
      searchButton.addEventListener('click', () => {
        setShowSearchCard(true)
      })
    }

    onTableChange().then((r) => r)
  }, [])

  const getRowDotColor = (event) => {
    const isCurrentUserDot = event.ownerPhone === currentUser?.phone
    if (event.isHoliday && !event.fromVisitationSchedule) {
      return 'standard-dot'
    }
    if (isCurrentUserDot) {
      return 'current-user-dot'
    }
    if (!isCurrentUserDot) {
      return 'coparent-dot'
    }

    return 'standard-dot'
  }

  return (
    <>
      {/* CARDS */}
      <>
        {/* HOLIDAYS CARD */}
        <BottomCard
          hasSubmitButton={false}
          className={`${theme} view-holidays`}
          wrapperClass={`view-holidays`}
          onClose={viewAllEvents}
          showCard={showHolidaysCard}
          title={'View Holidays ✨'}>
          <div id="holiday-card-buttons">
            <button className="card-button" id="view-all-holidays-item" onClick={showAllHolidays}>
              All
            </button>
            <button className="card-button blue" id="view-visitation-holidays-item" onClick={showVisitationHolidays}>
              Visitation
            </button>
          </div>
        </BottomCard>

        {/* SEARCH CARD */}
        <BottomCard
          submitIcon={<LuCalendarSearch />}
          submitText={'Search'}
          className="form search-card"
          wrapperClass="search-card"
          title={'Find Events'}
          onClose={viewAllEvents}
          showCard={showSearchCard}
          onSubmit={() => {
            if (searchQuery.length === 0) {
              AlertManager.throwError('Please enter a search value')
              return false
            }

            if (!Manager.isValid(searchResults)) {
              AlertManager.throwError('No results found')
              return false
            } else {
              setExistingEvents(searchResults)
              setShowSearchCard(false)
              setTimeout(() => {
                const rows = document.querySelectorAll('.event-row')

                if (rows) {
                  rows[0].scrollIntoView({ behavior: 'smooth' })
                }
              }, 400)
            }
          }}>
          <div className={'mb-5 flex form search-card'} id="search-container">
            <InputWrapper
              placeholder="Enter event name..."
              refreshKey={refreshKey}
              inputValue={searchQuery}
              onChange={async (e) => {
                const inputValue = e.target.value
                if (inputValue.length > 3) {
                  setSearchQuery(inputValue)
                  let results = []
                  if (Manager.isValid(allEventsFromDb)) {
                    results = allEventsFromDb.filter((x) => x?.title?.toLowerCase().indexOf(inputValue.toLowerCase()) > -1)
                  }
                  if (results.length > 0) {
                    setSearchResults(results)
                  }
                } else {
                  if (inputValue.length === 0) {
                    setShowSearchCard(false)
                    Manager.scrollIntoView('#static-calendar')
                    await getSecuredEvents(moment().format(DateFormats.dateForDb).toString())
                    setRefreshKey(Manager.getUid())
                  }
                }
              }}
            />
          </div>
        </BottomCard>

        {/* NEW EVENT */}
        <NewCalendarEvent selectedNewEventDay={selectedNewEventDay} showCard={showNewEventCard} hideCard={() => setShowNewEventCard(false)} />

        {/* EDIT EVENT */}
        <EditCalEvent
          showCard={showEditCard}
          onClose={async (editDay) => {
            await getSecuredEvents(moment(editDay).format(DateFormats.dateForDb).toString())
            setShowEditCard(false)
          }}
          event={eventToEdit}
        />
      </>

      {/* PAGE CONTAINER */}
      <div id="calendar-container" className={`page-container calendar ${theme} `}>
        <Fade direction={'up'} className={'page-container-fade-wrapper'} duration={1000} triggerOnce={true} cascade={true}>
          {/* STATIC CALENDAR */}
          <div id="static-calendar" className={theme}>
            <StaticDatePicker
              showDaysOutsideCurrentMonth={true}
              defaultValue={moment(selectedNewEventDay)}
              onMonthChange={async (month) => {
                await getSecuredEvents(null, month)
              }}
              onChange={async (day) => {
                setTimeout(async () => {
                  await getSecuredEvents(day)
                }, 500)
                setSelectedNewEventDay(day)
              }}
              slotProps={{
                actionBar: {
                  actions: ['today'],
                },
              }}
            />
          </div>

          {/* LEGEND */}
          <Accordion expanded={showLegend} id={'calendar-legend'} className={showLegend ? 'open' : 'closed'}>
            <AccordionSummary className={showLegend ? 'open' : 'closed'}>
              {showLegend && <TfiClose onClick={() => setShowLegend(false)} />}
            </AccordionSummary>
            <AccordionDetails>
              <p className="flex currentUser">
                <span className="dot in-legend currentUser"></span> Your Event
              </p>
              <p className="flex coparent">
                <span className="dot coparent in-legend"></span> Co-Parent/Child Event
              </p>
              <p className="flex standard">
                <span className="dot in-legend standard"></span> Holiday
              </p>
            </AccordionDetails>
          </Accordion>

          {/* CONTENT WITH PADDING */}
          <div className="with-padding">
            {/* BELOW CALENDAR */}
            {!showHolidays && !showSearchCard && (
              <div id="below-calendar" className={`${theme} mt-10 flex`}>
                {/* LEGEND BUTTON */}
                <div className="flex" id="legend-wrapper" onClick={() => setShowLegend(true)}>
                  <span className="dot currentUser"></span>
                  <span className="dot coparent"></span>
                  <span className="dot standard"></span>
                  <p id="legend-button">Legend</p>
                </div>
                {/* HOLIDAY BUTTON */}
                <p id="holidays-button">Holidays</p>

                {/* SEARCH BUTTON */}
                <p id="search-button">Search</p>
              </div>
            )}
            {/* MAP/LOOP EVENTS */}
            <div className="events">
              <Fade direction={'up'} className={'calendar-events-fade-wrapper'}>
                {!Manager.isValid(existingEvents) && <p id="no-events-text">No events on this day</p>}
                {Manager.isValid(existingEvents) &&
                  existingEvents.map((event, index) => {
                    let readableReminderTimes = []
                    event?.reminderTimes?.forEach((time) => {
                      if (time) {
                        readableReminderTimes.push(`<span>${CalendarMapper.readableReminderBeforeTimeframes(time)}</span>`)
                      }
                    })
                    let eventType = getRowDotColor(event)
                    return (
                      <div
                        key={index}
                        id="row"
                        onClick={(e) => handleEventRowClick(e, event)}
                        data-from-date={event?.startDate}
                        className={`${event?.fromVisitationSchedule ? 'event-row visitation flex' : 'event-row flex'} ${eventType} ${index === existingEvents.length - 2 ? 'last-child' : ''}`}>
                        <div className="text flex space-between">
                          {/* LEFT COLUMN */}
                          {/* TITLE */}
                          <div className="flex space-between" id="title-wrapper">
                            <p className="title flex" id="title" data-event-id={event?.id}>
                              <span className={`${eventType} event-type-dot`}></span>
                              {CalendarManager.formatEventTitle(event?.title)}
                            </p>
                          </div>
                          {/* DATE CONTAINER */}
                          <div id="subtitle" className="flex space-between calendar">
                            <div id="date-container">
                              {/* FROM DATE */}
                              {!contains(event?.startDate, 'Invalid') && event?.startDate?.length > 0 && (
                                <span className="start-date" id="subtitle">
                                  {moment(event?.startDate).format(showHolidays ? DateFormats.readableMonthAndDay : DateFormats.readableDay)}
                                </span>
                              )}
                              {/* TO WORD */}
                              {!contains(event?.endDate, 'Invalid') && event?.endDate?.length > 0 && event?.endDate !== event?.startDate && (
                                <span className="end-date" id="subtitle">
                                  &nbsp;to&nbsp;{' '}
                                </span>
                              )}
                              {/* TO DATE */}
                              {!contains(event?.endDate, 'Invalid') && event?.endDate?.length > 0 && event?.endDate !== event?.startDate && (
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
                              {!contains(event?.startTime, 'Invalid') && event?.startTime?.length > 0 && (
                                <span id="subtitle" className="from-time">
                                  <span className="at-symbol">&nbsp;@</span> {event?.startTime}
                                </span>
                              )}
                              {!contains(event?.endTime, 'Invalid') && event?.endTime?.length > 0 && event?.endTime !== event?.startTime && (
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
          </div>
        </Fade>
      </div>

      {/* DESKTOP SIDEBAR */}
      {!DomManager.isMobile() && (
        <div id="calendar-sidebar">
          <p className="item" id="new-event" onClick={() => setShowNewEventCard(true)}>
            <PiCalendarPlusDuotone className={'new-event'} id={'add-new-button'} /> New Event
          </p>
          {!showHolidays && (
            <p className="item" id="holidays-button" onClick={() => setShowHolidaysCard(true)}>
              <GiPartyPopper />
              Holidays
            </p>
          )}
          {showHolidays && (
            <p
              className="item"
              onClick={async () => {
                await getSecuredEvents(moment().format(DateFormats.dateForDb).toString())
                setShowHolidays(false)
              }}>
              <PiCalendarXDuotone /> Hide Holidays
            </p>
          )}

          <InputWrapper
            defaultValue="Find events"
            refreshKey={refreshKey}
            inputType={'input'}
            inputValue={searchQuery}
            onChange={async (e) => {
              const inputValue = e.target.value
              if (inputValue.length > 3) {
                setSearchQuery(inputValue)
                let results = []
                if (Manager.isValid(allEventsFromDb)) {
                  results = allEventsFromDb.filter((x) => x?.title?.toLowerCase().indexOf(inputValue.toLowerCase()) > -1)
                }
                if (results.length > 0) {
                  setExistingEvents(results)
                }
              } else {
                if (inputValue.length === 0) {
                  setShowSearchCard(false)
                  Manager.scrollIntoView('#static-calendar')
                  await getSecuredEvents(moment().format(DateFormats.dateForDb).toString())
                  setRefreshKey(Manager.getUid())
                  e.target.value = ''
                  setSearchQuery('')
                }
              }
            }}
          />
        </div>
      )}

      {/* NAVBARS */}
      {DomManager.isMobile() && (
        <>
          {!showNewEventCard && !showSearchCard && !showEditCard && !showHolidaysCard && !showHolidays && (
            <NavBar navbarClass={'calendar search-results'} addOrClose={searchResults.length === 0 ? 'add' : 'close'}>
              {searchResults.length === 0 && (
                <PiCalendarPlusDuotone className={'new-event'} id={'add-new-button'} onClick={() => setShowNewEventCard(true)} />
              )}
              {searchResults.length > 0 && (
                <CgClose
                  id={'close-button'}
                  onClick={async () => {
                    Manager.scrollIntoView('#static-calendar')
                    await getSecuredEvents(moment().format(DateFormats.dateForDb).toString())
                    setSearchResults([])
                    setSearchQuery('')
                  }}
                />
              )}
            </NavBar>
          )}
          {showHolidays && (
            <NavBar navbarClass={'calendar'} addOrClose={showHolidays ? 'close' : 'add'}>
              <CgClose
                id={'close-button'}
                onClick={async () => {
                  Manager.scrollIntoView('#static-calendar')
                  await getSecuredEvents(moment().format(DateFormats.dateForDb).toString())
                  setShowHolidays(false)
                }}
              />
            </NavBar>
          )}
        </>
      )}
    </>
  )
}