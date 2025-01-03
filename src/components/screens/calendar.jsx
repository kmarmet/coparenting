import React, { useContext, useEffect, useState } from 'react'
import DB from '@db'
import DateManager from '@managers/dateManager.js'
import Manager from '@manager'
import moment from 'moment'
import globalState from '../../context'
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
import Label from '../shared/label'
import { HiOutlineColorSwatch } from 'react-icons/hi'

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
  const [showDesktopLegend, setShowDesktopLegend] = useState(false)
  const [activeMonth, setActiveMonth] = useState('')
  const [holidays, setHolidays] = useState([])
  // GET EVENTS
  const getSecuredEvents = async (selectedDay, selectedMonth) => {
    let securedEvents = await SecurityManager.getCalendarEvents(currentUser)
    let allEvents = securedEvents
    let holidays = await DB.getTable(DB.tables.holidayEvents)
    const eventsToAddDotsTo = securedEvents.sort((a, b) => {
      return a.startTime + b.startTime
    })
    setAllEventsFromDb(securedEvents)
    if (selectedDay) {
      securedEvents = securedEvents.filter((x) => x.startDate === moment(selectedDay).format(DateFormats.dateForDb))
      holidays = holidays.filter((x) => moment(x.startDate).format(DateFormats.dateForDb) === moment(selectedDay).format(DateFormats.dateForDb))
    } else {
      holidays = holidays.filter((x) => x.startDate === moment().format(DateFormats.dateForDb))
      securedEvents = securedEvents.filter((x) => x.startDate === moment().format(DateFormats.dateForDb))
    }
    // Sort
    securedEvents = DateManager.sortCalendarEvents(securedEvents, 'startDate', 'startTime')
    securedEvents = [...securedEvents, ...holidays]
    // ADD DAY INDICATORS
    addDayIndicators([...allEvents, ...holidays])
    setExistingEvents(securedEvents)
  }

  const addDayIndicators = (events) => {
    const paycheckStrings = ['payday', 'paycheck', 'pay', 'salary', 'paid']
    // Remove existing icons/dots before adding them again
    document.querySelectorAll('.dot-wrapper').forEach((wrapper) => wrapper.remove())
    document.querySelectorAll('.payday-emoji').forEach((emoji) => emoji.remove())
    document.querySelectorAll('.holiday-emoji').forEach((emoji) => emoji.remove())
    // Iterate static calendar day elements
    const dayElements = document.querySelectorAll('.MuiPickersDay-root')
    for (const dayElement of dayElements) {
      const dayAsMs = dayElement.dataset.timestamp
      let formattedDay = moment(DateManager.msToDate(dayAsMs)).format(DateFormats.dateForDb)
      let dayEvent = getEventFromDate(formattedDay, events)

      // APPEND INVISIBLE DOTS AND SKIP DAY WITHOUT EVENT
      if (!dayEvent) {
        const invisibleDots = document.createElement('span')
        invisibleDots.classList.add('invisible-dots')
        if (dayElement.innerHTML.indexOf('invisible') === -1) {
          dayElement.append(invisibleDots)
        }
        continue
      }

      // Apply weekend day class
      const dayOfWeek = moment(formattedDay).isoWeekday()

      if (dayOfWeek === 6 || dayOfWeek === 7) {
        dayElement.classList.add('weekend-day')
      }
      // APPEND DOTS/EMOJIS
      if (dayEvent?.startDate === formattedDay) {
        const dotWrapper = document.createElement('span')
        dotWrapper.classList.add('dot-wrapper')
        if (dayEvent?.isHoliday) {
          const holidayEmoji = document.createElement('span')
          holidayEmoji.classList.add('holiday-emoji')
          switch (true) {
            case moment(dayEvent.startDate).format('MM/DD') === '01/01':
              holidayEmoji.innerText = '🥳'
              break
            case moment(dayEvent.startDate).format('MM/DD') === '04/20':
              holidayEmoji.innerText = '🐇'
              break
            case moment(dayEvent.startDate).format('MM/DD') === '05/26':
              holidayEmoji.innerText = '🎖️'
              break
            case moment(dayEvent.startDate).format('MM/DD') === '05/11':
              holidayEmoji.innerText = '👩‍👧‍👦'
              break
            case moment(dayEvent.startDate).format('MM/DD') === '06/15':
              holidayEmoji.innerText = '👨‍👧‍👦'
              break
            case moment(dayEvent.startDate).format('MM/DD') === '07/04':
              holidayEmoji.innerText = '🎇'
              break
            case moment(dayEvent.startDate).format('MM/DD') === '11/28':
              holidayEmoji.innerText = '🦃'
              break
            case moment(dayEvent.startDate).format('MM/DD') === '10/31':
              holidayEmoji.innerText = '🎃'
              break
            case moment(dayEvent.startDate).format('MM/DD') === '12/25':
              holidayEmoji.innerText = '🎄'
              break
            case moment(dayEvent.startDate).format('MM/DD') === '12/24':
              holidayEmoji.innerText = '🎄'
              break
            case moment(dayEvent.startDate).format('MM/DD') === '12/31':
              holidayEmoji.innerText = '🥳'
              break
            default:
              holidayEmoji.innerText = '✨'
          }
          dayElement.append(holidayEmoji)
        }
        // HOLIDAYS

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
          dayElement.append(payDayIcon)
        }
        // ADD DOTS
        const dot = dayElement.querySelector('.dot')
        const eventType = getRowDotColor(formattedDay)
        if (!Manager.isValid(dot)) {
          if (eventType === 'standard-dot') {
            const standardEventDot = document.createElement('span')
            standardEventDot.classList.add('standard-event-dot', 'dot')
            dotWrapper.append(standardEventDot)
          }
          if (eventType === 'current-user-dot') {
            const currentUserDot = document.createElement('span')
            currentUserDot.classList.add('current-user-event-dot', 'dot')
            dotWrapper.append(currentUserDot)
          }
          if (eventType === 'coparent-dot') {
            const coparentDot = document.createElement('span')
            coparentDot.classList.add('coparent-event-dot', 'dot')
            dotWrapper.append(coparentDot)
          }
          dayElement.append(dotWrapper)
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

  const handleEventRowClick = async (clickedEvent) => {
    if (clickedEvent.isHoliday) {
      return false
    }
    setEventToEdit(clickedEvent)
    setShowEditCard(true)
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, `${DB.tables.calendarEvents}/${currentUser.phone}/events`), async (snapshot) => {
      await getSecuredEvents(moment(selectedNewEventDay).format(DateFormats.dateForDb), moment().format('MM')).then((r) => r)
    })
    // onValue(child(dbRef, `${DB.tables.calendarEvents}/${currentUser.phone}/sharedEvents`), async (snapshot) => {
    //   await getSecuredEvents(moment(selectedNewEventDay).format(DateFormats.dateForDb), moment().format('MM')).then((r) => r)
    // })
  }

  const onActivityChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, `${DB.tables.activities}/${currentUser?.phone}`), async (snapshot) => {
      const activities = Manager.convertToArray(snapshot.val())
      setState({ ...state, activityCount: activities.length, isLoading: false })
    })
  }

  const setHolidaysState = async () => {
    const holidaysState = await DB.getTable(DB.tables.holidayEvents)
    setHolidays(holidaysState)
  }

  useEffect(() => {
    if (!loadingDisabled && currentUser?.hasOwnProperty('email')) {
      onActivityChange().then((r) => r)
      setLoadingDisabled(true)
      const appContentWithSidebar = document.getElementById('app-content-with-sidebar')
      if (appContentWithSidebar) {
        appContentWithSidebar.classList.add('logged-in')
      }
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

    setHolidaysState().then((r) => r)
    onTableChange().then((r) => r)
  }, [])

  const getRowDotColor = (dayDate) => {
    const dayEvent = allEventsFromDb.filter((x) => x.startDate === dayDate)[0]
    if (Manager.isValid(dayEvent)) {
      const isCurrentUserDot = dayEvent?.ownerPhone === currentUser?.phone
      if (dayEvent?.isHoliday && !dayEvent.fromVisitationSchedule) {
        return 'standard-dot'
      }
      if (isCurrentUserDot) {
        return 'current-user-dot'
      }
      if (!isCurrentUserDot) {
        return 'coparent-dot'
      }
    }

    return 'standard-dot'
  }

  const getEventFromDate = (dayDate, events) => {
    const arr = [...events, ...holidays]
    return arr.filter((x) => x.startDate === dayDate)[0]
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
        <EditCalEvent showCard={showEditCard} onClose={async (editDay) => setShowEditCard(false)} event={eventToEdit} />
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
                setActiveMonth(month)
                setTimeout(async () => {
                  await getSecuredEvents(null, month)
                }, 500)
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
                <span className="dot coparent in-legend"></span> Shared Event
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
                    let eventType = getRowDotColor(event.startDate)
                    return (
                      <div
                        key={index}
                        id="row"
                        onClick={(e) => handleEventRowClick(event)}
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
                              {Manager.isValid(searchResults) && (
                                <span className="start-date" id="subtitle">
                                  {moment(event?.startDate).format(DateFormats.readableMonthAndDay)}
                                </span>
                              )}
                              {/* FROM DATE */}
                              {!Manager.isValid(searchResults) && !contains(event?.startDate, 'Invalid') && event?.startDate?.length > 0 && (
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

          {/* DESKTOP LEGEND WRAPPER */}
          <div id="desktop-legend-wrapper">
            <div className="flex" id="legend-row" onClick={() => setShowDesktopLegend(!showDesktopLegend)}>
              <HiOutlineColorSwatch />
              <Label text={'Legend'} />
            </div>
            <div id="legend-content" className={showDesktopLegend ? 'active' : ''}>
              <p className="flex currentUser">
                <span className="dot in-legend currentUser"></span> Your Event
              </p>
              <p className="flex coparent">
                <span className="dot coparent in-legend"></span> Co-Parent/Child Event
              </p>
              <p className="flex standard">
                <span className="dot in-legend standard"></span> Holiday
              </p>
            </div>
          </div>

          <InputWrapper
            placeholder="Find events..."
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