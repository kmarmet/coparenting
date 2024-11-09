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
import CalendarMapper from 'mappers/calMapper'
import DatetimePicker from '@shared/datetimePicker.jsx'
import DateFormats from '../../constants/dateFormats'
import DatetimePickerViews from '../../constants/datetimePickerViews'
import DB from '@db'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import { MobileTimePicker } from '@mui/x-date-pickers'
import DateManager from '../../managers/dateManager'
import TitleSuggestion from '../../models/titleSuggestion'
import CalendarManager from '../../managers/calendarManager'
import TitleSuggestionWrapper from '../shared/titleSuggestionWrapper'
import { FaClone, FaRegCalendarCheck } from 'react-icons/fa6'
import Toggle from 'react-toggle'
import '../../styles/reactToggle.css'
import { ImEye } from 'react-icons/im'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  isAllUppercase,
  oneButtonAlert,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  successAlert,
  throwError,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../globalFunctions'
import SecurityManager from '../../managers/securityManager'
import ModelNames from '../../models/modelNames'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import InputWrapper from '../shared/inputWrapper'
import NotificationManager from '../../managers/notificationManager'
import BottomCard from '../shared/bottomCard'

// COMPONENT
export default function NewCalendarEvent({ showCard, onClose }) {
  // APP STATE
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, selectedNewEventDay } = state

  // EVENT STATE
  const [eventLength, setEventLength] = useState(EventLengths.single)
  const [eventFromDate, setEventFromDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventWebsite, setEventWebsite] = useState('')
  const [eventNotes, setEventNotes] = useState('')
  const [repeatingEndDate, setRepeatingEndDate] = useState('')
  const [repeatInterval, setRepeatInterval] = useState('')
  const [eventToDate, setEventToDate] = useState('')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [eventShareWith, setEventShareWith] = useState([])
  const [clonedDates, setClonedDates] = useState([])
  const [clonedDatesToSubmit, setClonedDatesToSubmit] = useState([])
  const [titleSuggestions, setTitleSuggestions] = useState([])
  const [eventChildren, setEventChildren] = useState([])
  const [eventReminderTimes, setEventReminderTimes] = useState([])
  const [coparentsToRemind, setCoparentsToRemind] = useState([])
  const [eventIsRepeating, setEventIsRepeating] = useState(false)

  // COMPONENT STATE
  const [isAllDay, setIsAllDay] = useState(false)
  const [showCloneInput, setShowCloneInput] = useState(false)
  const [showReminders, setShowReminders] = useState(false)
  const [includeChildren, setIncludeChildren] = useState(false)
  const [isVisitation, setIsVisitation] = useState(false)
  const [showCoparentReminderToggle, setShowCoparentReminderToggle] = useState(false)
  const [resetKey, setResetKey] = useState(Manager.getUid())
  const resetForm = () => {
    Manager.resetForm('new-event-form')
    setEventLength(EventLengths.single)
    setEventFromDate('')
    setEventLocation('')
    setEventTitle('')
    setEventWebsite('')
    setEventNotes('')
    setRepeatingEndDate('')
    setRepeatInterval('')
    setEventToDate('')
    setEventStartTime('')
    setEventEndTime('')
    setEventShareWith([])
    setClonedDates([])
    setClonedDatesToSubmit([])
    setTitleSuggestions([])
    setEventChildren([])
    setEventReminderTimes([])
    setCoparentsToRemind([])
    setIsAllDay(false)
    setEventIsRepeating(false)
    setShowCloneInput(false)
    setShowReminders(false)
    setIncludeChildren(false)
    setIsVisitation(false)
    setShowCoparentReminderToggle(false)
    setResetKey(Manager.getUid())
    onClose()
  }

  const submit = async () => {
    const newEvent = new CalendarEvent()

    // Required
    newEvent.title = eventTitle
    if (Manager.isValid(newEvent.title) && newEvent.title.toLowerCase().indexOf('birthday') > -1) {
      newEvent.title += ' 🎂'
    }
    if (isVisitation) {
      newEvent.title = `${formatNameFirstNameOnly(currentUser.name)}'s Visitation`
    }
    newEvent.startDate = DateManager.dateIsValid(eventFromDate) ? moment(eventFromDate).format(DateFormats.dateForDb) : ''
    newEvent.endDate = DateManager.dateIsValid(eventToDate) ? moment(eventToDate).format(DateFormats.dateForDb) : ''
    newEvent.startTime = DateManager.dateIsValid(eventStartTime) ? eventStartTime.format(DateFormats.timeForDb) : ''
    newEvent.endTime = DateManager.dateIsValid(eventEndTime) ? eventEndTime.format(DateFormats.timeForDb) : ''
    // Not Required
    newEvent.id = Manager.getUid()
    newEvent.directionsLink = Manager.isValid(eventLocation) ? Manager.getDirectionsLink(eventLocation) : ''
    newEvent.location = eventLocation || ''
    newEvent.children = eventChildren || []
    newEvent.ownerPhone = currentUser.phone
    newEvent.createdBy = currentUser.name
    newEvent.shareWith = Manager.getUniqueArray(eventShareWith).flat()
    newEvent.notes = eventNotes
    newEvent.websiteUrl = eventWebsite
    newEvent.reminderTimes = eventReminderTimes || []
    newEvent.repeatInterval = repeatInterval
    newEvent.morningSummaryReminderSent = false
    newEvent.eveningSummaryReminderSent = false
    newEvent.sentReminders = []
    newEvent.fromVisitationSchedule = isVisitation ? true : false

    // Insert Suggestion
    const alreadyExists =
      titleSuggestions.filter((x) => x.ownerPhone === currentUser.phone && x.suggestion.toLowerCase() === newEvent.title.toLowerCase()).length > 0

    if (!alreadyExists) {
      const newSuggestion = new TitleSuggestion()
      newSuggestion.ownerPhone = currentUser.phone
      newSuggestion.formName = 'calendar'
      newSuggestion.suggestion = newEvent.title
      await DB.addSuggestion(newSuggestion)
    }

    // Repeating Events Validation
    if (repeatingEndDate.length === 0 && repeatInterval.length > 0) {
      throwError('If you have chose to repeat this event, please select an end month')
      return false
    }

    const validation = DateManager.formValidation(eventTitle, eventShareWith, eventFromDate)
    if (validation) {
      throwError(validation)
      return false
    }

    if (eventReminderTimes.length > 0 && eventStartTime.length === 0) {
      throwError('If you set reminder times, please also uncheck All Day and add a start time')
      return false
    }

    const cleanedObject = Manager.cleanObject(newEvent, ModelNames.calendarEvent)
    MyConfetti.fire()
    onClose()

    // Add first/initial date before adding repeating/cloned
    await CalendarManager.addCalendarEvent(cleanedObject).finally(async () => {
      NotificationManager.sendToShareWith(eventShareWith, 'New Calendar Event', `${eventTitle} on ${moment(eventFromDate).format('ddd DD')}`)

      // Add cloned dates
      if (Manager.isValid(clonedDatesToSubmit, true)) {
        await CalendarManager.addMultipleCalEvents(Manager.getUniqueArray(clonedDatesToSubmit).flat())
      }

      // Repeating Events
      await addRepeatingEventsToDb()
      if (navigator.setAppBadge) {
        await navigator.setAppBadge(1)
      }
    })

    resetForm()
  }

  // const setActivitySets = async (userPhone) => {
  //   const existingActivitySet = await DB.getTable(`${DB.tables.activitySets}/${userPhone}`, true)
  //   let newActivitySet = new ActivitySet()
  //   let unreadMessageCount = existingActivitySet?.unreadMessageCount || 0
  //   if (Manager.isValid(existingActivitySet, false, true)) {
  //     newActivitySet = { ...existingActivitySet }
  //   }
  //   newActivitySet.unreadMessageCount = unreadMessageCount === 0 ? 1 : (unreadMessageCount += 1)
  //   await DB_UserScoped.addActivitySet(`${DB.tables.activitySets}/${userPhone}`, newActivitySet)
  // }

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
        repeatingDateObject.startDate = moment(date).format(DateFormats.monthDayYear)
        repeatingDateObject.shareWith = Manager.getUniqueArray(eventShareWith).flat()

        // Not Required
        repeatingDateObject.directionsLink = eventLocation || ''
        repeatingDateObject.location = eventLocation || ''
        repeatingDateObject.children = eventChildren || []
        repeatingDateObject.ownerPhone = currentUser.phone
        repeatingDateObject.createdBy = currentUser.name
        repeatingDateObject.notes = eventNotes || ''
        repeatingDateObject.websiteUrl = eventWebsite || ''
        repeatingDateObject.startTime = eventStartTime || ''
        repeatingDateObject.endTime = eventEndTime || ''
        repeatingDateObject.reminderTimes = eventReminderTimes || []
        repeatingDateObject.sentReminders = []
        repeatingDateObject.endDate = eventToDate || ''
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
      await CalendarManager.addMultipleCalEvents(currentUser, repeatingEvents)
    }
  }

  const handleChildSelection = (e) => {
    let childrenArr = []
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        childrenArr = [...eventChildren, e]
      },
      (e) => {},
      true
    )
    setEventChildren(childrenArr)
  }

  const handleShareWithSelection = (e) => {
    const shareWithNumbers = Manager.handleShareWithSelection(e, currentUser, eventShareWith)
    setEventShareWith(shareWithNumbers)
  }

  const handleCoparentsToRemindSelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setCoparentsToRemind([...coparentsToRemind, e])
      },
      (e) => {
        let filtered = coparentsToRemind.filter((x) => x !== e)
        setCoparentsToRemind(filtered)
      },
      true
    )
  }

  const handleReminderSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        let timeframe = CalendarMapper.reminderTimes(e)
        setEventReminderTimes([...eventReminderTimes, timeframe])
      },
      (e) => {
        let mapped = CalendarMapper.reminderTimes(e)
        let filtered = eventReminderTimes.filter((x) => x !== mapped)
        setEventReminderTimes(filtered)
      },
      true
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

  // Add cloned events
  useEffect(() => {
    clonedDates.forEach((date) => {
      const clonedDateObject = new CalendarEvent()
      // Required
      clonedDateObject.title = eventTitle
      clonedDateObject.id = Manager.getUid()
      clonedDateObject.startDate = DateManager.dateIsValid(date) ? moment(date).format(DateFormats.dateForDb) : ''
      clonedDateObject.endDate = DateManager.dateIsValid(eventToDate) ? moment(eventToDate).format(DateFormats.dateForDb) : ''
      clonedDateObject.startTime = DateManager.dateIsValid(eventStartTime) ? eventStartTime.format(DateFormats.timeForDb) : ''
      clonedDateObject.endTime = DateManager.dateIsValid(eventEndTime) ? eventEndTime.format(DateFormats.timeForDb) : ''
      // Not Required
      clonedDateObject.directionsLink = eventLocation || ''
      clonedDateObject.location = eventLocation || ''
      clonedDateObject.children = eventChildren || []
      clonedDateObject.ownerPhone = currentUser.phone
      clonedDateObject.createdBy = currentUser.name
      clonedDateObject.shareWith = Manager.getUniqueArray(eventShareWith).flat()
      clonedDateObject.notes = eventNotes || ''
      clonedDateObject.websiteUrl = eventWebsite || ''
      clonedDateObject.startTime = ''
      clonedDateObject.endTime = ''
      clonedDateObject.reminderTimes = eventReminderTimes || []
      clonedDateObject.sentReminders = []
      clonedDateObject.endDate = ''
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
    if (selectedNewEventDay) {
      setEventFromDate(moment(selectedNewEventDay).format(DateFormats.dateForDb))
    }
  }, [selectedNewEventDay])

  useEffect(() => {
    Manager.showPageContainer('show')
  }, [])

  return (
    <div>
      {/* FORM WRAPPER */}
      <BottomCard
        submitText={'Create Event'}
        className={`${theme} new-event-form new-calendar-event`}
        onClose={onClose}
        onSubmit={submit}
        submitIcon={<FaRegCalendarCheck />}
        showCard={showCard}
        title={'Add New Event'}>
        <div id="calendar-event-form-container" className={`form ${theme}`}>
          {/* Event Length */}
          <div className="action-pills calendar-event">
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
          <div className="title-suggestion-wrapper">
            <InputWrapper
              refreshKey={resetKey}
              inputClasses="event-title-input"
              inputType={'input'}
              labelText={'Title'}
              required={true}
              onChange={async (e) => {
                const inputValue = e.target.value
                if (inputValue.length > 1) {
                  const dbSuggestions = await SecurityManager.getTitleSuggestions(currentUser)

                  if (Manager.isValid(dbSuggestions, true)) {
                    const matching = dbSuggestions.filter(
                      (x) =>
                        x.formName === 'calendar' &&
                        x.ownerPhone === currentUser.phone &&
                        contains(x.suggestion.toLowerCase(), inputValue.toLowerCase())
                    )
                    setTitleSuggestions(Manager.getUniqueArray(matching).flat())
                  }
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

          {/* FROM DATE */}
          <div className="flex gap m-0">
            {/* FROM DATE */}
            {eventLength === EventLengths.single && (
              <>
                <div className="w-100">
                  <InputWrapper labelText={'Date'} required={true} inputType={'date'}>
                    <MobileDatePicker
                      disablePast={true}
                      value={moment(selectedNewEventDay)}
                      className={`${theme} m-0 w-100 event-from-date mui-input`}
                      onAccept={(e) => {
                        setEventFromDate(e)
                      }}
                    />
                  </InputWrapper>
                </div>
              </>
            )}
          </div>

          {/* DATE RANGE */}
          {eventLength === EventLengths.multiple && (
            <>
              <InputWrapper labelText={'Date Range'} required={true} inputType={'date'}>
                <DateRangePicker
                  showOneCalendar
                  showHeader={false}
                  editable={false}
                  id="event-date"
                  placement="auto"
                  character=" to "
                  className={`${theme} mb-15`}
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
              </InputWrapper>
            </>
          )}

          {/* EVENT WITH TIME */}
          {!isAllDay && (
            <div className={'flex gap event-times-wrapper mb-15'}>
              <div>
                <InputWrapper wrapperClasses="higher-label" labelText={'Start Time'} required={false} inputType={'date'}>
                  <MobileTimePicker defaultValue={null} minutesStep={5} className={`${theme}`} onAccept={(e) => setEventStartTime(e)} />
                </InputWrapper>
              </div>
              <span>&nbsp;to&nbsp;</span>
              <div>
                <InputWrapper wrapperClasses="higher-label" labelText={'End Time'} required={false} inputType={'date'}>
                  <MobileTimePicker defaultValue={null} minutesStep={5} className={`${theme} `} onAccept={(e) => setEventEndTime(e)} />
                </InputWrapper>
              </div>
            </div>
          )}

          <hr />

          {/* WHO IS ALLOWED TO SEE IT? */}
          {Manager.isValid(currentUser?.coparents, true) && (
            <ShareWithCheckboxes
              icon={<ImEye />}
              required={true}
              shareWith={currentUser.coparents.map((x) => x.phone)}
              onCheck={(e) => handleShareWithSelection(e)}
              labelText={'Who is allowed to see it?'}
              containerClass={'share-with-coparents'}
              checkboxLabels={currentUser.coparents.map((x) => x.phone)}
            />
          )}

          <hr />

          {/* ALL DAY / HAS END DATE */}
          <div className="flex">
            <p>All Day</p>
            <Toggle
              icons={{
                unchecked: null,
              }}
              className={'ml-auto reminder-toggle'}
              onChange={(e) => setIsAllDay(!isAllDay)}
            />
          </div>

          {/* IS VISITATION? */}
          <div className="flex">
            <p>Visitation Event</p>
            <Toggle
              icons={{
                unchecked: null,
              }}
              className={'ml-auto visitation-toggle'}
              onChange={(e) => setIsVisitation(!isVisitation)}
            />
          </div>

          {/* REMINDER */}
          {!isAllDay && (
            <>
              <div className="flex">
                <p>Remind Me</p>
                <Toggle
                  icons={{
                    checked: <span className="material-icons-round">notifications</span>,
                    unchecked: null,
                  }}
                  className={'ml-auto reminder-toggle'}
                  onChange={(e) => setShowReminders(!showReminders)}
                />
              </div>
              <div className="share-with-container">
                <Accordion>
                  <Accordion.Panel expanded={showReminders}>
                    <CheckboxGroup
                      containerClass={'reminder-times'}
                      elClass={`${theme}`}
                      skipNameFormatting={true}
                      checkboxLabels={['At time of event', '5 minutes before', '30 minutes before', '1 hour before']}
                      onCheck={handleReminderSelection}
                    />
                  </Accordion.Panel>
                </Accordion>
              </div>
            </>
          )}

          {/* REMIND COPARENTS*/}
          {Manager.isValid(currentUser?.coparents, true) && (
            <div className="share-with-container">
              <div className="flex">
                <p>Remind Co-parent(s)</p>
                <Toggle
                  icons={{
                    checked: <span className="material-icons-round">person</span>,
                    unchecked: null,
                  }}
                  className={'ml-auto reminder-toggle'}
                  onChange={(e) => setShowCoparentReminderToggle(showCoparentReminderToggle === true ? false : true)}
                />
              </div>
              <Accordion>
                <Accordion.Panel expanded={showCoparentReminderToggle}>
                  {currentUser.accountType === 'parent' && (
                    <CheckboxGroup
                      elClass={`${theme} `}
                      dataPhone={currentUser?.coparents.map((x) => x.phone)}
                      checkboxLabels={currentUser?.coparents.map((x) => x.name)}
                      onCheck={handleCoparentsToRemindSelection}
                    />
                  )}
                  {currentUser.accountType === 'child' && (
                    <CheckboxGroup
                      elClass={`${theme} `}
                      dataPhone={currentUser.parents.map((x) => x.phone)}
                      checkboxLabels={currentUser.parents.map((x) => x.name)}
                      onCheck={handleCoparentsToRemindSelection}
                    />
                  )}
                </Accordion.Panel>
              </Accordion>
            </div>
          )}

          {/* INCLUDING WHICH CHILDREN */}
          {Manager.isValid(currentUser.children !== undefined, true) && (
            <div className="share-with-container">
              <div className="flex">
                <p>Include Children</p>
                <Toggle
                  icons={{
                    checked: <span className="material-icons-round">face</span>,
                    unchecked: null,
                  }}
                  className={'ml-auto reminder-toggle'}
                  onChange={(e) => setIncludeChildren(!includeChildren)}
                />
              </div>
              <Accordion>
                <Accordion.Panel expanded={includeChildren}>
                  <CheckboxGroup
                    elClass={`${theme} `}
                    checkboxLabels={currentUser?.children.map((x) => x['general'].name)}
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
              <div className="share-with-container" id="repeating-container">
                <div className="flex">
                  <p>Repeating</p>
                  <Toggle
                    icons={{
                      checked: <span className="material-icons-round">event_repeat</span>,
                      unchecked: null,
                    }}
                    className={'ml-auto reminder-toggle'}
                    onChange={(e) => setEventIsRepeating(!eventIsRepeating)}
                  />
                </div>
                <Accordion>
                  <Accordion.Panel expanded={eventIsRepeating}>
                    <CheckboxGroup
                      elClass={`${theme} `}
                      boxWidth={35}
                      onCheck={handleRepeatingSelection}
                      checkboxLabels={['Daily', 'Weekly', 'Biweekly', 'Monthly']}
                    />
                    {repeatInterval && (
                      <DatetimePicker
                        className={`mt-0 w-100`}
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

              <div className="flex">
                <p>Copy Event to Other Dates</p>
                <Toggle
                  icons={{
                    checked: <FaClone />,
                    unchecked: null,
                  }}
                  className={'ml-auto reminder-toggle'}
                  onChange={(e) => setShowCloneInput(!showCloneInput)}
                />
              </div>

              {/* CLONED */}
              {showCloneInput && (
                <div>
                  <InputWrapper labelText={'Select Dates'} required={false} inputType={'date'}>
                    <MultiDatePicker
                      className={`${theme} multidate-picker mb-15`}
                      placement="auto"
                      placeholder={null}
                      label=""
                      onOpen={() => Manager.hideKeyboard()}
                      onChange={(e) => {
                        if (!Array.isArray(clonedDates)) {
                          e = [e]
                          setClonedDates(e)
                        } else {
                          setClonedDates(e)
                        }
                      }}
                    />
                  </InputWrapper>
                </div>
              )}
            </>
          )}

          <hr className="mb-0" />

          {/* URL/WEBSITE */}
          <InputWrapper labelText={'Website'} required={false} inputType={'input'} onChange={(e) => setEventWebsite(e.target.value)}></InputWrapper>

          {/* LOCATION/ADDRESS */}
          <InputWrapper labelText={'Location'} required={false} inputType={'location'}>
            <Autocomplete
              placeholder={'Location'}
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
          </InputWrapper>

          {/* NOTES */}
          <InputWrapper labelText={'Notes'} required={false} inputType={'textarea'} onChange={(e) => setEventNotes(e.target.value)}></InputWrapper>
        </div>
      </BottomCard>
    </div>
  )
}
