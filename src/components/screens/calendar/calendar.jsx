// Path: src\components\screens\calendar\calendar.jsx
import EditCalEvent from '/src/components/forms/editCalEvent'
import NavBar from '/src/components/navBar.jsx'
import Form from '/src/components/shared/form'
import InputWrapper from '/src/components/shared/inputWrapper'
import DatetimeFormats from '/src/constants/datetimeFormats'
import globalState from '/src/context.js'
import AlertManager from '/src/managers/alertManager'
import AppManager from '/src/managers/appManager'
import DatasetManager from '/src/managers/datasetManager'
import DateManager from '/src/managers/dateManager'
import DomManager from '/src/managers/domManager'
import Manager from '/src/managers/manager'
import {StaticDatePicker} from '@mui/x-date-pickers-pro'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {BsStars} from 'react-icons/bs'
import {LuCalendarSearch} from 'react-icons/lu'
import {PiCalendarXDuotone} from 'react-icons/pi'
import InputTypes from '../../../constants/inputTypes'
import DB from '../../../database/DB.js'
import useAppUpdates from '../../../hooks/useAppUpdates'
import useCalendarEvents from '../../../hooks/useCalendarEvents'
import useCurrentUser from '../../../hooks/useCurrentUser'
import Spacer from '../../shared/spacer'
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
  const [showHolidaysCard, setShowHolidaysCard] = useState(false)
  const [showSearchCard, setShowSearchCard] = useState(false)
  const [showHolidays, setShowHolidays] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(null)
  const {currentUser, currentUserIsLoading} = useCurrentUser()
  const {calendarEvents, eventsAreLoading} = useCalendarEvents()
  const {appUpdates} = useAppUpdates()

  // GET EVENTS

  const GetEvents = async (activeDay) => {
    let _eventsOfDay = []
    let dateToUse = activeDay

    if (!Manager.IsValid(currentMonth)) {
      setCurrentMonth(moment(activeDay).format('MMMM'))
    }

    if (!activeDay) {
      dateToUse = selectedDate
    }

    // All secured events
    const sortedEvents = DateManager.SortCalendarEvents(calendarEvents, 'startDate', 'startTime')

    // Set events of day
    _eventsOfDay = sortedEvents?.filter((x) => x.startDate === moment(dateToUse).format(DatetimeFormats.dateForDb))
    _eventsOfDay = DateManager.SortCalendarEvents(_eventsOfDay, 'startTime', 'asc')

    // Set Holidays
    const holidaysToLoop = holidays.filter(
      (x) => moment(x.startDate).format(DatetimeFormats.dateForDb) === moment(dateToUse).format(DatetimeFormats.dateForDb)
    )
    _eventsOfDay = DatasetManager.CombineArrays(_eventsOfDay, holidaysToLoop)
    setEventsOfActiveDay(DatasetManager.GetValidArray(_eventsOfDay))

    // ADD DAY INDICATORS
    const combined = DatasetManager.CombineArrays(sortedEvents, holidaysToLoop)
    await AddDayIndicators(combined)
  }

  const AddMonthText = (updatedMonth = moment().format('MMMM')) => {
    const leftArrow = document.querySelector('.MuiPickersArrowSwitcher-previousIconButton')
    const arrows = document.querySelector('.MuiPickersArrowSwitcher-root')
    if (Manager.IsValid(leftArrow) && Manager.IsValid(arrows)) {
      const existingNodes = arrows.querySelectorAll('#calendar-month')
      if (Manager.IsValid(existingNodes)) {
        existingNodes.forEach((node) => node.remove())
      }
      const month = document.createElement('span')
      month.id = 'calendar-month'
      month.innerText = updatedMonth
      leftArrow.insertAdjacentElement('afterend', month)
    }
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
      const dayEvent = events.find((x) => moment(x?.startDate).format(DatetimeFormats.dateForDb) === formattedDay)

      // APPEND INVISIBLE DOTS AND SKIP DAY WITHOUT EVENT
      if (!Manager.IsValid(daysEventsObject.dayEvents) || !Manager.IsValid(daysEventsObject.dayEvent) || dayEvent === undefined) {
        const dotWrapper = document.createElement('span')
        dotWrapper.classList.add('dot-wrapper')
        dayElement.append(dotWrapper)
        continue
      }

      // APPEND DOTS/EMOJIS
      const dotWrapper = document.createElement('span')
      dotWrapper.classList.add('dot-wrapper')

      // HOLIDAYS
      for (let holiday of emojiHolidays) {
        // Add holiday emoji
        if (Manager.IsValid(holiday) && holiday?.startDate === dayEvent?.startDate) {
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
        (x) => x.isHoliday === true && x.ownerKey === currentUser?.key && Manager.Contains(x.title.toLowerCase(), 'holiday')
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
    GetEvents(moment().format(DatetimeFormats.dateForDb).toString()).then((r) => r)
    setState({...state, refreshKey: Manager.GetUid()})
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
      if (Manager.IsValid(event)) {
        const isCurrentUserDot = event?.ownerKey === currentUser?.key
        if (
          event?.title.toLowerCase().includes('pay') ||
          event?.title.toLowerCase().includes('paid') ||
          event?.title.toLowerCase().includes('salary') ||
          event?.title.toLowerCase().includes('expense')
        ) {
          payEvents.push(event.startDate)
        }
        if (event?.isHoliday && !event.fromVisitationSchedule && !Manager.IsValid(event.ownerKey)) {
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
    // AppManager.SetAppBadge(appUpdates?.length)
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
      setState({...state, refreshKey: Manager.GetUid(), isLoading: false})
    }
  }

  const UpdateOrRefreshIfNecessary = async () => {
    let latestVersionNumber = appUpdates[appUpdates.length - 1]?.currentVersion
    const shouldRefresh = await AppManager.UpdateOrRefreshIfNecessary(currentUser, latestVersionNumber).then()
    if (shouldRefresh) {
      setState({...state, successAlertMessage: 'Updating App ...'})
      await Manager.GetPromise(() => {
        window.location.reload()
      }, 2500)
    }
  }

  useEffect(() => {
    GetEvents().then((r) => r)
  }, [calendarEvents])

  useEffect(() => {
    if (Manager.IsValid(currentUser)) {
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

  useEffect(() => {
    setTimeout(() => {
      AddMonthText()
    }, 500)
  }, [])

  useEffect(() => {
    if (Manager.IsValid(appUpdates) && Manager.IsValid(currentUser)) {
      UpdateOrRefreshIfNecessary().then((r) => r)
    }
  }, [appUpdates, currentUser])

  return (
    <>
      {/* CARDS */}
      <>
        {/* HOLIDAYS CARD */}
        <Form
          hasSubmitButton={false}
          className={`${theme} view-holidays`}
          wrapperClass={`view-holidays`}
          onClose={ViewAllEvents}
          showCard={showHolidaysCard}
          title={'View Holidays ✨'}>
          <div id="holiday-card-buttons">
            <button className="default button green" id="view-all-holidays-item" onClick={ShowAllHolidays}>
              All
            </button>
            <button className="default button blue" id="view-visitation-holidays-item" onClick={ShowVisitationHolidays}>
              Visitation
            </button>
          </div>
        </Form>

        {/* SEARCH CARD */}
        <Form
          submitIcon={<LuCalendarSearch />}
          submitText={'Search'}
          className="search-card"
          wrapperClass="search-card"
          title={'Find Events'}
          onClose={ViewAllEvents}
          showCard={showSearchCard}
          onSubmit={Search}>
          <InputWrapper
            placeholder="Event Name"
            refreshKey={refreshKey}
            inputValue={searchQuery}
            inputType={InputTypes.text}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Form>

        {/* EDIT EVENT */}
        <EditCalEvent showCard={showEditCard} hideCard={() => setShowEditCard(false)} event={eventToEdit} />
      </>

      {/* PAGE CONTAINER */}
      <div id="calendar-container" className={`page-container calendar ${theme}`}>
        <Spacer height={32.5} />

        {/* STATIC CALENDAR */}
        <div id="static-calendar" className={`${theme}`}>
          <StaticDatePicker
            showDaysOutsideCurrentMonth={true}
            views={['month', 'day']}
            minDate={moment(`${moment().year()}-01-01`)}
            maxDate={moment(`${moment().year()}-12-31`)}
            onMonthChange={async (month) => {
              setCurrentMonth(moment(month).format('MMMM'))
              await GetEvents(moment(month).format(DatetimeFormats.dateForDb))
              AddMonthText(moment(month).format('MMMM'))
            }}
            onChange={async (day) => {
              DomManager.Animate.RemoveAnimationClasses('.event-row', 'animate__fadeInRight')
              setTimeout(async () => {
                setSelectedDate(moment(day).format('YYYY-MM-DD'))
                setState({...state, dateToEdit: moment(day).format(DatetimeFormats.dateForDb)})
                await GetEvents(day).then((r) => r)
              }, 100)
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
        <div className="screen-content">
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
            className="button bottom-right default smaller"
            onClick={async () => {
              await GetEvents(moment().format(DatetimeFormats.dateForDb).toString())
              setShowHolidays(false)
            }}>
            Hide Holidays
          </button>
        )}
        {Manager.IsValid(searchResults) && (
          <button
            className="button default bottom-right with-border smaller"
            onClick={async () => {
              await GetEvents(moment().format(DatetimeFormats.dateForDb).toString())
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
          {/*<p className="item" id="new-event" onClick={() => setShowNewEventCard(true)}>*/}
          {/*  <PiCalendarPlusDuotone className={'new-event'} id={'Add-new-button'} /> New Event*/}
          {/*</p>*/}
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
                await GetEvents(moment().format(DatetimeFormats.dateForDb).toString())
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
                if (Manager.IsValid(calendarEvents)) {
                  results = calendarEvents.filter((x) => x?.title?.toLowerCase().indexOf(inputValue.toLowerCase()) > -1)
                }
                if (results.length > 0) {
                  setEventsOfActiveDay(results)
                }
              } else {
                if (inputValue.length === 0) {
                  setShowSearchCard(false)
                  await GetEvents(moment().format(DatetimeFormats.dateForDb).toString())
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