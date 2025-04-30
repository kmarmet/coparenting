// Path: src\components\screens\calendar\calendar.jsx
import EditCalEvent from '/src/components/forms/editCalEvent'
import NavBar from '/src/components/navBar.jsx'
import InputWrapper from '/src/components/shared/inputWrapper'
import Modal from '/src/components/shared/modal'
import DatetimeFormats from '/src/constants/datetimeFormats'
import globalState from '/src/context.js'
import firebaseConfig from '/src/firebaseConfig.js'
import AlertManager from '/src/managers/alertManager'
import AppManager from '/src/managers/appManager'
import DatasetManager from '/src/managers/datasetManager'
import DateManager from '/src/managers/dateManager'
import DomManager from '/src/managers/domManager'
import Manager from '/src/managers/manager'
import {StaticDatePicker} from '@mui/x-date-pickers-pro'
import {initializeApp} from 'firebase/app'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {BsStars} from 'react-icons/bs'
import {LuCalendarSearch} from 'react-icons/lu'
import {PiCalendarPlusDuotone, PiCalendarXDuotone} from 'react-icons/pi'
import InputTypes from '../../../constants/inputTypes'
import DB from '../../../database/DB.js'
import useCalendarEvents from '../../../hooks/useCalendarEvents'
import useCurrentUser from '../../../hooks/useCurrentUser'
import Spacer from '../../shared/spacer'
import StandaloneLoadingGif from '../../shared/standaloneLoadingGif'
import CalendarEvents from './calendarEvents.jsx'
import CalendarLegend from './calendarLegend.jsx'
import DesktopLegend from './desktopLegend.jsx'

export default function EventCalendar() {
  const {state, setState} = useContext(globalState)
  const {theme, currentScreen, refreshKey} = state
  const [eventsOfActiveDay, setEventsOfActiveDay] = useState([])
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
  const [currentMonth, setCurrentMonth] = useState(null)
  const app = initializeApp(firebaseConfig)
  const {currentUser, currentUserIsLoading} = useCurrentUser()
  const {calendarEvents, eventsAreLoading} = useCalendarEvents()

  // GET EVENTS
  const GetSecuredEvents = async (activeDay) => {
    let _eventsOfDay = []
    let dateToUse = activeDay

    if (!Manager.isValid(currentMonth)) {
      setCurrentMonth(moment(activeDay).format('MMMM'))
    }

    if (!activeDay) {
      dateToUse = selectedDate
    }

    // All secured events
    const sortedEvents = DateManager.sortCalendarEvents(calendarEvents, 'startDate', 'startTime')

    // Set events of day
    _eventsOfDay = sortedEvents.filter((x) => x.startDate === moment(dateToUse).format(DatetimeFormats.dateForDb))
    _eventsOfDay = DateManager.sortCalendarEvents(_eventsOfDay, 'startTime', 'asc')

    // Set Holidays
    const holidaysToLoop = holidays.filter(
      (x) => moment(x.startDate).format(DatetimeFormats.dateForDb) === moment(dateToUse).format(DatetimeFormats.dateForDb)
    )
    _eventsOfDay = [..._eventsOfDay, ...holidaysToLoop]
    setEventsOfActiveDay(_eventsOfDay)

    // ADD DAY INDICATORS
    await AddDayIndicators([...sortedEvents, ...holidays])
  }

  const AddDayIndicators = async (events) => {
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
      let formattedDay = moment(DateManager.msToDate(dayAsMs)).format(DatetimeFormats.dateForDb)
      let daysEventsObject = GetEventsFromDate(formattedDay, events)
      const {dotClasses, payEvents} = daysEventsObject
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

  const ShowAllHolidays = async () => {
    setShowHolidaysCard(!showHolidaysCard)
    setEventsOfActiveDay(DatasetManager.getUniqueArray(holidays, true))
    setShowHolidays(true)
  }

  const ShowVisitationHolidays = async () => {
    let allEvents = await DB.getTable(DB.tables.calendarEvents)
    allEvents = allEvents.flat()
    let userVisitationHolidays = []
    if (currentUser.accountType === 'parent') {
      userVisitationHolidays = allEvents.filter(
        (x) => x.isHoliday === true && x.ownerKey === currentUser?.key && Manager.contains(x.title.toLowerCase(), 'holiday')
      )
    }
    userVisitationHolidays.forEach((holiday) => {
      holiday.title += ` (${holiday.holidayName})`
    })
    setEventsOfActiveDay(userVisitationHolidays)
    setShowHolidaysCard(!showHolidaysCard)
    setShowHolidays(true)
  }

  const ViewAllEvents = () => {
    setShowHolidaysCard(false)
    setSearchQuery('')
    setShowSearchCard(false)
    GetSecuredEvents(moment().format(DatetimeFormats.dateForDb).toString()).then((r) => r)
    setState({...state, refreshKey: Manager.getUid()})
  }

  const SetHolidaysState = async () => {
    let holidaysState = await DB.getTable(DB.tables.holidayEvents)
    holidaysState = DatasetManager.sortByProperty(holidaysState, 'startDate', 'asc')
    setHolidays(holidaysState)
  }

  const GetEventsFromDate = (dayDate, events) => {
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

  const SetInitialActivities = async () => {
    const notifications = await DB.getTable(`${DB.tables.notifications}/${currentUser?.key}`)
    await AppManager.setAppBadge(notifications.length)
    setState({...state, notificationCount: notifications.length, isLoading: false, refreshKey: Manager.getUid()})
  }

  // SEARCH
  const Search = async () => {
    if (searchQuery.length === 0) {
      AlertManager.throwError('Please enter a search value')
      return false
    }
    const searchResults = calendarEvents.filter((x) => x.title.toLowerCase().trim().indexOf(searchQuery.toLowerCase().trim()) > -1)
    if (searchResults.length === 0) {
      AlertManager.throwError('No events found')
      return false
    } else {
      setSearchResults(searchResults)
      setEventsOfActiveDay(searchResults)
      setShowSearchCard(false)
      setState({...state, refreshKey: Manager.getUid(), isLoading: false})
    }
  }

  useEffect(() => {
    if (Manager.isValid(calendarEvents)) {
      GetSecuredEvents().then((r) => r)
    }
  }, [calendarEvents])

  useEffect(() => {
    if (Manager.isValid(currentUser)) {
      SetInitialActivities().then((r) => r)
    }
  }, [currentUser])

  // SHOW HOLIDAYS
  useEffect(() => {
    if (DomManager.isMobile()) {
      if (showHolidays) {
        const rows = document.querySelectorAll('.event-row')

        if (rows && rows[0]) {
          rows[0].scrollIntoView({behavior: 'smooth'})
        }
      }
    }
  }, [showHolidays])

  // ON PAGE LOAD
  useEffect(() => {
    // Append Holidays/Search Cal Buttons
    if (!currentUserIsLoading) {
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

      const legendButton = document.getElementById('legend-button')
      if (legendButton) {
        legendButton.addEventListener('click', () => {
          legendButton.classList.toggle('active')
        })
      }
      SetHolidaysState().then((r) => r)
    }
  }, [currentScreen, currentUserIsLoading])

  return (
    <>
      {currentUserIsLoading && !Manager.isValid(eventsOfActiveDay) && <StandaloneLoadingGif />}
      {/* CARDS */}
      <>
        {/* HOLIDAYS CARD */}
        <Modal
          hasSubmitButton={false}
          className={`${theme} view-holidays`}
          wrapperClass={`view-holidays`}
          onClose={ViewAllEvents}
          showCard={showHolidaysCard}
          title={'View Holidays ✨'}>
          <Spacer height={10} />
          <div id="holiday-card-buttons">
            <button className="default button green" id="view-all-holidays-item" onClick={ShowAllHolidays}>
              All
            </button>
            <button className="default button blue" id="view-visitation-holidays-item" onClick={ShowVisitationHolidays}>
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
          onClose={ViewAllEvents}
          showCard={showSearchCard}
          onSubmit={Search}>
          <Spacer height={5} />
          <InputWrapper
            labelText="Event Name"
            refreshKey={refreshKey}
            inputValue={searchQuery}
            inputType={InputTypes.text}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
            views={['month', 'day']}
            minDate={moment(`${moment().year()}-01-01`)}
            maxDate={moment(`${moment().year()}-12-31`)}
            onMonthChange={async (month) => {
              setCurrentMonth(moment(month).format('MMMM'))
              await GetSecuredEvents(moment(month).format(DatetimeFormats.dateForDb))
            }}
            onChange={async (day) => {
              setSelectedDate(moment(day).format('YYYY-MM-DD'))
              setState({...state, dateToEdit: moment(day).format(DatetimeFormats.dateForDb)})
              await GetSecuredEvents(day).then((r) => r)
            }}
            slotProps={{
              actionBar: {
                actions: ['today'],
              },
            }}
          />
        </div>

        {/* LEGEND */}
        <CalendarLegend />

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

        {/* CONTENT WITH PADDING */}
        <div className="with-padding">
          {/* MAP/LOOP EVENTS */}
          {!eventsAreLoading && (
            <CalendarEvents
              eventsOfActiveDay={eventsOfActiveDay}
              setEventToEdit={(ev) => {
                setEventToEdit(ev)
                setShowEditCard(true)
              }}
            />
          )}
        </div>

        {/* HIDE BUTTONS */}
        {showHolidays && (
          <button
            className="button bottom-right default"
            onClick={async () => {
              await GetSecuredEvents(moment().format(DatetimeFormats.dateForDb).toString())
              setShowHolidays(false)
            }}>
            Hide Holidays
          </button>
        )}
        {Manager.isValid(searchResults) && (
          <button
            className="button default bottom-right with-border"
            onClick={async () => {
              await GetSecuredEvents(moment().format(DatetimeFormats.dateForDb).toString())
              setSearchResults([])
              setSearchQuery('')
            }}>
            Close Search
          </button>
        )}
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
                await GetSecuredEvents(moment().format(DatetimeFormats.dateForDb).toString())
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
                if (Manager.isValid(calendarEvents)) {
                  results = calendarEvents.filter((x) => x?.title?.toLowerCase().indexOf(inputValue.toLowerCase()) > -1)
                }
                if (results.length > 0) {
                  setEventsOfActiveDay(results)
                }
              } else {
                if (inputValue.length === 0) {
                  setShowSearchCard(false)
                  await GetSecuredEvents(moment().format(DatetimeFormats.dateForDb).toString())
                  e.target.value = ''
                  setSearchQuery('')
                }
              }
            }}
          />
        </div>
      )}

      {/* NAV BARS */}
      <NavBar />
    </>
  )
}