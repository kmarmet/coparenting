/* eslint-disable no-unused-vars */
import { default as MultiDatePicker } from '@rsuite/multi-date-picker'
import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import { Accordion, DateRangePicker } from 'rsuite'
import EventLengths from 'constants/eventLengths'
import globalState from '../../context'
import Manager from '@manager'
import MyConfetti from '@shared/myConfetti.js'
import CheckboxGroup from '@shared/checkboxGroup'
import CalendarEvent from '../../models/calendarEvent'
import ScreenNames from '@screenNames'
import BottomButton from 'components/shared/bottomButton'
import { useSwipeable } from 'react-swipeable'
import CalendarMapper from 'mappers/calMapper'
import DatetimePicker from '@shared/datetimePicker.jsx'
import DateFormats from '../../constants/dateFormats'
import DatetimePickerViews from '../../constants/datetimePickerViews'
import DB from '@db'
import PushAlertApi from '../../api/pushAlert'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import { MobileTimePicker } from '@mui/x-date-pickers'
import DateManager from '../../managers/dateManager'
import DB_UserScoped from '@userScoped'
import TitleSuggestion from '../../models/titleSuggestion'
import CalendarManager from '../../managers/calendarManager'
import TitleSuggestionWrapper from '../shared/titleSuggestionWrapper'

// COMPONENT
export default function NewCalendarEvent() {
  // APP STATE
  const { state, setState } = useContext(globalState)
  const { currentUser, selectedNewEventDay } = state

  // COMPONENT STATE
  const [eventFromDate, setEventFromDate] = useState('')
  const [repeatInterval, setRepeatInterval] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [repeatingEndDate, setRepeatingEndDate] = useState('')
  const [eventToDate, setEventToDate] = useState('')
  const [expandNotesAccordion, setExpandNotesAccordion] = useState(false)
  const [children, setChildren] = useState([])
  const [reminderTimes, setReminderTimes] = useState([])
  const [shareWith, setShareWith] = useState([])
  const [clonedDates, setClonedDates] = useState([])
  const [clonedDatesToSubmit, setClonedDatesToSubmit] = useState([])
  const [eventLength, setEventLength] = useState(EventLengths.single)
  const [isAllDay, setIsAllDay] = useState(true)
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [childrenAccIsExpanded, setChildrenAccIsExpanded] = useState(false)
  const [reminderAccIsExpanded, setReminderAccIsExpanded] = useState(false)
  const [repeatAccIsExpanded, setRepeatAccIsExpanded] = useState(false)
  const [shareWithAccIsExpanded, setShareWithAccIsExpanded] = useState(false)
  const [showSubmitButton, setShowSubmitButton] = useState(false)
  const [titleSuggestions, setTitleSuggestions] = useState([])
  const [showCloneInput, setShowCloneInput] = useState(false)
  // HANDLE SWIPE
  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      console.log('User Swiped!', eventData)
      setState({ ...state, currentScreen: ScreenNames.calendar })
    },
    preventScrollOnSwipe: true,
  })

  const submit = async () => {
    const newEvent = new CalendarEvent()

    // Required
    newEvent.title = eventTitle
    if (Manager.isValid(newEvent.title) && newEvent.title.toLowerCase().indexOf('birthday') > -1) {
      newEvent.title += ' 🎂'
    }

    newEvent.fromDate = DateManager.dateIsValid(eventFromDate) ? moment(eventFromDate).format(DateFormats.dateForDb) : ''
    newEvent.toDate = DateManager.dateIsValid(eventToDate) ? moment(eventToDate).format(DateFormats.dateForDb) : ''
    newEvent.startTime = DateManager.dateIsValid(eventStartTime) ? eventStartTime.format(DateFormats.timeForDb) : ''
    newEvent.endTime = DateManager.dateIsValid(eventEndTime) ? eventEndTime.format(DateFormats.timeForDb) : ''
    // Not Required
    newEvent.id = Manager.getUid()
    newEvent.directionsLink = Manager.isValid(eventLocation) ? Manager.getDirectionsLink(eventLocation) : ''
    newEvent.location = eventLocation || ''
    newEvent.children = children || []
    newEvent.phone = currentUser.phone
    newEvent.createdBy = currentUser.name
    newEvent.shareWith = Manager.getUniqueArray(shareWith).flat()
    newEvent.notes = notes || ''
    newEvent.websiteUrl = websiteUrl || ''
    newEvent.reminderTimes = reminderTimes || []
    newEvent.repeatInterval = repeatInterval
    newEvent.morningSummaryReminderSent = false
    newEvent.eveningSummaryReminderSent = false
    newEvent.sentReminders = []
    newEvent.fromVisitationSchedule = false

    // Insert Suggestion
    const newSuggestion = new TitleSuggestion()
    newSuggestion.ownerPhone = currentUser.phone
    newSuggestion.formName = 'calendar'
    newSuggestion.suggestion = newEvent.title

    await DB.addSuggestion(newSuggestion)

    // Repeating Events Validation
    if (!Manager.isValid(repeatingEndDate) && Manager.isValid(repeatInterval)) {
      setState({
        ...state,
        showAlert: true,
        alertMessage: 'For repeating events, please choose an end month. Or uncheck the interval option',
      })
      return false
    }

    // Single Event Validation
    if (Manager.validation([eventTitle, shareWith]) > 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please fill out required fields' })
      return false
    }

    if (reminderTimes.length > 0 && eventStartTime.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'If you set reminder times, please also uncheck All Day and add a start time' })
      return false
    }

    MyConfetti.fire()

    // Add first/initial date before adding repeating/cloned
    await CalendarManager.addCalendarEvent(newEvent).finally(async () => {
      for (const toShareWith of shareWith) {
        const subId = await PushAlertApi.getSubId(toShareWith)
        await PushAlertApi.sendMessage(`New Calendar Event`, `${eventTitle} on ${moment(eventFromDate).format('ddd DD')}`, subId)
      }

      // Add cloned dates
      if (Manager.isValid(clonedDatesToSubmit, true)) {
        await CalendarManager.addMultipleCalEvents(Manager.getUniqueArray(clonedDatesToSubmit).flat())
      }

      // Repeating Events
      await addRepeatingEventsToDb()

      if (navigator.setAppBadge) {
        await navigator.setAppBadge(1)
      }
      setState({ ...state, currentScreen: ScreenNames.calendar })
    })
  }

  const addRepeatingEventsToDb = async () => {
    let repeatingEvents = []
    let datesToRepeat = CalendarMapper.repeatingEvents(
      repeatInterval,
      moment(eventFromDate, DateFormats.fullDatetime).format(DateFormats.monthDayYear),
      repeatingEndDate
    )
    if (Manager.isValid(datesToRepeat)) {
      datesToRepeat.forEach((date) => {
        const repeatingDateObject = new CalendarEvent()

        // Required
        repeatingDateObject.id = Manager.getUid()
        repeatingDateObject.title = eventTitle
        repeatingDateObject.fromDate = moment(date).format(DateFormats.monthDayYear)
        repeatingDateObject.shareWith = Manager.getUniqueArray(shareWith).flat()

        // Not Required
        repeatingDateObject.directionsLink = eventLocation || ''
        repeatingDateObject.location = eventLocation || ''
        repeatingDateObject.children = children || []
        repeatingDateObject.phone = currentUser.phone
        repeatingDateObject.createdBy = currentUser.name
        repeatingDateObject.notes = notes || ''
        repeatingDateObject.websiteUrl = websiteUrl || ''
        repeatingDateObject.startTime = eventStartTime || ''
        repeatingDateObject.endTime = eventEndTime || ''
        repeatingDateObject.reminderTimes = reminderTimes || []
        repeatingDateObject.sentReminders = []
        repeatingDateObject.toDate = eventToDate || ''
        repeatingDateObject.repeatInterval = repeatInterval
        repeatingDateObject.fromVisitationSchedule = false
        repeatingDateObject.morningSummaryReminderSent = false
        repeatingDateObject.eveningSummaryReminderSent = false

        if (!isAllDay) {
          repeatingDateObject.startTime = moment(eventStartTime, DateFormats.fullDatetime).format(DateFormats.timeForDb)
          repeatingDateObject.endTime = moment(eventEndTime, DateFormats.fullDatetime).format(DateFormats.timeForDb)
        }
        repeatingEvents.push(repeatingDateObject)
      })
      // Upload to DB
      await CalendarManager.addMultipleCalEvents(repeatingEvents)
    }
  }

  const handleChildSelection = (e) => {
    let childrenArr = []
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        childrenArr = [...children, e]
      },
      (e) => {},
      true
    )
    setChildren(childrenArr)
  }

  const handleShareWithSelection = async (e) => {
    await Manager.handleShareWithSelection(e, currentUser, shareWith).then((updated) => {
      setShareWith(updated)
    })
  }

  const handleReminderSelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        let timeframe = CalendarMapper.reminderTimes(e)

        if (reminderTimes.length === 0) {
          setReminderTimes([timeframe])
        } else {
          setReminderTimes([...reminderTimes, timeframe])
        }
      },
      (e) => {
        let mapped = CalendarMapper.reminderTimes(e)
        let filtered = reminderTimes.filter((x) => x !== mapped)
        setReminderTimes(filtered)
      },
      true
    )
  }

  const handleAllDaySelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setIsAllDay(true)
      },
      (e) => {
        setIsAllDay(false)
      },
      false
    )
  }

  const handleRepeatingSelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        let selection = ''
        if (e.toLowerCase().indexOf('week') > -1) {
          selection = 'weekly'
        }
        if (e.toLowerCase().indexOf('bi') > -1) {
          selection = 'biweekly'
        }
        if (e.toLowerCase().indexOf('daily') > -1) {
          selection = 'daily'
        }
        if (e.toLowerCase().indexOf('monthly') > -1) {
          selection = 'monthly'
        }
        setRepeatInterval(selection)
        setShowCloneInput(false)
      },
      (e) => {
        if (repeatInterval.toLowerCase() === e.toLowerCase()) {
          setRepeatInterval(null)
          setShowCloneInput(true)
        }
      },
      false
    )
  }

  const setDatetimeValue = () => {
    const datetimeInput = document.querySelector('.MuiInputBase-input')

    if (datetimeInput) {
      setEventFromDate(datetimeInput.value)
    }
  }

  // Add cloned events
  useEffect(() => {
    clonedDates.forEach((date) => {
      const clonedDateObject = new CalendarEvent()
      // Required
      clonedDateObject.title = eventTitle
      clonedDateObject.id = Manager.getUid()
      clonedDateObject.fromDate = DateManager.dateIsValid(date) ? moment(date).format(DateFormats.dateForDb) : ''
      clonedDateObject.toDate = DateManager.dateIsValid(eventToDate) ? moment(eventToDate).format(DateFormats.dateForDb) : ''
      clonedDateObject.startTime = DateManager.dateIsValid(eventStartTime) ? eventStartTime.format(DateFormats.timeForDb) : ''
      clonedDateObject.endTime = DateManager.dateIsValid(eventEndTime) ? eventEndTime.format(DateFormats.timeForDb) : ''
      // Not Required
      clonedDateObject.directionsLink = eventLocation || ''
      clonedDateObject.location = eventLocation || ''
      clonedDateObject.children = children || []
      clonedDateObject.phone = currentUser.phone
      clonedDateObject.createdBy = currentUser.name
      clonedDateObject.shareWith = Manager.getUniqueArray(shareWith).flat()
      clonedDateObject.notes = notes || ''
      clonedDateObject.websiteUrl = websiteUrl || ''
      clonedDateObject.startTime = ''
      clonedDateObject.endTime = ''
      clonedDateObject.reminderTimes = reminderTimes || []
      clonedDateObject.sentReminders = []
      clonedDateObject.toDate = ''
      clonedDateObject.morningSummaryReminderSent = false
      clonedDateObject.repeatInterval = ''
      clonedDateObject.fromVisitationSchedule = false
      clonedDateObject.eveningSummaryReminderSent = false

      if (!isAllDay) {
        clonedDateObject.startTime = moment(eventStartTime, DateFormats.fullDatetime).format(DateFormats.timeForDb)
        clonedDateObject.endTime = moment(eventEndTime, DateFormats.fullDatetime).format(DateFormats.timeForDb)
      }

      if (clonedDatesToSubmit.length === 0) {
        setClonedDatesToSubmit([clonedDateObject])
      } else {
        setClonedDatesToSubmit([...clonedDatesToSubmit, clonedDateObject])
      }
    })
    if (clonedDates.length === 0) {
      const multidatePicker = document.querySelector('.multidate-picker')
      if (multidatePicker) {
        multidatePicker.classList.remove('active')
        const addCloneButton = document.querySelector('.add-clone-button')
        if (addCloneButton) {
          addCloneButton.style.display = 'block'
        }
      }
    }
  }, [clonedDates.length])

  useEffect(() => {
    const shouldShowButton =
      shareWith.length > 0 && eventTitle.length > 0 && moment(eventFromDate).format(DateFormats.dateForDb).replace('Invalid date', '').length > 0
    if (shouldShowButton) {
      setShowSubmitButton(true)
    }
  }, [shareWith.length, eventTitle.length, eventFromDate.length, eventFromDate])

  useEffect(() => {
    setState({
      ...state,
      currentScreen: ScreenNames.newCalendarEvent,
      previousScreen: ScreenNames.calendar,
      showMenuButton: false,
      showBackButton: true,
    })
    Manager.toggleForModalOrNewForm('show')
    setDatetimeValue()
  }, [])

  return (
    <>
      <p className="screen-title ">New Event</p>
      {/* BUTTONS */}
      {showSubmitButton && <BottomButton onClick={submit} elClass={'single visible active'} />}
      <div {...handlers} id="calendar-event-form-container" className={`form page-container ${currentUser?.settings?.theme}`}>
        {/* Event Length */}
        <div className="action-pills calendar-event mb-5">
          <div className={`flex left ${eventLength === 'single' ? 'active' : ''}`} onClick={() => setEventLength(EventLengths.single)}>
            <span className="material-icons-round">event</span>
            <p>Single Day</p>
          </div>
          <div className={`flex right ${eventLength === 'multiple' ? 'active' : ''}`} onClick={() => setEventLength(EventLengths.multiple)}>
            <span className="material-icons-round">date_range</span>
            <p>Multiple Days</p>
          </div>
        </div>

        {/* CALENDAR FORM */}
        {/* TITLE */}
        <label className="mt-0">
          Title <span className="asterisk">*</span>
        </label>
        <div className="title-suggestion-wrapper">
          <input
            className={`event-title event-title-input mb-0 ${titleSuggestions.length > 0 ? 'no-radius' : ''}`}
            type="text"
            onChange={async (e) => {
              const inputValue = e.target.value
              if (inputValue.length > 1) {
                const dbSuggestions = await DB.getTable(DB.tables.suggestions)
                const matching = dbSuggestions.filter(
                  (x) => x.formName === 'calendar' && x.ownerPhone === currentUser.phone && x.suggestion.toLowerCase().contains(inputValue)
                )
                setTitleSuggestions(Manager.getUniqueArray(matching).flat())
              } else {
                setTitleSuggestions([])
              }
              setEventTitle(inputValue)
            }}
          />
          <TitleSuggestionWrapper
            suggestions={titleSuggestions}
            setSuggestions={() => setTitleSuggestions([])}
            onClick={(e) => {
              const suggestion = e.target.textContent
              setEventTitle(suggestion)
              setTitleSuggestions([])
              document.querySelector('.event-title-input').value = suggestion
            }}></TitleSuggestionWrapper>
        </div>

        <div className="flex gap mt-15 mb-15">
          {/* FROM DATE */}
          {eventLength === EventLengths.single && (
            <>
              <div className="w-100">
                <label className="mb-0">
                  Date <span className="asterisk">*</span>
                </label>
                <MobileDatePicker
                  defaultValue={moment(selectedNewEventDay)}
                  className={`${currentUser?.settings?.theme} m-0 w-100 event-from-date mui-input`}
                  onAccept={(e) => setEventFromDate(e)}
                />
              </div>
            </>
          )}

          {/* EVENT WITH TIME */}
          {eventLength === EventLengths.single && !isAllDay && (
            <div className={'flex gap'}>
              <div>
                <label>Start time</label>
                <MobileTimePicker minutesStep={5} className={`${currentUser?.settings?.theme} m-0`} onAccept={(e) => setEventStartTime(e)} />
              </div>
              <div>
                <label>End time</label>
                <MobileTimePicker minutesStep={5} className={`${currentUser?.settings?.theme} m-0`} onAccept={(e) => setEventEndTime(e)} />
              </div>
            </div>
          )}
        </div>

        {/* ALL DAY / HAS END DATE */}
        {eventLength !== EventLengths.multiple && (
          <CheckboxGroup elClass={'mb-0'} defaultLabel={'All Day'} labels={['All Day']} skipNameFormatting={true} onCheck={handleAllDaySelection} />
        )}

        {/* DATE RANGE */}
        {eventLength === EventLengths.multiple && (
          <>
            <label className="mt-10">Date Range*</label>
            <DateRangePicker
              showOneCalendar
              showHeader={false}
              editable={false}
              id="event-date"
              placement="auto"
              character=" to "
              className="m-0"
              format={'MM/dd/yyyy'}
              onChange={(e) => {
                let formattedDates = []
                if (e && e.length > 0) {
                  e.forEach((date) => {
                    formattedDates.push(new Date(moment(date).format('MM/DD/YYYY')))
                  })
                  setEventFromDate(formattedDates[0])
                  setEventToDate(formattedDates[1])
                }
              }}
            />
          </>
        )}

        {/* NOTES/LOCATION/URL */}
        <Accordion className="mb-15 mt-10">
          <p
            className={expandNotesAccordion ? 'accordion-header open' : 'accordion-header'}
            onClick={() => {
              setExpandNotesAccordion(!expandNotesAccordion)
            }}>
            Add Website-Notes-Location <span className={'material-icons-round'}>{expandNotesAccordion ? 'remove' : 'add'}</span>
          </p>
          <Accordion.Panel expanded={expandNotesAccordion === true}>
            <div id="url-notes-container">
              {/* URL/WEBSITE */}
              <input type="url" onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="URL/Website" className="mb-10" />

              {/* LOCATION/ADDRESS */}
              <Autocomplete
                placeholder={`Location`}
                apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
                options={{
                  types: ['geocode', 'establishment'],
                  componentRestrictions: { country: 'usa' },
                }}
                className="mb-10"
                onPlaceSelected={(place) => {
                  setEventLocation(place.formatted_address)
                }}
              />
              {/* NOTES */}
              <textarea placeholder="Notes" onChange={(e) => setNotes(e.target.value)}></textarea>
            </div>
          </Accordion.Panel>
        </Accordion>

        <p className="requirement-text">Required</p>

        {/* WHO IS ALLOWED TO SEE IT? */}
        {(currentUser.coparents.length > 0 || currentUser.parents.length > 0) && (
          <div className="share-with-container">
            <label>
              <span className="material-icons-round mr-10">visibility</span> Who is allowed to see it?
              <span className="asterisk">*</span>
            </label>
            <CheckboxGroup
              elClass={`${currentUser?.settings?.theme} `}
              dataPhone={currentUser.accountType === 'parent' ? currentUser.coparents.map((x) => x.phone) : currentUser.parents.map((x) => x.phone)}
              labels={currentUser.accountType === 'parent' ? currentUser.coparents.map((x) => x.name) : currentUser.parents.map((x) => x.name)}
              onCheck={handleShareWithSelection}
            />
          </div>
        )}

        <p className="requirement-text">Optional</p>

        {/* REMINDER */}
        {(currentUser.coparents.length > 0 || currentUser.parents.length > 0) && !isAllDay && (
          <>
            <div className="share-with-container mb-5">
              <Accordion>
                <label onClick={() => setReminderAccIsExpanded(!reminderAccIsExpanded)}>
                  <span className="material-icons mr-10">notification_add</span> Set Reminders
                  <span className={'material-icons-round plus-minus-symbol'}>{reminderAccIsExpanded ? 'remove' : 'add'}</span>
                </label>
                <Accordion.Panel expanded={reminderAccIsExpanded}>
                  <CheckboxGroup
                    elClass={`${currentUser?.settings?.theme} `}
                    boxWidth={50}
                    skipNameFormatting={true}
                    dataPhone={
                      currentUser.accountType === 'parent' ? currentUser.coparents.map((x) => x.phone) : currentUser.parents.map((x) => x.phone)
                    }
                    labels={['At time of event', '5 minutes before', '30 minutes before', '1 hour before']}
                    onCheck={handleReminderSelection}
                  />
                </Accordion.Panel>
              </Accordion>
            </div>
          </>
        )}

        {/* SEND NOTIFICATION TO */}
        {(!currentUser.accountType || currentUser.accountType === 'parent') && (
          <div className="share-with-container mb-5">
            <Accordion>
              <label onClick={() => setShareWithAccIsExpanded(!shareWithAccIsExpanded)}>
                <span className="material-icons-round notifications mr-10">campaign</span>Set Notification Recipient(s)
                <span className={'material-icons-round plus-minus-symbol'}>{shareWithAccIsExpanded ? 'remove' : 'add'}</span>
              </label>
              <Accordion.Panel expanded={shareWithAccIsExpanded}>
                <CheckboxGroup
                  elClass={`${currentUser?.settings?.theme} `}
                  dataPhone={
                    currentUser.accountType === 'parent' ? currentUser.coparents.map((x) => x.phone) : currentUser.parents.map((x) => x.phone)
                  }
                  labels={currentUser.accountType === 'parent' ? currentUser.coparents.map((x) => x.name) : currentUser.parents.map((x) => x.name)}
                  onCheck={handleShareWithSelection}
                />
              </Accordion.Panel>
            </Accordion>
          </div>
        )}

        {/* INCLUDING WHICH CHILDREN */}
        {Manager.isValid(currentUser.children !== undefined, true) && (
          <div className="share-with-container mb-5">
            <Accordion>
              <label onClick={() => setChildrenAccIsExpanded(!childrenAccIsExpanded)}>
                <span className="material-icons mr-10">face</span> Set Included Child(ren)
                <span className={'material-icons-round plus-minus-symbol'}>{childrenAccIsExpanded ? 'remove' : 'add'}</span>
              </label>
              <Accordion.Panel expanded={childrenAccIsExpanded}>
                <CheckboxGroup
                  elClass={`${currentUser?.settings?.theme} `}
                  labels={currentUser.children.map((x) => x['general'].name)}
                  onCheck={handleChildSelection}
                />
              </Accordion.Panel>
            </Accordion>
          </div>
        )}

        {/* REPEATING/CLONED */}
        {(!currentUser.accountType || currentUser.accountType === 'parent') && (
          <>
            {/* REPEATING */}
            <div className="share-with-container mb-5" id="repeating-container">
              <Accordion>
                <label onClick={() => setRepeatAccIsExpanded(!repeatAccIsExpanded)}>
                  <span className="material-icons mr-10">event_repeat</span> Set Repeat Interval
                  <span className={'material-icons-round plus-minus-symbol'}>{repeatAccIsExpanded ? 'remove' : 'add'}</span>
                </label>
                <Accordion.Panel expanded={repeatAccIsExpanded}>
                  <CheckboxGroup
                    elClass={`${currentUser?.settings?.theme} `}
                    boxWidth={35}
                    onCheck={handleRepeatingSelection}
                    labels={['Daily', 'Weekly', 'Biweekly', 'Monthly']}
                  />
                  {repeatInterval && (
                    <DatetimePicker
                      className={'mt-0 w-100'}
                      label={'Month to end repeating events'}
                      format={DateFormats.readableMonth}
                      views={DatetimePickerViews.monthAndYear}
                      hasAmPm={false}
                      onAccept={(e) => setRepeatingEndDate(moment(e).format('MM-DD-yyyy'))}
                    />
                  )}
                </Accordion.Panel>
              </Accordion>
            </div>

            {/* CLONED */}
            <div className="mt-15">
              <button
                className={`${currentUser?.settings?.theme} default center add-clone-button mt-20 mb-15`}
                onClick={() => setShowCloneInput(true)}>
                Copy Event to Other Dates
              </button>
              {showCloneInput && (
                <MultiDatePicker
                  className={`${currentUser?.settings?.theme} multidate-picker`}
                  placeholder="Select dates"
                  placement="auto"
                  label=""
                  onOpen={() => Manager.hideKeyboard()}
                  // format="MM/dd/yyyy"
                  onChange={(e) => {
                    if (!Array.isArray(clonedDates)) {
                      e = [e]
                      setClonedDates(e)
                    } else {
                      setClonedDates(e)
                    }
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}