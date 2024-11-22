import React, { useContext, useEffect, useState } from 'react'
import DB from '@db'
import AppManager from '@managers/appManager'
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
import { FaChildren } from 'react-icons/fa6'
import { MdOutlineEditOff } from 'react-icons/md'
import { StaticDatePicker } from '@mui/x-date-pickers-pro'
import AlertManager from '../../managers/alertManager'
import { CgClose } from 'react-icons/cg'
import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  getFirstWord,
  hasClass,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../globalFunctions'
import { child, getDatabase, onValue, ref } from 'firebase/database'

import NewCalendarEvent from '../forms/newCalendarEvent'
import EditCalEvent from '../forms/editCalEvent'
import { TbLocation } from 'react-icons/tb'
import { PiBellSimpleRinging, PiCalendarPlusDuotone, PiGlobeDuotone } from 'react-icons/pi'
import NavBar from '../navBar'
import InputWrapper from '../shared/inputWrapper'

export default function EventCalendar() {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser } = state
  const [existingEvents, setExistingEvents] = useState([])
  const [showHolidaysCard, setShowHolidaysCard] = useState(false)
  const [allEventsFromDb, setAllEventsFromDb] = useState([])
  const [showNewEventCard, setShowNewEventCard] = useState(false)
  const [showEditCard, setShowEditCard] = useState(false)
  const [eventToEdit, setEventToEdit] = useState(null)
  const [showSearchCard, setShowSearchCard] = useState(false)
  const [showHolidays, setShowHolidays] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNewEventDay, setSelectedNewEventDay] = useState(moment())
  const [dayFromEdit, setDayFromEdit] = useState(null)

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

    // Filter out dupes by event title
    setExistingEvents(securedEvents)
    setTimeout(() => {
      addEventRowAnimation()
    }, 100)
  }

  const addDayIndicators = async (events) => {
    // Remove existing icons/dots before adding them again
    document.querySelectorAll('.dot-wrapper').forEach((wrapper) => wrapper.remove())
    document.querySelectorAll('.payday-emoji').forEach((emoji) => emoji.remove())
    document.querySelectorAll('.holiday-emoji').forEach((emoji) => emoji.remove())

    // Loop through all calendar UI days
    document.querySelectorAll('.MuiPickersDay-root').forEach((day) => {
      const dayAsMs = day.getAttribute('data-timestamp')
      let formattedDay = DateManager.msToDate(dayAsMs)
      const dayHasEvent = events.filter((x) => x?.startDate === formattedDay || x?.endDate === formattedDay).length > 0
      const paycheckStrings = ['payday', 'paycheck', 'pay', 'salary', 'paid']

      // Apply weekend day class
      const dayOfWeek = moment(formattedDay).isoWeekday()
      if (dayOfWeek === 6 || dayOfWeek === 7) {
        day.classList.add('weekend-day')
      }
      if (dayHasEvent) {
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
        // STANDARD EVENT DOT
        if (events.filter((x) => x.startDate === formattedDay).length > 0) {
          const standardEventDot = document.createElement('span')
          standardEventDot.classList.add('standard-event-dot')
          standardEventDot.classList.add('dot')
          dotWrapper.append(standardEventDot)
        }

        // COPARENT EVENT DOT
        if (
          events.filter((x) => x.startDate === formattedDay && x.fromVisitationSchedule === true && !contains(x?.title, currentUserName)).length > 0
        ) {
          const visitationDot = document.createElement('span')
          visitationDot.classList.add('coparent-visitation-dot')
          visitationDot.classList.add('dot')
          dotWrapper.append(visitationDot)
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
    })
  }

  const addEventRowAnimation = () => {
    document.querySelectorAll('.event-row').forEach((eventRow, i) => {
      setTimeout(() => {
        eventRow.classList.add('active')
      }, 200 * i)
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
    if (event.isHoliday) {
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

  useEffect(() => {
    if (showHolidays) {
      const rows = document.querySelectorAll('.event-row')

      if (rows && rows[0]) {
        rows[0].scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      Manager.scrollIntoView('#static-calendar ')
    }
  }, [showHolidays])

  // ON PAGE LOAD
  useEffect(() => {
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
    Manager.showPageContainer('show')
  }, [])

  return (
    <>
      {/* CARDS */}
      <>
        {/* HOLIDAYS CARD */}
        <BottomCard
          hasSubmitButton={false}
          className={`${theme} view-holidays`}
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
          title={'Find Events'}
          onClose={async () => {
            Manager.scrollIntoView('#static-calendar')
            await getSecuredEvents(moment().format(DateFormats.dateForDb).toString())
            setShowSearchCard(false)
            setRefreshKey(Manager.getUid())
            setSearchQuery('')
          }}
          onSubmit={() => {
            if (searchQuery.length === 0) {
              AlertManager.throwError('Please enter a search value')
              return false
            }

            if (!Manager.isValid(searchResults, true)) {
              AlertManager.throwError('No results found')
              return false
            } else {
              setExistingEvents(searchResults)
              setShowSearchCard(false)
              setTimeout(() => {
                addEventRowAnimation()
                const rows = document.querySelectorAll('.event-row')

                if (rows) {
                  rows[0].scrollIntoView({ behavior: 'smooth' })
                }
              }, 400)
            }
          }}
          showCard={showSearchCard}>
          <div className={'mb-5 flex form search-card'} id="search-container">
            <InputWrapper
              defaultValue="Enter event name..."
              refreshKey={refreshKey}
              inputType={'input'}
              inputValue={searchQuery}
              onChange={async (e) => {
                const inputValue = e.target.value
                if (inputValue.length > 3) {
                  setSearchQuery(inputValue)
                  let results = []
                  if (Manager.isValid(allEventsFromDb, true)) {
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
        {/* STATIC CALENDAR */}
        <div id="static-calendar">
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

        {/* CONTENT WITH PADDING */}
        <div className="with-padding">
          {/* BELOW CALENDAR */}
          {!showHolidays && !showSearchCard && (
            <div id="below-calendar" className={`${theme} mt-10 flex`}>
              {/* HOLIDAY BUTTON */}
              <p id="holidays-button">Holidays</p>

              {/* SEARCH BUTTON */}
              <p id="search-button">Search</p>
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
                  <div key={index}>
                    <div
                      onClick={(e) => handleEventRowClick(e, event)}
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
                            {!contains(event?.startTime, 'Invalid') && event?.startTime?.length > 0 && (
                              <span className="from-time">
                                <span className="at-symbol">&nbsp;@</span> {event?.startTime}
                              </span>
                            )}
                            {!contains(event?.endTime, 'Invalid') && event?.endTime?.length > 0 && event?.endTime !== event?.startTime && (
                              <span className="to-time">&nbsp;-&nbsp;{event?.endTime}</span>
                            )}
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

                        {/* CHILDREN */}
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
                  </div>
                )
              })}
          </div>
        </div>
      </div>

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
  )
}