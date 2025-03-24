// Path: src\components\screens\calendar\calendar.jsx
import React, { useContext, useEffect, useState } from 'react'
import AlertManager from '/src/managers/alertManager'
import AppManager from '/src/managers/appManager'
import Modal from '/src/components/shared/modal'
import DB from '../../../database/DB.js'
import DatasetManager from '/src/managers/datasetManager'
import DateFormats from '/src/constants/dateFormats'
import DateManager from '/src/managers/dateManager'
import DomManager from '/src/managers/domManager'
import EditCalEvent from '/src/components/forms/editCalEvent'
import InputWrapper from '/src/components/shared/inputWrapper'
import Manager from '/src/managers/manager'
import NavBar from '/src/components/navBar.jsx'
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
import ScreenNames from '../../../constants/screenNames'
import firebaseConfig from '/src/firebaseConfig.js'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { BiSolidCalendarPlus } from 'react-icons/bi'

export default function EventCalendar() {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser, authUser, refreshKey } = state
  const [eventsOfActiveDay, setEventsOfActiveDay] = useState([])
  const [allEventsFromDb, setAllEventsFromDb] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [holidays, setHolidays] = useState([])
  const [selectedDate, setSelectedDate] = useState()
  const [searchQuery, setSearchQuery] = useState('')
  const [eventToEdit, setEventToEdit] = useState(null)
  const [showEditCard, setShowEditCard] = useState(false)
  const [showNewEventCard, setShowNewEventCard] = useState(false)
  const [showHolidaysCard, setShowHolidaysCard] = useState(false)
  const [showSearchCard, setShowSearchCard] = useState(false)
  const [showHolidays, setShowHolidays] = useState(false)
  const [loadingDisabled, setLoadingDisabled] = useState(false)
  const [eventsSetOnPageLoad, setEventsSetOnPageLoad] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(null)
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

  // GET EVENTS
  const getSecuredEvents = async (activeDay) => {
    const allUsers = await DB.getTable(DB.tables.users)
    const user = allUsers.find((x) => x.email === auth.currentUser.email)
    let securedEvents = await SecurityManager.getCalendarEvents(user)
    let _eventsOfDay = []
    setAllEventsFromDb(securedEvents)
    let dateToUse = activeDay

    if (!Manager.isValid(currentMonth)) {
      setCurrentMonth(moment(activeDay).format('MMMM'))
    }

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
    const emojiHolidays = await DB.getTable(DB.tables.holidayEvents)

    // Remove existing icons/dots before adding them again
    document.querySelectorAll('.dot-wrapper').forEach((wrapper) => wrapper.remove())
    document.querySelectorAll('.payday-emoji').forEach((emoji) => emoji.remove())
    document.querySelectorAll('.holiday-emoji').forEach((emoji) => emoji.remove())

    // Iterate static calendar day elements
    const dayElements = document.querySelectorAll('.MuiPickersDay-root')

    // Iterate day elements
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

        // ADD INVISIBLE DOTS
        if (dayElement.innerHTML.indexOf('invisible') === -1) {
          dayElement.append(invisibleDots)
        }
        continue
      }

      // APPEND DOTS/EMOJIS
      const dotWrapper = document.createElement('span')
      dotWrapper.classList.add('dot-wrapper')

      // HOLIDAYS
      for (let holiday of emojiHolidays) {
        // Add holiday emoji
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

      // PAYDAY ICON
      let isPayday = payEvents.includes(dayEvent.startDate)

      if (isPayday) {
        const dotToAppend = document.createElement('span')
        dotToAppend.classList.add('payday-dot', 'dot')
        dotWrapper.append(dotToAppend)
      }

      // APPEND DOT WRAPPER
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
        (x) => x.isHoliday === true && x.ownerKey === currentUser?.key && Manager.contains(x.title.toLowerCase(), 'holiday')
      )
    }
    if (currentUser.accountType === 'child') {
      // const parentNumbers = (currentUser?.parents?.userVisitationHolidays = allEvents.filter(
      //   (x) => x.isHoliday === true && x.ownerKey === currentUser?.key && contains(x.title.toLowerCase(), 'holiday')
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
    setState({ ...state, refreshKey: Manager.getUid() })
  }

  const setHolidaysState = async () => {
    let holidaysState = await DB.getTable(DB.tables.holidayEvents)
    holidaysState = DatasetManager.sortByProperty(holidaysState, 'startDate', 'asc')
    setHolidays(holidaysState)
  }

  const getEventsFromDate = (dayDate, events) => {
    const arr = [...events, ...holidays]
    const dayEvent = arr.find((x) => x.startDate === dayDate)
    const dayEvents = arr.filter((x) => x.startDate === dayDate)
    let payEvents = []
    let dotClasses = []
    for (let event of dayEvents) {
      if (Manager.isValid(event)) {
        const isCurrentUserDot = event?.ownerKey === currentUser?.key
        if (
          event?.title.toLowerCase().includes('pay') ||
          event?.title.toLowerCase().includes('paid') ||
          event?.title.toLowerCase().includes('salary') ||
          event?.title.toLowerCase().includes('expense')
        ) {
          payEvents.push(event.startDate)
        }
        if (event?.isHoliday && !event.fromVisitationSchedule && !Manager.isValid(event.ownerKey)) {
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
    const notifications = await DB.getTable(`${DB.tables.notifications}/${currentUser?.key}`)
    await AppManager.setAppBadge(notifications.length)
    setState({ ...state, notificationCount: notifications.length, isLoading: false })
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    await setHolidaysState()
    onValue(child(dbRef, `${DB.tables.calendarEvents}/${currentUser?.key}`), async () => {
      const selectedCalendarElement = document.querySelector('.MuiButtonBase-root.MuiPickersDay-root.Mui-selected')
      if (selectedCalendarElement) {
        const timestampMs = selectedCalendarElement.dataset.timestamp
        const asDay = DateManager.msToDate(timestampMs)
        await getSecuredEvents(asDay)
      }
    })
  }

  // Check if parent access is granted -> if not, show request parent access screen
  const redirectChildIfNecessary = async () => {
    const users = await DB.getTable(`${DB.tables.users}`)
    const user = users.find((x) => x.email === authUser?.email)
    if (user && user.accountType === 'child' && !user.parentAccessGranted) {
      setState({ ...state, currentScreen: ScreenNames.requestParentAccess, currentUser: user })
    }
  }

  // SEARCH
  const search = async () => {
    if (searchQuery.length === 0) {
      AlertManager.throwError('Please enter a search value')
      return false
    }
    const searchResults = allEventsFromDb.filter((x) => x.title.toLowerCase().indexOf(searchQuery.toLowerCase()) > -1)
    if (searchResults.length === 0) {
      AlertManager.throwError('No events found')
      return false
    } else {
      setSearchResults(searchResults)
      setEventsOfActiveDay(searchResults)
      setShowSearchCard(false)
      setState({ ...state, refreshKey: Manager.getUid() })
    }
  }

  useEffect(() => {
    redirectChildIfNecessary().then((r) => r)
    // eslint-disable-next-line no-prototype-builtins
    if (!loadingDisabled && currentUser?.hasOwnProperty('email')) {
      setLoadingDisabled(true)
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

    const legendButton = document.getElementById('legend-button')
    if (legendButton) {
      legendButton.addEventListener('click', () => {
        legendButton.classList.toggle('active')
      })
    }
  }, [])

  return (
    <>
      {/* CARDS */}
      <>
        {/* HOLIDAYS CARD */}
        <Modal
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
        </Modal>

        {/* SEARCH CARD */}
        <Modal
          submitIcon={<LuCalendarSearch />}
          submitText={'Search'}
          className="search-card"
          wrapperClass="search-card"
          title={'Find Events'}
          onClose={viewAllEvents}
          showCard={showSearchCard}
          onSubmit={search}>
          <InputWrapper labelText="event name" refreshKey={refreshKey} inputValue={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </Modal>

        {/* EDIT EVENT */}
        <EditCalEvent showCard={showEditCard} hideCard={() => setShowEditCard(false)} event={eventToEdit} />
      </>

      {/* PAGE CONTAINER */}
      <div id="calendar-container" className={`page-container calendar ${theme}`}>
        <p className="screen-title mb-0">Calendar</p>

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
              setCurrentMonth(moment(month).format('MMMM'))
            }}
            onChange={async (day) => {
              setSelectedDate(moment(day).format('YYYY-MM-DD'))
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
            <p id="legend-button" className="animated-button">
              Legend
            </p>

            {/* SEARCH BUTTON */}
            <p id="search-button">Search</p>

            {/* HOLIDAY BUTTON */}
            <p id="holidays-button">Holidays</p>
          </div>
        )}

        {Manager.isValid(searchResults) && (
          <button
            id="close-search-button"
            className="button default"
            onClick={async () => {
              await getSecuredEvents(moment().format(DateFormats.dateForDb).toString())
              setSearchResults([])
              setSearchQuery('')
            }}>
            close search
          </button>
        )}
        {showHolidays && (
          <button
            id="close-holidays-button"
            className="button default"
            onClick={async () => {
              await getSecuredEvents(moment().format(DateFormats.dateForDb).toString())
              setShowHolidays(false)
            }}>
            hide holidays
          </button>
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

          {/* DESKTOP SIDEBAR */}
          <InputWrapper
            labelText="Find events..."
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
                  setEventsOfActiveDay(results)
                }
              } else {
                if (inputValue.length === 0) {
                  setShowSearchCard(false)
                  await getSecuredEvents(moment().format(DateFormats.dateForDb).toString())
                  e.target.value = ''
                  setSearchQuery('')
                }
              }
            }}
          />
        </div>
      )}

      {/* NAV BARS */}
      {DomManager.isMobile() && (
        <>
          {!showNewEventCard && !showSearchCard && !showEditCard && !showHolidaysCard && !showHolidays && (
            <NavBar navbarClass={'calendar search-results'} addOrClose={searchResults.length === 0 ? 'add' : 'close'}>
              {searchResults.length === 0 && (
                <BiSolidCalendarPlus className={'new-event-icon'} id={'add-new-button'} onClick={() => setShowNewEventCard(true)} />
              )}
            </NavBar>
          )}
        </>
      )}
    </>
  )
}