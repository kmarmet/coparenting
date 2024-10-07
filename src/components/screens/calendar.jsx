import React, { useContext, useEffect, useState } from 'react'
import ScreenNames from '@screenNames'
import DB from '@db'
import AppManager from '@managers/appManager'
import DateManager from '@managers/dateManager'
import Manager from '@manager'
import AddNewButton from '@shared/addNewButton'
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
import BottomButton from '../shared/bottomButton'

export default function EventCalendar() {
  const { state, setState } = useContext(globalState)
  const { currentUser, menuIsOpen, currentScreen } = state
  const [existingEvents, setExistingEvents] = useState([])
  const [showInfoContainer, setShowInfoContainer] = useState(false)
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [allHolidays, setAllHolidays] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [searchResultsToUse, setSearchResultsToUse] = useState([])
  const [allEventsFromDb, setAllEventsFromDb] = useState([])

  // HANDLE SWIPE
  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      //console.log("User Swiped!", eventData);
      // setState({ ...state, showMenuButton: true, currentScreen: ScreenNames.cal })
      // Manager.toggleForModalOrNewForm('show')
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
      if (dateArr.findIndex((x) => x.some((d) => d.date === event.date || d.fromDate === event.date)) === -1) {
        dateArr.push([event])
      } else {
        const arrIndex = dateArr.findIndex((x) => x.some((d) => d.date === event.date || d.fromDate === event.date))
        dateArr[arrIndex].push(event)
      }
    })
    return dateArr
  }

  const updateLogFromDb = async (selectedDay, selectedMonth, eventsFromDB) => {
    let _allEvents = await DB.getFilteredRecords(eventsFromDB, currentUser).then((x) => x)
    const eventsToAddDotsTo = _allEvents.sort((a, b) => {
      return a.time + b.time
    })

    setAllEventsFromDb(_allEvents)
    // Sort desc
    _allEvents = _allEvents.sort((a, b) => {
      if (a.time < b.time) {
        return -1
      }
      if (a.time > b.time) {
        return 1
      }
      return 0
    })
    if (selectedDay !== null) {
      _allEvents = _allEvents.filter((x) => {
        if (x.date === selectedDay.toString() || x.fromDate === selectedDay.toString()) {
          return x
        }
      })
      let datesWithTime = []
      let datesWithoutTime = []
      _allEvents.forEach((event) => {
        if (Manager.isValid(event.startTime, false, false, true)) {
          datesWithTime.push(event)
        } else {
          datesWithoutTime.push(event)
        }
      })
      _allEvents = datesWithoutTime.concat(datesWithTime)
    }
    let eventsWithMultipleDays = []
    eventsToAddDotsTo.forEach((event, index) => {
      if (event.fromDate && event.toDate && event.fromDate !== event.toDate) {
        if (eventsWithMultipleDays.filter((x) => x.fromDate === event.fromDate).length === 0) {
          const eventDaysCount = moment(event.toDate).diff(event.fromDate, 'days')
          const randomColor = Math.floor(Math.random() * 16777215).toString(16)
          eventsWithMultipleDays.push({ eventObj: event, daysCount: eventDaysCount, color: randomColor })
        }
      }
    })

    // Support showing each event for multi-day events
    eventsWithMultipleDays.forEach((event) => {
      let dateRange = []
      for (let i = 0; i <= event.daysCount; i++) {
        let formattedDay = moment(event.eventObj.fromDate).add(i, 'day').format('MM/DD/yyyy')
        dateRange.push(formattedDay)
      }
      if (dateRange.includes(selectedDay)) {
        const eventToAdd = {
          id: event.eventObj.id,
          title: event.eventObj.title,
          fromDate: event.eventObj.fromDate,
          toDate: event.eventObj.toDate,
          startTime: event.eventObj.startTime,
          endTime: event.eventObj.endTime,
          children: event.eventObj.children,
        }
        if (!_allEvents.includes(eventToAdd)) {
          _allEvents.push(eventToAdd)
        }
      }
    })

    addDayIndicators(selectedMonth, eventsToAddDotsTo, eventsWithMultipleDays)

    // Filter out dupes by event title
    let formattedDateArr = formatEvents(_allEvents)
    setExistingEvents(formattedDateArr)
    document.querySelectorAll('.event-details').forEach((event) => event.classList.remove('active'))
    setTimeout(() => {
      addEventRowAnimation()
    }, 100)

    setState({ ...state, menuIsOpen: false })
  }

  const scrollToTopOfEvents = async () => {
    let detailsContainer = document.querySelector('.details-container')
    if (detailsContainer) {
      detailsContainer.scroll(0, 0)
    }
  }

  const addDayIndicators = (selectedMonth, events, eventsWithMultipleDays) => {
    if (selectedMonth) {
      selectedMonth = moment().add(1, 'M').format('MM')
    }
    // Loop through all calendar UI days
    document.querySelectorAll('.flatpickr-day').forEach((day, outerIndex) => {
      let formattedDay = moment(day.getAttribute('aria-label')).format('MM/DD/yyyy')
      let holidayDate = moment(day.getAttribute('aria-label')).format('MM/DD')
      if (selectedMonth) {
        formattedDay = moment(formattedDay).format('MM/DD/yyyy')
      }

      const dayHasEvent = events.filter((x) => x?.fromDate === formattedDay || x?.toDate === formattedDay).length > 0

      if (dayHasEvent) {
        // Add holiday emoji
        if (events.filter((x) => x.fromDate === formattedDay && x.isHoliday === true).length > 0) {
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
        if (events.filter((x) => x.fromDate === formattedDay && showPaydayEmoji(x.title)).length > 0) {
          const paydayEmoji = document.createElement('span')
          paydayEmoji.classList.add('payday-emoji')
          paydayEmoji.innerText = '$'
          day.append(paydayEmoji)
        }
        // Add visitation border
        if (events.filter((x) => x.fromDate === formattedDay && x.fromVisitationSchedule === true).length > 0) {
          const visitationDot = document.createElement('span')
          visitationDot.classList.add('visitation-dot')
          visitationDot.style.backgroundColor = '#00b389'
          day.append(visitationDot)
        }
        // Add purple event dot
        if (events.filter((x) => x.fromDate === formattedDay)) {
          const dot = document.createElement('span')
          const visitationDot = day.querySelector('.visitation-dot')
          if (!visitationDot) {
            dot.classList.add('single')
          }
          dot.classList.add('dot')
          dot.style.backgroundColor = '#7b75ff'
          day.append(dot)
        }
      }
      // Apply colors to multi-day events
      eventsWithMultipleDays.forEach((eventParentObj, index) => {
        if (eventParentObj.eventObj.fromDate === formattedDay) {
          for (let i = 0; i <= eventParentObj.daysCount; i++) {
            document.querySelectorAll('.flatpickr-day').forEach((calDay) => {
              let formattedDay = moment(day.getAttribute('aria-label')).add(i, 'day').format('MM/DD/yyyy')
              const daySquare = calDay.getAttribute('aria-label')
              if (moment(daySquare).format('MM/DD/yyyy') === formattedDay) {
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
    document.querySelectorAll('.event-details').forEach((eventRow, i) => {
      setTimeout(() => {
        eventRow.classList.add('active')
      }, 200 * i)
    })
  }

  const toggleCalendar = (stateAction) => {
    const cal = document.querySelector('.flatpickr-calendar')
    if (cal) {
      if (stateAction === 'show') {
        addEventRowAnimation()
        cal.classList.remove('hide')
      } else {
        CalendarManager.hideCalendar()
      }
    }
  }

  const formatWebsiteUrl = (url) => {
    return url.slice(0, url.indexOf('com') + 3)
  }

  const addFlatpickrCalendar = async () => {
    const dbRef = ref(getDatabase())
    Manager.toggleForModalOrNewForm('show')
    toggleCalendar('show')
    flatpickr('#calendar-ui-container', {
      inline: true,
      defaultDate: new Date(),
      onReady: () => {},
      nextArrow: '<span class="calendar-arrow right material-icons-round">arrow_forward_ios</span>',
      prevArrow: '<span class="calendar-arrow left material-icons-round">arrow_back_ios</span>',
      appendTo: document.getElementById('calendar-ui-container'),
      // On month change
      onMonthChange: (selectedDates, dateStr, instance) => {
        disableSelectedDayBg()
        onValue(child(dbRef, DB.tables.calendarEvents), async (snapshot) => {
          const tableData = snapshot.val()
          await DB.getFilteredRecords(tableData, currentUser).then((x) => {
            updateLogFromDb(moment(`${instance.currentMonth + 1}/01/${instance.currentYear}`).format('MM/DD/yyyy'), instance.currentMonth + 1, x)
          })
        })
        const today = moment().format(DateFormats.flatpickr)

        console.log(document.querySelector(`[aria-label='${today}']`))
        const monthSelectOption = document.querySelector(`[value='7']`)
        monthSelectOption.click()
      },
      // Firebase onValue change / date selection/click
      onChange: async (e) => {
        const date = moment(e[0]).format('MM/DD/yyyy').toString()
        onValue(child(dbRef, DB.tables.calendarEvents), async (snapshot) => {
          let tableData = snapshot.val()
          if (snapshot.exists()) {
            await DB.getFilteredRecords(tableData, currentUser).then(async (events) => {
              const sortedEvents = DateManager.sortCalendarEvents(events, 'fromDate', 'startTime')
              await updateLogFromDb(date, moment(e[0]).format('MM'), sortedEvents)
              await scrollToTopOfEvents()
              setState({ ...state, selectedNewEventDay: moment(e[0]).format('MM/DD/yyyy').toString() })
            })
          }
        })
      },
    })
    onValue(child(dbRef, DB.tables.calendarEvents), async (snapshot) => {
      let calEvents = snapshot.val()
      if (snapshot.exists()) {
        if (!Array.isArray(calEvents)) {
          calEvents = DB.convertKeyObjectToArray(calEvents)
        }
        await DB.getFilteredRecords(calEvents, currentUser).then((events) => {
          const sortedEvents = DateManager.sortCalendarEvents(events, 'fromDate', 'startTime')
          updateLogFromDb(moment().format('MM/DD/yyyy'), null, sortedEvents)
        })
      }
    })
  }

  const toggleAllHolidays = async () => {
    const allEvents = await DB.getTable(DB.tables.calendarEvents)
    const _holidays = allEvents.filter((x) => x.isHoliday === true).filter((x) => !x.title.contains('Visitation'))
    toggleCalendar('hide')
    setSearchResultsToUse(_holidays)
    setAllHolidays(_holidays)
    setShowFilters(!showFilters)
  }

  const toggleVisitationHolidays = async () => {
    const allEvents = await DB.getTable(DB.tables.calendarEvents)
    let userVisitationHolidays = allEvents.filter((x) => x.isHoliday === true && x.title.contains(currentUser.name.getFirstWord()))
    let apiHolidays = await DateManager.getHolidays()
    userVisitationHolidays.forEach((holiday) => {
      const apiHoliday = apiHolidays.filter((x) => x.date === moment(holiday.fromDate).format('yyyy-MM-DD'))[0]
      if (apiHoliday !== undefined && apiHoliday.hasOwnProperty('name')) {
        holiday.title += ` (${apiHoliday.name})`
      }
    })
    setSearchResultsToUse(userVisitationHolidays)
    setShowFilters(!showFilters)
    toggleCalendar('hide')
  }

  const viewAllEvents = async () => {
    await addFlatpickrCalendar()
    setSearchResultsToUse([])
    setShowFilters(false)
  }

  const disableSelectedDayBg = async () => {
    const selectedDay = document.querySelector('.flatpickr-day.selected')
    if (selectedDay) {
      selectedDay.classList.remove('selected')
    }
  }

  const goToToday = async () => {
    const today = moment().format(DateFormats.flatpickr)
    const monthNumber = moment().format('M') - 1
    const monthSelectOption = document.querySelector(`.flatpickr-monthDropdown-months [value='${monthNumber}']`)
    // console.log(monthSelectOption)
    setTimeout(() => {
      console.log(`[aria-label='${today}']`)
      document.querySelector(`[aria-label='${today}']`).classList.add('selected')
    }, 500)
  }

  // ON PAGE LOAD
  useEffect(() => {
    addFlatpickrCalendar().then((r) => r)
    Manager.toggleForModalOrNewForm('show')
    setTimeout(() => {
      setState({ ...state, currentScreen: ScreenNames.calendar, isLoading: false, showBackButton: false, showMenuButton: true })
    }, 500)
  }, [])

  // TOGGLE SEARCH INPUT
  useEffect(() => {
    if (showSearchInput) {
      document.querySelector('#filter-button').style.display = 'none'
    } else {
      document.querySelector('#filter-button').style.display = 'flex'
    }
  }, [showSearchInput])

  return (
    <>
      <p className="screen-title">Shared Calendar</p>

      {/* ADD NEW BUTTON */}
      <AddNewButton
        canClose={true}
        onClose={() => {}}
        onClick={() => {
          toggleCalendar('hide')
          setState({ ...state, currentScreen: ScreenNames.newCalendarEvent })
        }}
      />

      {/* CLOSE SEARCH BUTTON */}
      {allHolidays.length > 0 && (
        <BottomButton
          iconName="close"
          elClass={'red visible'}
          bottom="160"
          onClick={() => {
            viewAllEvents()
            setAllHolidays([])
          }}
        />
      )}

      {/* BOTTOM FILTER CARD */}
      <BottomCard
        className={`${currentUser?.settings?.theme}`}
        onClose={viewAllEvents}
        showCard={showFilters}
        title={allHolidays.length > 0 ? 'Filter' : 'Filter Holidays ✨'}>
        <p id="view-all-holidays-item" className="ml-auto mr-auto" onClick={viewAllEvents}>
          View All Events <span className="material-icons-round accent pl-5 fs-20">calendar_month</span>
        </p>
        <p id="view-all-holidays-item" onClick={toggleAllHolidays}>
          View All Holidays ✨
        </p>
        <p id="view-visitation-holidays-item" onClick={toggleVisitationHolidays}>
          View Visitation Holidays ✨👦👧
        </p>
      </BottomCard>

      {/* PAGE CONTAINER */}
      {/* CALENDAR */}
      <div
        id="calendar-container"
        className={`page-container calendar ${currentUser.settings.theme || 'dark'} `}
        onClick={(e) =>
          menuIsOpen
            ? setState({
                ...state,
                menuIsOpen: false,
              })
            : ''
        }>
        <div id="calendar-ui-container" className={`${currentUser?.settings?.theme}`} {...handlers}></div>
        <div id="with-padding" className={`${currentUser?.settings?.theme}`}>
          {/* BELOW CALENDAR */}
          <div id="below-calendar" className={`${currentUser.settings.theme} mt-10 ${showInfoContainer ? 'active' : ''}`}>
            <div className="flex wrap">
              <p onClick={() => setShowFilters(!showFilters)} id="filter-button">
                Filter
                <span id="filter-icon" className="material-icons-round ">
                  filter_list
                </span>
              </p>

              {/* SEARCH INPUT */}
              {showSearchInput && (
                <div className={'mb-5 flex form'} id="search-container">
                  <DebounceInput
                    placeholder="Find an event..."
                    minLength={2}
                    className={`${showSearchInput ? 'active search-input' : 'search-input'}`}
                    debounceTimeout={500}
                    onChange={(e) => {
                      const inputValue = e.target.value
                      if (inputValue.length > 3) {
                        let results = []
                        if (Manager.isValid(allEventsFromDb, true)) {
                          results = allEventsFromDb.filter((x) => x?.title?.toLowerCase().indexOf(inputValue.toLowerCase()) > -1)
                        }
                        if (results.length > 0) {
                          setSearchResultsToUse(results)
                          toggleCalendar('hide')
                          CalendarManager.hideCalendar()
                          Manager.scrollToTopOfPage()
                        } else {
                          setSearchResultsToUse([])
                        }
                      } else {
                        setSearchResultsToUse([])
                      }
                    }}
                  />
                  <button
                    id="close-search-button"
                    onClick={() => {
                      setSearchResultsToUse([])
                      addFlatpickrCalendar().then((r) => r)
                      document.querySelector('.search-input').value = ''
                      setShowSearchInput(false)
                    }}>
                    <span className="material-icons-round">close</span>
                  </button>
                </div>
              )}

              <span
                className="material-icons search-icon blue"
                onClick={() => {
                  setShowSearchInput(!showSearchInput)
                  addFlatpickrCalendar().then((r) => r)
                  setSearchResultsToUse([])
                  setTimeout(() => {
                    document.querySelector('.search-input').focus()
                  }, 100)
                }}>
                {showSearchInput ? '' : 'search'}
              </span>
              <span className="material-icons help-icon info-icon blue" onClick={() => setShowInfoContainer(!showInfoContainer)}>
                info
              </span>

              {/* TODAY BUTTON */}
              {/*<button id="today-button" onClick={goToToday} className="button default ml-10">*/}
              {/*  Today*/}
              {/*</button>*/}
              <div id="cal-info-container" className={`${showInfoContainer ? 'active' : ''} w-100`}>
                {/* LEGEND */}
                <div id="calendar-legend" className="mb-5">
                  <p id="legend-title" className="blue">
                    Legend
                  </p>
                  <div className="column one mr-15">
                    <span className="visitation"></span>visitation day
                  </div>
                  <div className="column two">
                    <span className="dot"></span>day with event(s)
                  </div>
                </div>

                {/* INFO TEXT */}
                <p id="tips-title" className="blue">
                  Tips
                </p>
                <p className="small mb-5 mt-0">&#8226; Swipe left/right to change the current month</p>
                <p
                  className="small link mt-0 mb-5"
                  onClick={() =>
                    setState({
                      ...state,
                      currentScreen: ScreenNames.settings,
                    })
                  }>
                  &#8226; Daily Summary reminder times can be set in the <span>Settings</span>
                </p>
                <p className="small mt-5 mb-5">&#8226; Tap calendar event to edit or delete</p>
                <p className="small mt-0">&#8226; Scroll events below to view more</p>
              </div>
            </div>
          </div>

          {searchResultsToUse.length === 0 && existingEvents.length === 0 && <p className="description">No events on this day</p>}

          {/* MAP/LOOP SEARCH/HOLIDAY RESULTS */}
          {searchResultsToUse.length > 0 && (
            <div className="search-results">
              {Manager.isValid(searchResultsToUse, true) &&
                searchResultsToUse.map((event, index) => {
                  return (
                    <div className="flex columns" key={index}>
                      <div className="event search">
                        <div
                          className={'details-container search mb-10 '}
                          onClick={(e) => {
                            // @ts-ignore
                            const elementType = e.target.tagName
                            if (elementType.toLowerCase() !== 'a') {
                              if (AppManager.getAccountType() === 'parent' || AppManager.getAccountType() === undefined) {
                                setState({
                                  ...state,
                                  currentScreen: ScreenNames.editCalendarEvent,
                                  calEventToEdit: event,
                                })
                              }
                            }
                          }}>
                          <div className={`${searchResultsToUse.length > 0 ? 'active' : ''} event-details`}>
                            <div className="flex parent ">
                              <div className="flex content">
                                <div className="text">
                                  <p className="title text-small-title">
                                    <b className="text-small-title">{CalendarManager.formatEventTitle(event.title.toString())}</b>
                                  </p>

                                  {/* CHILDREN */}
                                  {event.children && event.children.length > 0 && <p className="children">with {event.children.join(', ')} </p>}

                                  {/* DATE CONTAINER */}
                                  <div id="date-container">
                                    {/* fromDate */}
                                    {event && Manager.isValid(event.fromDate) && (
                                      <span className="fromDate">{moment(event.fromDate).format('dddd MM/DD')}</span>
                                    )}
                                    {/* toDate */}
                                    {event && Manager.isValid(event.toDate) && event.toDate !== event.fromDate && (
                                      <span className="toDate"> to </span>
                                    )}
                                    {event && Manager.isValid(event.toDate) && event.toDate !== event.fromDate && (
                                      <span className="toDate">{moment(event.toDate).format('ddd MM/DD')}</span>
                                    )}
                                    {/* ALL DAY */}
                                    {event &&
                                      Manager.isValid(event.toDate) &&
                                      event.toDate.indexOf('Invalid') === -1 &&
                                      event.toDate !== event.fromDate && <span className="toDate"> to </span>}
                                    {event &&
                                      !Manager.isValid(event.startTime) &&
                                      (!Manager.isValid(event.toDate) || event.toDate.indexOf('Invalid') > -1) &&
                                      event.toDate !== event.fromDate && <span className="toDate"> - ALL DAY</span>}
                                    {/* Times */}
                                    <span id="times">
                                      {event.startTime && (
                                        <span className="from-time">
                                          <span className="at-symbol">&nbsp;@</span> {event.startTime}
                                        </span>
                                      )}
                                      {event.endTime && event.endTime !== event.startTime && <span> - </span>}
                                      {event.endTime && event.endTime !== event.startTime && <span className="to-time"> {event.endTime}</span>}
                                    </span>
                                  </div>

                                  {/* NOTES */}
                                  {Manager.isValid(event.notes) && event.notes.length > 0 && <p className="notes">{event.notes}</p>}

                                  {/* EVENT LINK */}
                                  {event.link && event.link !== undefined && event.link.length > 0 && (
                                    <div id="website-url-container" className="flex">
                                      <p className="website-url-label">&#8226; Website:</p>
                                      <a target="_blank" href={event.link} className="website-url">
                                        {formatWebsiteUrl(event.link)}
                                        <span className="material-icons-round link-icon">open_in_new</span>
                                      </a>
                                    </div>
                                  )}

                                  {/* DIRECTIONS LINK */}
                                  {event.location && event.location.length > 0 && (
                                    <div className="flex" id="directions-container">
                                      <p>&#8226; Directions:</p>
                                      <a href={Manager.getDirectionsLink(event.location)}>{event.location.replace(', USA', '')}</a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}

          {/* MAP/LOOP DEFAULT EVENTS */}
          {searchResultsToUse.length === 0 && (
            <div className="events">
              {Manager.isValid(existingEvents, true) &&
                existingEvents.map((eventArr, outerIndex) => {
                  return (
                    <div key={outerIndex} className="flex columns">
                      <div className="details-container">
                        {eventArr.map((event, index) => {
                          let readableReminderTimes = []
                          event.reminderTimes?.forEach((time) => {
                            if (time && time !== undefined) {
                              readableReminderTimes.push(`<span>${CalendarMapper.readableReminderBeforeTimeframes(time)}</span>`)
                            }
                          })
                          return (
                            <div
                              onClick={(e) => {
                                const elementType = e.target.tagName
                                if (elementType.toLowerCase() !== 'a') {
                                  if (AppManager.getAccountType() === 'parent' || AppManager.getAccountType() === undefined) {
                                    toggleCalendar('hide')
                                    setState({
                                      ...state,
                                      currentScreen: ScreenNames.editCalendarEvent,
                                      calEventToEdit: event,
                                    })
                                  }
                                }
                              }}
                              key={index}
                              data-from-date={event.fromDate}
                              className={event.fromVisitationSchedule ? 'event-details visitation' : 'event-details'}>
                              <div className="flex parent">
                                <div className="flex content">
                                  <div className="text">
                                    {/* TITLE */}
                                    <p className="title mb-3" data-event-id={event.id}>
                                      <b className="text-small-title">
                                        {CalendarManager.formatEventTitle(event.title)}
                                        {Manager.isValid(event.visitationEnd) && event.visitationEnd === true ? ' (END)' : ''}
                                      </b>
                                    </p>

                                    <div className={`${currentUser?.settings?.theme} event-content`}>
                                      {/* DATE CONTAINER */}
                                      <div id="date-container" className={currentUser?.settings?.theme === 'dark' ? 'event-row pt-10' : 'event-row'}>
                                        <span className={'material-icons-round event-icon'}>calendar_month</span>
                                        {/* FROM DATE */}
                                        {!event.fromDate.contains('Invalid') && event.fromDate?.length > 0 && (
                                          <span className="fromDate">{moment(event.fromDate).format(DateFormats.readableDay)}</span>
                                        )}
                                        {/* TO WORD */}
                                        {!event.toDate?.contains('Invalid') && event.toDate?.length > 0 && event.toDate !== event.fromDate && (
                                          <span className="toDate"> to </span>
                                        )}
                                        {/* TO DATE */}
                                        {!event.toDate?.contains('Invalid') &&
                                          event.toDate?.length > 0 &&
                                          event.toDate !== event.fromDate &&
                                          moment(event.toDate).format(DateFormats.readableDay)}
                                        {/* ALL DAY */}
                                        {event &&
                                          !Manager.isValid(event.startTime) &&
                                          (!Manager.isValid(event.toDate) || event.toDate.indexOf('Invalid') > -1) &&
                                          event.toDate !== event.fromDate && <span className="toDate">&nbsp;- ALL DAY</span>}
                                        {/* TIMES */}
                                        <span id="times">
                                          {!event.startTime?.contains('Invalid') && event.startTime?.length > 0 && (
                                            <span className="from-time">
                                              <span className="at-symbol">&nbsp;@</span> {event.startTime}
                                            </span>
                                          )}
                                          {!event.endTime?.contains('Invalid') && event.endTime?.length > 0 && event.endTime !== event.startTime && (
                                            <span className="to-time"> - {event.endTime}</span>
                                          )}
                                        </span>
                                      </div>

                                      {/* CHILDREN */}
                                      {event.children && event.children.length > 0 && (
                                        <div className="event-row mr-0">
                                          <p className="children flex flex-start w-auto">
                                            <span className="mr-0 material-icons-round event-icon">face</span>Children:
                                            {event.children.map((child, index) => {
                                              return (
                                                <span key={index} className="child-name">
                                                  {child}
                                                </span>
                                              )
                                            })}
                                          </p>
                                        </div>
                                      )}

                                      {/* NOTES */}
                                      {Manager.isValid(event.notes) && event.notes.length > 0 && (
                                        <div className="event-row">
                                          <p className="notes">
                                            <span className="material-icons-round event-icon">text_snippet</span>
                                            {event.notes}
                                          </p>
                                        </div>
                                      )}

                                      {/* EVENT WEBSITE URL */}
                                      {event.websiteUrl && true && event.websiteUrl.length > 0 && (
                                        <div className="event-row">
                                          <p className="website-url-label">
                                            <span className="material-icons-round event-icon">language</span> Website:
                                          </p>
                                          <a target="_blank" href={event.websiteUrl} className="website-url" rel="noreferrer">
                                            {formatWebsiteUrl(event.websiteUrl)}
                                            <span className="material-icons-round website-url-icon">open_in_new</span>
                                          </a>
                                        </div>
                                      )}

                                      {/* DIRECTIONS LINK */}
                                      {event.location && event.location.length > 0 && (
                                        <div className="event-row">
                                          <p>
                                            <span className={'material-icons-round event-icon directions'}>turn_right</span> Directions:
                                          </p>
                                          <a href={Manager.getDirectionsLink(event.location)} target="_blank">
                                            Navigation<span className="material-icons-round website-url-icon">open_in_new</span>
                                          </a>
                                        </div>
                                      )}

                                      {/* REMINDERS */}
                                      {Manager.isValid(readableReminderTimes, true) && (
                                        <div className="event-row reminders">
                                          <>
                                            <span className={`event-icon material-icons-round`}>notifications_active</span>
                                            <div className="flex">
                                              <p id="reminders-title">Reminders: </p>

                                              <p
                                                className="flex"
                                                dangerouslySetInnerHTML={{
                                                  __html:
                                                    `${readableReminderTimes.toString().replaceAll(',', '').replaceAll(' minutes before', 'mins').replaceAll('At time of event', 'Event Time')}`.replaceAll(
                                                      ' hour before',
                                                      'hr'
                                                    ),
                                                }}
                                                id="reminder-times"></p>
                                            </div>
                                          </>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
