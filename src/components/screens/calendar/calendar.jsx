// Path: src\components\screens\calendar\calendar.jsx
import {StaticDatePicker} from '@mui/x-date-pickers-pro'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {BsStars} from 'react-icons/bs'
import {LuCalendarSearch} from 'react-icons/lu'
import {PiCalendarXDuotone} from 'react-icons/pi'
import EditCalEvent from '../../../components/forms/editCalEvent'
import NavBar from '../../../components/navBar.jsx'
import Form from '../../../components/shared/form'
import DatetimeFormats from '../../../constants/datetimeFormats'
import FinancialKeywords from '../../../constants/financialKeywords'
import InputTypes from '../../../constants/inputTypes'
import ScreenNames from '../../../constants/screenNames'
import globalState from '../../../context.js'
import DB from '../../../database/DB.js'
import useCalendarEvents from '../../../hooks/useCalendarEvents'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useEventsOfDay from '../../../hooks/useEventsOfDay'
import AlertManager from '../../../managers/alertManager'
import DatasetManager from '../../../managers/datasetManager'
import DateManager from '../../../managers/dateManager'
import DomManager from '../../../managers/domManager'
import Manager from '../../../managers/manager'
import InputField from '../../shared/inputField'
import Screen from '../../shared/screen'
import CalendarEvents from './calendarEvents.jsx'
import CalendarLegend from './calendarLegend.jsx'
import DesktopLegend from './desktopLegend.jsx'

export default function EventCalendar() {
    const {state, setState} = useContext(globalState)
    const {theme, currentScreen, refreshKey, isLoading} = state

    // STATE
    const [searchResults, setSearchResults] = useState([])
    const [selectedDate, setSelectedDate] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [eventToEdit, setEventToEdit] = useState(null)
    const [contentIsLoaded, setContentIsLoaded] = useState(false)

    // CARD STATE
    const [showEditCard, setShowEditCard] = useState(false)
    const [showHolidaysCard, setShowHolidaysCard] = useState(false)
    const [showSearchCard, setShowSearchCard] = useState(false)
    const [showHolidays, setShowHolidays] = useState(false)

    // HOOKS
    const {currentUser, currentUserIsLoading} = useCurrentUser()
    const {calendarEvents, eventsAreLoading} = useCalendarEvents()
    const {eventsOfDay} = useEventsOfDay(selectedDate)

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

    const AddDayIndicators = async () => {
        const holidayEvents = await DB.getTable(DB.tables.holidayEvents)

        // Clear existing indicators
        document.querySelectorAll('.dot-wrapper, .payday-emoji, .holiday-emoji').forEach((el) => el.remove())

        const dayElements = document.querySelectorAll('.MuiPickersDay-root')

        const holidayEmojiMap = {
            '01/01': '🥳',
            '04/20': '🐇',
            '05/11': '👩‍👧‍👦',
            '05/26': '🎖️',
            '06/15': '👨‍👧‍👦',
            '06/19': '✨',
            '07/04': '🎇',
            '10/31': '🎃',
            '11/28': '🦃',
            '12/24': '🎄',
            '12/25': '🎄',
            '12/31': '🥳',
        }

        for (const dayElement of dayElements) {
            const dayMs = dayElement.dataset.timestamp
            const formattedDay = moment(DateManager.msToDate(dayMs)).format(DatetimeFormats.dateForDb)
            const dayEvent = calendarEvents.find((event) => moment(event?.startDate).format(DatetimeFormats.dateForDb) === formattedDay)
            const dayEvents = calendarEvents.filter((e) => e?.startDate === formattedDay)
            const {dotClasses, payEvents} = GetEventDotClasses(dayEvent, dayEvents, holidayEvents)
            const dotWrapper = document.createElement('span')
            dotWrapper.classList.add('dot-wrapper')

            if (!Manager.IsValid(calendarEvents) || !Manager.IsValid(dayEvent)) {
                dayElement.append(dotWrapper)
                continue
            }

            // 🔹 Holiday Emoji
            const matchingHoliday = holidayEvents.find((h) => h?.startDate === dayEvent?.startDate && Manager.IsValid(h))
            if (matchingHoliday) {
                const emoji = document.createElement('span')
                emoji.classList.add('holiday-emoji')

                const dateKey = moment(matchingHoliday.startDate).format('MM/DD')
                emoji.innerText = holidayEmojiMap[dateKey] || '✨'
                dayElement.append(emoji)
            }

            // 🔹 Event Dots
            dotClasses.forEach((cls) => {
                const dot = document.createElement('span')
                dot.classList.add(cls, 'dot')
                dotWrapper.append(dot)
            })

            // 🔹 Payday Dot
            if (payEvents.includes(dayEvent.startDate)) {
                const paydayDot = document.createElement('span')
                paydayDot.classList.add('payday-dot', 'dot')
                dotWrapper.append(paydayDot)
            }

            dayElement.append(dotWrapper)
        }
        setContentIsLoaded(true)
    }

    const ShowAllHolidays = async () => {
        setShowHolidaysCard(!showHolidaysCard)
        setShowHolidays(true)
    }

    const ShowVisitationHolidays = async () => {
        let allEvents = await DB.getTable(DB.tables.calendarEvents)
        allEvents = allEvents.flat()
        let userVisitationHolidays = []
        if (currentUser.accountType === 'parent') {
            userVisitationHolidays = allEvents.filter(
                (x) => x.isHoliday === true && x?.owner?.key === currentUser?.key && Manager.Contains(x.title.toLowerCase(), 'holiday')
            )
        }
        userVisitationHolidays.forEach((holiday) => {
            holiday.title += ` (${holiday.holidayName})`
        })
        setShowHolidaysCard(!showHolidaysCard)
        setShowHolidays(true)
    }

    const ViewAllEvents = () => {
        setShowHolidaysCard(false)
        setSearchQuery('')
        setShowSearchCard(false)
        setState({...state, refreshKey: Manager.GetUid()})
    }

    const GetEventDotClasses = (dayEvent, dayEvents, holidayEvents) => {
        const payEvents = []
        let dotClasses = []
        const dayEventsOfAllTypes = DatasetManager.CombineArrays(dayEvents, holidayEvents)
        const holidayDates = holidayEvents?.map((holiday) => moment(holiday?.startDate).format(DatetimeFormats.dateForDb))

        for (const event of dayEventsOfAllTypes) {
            if (!Manager.IsValid(event) || !Manager.IsValid(event?.startDate)) continue

            if (event?.startDate === dayEvent?.startDate) {
                const title = event.title?.toLowerCase() || ''
                const isPayEvent = FinancialKeywords.some((keyword) => title.includes(keyword))
                const currentUserEvent = event.owner?.key === currentUser?.key
                const coParentOrChildEvent = !Manager.IsValid(event.owner) || event.owner?.key !== currentUser?.key
                const isHoliday = event?.isHoliday || holidayDates.includes(event?.startDate)

                if (isPayEvent) payEvents.push(event.startDate)

                switch (true) {
                    case isHoliday:
                        dotClasses.push('holiday-event-dot')
                        break
                    case currentUserEvent && !isHoliday && !coParentOrChildEvent:
                        dotClasses.push('current-user-event-dot')
                        break
                    case coParentOrChildEvent && !isHoliday && !currentUserEvent:
                        dotClasses.push('coParent-event-dot')
                        break
                }
            }
        }

        dotClasses = DatasetManager.GetValidArray(dotClasses, true)
        return {
            dotClasses,
            payEvents,
        }
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
            setShowSearchCard(false)
            setState({...state, refreshKey: Manager.GetUid(), isLoading: false})
        }
    }

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

    // APPEND HOLIDAYS/SEARCH CAL BUTTONS
    useEffect(() => {
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
        }
    }, [currentScreen, currentUserIsLoading])

    // ON PAGE LOAD
    useEffect(() => {
        AddMonthText()
    }, [])

    // ADD DAY INDICATORS
    useEffect(() => {
        if (Manager.IsValid(eventsOfDay)) {
            setSelectedDate(moment().format(DatetimeFormats.dateForDb))
            setTimeout(() => {
                AddDayIndicators().then((r) => r)
            }, 300)
        }
    }, [eventsOfDay])

    return (
        <Screen loadingByDefault={true} stopLoadingBool={contentIsLoaded} activeScreen={ScreenNames.calendar}>
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
                    <InputField
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
                {/*<Spacer height={32.5} />*/}

                {/* STATIC CALENDAR */}
                <div id="static-calendar" className={`${theme}`}>
                    <StaticDatePicker
                        showDaysOutsideCurrentMonth={true}
                        minDate={moment(`${moment().year()}-01-01`)}
                        maxDate={moment(`${moment().year()}-12-31`)}
                        onMonthChange={async (month) => {
                            AddDayIndicators().then((r) => r)
                            AddMonthText(moment(month).format('MMMM'))
                        }}
                        onChange={async (day) => {
                            setTimeout(async () => {
                                setSelectedDate(moment(day).format(DatetimeFormats.dateForDb))
                                setState({...state, dateToEdit: moment(day).format(DatetimeFormats.dateForDb)})
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
                            selectedDate={selectedDate}
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
                            setShowHolidays(false)
                        }}>
                        Hide Holidays
                    </button>
                )}
                {Manager.IsValid(searchResults) && (
                    <button
                        className="button default bottom-right with-border smaller"
                        onClick={async () => {
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
                                setShowHolidays(false)
                            }}>
                            <PiCalendarXDuotone /> Hide Holidays
                        </p>
                    )}

                    {/* DESKTOP LEGEND WRAPPER */}
                    <DesktopLegend />

                    {/* DESKTOP SIDEBAR */}
                    <InputField
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
                            } else {
                                if (inputValue.length === 0) {
                                    setShowSearchCard(false)
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
        </Screen>
    )
}