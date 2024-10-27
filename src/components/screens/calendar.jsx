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
import { LuCalendarSearch } from 'react-icons/lu'
import SecurityManager from '../../managers/securityManager'
import { BiFilterAlt } from 'react-icons/bi'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  contains,
  displayAlert,
  formatNameFirstNameOnly,
  removeFileExtension,
} from '../../globalFunctions'
import NewCalendarEvent from '../forms/newCalendarEvent'
import EditCalEvent from './editCalEvent'
import { TbLocation } from 'react-icons/tb'
import { PiCalendarPlusDuotone, PiBellSimpleRinging } from 'react-icons/pi'
export default function EventCalendar() {
  const { state, setState } = useContext(globalState)
  const { theme, menuIsOpen, currentUser, selectedNewEventDay, navbarButton } = state
  const [existingEvents, setExistingEvents] = useState([])
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [allHolidays, setAllHolidays] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [searchResultsToUse, setSearchResultsToUse] = useState([])
  const [allEventsFromDb, setAllEventsFromDb] = useState([])
  const [showNewEventCard, setShowNewEventCard] = useState(false)
  const [showEditCard, setShowEditCard] = useState(false)
  const [eventToEdit, setEventToEdit] = useState(null)
  const [showSearchCard, setShowSearchCard] = useState(false)
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
      if (dateArr.findIndex((x) => x.some((d) => d.date === event.date || d.fromDate === event.date)) === -1) {
        dateArr.push([event])
      } else {
        const arrIndex = dateArr.findIndex((x) => x.some((d) => d.date === event.date || d.fromDate === event.date))
        dateArr[arrIndex].push(event)
      }
    })
    return dateArr
  }

  const getSecuredEvents = async (selectedDay, selectedMonth) => {
    let securedEvents = await SecurityManager.getCalendarEvents(currentUser)

    securedEvents = DateManager.sortCalendarEvents(securedEvents, 'fromDate', 'startTime')
    const eventsToAddDotsTo = securedEvents.sort((a, b) => {
      return a.time + b.time
    })

    setAllEventsFromDb(securedEvents)
    // Sort desc
    securedEvents = securedEvents.sort((a, b) => {
      if (a.time < b.time) {
        return -1
      }
      if (a.time > b.time) {
        return 1
      }
      return 0
    })
    if (selectedDay !== null) {
      securedEvents = securedEvents.filter((x) => {
        if (x.date === selectedDay.toString() || x.fromDate === selectedDay.toString()) {
          return x
        }
      })
      let datesWithTime = []
      let datesWithoutTime = []

      // Sort dates with time
      securedEvents.forEach((event) => {
        if (Manager.isValid(event.startTime, false, false, true)) {
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
        let formattedDay = moment(event.eventObj.fromDate).add(i, 'day').format(DateFormats.dateForDb)
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

  const scrollToTopOfEvents = () => {
    let detailsContainer = document.querySelector('.details-container')
    if (detailsContainer) {
      detailsContainer.scroll(0, 0)
    }
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
      console.log()
      let holidayDate = moment(day.getAttribute('aria-label')).format('MM/DD')
      if (selectedMonth) {
        formattedDay = moment(formattedDay).format(DateFormats.dateForDb)
      }

      const dayHasEvent = events.filter((x) => x?.fromDate === formattedDay || x?.toDate === formattedDay).length > 0

      // IF DAY HAS EVENT(S)
      if (dayHasEvent) {
        const dotWrapper = document.createElement('span')
        dotWrapper.classList.add('dot-wrapper')
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

        // PAYDAY EMOJI
        if (events.filter((x) => x.fromDate === formattedDay && showPaydayEmoji(x.title)).length > 0) {
          const paydayEmoji = document.createElement('span')
          paydayEmoji.classList.add('payday-emoji')

          paydayEmoji.innerText = '$'
          day.append(paydayEmoji)
        }

        // VISITATION DOT
        const currentUserName = formatNameFirstNameOnly(currentUser.name)
        if (
          events.filter((x) => x.fromDate === formattedDay && x.fromVisitationSchedule === true && contains(x?.title, currentUserName)).length > 0
        ) {
          const visitationDot = document.createElement('span')
          visitationDot.classList.add('current-user-visitation-dot')
          visitationDot.classList.add('dot')
          dotWrapper.append(visitationDot)
        }

        if (
          events.filter((x) => x.fromDate === formattedDay && x.fromVisitationSchedule === true && !contains(x?.title, currentUserName)).length > 0
        ) {
          const visitationDot = document.createElement('span')
          visitationDot.classList.add('coparent-visitation-dot')
          visitationDot.classList.add('dot')
          dotWrapper.append(visitationDot)
        }

        // STANDARD EVENT DOT
        if (events.filter((x) => x.fromDate === formattedDay)) {
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
        if (eventParentObj.eventObj.fromDate === formattedDay) {
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

  // ADD FLATPICKR CALENDAR
  const addFlatpickrCalendar = async () => {
    const dbRef = ref(getDatabase())
    toggleCalendar('show')
    flatpickr('#calendar-ui-container', {
      inline: true,
      defaultDate: new Date(),
      onReady: () => {
        Manager.showPageContainer('show')
        onValue(child(dbRef, DB.tables.calendarEvents), async (snapshot) => {
          await getSecuredEvents(moment().format(DateFormats.dateForDb).toString(), moment().format('MM'))
          setState({ ...state, selectedNewEventDay: moment().format(DateFormats.dateForDb).toString() })
        })
      },
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
        setNavbarButton(
          () => {
            setShowNewEventCard(true)
          },
          <PiCalendarPlusDuotone />
        )
        const date = moment(e[0]).format(DateFormats.dateForDb).toString()
        onValue(child(dbRef, DB.tables.calendarEvents), async (snapshot) => {
          await getSecuredEvents(date, moment(e[0]).format('MM'))
          setState({ ...state, selectedNewEventDay: moment(e[0]).format(DateFormats.dateForDb).toString() })
        })
      },
    })
  }

  const toggleAllHolidays = async () => {
    const allEvents = Manager.convertToArray(await DB.getTable(DB.tables.calendarEvents))
    const _holidays = allEvents.filter((x) => x.isHoliday === true).filter((x) => !contains(x?.title.toLowerCase(), 'visitation'))
    toggleCalendar('hide')
    setSearchResultsToUse(_holidays)
    setAllHolidays(_holidays)
    setShowFilters(!showFilters)
  }

  const toggleVisitationHolidays = async () => {
    const allEvents = Manager.convertToArray(await DB.getTable(DB.tables.calendarEvents))
    let userVisitationHolidays = allEvents.filter(
      (x) => x.isHoliday === true && x.phone === currentUser.phone && contains(x.title.toLowerCase(), 'holiday')
    )
    userVisitationHolidays.forEach((holiday) => {
      const holidayName = CalendarMapper.holidayDateToName(moment(holiday.fromDate).format('MM/DD'))
      holiday.title += ` (${holidayName})`
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

  const setNavbarButton = (action, icon = 'add', color = 'green') => {
    setTimeout(() => {
      setState({
        ...state,
        navbarButton: {
          ...navbarButton,
          action: () => action(),
          icon: icon,
          color: color,
        },
      })
    }, 500)
  }

  // ON PAGE LOAD
  useEffect(() => {
    addFlatpickrCalendar().then((r) => r)
    Manager.showPageContainer('show')
    setTimeout(() => {
      setState({
        ...state,
        selectedNewEventDay: moment(),
        navbarButton: {
          ...navbarButton,
          action: () => {
            setShowNewEventCard(true)
          },
          icon: <PiCalendarPlusDuotone />,
        },
      })
    }, 500)
  }, [])

  return (
    <>
      {/* BOTTOM FILTER CARD */}
      <BottomCard
        className={`${theme}`}
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

      <BottomCard
        className="form search-card"
        title={'Find Events'}
        onClose={() => {
          setSearchResultsToUse([])
          addFlatpickrCalendar().then((r) => r)
          setShowSearchCard(false)
        }}
        showCard={showSearchCard}>
        <div className={'mb-5 flex form search-card'} id="search-container">
          <DebounceInput
            placeholder="Enter an event name..."
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
                  addFlatpickrCalendar().then((r) => r)
                }
              } else {
                addFlatpickrCalendar().then((r) => r)
                setSearchResultsToUse([])
              }
            }}
          />
        </div>
      </BottomCard>

      {/* FORMS */}
      <NewCalendarEvent showCard={showNewEventCard} hideCard={() => setShowNewEventCard(false)} />
      <EditCalEvent
        event={eventToEdit}
        showCard={showEditCard}
        hideCard={async (e) => {
          await getSecuredEvents(eventToEdit.fromDate)
          setShowEditCard(false)
        }}
      />

      {/* PAGE CONTAINER */}
      {/* CALENDAR */}
      <div
        id="calendar-container"
        className={`page-container calendar ${theme} `}
        onClick={(e) =>
          menuIsOpen
            ? setState({
                ...state,
                menuIsOpen: false,
              })
            : ''
        }>
        {/* PAGE CONTAINER */}
        <div id="calendar-ui-container" className={`${theme}`} {...handlers}></div>
        <div id="with-padding" className={theme}>
          {/* BELOW CALENDAR */}
          {searchResultsToUse.length === 0 && (
            <div id="below-calendar" className={`${theme} mt-10`}>
              <div className="flex wrap">
                <p onClick={() => setShowFilters(!showFilters)} id="filter-button">
                  Filter
                  <BiFilterAlt id={'filter-icon'} />
                </p>

                {/* SEARCH ICON */}
                <LuCalendarSearch
                  className="search-icon blue"
                  onClick={() => {
                    setShowSearchCard(true)
                    addFlatpickrCalendar().then((r) => r)
                    setSearchResultsToUse([])
                    setTimeout(() => {
                      document.querySelector('.search-input').focus()
                    }, 100)
                  }}
                />
              </div>
            </div>
          )}

          {searchResultsToUse.length === 0 && existingEvents.length === 0 && <p className="description">No events on this day</p>}

          {/* MAP/LOOP SEARCH/HOLIDAY RESULTS */}
          {searchResultsToUse.length > 0 && (
            <div className={`${theme} search-results`}>
              {Manager.isValid(searchResultsToUse, true) &&
                searchResultsToUse.map((event, index) => {
                  return (
                    <div key={index} className={`${searchResultsToUse.length > 0 ? 'active' : ''} event-row`}>
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
                          {event && Manager.isValid(event.toDate) && event.toDate !== event.fromDate && <span className="toDate"> to </span>}
                          {event && Manager.isValid(event.toDate) && event.toDate !== event.fromDate && (
                            <span className="toDate">{moment(event.toDate).format('ddd MM/DD')}</span>
                          )}
                          {/* ALL DAY */}
                          {event && Manager.isValid(event.toDate) && event.toDate.indexOf('Invalid') === -1 && event.toDate !== event.fromDate && (
                            <span className="toDate"> to </span>
                          )}
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
                            <a href={Manager.getDirectionsLink(event.location)}>{event.location.replace(', USA', '')}</a>
                          </div>
                        )}
                      </div>
                      <hr />
                    </div>
                  )
                })}
            </div>
          )}

          {/* MAP/LOOP DEFAULT EVENTS */}
          {searchResultsToUse.length === 0 && (
            <div className="events">
              {Manager.isValid(existingEvents, true) &&
                existingEvents.map((event, index) => {
                  let readableReminderTimes = []
                  event.reminderTimes?.forEach((time) => {
                    if (time && time !== undefined) {
                      readableReminderTimes.push(`<span>${CalendarMapper.readableReminderBeforeTimeframes(time)}</span>`)
                    }
                  })
                  let eventType = 'standard'
                  if (event.fromVisitationSchedule) {
                    if (contains(event.createdBy?.toLowerCase(), currentUser.name.toLowerCase())) {
                      eventType = 'current-user-visitation'
                    } else {
                      eventType = 'coparent-visitation'
                    }
                  }
                  return (
                    <div
                      onClick={(e) => {
                        if (!event.isHoliday && e.target.tagName !== 'A') {
                          if (AppManager.getAccountType() === 'parent' || !Manager.isValid(AppManager.getAccountType())) {
                            setEventToEdit(event)
                            setShowEditCard(true)
                          }
                        }
                      }}
                      key={index}
                      data-from-date={event.fromDate}
                      className={`${event.fromVisitationSchedule ? 'event-row visitation flex' : 'event-row flex'} ${eventType}`}>
                      <div className="text">
                        <div className="top">
                          {/* DATE CONTAINER */}
                          <div id="date-container">
                            {/*<span className={`${eventType} color-coded-event-dot`}></span>*/}
                            {/* FROM DATE */}
                            {!contains(event.fromDate, 'Invalid') && event?.fromDate?.length > 0 && (
                              <span className="fromDate">{moment(event?.fromDate).format(DateFormats.readableDay)}</span>
                            )}
                            {/* TO WORD */}
                            {!contains(event?.toDate, 'Invalid') && event?.toDate?.length > 0 && event?.toDate !== event?.fromDate && (
                              <span className="toDate"> to </span>
                            )}
                            {/* TO DATE */}
                            {!contains(event.toDate, 'Invalid') &&
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
                              {!contains(event?.startTime, 'Invalid') && event.startTime?.length > 0 && (
                                <span className="from-time">
                                  <span className="at-symbol">&nbsp;@</span> {event.startTime}
                                </span>
                              )}
                              {!contains(event?.endTime, 'Invalid') && event.endTime?.length > 0 && event.endTime !== event.startTime && (
                                <span className="to-time"> - {event.endTime}</span>
                              )}
                            </span>
                            {/* DIRECTIONS LINK */}
                            {event.location && event.location.length > 0 && (
                              <div className="directions">
                                <TbLocation />
                                <a href={Manager.getDirectionsLink(event.location)} target="_blank">
                                  Nav
                                </a>
                              </div>
                            )}
                          </div>
                          {/* TITLE */}
                          <p className="title" data-event-id={event.id}>
                            <b className={`event-title ${eventType}`}>{CalendarManager.formatEventTitle(event.title)}</b>
                          </p>
                        </div>

                        <div className="column right"></div>
                        <div className="flex reminders">
                          {/* REMINDERS */}
                          {Manager.isValid(readableReminderTimes, true) && (
                            <>
                              <PiBellSimpleRinging className={'event-icon'} />
                              <p
                                className="flex reminder-times"
                                dangerouslySetInnerHTML={{
                                  __html: `${readableReminderTimes
                                    .join('|')
                                    .replaceAll('|', '<span class="divider">|</span>')
                                    .replaceAll(' minutes before', 'mins')
                                    .replaceAll('At time of event', 'Event Time')
                                    .replaceAll(' hour before', 'hr')}`,
                                }}></p>
                            </>
                          )}
                        </div>

                        {/* CHILDREN */}
                        {event.children && event.children.length > 0 && (
                          <div className="children flex">
                            <p className="children flex flex-start w-auto gap">
                              <span className="mr-0 material-icons-round event-icon">face</span>
                              {event.children.map((child, index) => {
                                return (
                                  <span key={index} className="child-date">
                                    {child}
                                  </span>
                                )
                              })}
                            </p>
                          </div>
                        )}

                        {/* NOTES */}
                        {Manager.isValid(event.notes) && event.notes.length > 0 && (
                          <div className="flex">
                            <span className="material-icons-round event-icon">text_snippet</span>
                            <p className="notes">{event.notes}</p>
                          </div>
                        )}

                        {/* EVENT WEBSITE URL */}
                        {event.websiteUrl && true && event.websiteUrl.length > 0 && (
                          <div className="wesite flex">
                            <span className="material-icons-round event-icon">language</span>
                            <a target="_blank" href={event.websiteUrl} className="website-url" rel="noreferrer">
                              {formatWebsiteUrl(event.websiteUrl)}
                            </a>
                          </div>
                        )}
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
