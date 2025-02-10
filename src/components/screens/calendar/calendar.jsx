import React, { useContext, useEffect, useState } from 'react'
import AlertManager from '/src/managers/alertManager'
import AppManager from '/src/managers/appManager'
import BottomCard from '/src/components/shared/bottomCard'
import DB from '/src/database/DB'
import DatasetManager from '/src/managers/datasetManager'
import DateFormats from '/src/constants/dateFormats'
import DateManager from '/src/managers/dateManager'
import DomManager from '/src/managers/domManager'
import EditCalEvent from '/src/components/forms/editCalEvent'
import InputWrapper from '/src/components/shared/inputWrapper'
import Manager from '/src/managers/manager'
import NavBar from '/src/components/navBar.jsx'
import NewCalendarEvent from '/src/components/forms/newCalendarEvent'
import SecurityManager from '/src/managers/securityManager'
import globalState from '/src/context.js'
import moment from 'moment'
import { CgClose } from 'react-icons/cg'
import { LuCalendarSearch } from 'react-icons/lu'
import { PiCalendarPlusDuotone, PiCalendarXDuotone } from 'react-icons/pi'
import { StaticDatePicker } from '@mui/x-date-pickers-pro'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import { BsStars } from 'react-icons/bs'
import CalendarEvents from './calendarEvents.jsx'
import Legend from './legend.jsx'
import DesktopLegend from './desktopLegend.jsx'

export default function EventCalendar() {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser, isLoading } = state
  const [eventsOfActiveDay, setEventsOfActiveDay] = useState([])
  const [allEventsFromDb, setAllEventsFromDb] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [holidays, setHolidays] = useState([])
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [selectedDate, setSelectedDate] = useState()
  const [searchQuery, setSearchQuery] = useState('')
  const [eventToEdit, setEventToEdit] = useState(null)
  const [showEditCard, setShowEditCard] = useState(false)
  const [showNewEventCard, setShowNewEventCard] = useState(false)
  const [showHolidaysCard, setShowHolidaysCard] = useState(false)
  const [showSearchCard, setShowSearchCard] = useState(false)
  const [showHolidays, setShowHolidays] = useState(false)
  const [loadingDisabled, setLoadingDisabled] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const [eventsSetOnPageLoad, setEventsSetOnPageLoad] = useState(false)

  // GET EVENTS
  const getSecuredEvents = async (activeDay) => {
    let securedEvents = await SecurityManager.getCalendarEvents(currentUser)
    let _eventsOfDay = []
    setAllEventsFromDb(securedEvents)
    let dateToUse = activeDay
    if (!activeDay) {
      dateToUse = selectedDate
    }
    // All secured events
    securedEvents = DateManager.sortCalendarEvents(securedEvents, 'startDate', 'startTime')

    // Set events of day
    _eventsOfDay = securedEvents.filter((x) => x.startDate === moment(dateToUse).format(DateFormats.dateForDb))

    // Set Holidays
    const holidaysToLoop = holidays.filter(
      (x) => moment(x.startDate).format(DateFormats.dateForDb) === moment(dateToUse).format(DateFormats.dateForDb)
    )
    _eventsOfDay = [..._eventsOfDay, ...holidaysToLoop]
    setEventsOfActiveDay(_eventsOfDay)

    // ADD DAY INDICATORS
    await addDayIndicators([...securedEvents, ...holidays])
  }

  const addDayIndicators = async (events) => {
    const payString = 'payday,paycheck,pay,salary,paid,payment'
    const emojiHolidays = await DB.getTable(DB.tables.holidayEvents)
    // Remove existing icons/dots before adding them again
    document.querySelectorAll('.dot-wrapper').forEach((wrapper) => wrapper.remove())
    document.querySelectorAll('.payday-emoji').forEach((emoji) => emoji.remove())
    document.querySelectorAll('.holiday-emoji').forEach((emoji) => emoji.remove())

    // Iterate static calendar day elements
    const dayElements = document.querySelectorAll('.MuiPickersDay-root')

    for (const dayElement of dayElements) {
      const dayAsMs = dayElement.dataset.timestamp
      let formattedDay = moment(DateManager.msToDate(dayAsMs)).format(DateFormats.dateForDb)
      let daysEventsObject = getEventsFromDate(formattedDay, events)
      const { dotClasses, payEvents } = daysEventsObject
      const dayEvent = events.filter((x) => x?.startDate === formattedDay)[0]
      const holiday = holidays.filter((x) => x?.startDate === formattedDay)[0]

      // APPEND INVISIBLE DOTS AND SKIP DAY WITHOUT EVENT
      if (!dayEvent && !holiday) {
        const invisibleDots = document.createElement('span')
        invisibleDots.classList.add('invisible-dots')
        if (dayElement.innerHTML.indexOf('invisible') === -1) {
          dayElement.append(invisibleDots)
        }
        continue
      }

      // APPEND DOTS/EMOJIS
      const dotWrapper = document.createElement('span')
      dotWrapper.classList.add('dot-wrapper')

      // PAYDAY ICON
      let isPayday = payEvents.includes(dayEvent.startDate)

      if (isPayday) {
        const payDayIcon = document.createElement('sup')
        payDayIcon.classList.add('payday-emoji')
        payDayIcon.innerText = '$'
        dayElement.append(payDayIcon)
      }

      // HOLIDAYS
      for (let holiday of emojiHolidays) {
        if (Manager.isValid(holiday) && holiday?.startDate === dayEvent?.startDate) {
          const holidayEmoji = document.createElement('span')
          holidayEmoji.classList.add('holiday-emoji')
          switch (true) {
            case moment(holiday.startDate).format('MM/DD') === '01/01':
              holidayEmoji.innerText = '🥳'
              break
            case moment(holiday.startDate).format('MM/DD') === '04/20':
              holidayEmoji.innerText = '🐇'
              break
            case moment(holiday.startDate).format('MM/DD') === '05/26':
              holidayEmoji.innerText = '🎖️'
              break
            case moment(holiday.startDate).format('MM/DD') === '05/11':
              holidayEmoji.innerText = '👩‍👧‍👦'
              break
            case moment(holiday.startDate).format('MM/DD') === '06/15':
              holidayEmoji.innerText = '👨‍👧‍👦'
              break
            case moment(holiday.startDate).format('MM/DD') === '07/04':
              holidayEmoji.innerText = '🎇'
              break
            case moment(holiday.startDate).format('MM/DD') === '11/28':
              holidayEmoji.innerText = '🦃'
              break
            case moment(holiday.startDate).format('MM/DD') === '10/31':
              holidayEmoji.innerText = '🎃'
              break
            case moment(holiday.startDate).format('MM/DD') === '12/25':
              holidayEmoji.innerText = '🎄'
              break
            case moment(holiday.startDate).format('MM/DD') === '12/24':
              holidayEmoji.innerText = '🎄'
              break
            case moment(holiday.startDate).format('MM/DD') === '12/31':
              holidayEmoji.innerText = '🥳'
              break
            default:
              holidayEmoji.innerText = '✨'
          }
          dayElement.append(holidayEmoji)
        }
      }

      // ADD DOTS
      for (let dotClass of dotClasses) {
        const dotToAppend = document.createElement('span')
        dotToAppend.classList.add(dotClass, 'dot')
        dotWrapper.append(dotToAppend)
      }
      dayElement.append(dotWrapper)
    }
  }

  const showAllHolidays = async () => {
    setShowHolidaysCard(!showHolidaysCard)
    setEventsOfActiveDay(DatasetManager.getUniqueArray(holidays, true))
    setShowHolidays(true)
  }

  const showVisitationHolidays = async () => {
    let allEvents = await DB.getTable(DB.tables.calendarEvents)
    allEvents = allEvents.flat()
    let userVisitationHolidays = []
    if (currentUser.accountType === 'parent') {
      userVisitationHolidays = allEvents.filter(
        (x) => x.isHoliday === true && x.ownerPhone === currentUser?.phone && Manager.contains(x.title.toLowerCase(), 'holiday')
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
    setEventsOfActiveDay(userVisitationHolidays)
    setShowHolidaysCard(!showHolidaysCard)
    setShowHolidays(true)
  }

  const viewAllEvents = () => {
    setShowHolidaysCard(false)
    setSearchQuery('')
    setShowSearchCard(false)
    getSecuredEvents(moment().format(DateFormats.dateForDb).toString()).then((r) => r)
  }

  const setHolidaysState = async () => {
    const holidaysState = await DB.getTable(DB.tables.holidayEvents)
    setHolidays(holidaysState)
  }

  const getEventsFromDate = (dayDate, events) => {
    const arr = [...events, ...holidays]
    const dayEvent = arr.filter((x) => x.startDate === dayDate)[0]
    const dayEvents = arr.filter((x) => x.startDate === dayDate)
    let payEvents = []
    let dotClasses = []
    for (let event of dayEvents) {
      if (Manager.isValid(event)) {
        const isCurrentUserDot = event?.ownerPhone === currentUser?.phone
        if (
          event?.title.toLowerCase().includes('pay') ||
          event?.title.toLowerCase().includes('paid') ||
          event?.title.toLowerCase().includes('salary')
        ) {
          payEvents.push(event.startDate)
        }
        if (event?.isHoliday && !event.fromVisitationSchedule && !Manager.isValid(event.ownerPhone)) {
          dotClasses.push('holiday-event-dot')
        }
        if (!event?.isHoliday && isCurrentUserDot) {
          dotClasses.push('current-user-event-dot')
        }
        if (!event?.isHoliday && !isCurrentUserDot) {
          dotClasses.push('coparent-event-dot')
        }
      }
    }
    dotClasses = DatasetManager.getUniqueArray(dotClasses, true)
    return {
      dayEvent,
      dayEvents,
      dotClasses,
      payEvents,
    }
  }

  const setInitialActivities = async () => {
    const activities = await DB.getTable(`${DB.tables.activities}/${currentUser?.phone}`)
    await AppManager.setAppBadge(activities.length)
    setState({ ...state, activityCount: activities.length, isLoading: false })
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    await setHolidaysState()
    onValue(child(dbRef, `${DB.tables.calendarEvents}/${currentUser.phone}`), async (snapshot) => {
      const selectedCalendarElement = document.querySelector('.MuiButtonBase-root.MuiPickersDay-root.Mui-selected')
      if (selectedCalendarElement) {
        const timestampMs = selectedCalendarElement.dataset.timestamp
        const asDay = DateManager.msToDate(timestampMs)
        await getSecuredEvents(asDay)
      }
    })
  }

  useEffect(() => {
    if (!loadingDisabled && currentUser?.hasOwnProperty('email')) {
      setLoadingDisabled(true)
      const appContentWithSidebar = document.getElementById('app-content-with-sidebar')
      if (appContentWithSidebar) {
        appContentWithSidebar.classList.add('logged-in')
      }
      if (!eventsSetOnPageLoad) {
        getSecuredEvents().then((r) => r)
        setEventsSetOnPageLoad(true)
      }
      setInitialActivities().then((r) => r)
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
      }
    }
  }, [showHolidays])

  // ON PAGE LOAD
  useEffect(() => {
    // Append Holidays/Search Cal Buttons
    const staticCalendar = document.querySelector('.MuiDialogActions-root')
    const holidaysButton = document.getElementById('holidays-button')
    const searchButton = document.getElementById('search-button')
    if (staticCalendar && holidaysButton && searchButton) {
      staticCalendar.prepend(holidaysButton)
      staticCalendar.prepend(searchButton)

      holidaysButton.addEventListener('click', () => {
        setShowHolidaysCard(!showHolidaysCard)
      })
      searchButton.addEventListener('click', () => {
        setShowSearchCard(true)
      })
    }

    onTableChange().then((r) => r)
  }, [])

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
              setEventsOfActiveDay(searchResults)
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

                    await getSecuredEvents(moment().format(DateFormats.dateForDb).toString())
                    setRefreshKey(Manager.getUid())
                  }
                }
              }}
            />
          </div>
        </BottomCard>

        {/* NEW EVENT */}
        <NewCalendarEvent selectedNewEventDay={selectedDate} showCard={showNewEventCard} hideCard={() => setShowNewEventCard(false)} />

        {/* EDIT EVENT */}
        <EditCalEvent showCard={showEditCard} hideCard={() => setShowEditCard(false)} event={eventToEdit} />
      </>

      {/* PAGE CONTAINER */}
      <div id="calendar-container" className={`page-container calendar ${theme} `}>
        <p className="screen-title">Calendar</p>
        {/* STATIC CALENDAR */}
        <div id="static-calendar" className={theme}>
          <StaticDatePicker
            showDaysOutsideCurrentMonth={true}
            defaultValue={moment(selectedDate)}
            views={['month', 'day']}
            minDate={moment(`${moment().year()}-01-01`)}
            maxDate={moment(`${moment().year()}-12-31`)}
            onMonthChange={async (month) => {
              await getSecuredEvents()
            }}
            onChange={async (day) => {
              setSelectedDate(day)
              await getSecuredEvents(day).then((r) => r)
            }}
            slotProps={{
              actionBar: {
                actions: ['today'],
              },
            }}
          />
        </div>

        {/* LEGEND */}
        <Legend />

        {/* BELOW CALENDAR BUTTONS */}
        {!showHolidays && !showSearchCard && (
          <div id="below-calendar" className={`${theme} mt-10 flex`}>
            {/* LEGEND BUTTON */}
            <div className="flex" id="legend-wrapper" onClick={() => setShowLegend(true)}>
              <span className="dot currentUser"></span>
              <span className="dot coparent"></span>
              <span className="dot standard"></span>
              <p id="legend-button">Legend</p>
            </div>

            {/* SEARCH BUTTON */}
            <p id="search-button">Search</p>

            {/* HOLIDAY BUTTON */}
            <p id="holidays-button">Holidays</p>
          </div>
        )}

        {/* CONTENT WITH PADDING */}
        <div className="with-padding">
          {/* MAP/LOOP EVENTS */}
          <CalendarEvents
            eventsOfActiveDay={eventsOfActiveDay}
            setEventToEdit={(ev) => {
              setEventToEdit(ev)
              setShowEditCard(true)
            }}
          />
        </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      {!DomManager.isMobile() && (
        <div id="calendar-sidebar">
          <p className="item" id="new-event" onClick={() => setShowNewEventCard(true)}>
            <PiCalendarPlusDuotone className={'new-event'} id={'add-new-button'} /> New Event
          </p>
          {!showHolidays && (
            <p className="item" id="holidays-button" onClick={() => setShowHolidaysCard(true)}>
              <BsStars />
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
          <DesktopLegend />

          <InputWrapper
            labelText="Find events..."
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
                  setEventsOfActiveDay(results)
                }
              } else {
                if (inputValue.length === 0) {
                  setShowSearchCard(false)
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