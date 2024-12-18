/* eslint-disable no-unused-vars */
import { default as MultiDatePicker } from '@rsuite/multi-date-picker'
import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
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
import DateManager from '../../managers/dateManager'
import InputSuggestionWrapper from '../shared/inputSuggestionWrapper'
import { FaClone, FaRegCalendarCheck } from 'react-icons/fa6'
import Toggle from 'react-toggle'
import SecurityManager from '../../managers/securityManager'
import ModelNames from '../../models/modelNames'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import InputWrapper from '../shared/inputWrapper'
import BottomCard from '../shared/bottomCard'
import { IoTodayOutline } from 'react-icons/io5'
import { HiOutlineCalendarDays } from 'react-icons/hi2'
import { MobileDatePicker, MobileDateRangePicker, MobileTimePicker, SingleInputDateRangeField } from '@mui/x-date-pickers-pro'
import AlertManager from '../../managers/alertManager'
import AccordionSummary from '@mui/material/AccordionSummary'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  hasClass,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../globalFunctions'
import ObjectManager from '../../managers/objectManager'
import DatasetManager from '../../managers/datasetManager'
import InputSuggestion from '../../models/inputSuggestion' // COMPONENT
import _ from 'lodash'
import FormNames from '../../models/formNames'
import CalendarManager from '../../managers/calendarManager'
import NotificationManager from '../../managers/notificationManager'
import Label from '../shared/label'
import DB_UserScoped from '@userScoped'

// COMPONENT
export default function NewCalendarEvent({ showCard, hideCard, selectedNewEventDay }) {
  // APP STATE
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

  // EVENT STATE
  const [eventLength, setEventLength] = useState(EventLengths.single)
  const [eventStartDate, setEventStartDate] = useState('')
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventWebsite, setEventWebsite] = useState('')
  const [eventNotes, setEventNotes] = useState('')
  const [repeatingEndDate, setRepeatingEndDate] = useState('')
  const [repeatInterval, setRepeatInterval] = useState('')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [eventShareWith, setEventShareWith] = useState([])
  const [clonedDates, setClonedDates] = useState([])
  const [inputSuggestions, setInputSuggestions] = useState([])
  const [eventChildren, setEventChildren] = useState([])
  const [eventReminderTimes, setEventReminderTimes] = useState([])
  const [coparentsToRemind, setCoparentsToRemind] = useState([])
  const [eventIsRepeating, setEventIsRepeating] = useState(false)
  const [eventIsDateRange, setEventIsDateRange] = useState(false)
  // COMPONENT STATE
  const [isAllDay, setIsAllDay] = useState(false)
  const [showCloneInput, setShowCloneInput] = useState(false)
  const [showReminders, setShowReminders] = useState(false)
  const [includeChildren, setIncludeChildren] = useState(false)
  const [isVisitation, setIsVisitation] = useState(false)
  const [showCoparentReminderToggle, setShowCoparentReminderToggle] = useState(false)
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [suggestionRefreshKey, setSuggestionRefreshKey] = useState(Manager.getUid())

  const resetForm = async () => {
    Manager.resetForm('new-event-form')
    setEventLength(EventLengths.single)
    setEventStartDate('')
    setEventEndDate('')
    setEventLocation('')
    setEventTitle('')
    setEventWebsite('')
    setEventNotes('')
    setRepeatingEndDate('')
    setRepeatInterval('')
    setEventStartTime('')
    setEventEndTime('')
    setEventShareWith([])
    setClonedDates([])
    setInputSuggestions([])
    setEventChildren([])
    setEventReminderTimes([])
    setCoparentsToRemind([])
    setEventIsDateRange(false)
    setEventIsRepeating(false)
    setIsAllDay(false)
    setShowCloneInput(false)
    setShowReminders(false)
    setIncludeChildren(false)
    setIsVisitation(false)
    setShowCoparentReminderToggle(false)
    setRefreshKey(Manager.getUid())
    setSuggestionRefreshKey(Manager.getUid())
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(currentUser.phone)
    setState({ ...state, currentUser: updatedCurrentUser })
    hideCard()
  }

  const submit = async () => {
    const newEvent = new CalendarEvent()
    // Required
    newEvent.title = eventTitle
    if (Manager.isValid(newEvent.title) && newEvent.title.toLowerCase().indexOf('birthday') > -1) {
      newEvent.title += ' 🎂'
    }
    if (isVisitation) {
      newEvent.title = `${formatNameFirstNameOnly(currentUser?.name)}'s Visitation`
    }
    newEvent.startDate = DateManager.dateIsValid(eventStartDate) ? moment(eventStartDate).format(DateFormats.dateForDb) : ''
    newEvent.endDate = DateManager.dateIsValid(eventEndDate) ? moment(eventEndDate).format(DateFormats.dateForDb) : ''
    newEvent.startTime = DateManager.dateIsValid(eventStartTime) ? eventStartTime.format(DateFormats.timeForDb) : ''
    newEvent.endTime = DateManager.dateIsValid(eventEndTime) ? eventEndTime.format(DateFormats.timeForDb) : ''
    // Not Required
    newEvent.id = Manager.getUid()
    newEvent.directionsLink = !_.isEmpty(eventLocation) ? Manager.getDirectionsLink(eventLocation) : ''
    newEvent.location = eventLocation
    newEvent.children = eventChildren
    newEvent.ownerPhone = currentUser?.phone
    newEvent.createdBy = currentUser?.name
    newEvent.shareWith = DatasetManager.getUniqueArray(eventShareWith, true)
    newEvent.notes = eventNotes
    newEvent.isRepeating = eventIsRepeating
    newEvent.websiteUrl = eventWebsite
    newEvent.reminderTimes = eventReminderTimes
    newEvent.repeatInterval = repeatInterval
    newEvent.fromVisitationSchedule = isVisitation

    if (Manager.isValid(newEvent)) {
      // Repeating Events Validation
      if (repeatingEndDate.length === 0 && repeatInterval.length > 0) {
        AlertManager.throwError('If you have chosen to repeat this event, please select an end month')
        return false
      }

      const validation = DateManager.formValidation(eventTitle, eventShareWith, eventStartDate)
      if (validation) {
        AlertManager.throwError(validation)
        return false
      }

      if (eventReminderTimes.length > 0 && eventStartTime.length === 0) {
        AlertManager.throwError('If you set reminder times, please also uncheck All Day and add a start time')
        return false
      }

      // Insert Suggestion
      const alreadyExists =
        _.filter(inputSuggestions, (row) => {
          return row.suggestion === newEvent.title && row.ownerPhone === currentUser?.phone
        }).length > 0

      if (!alreadyExists) {
        const newSuggestion = new InputSuggestion()
        newSuggestion.ownerPhone = currentUser?.phone
        newSuggestion.formName = FormNames.calendar
        newSuggestion.suggestion = newEvent.title
        newSuggestion.id = Manager.getUid()
        await DB.addSuggestion(newSuggestion)
      }

      const cleanedObject = ObjectManager.cleanObject(newEvent, ModelNames.calendarEvent)
      MyConfetti.fire()

      // Determine if you add 1 or more events
      let addSingleEvent = true

      // Date Range
      if (eventIsDateRange) {
        addSingleEvent = false
        const dateObjects = createEventList()
        await CalendarManager.addMultipleCalEvents(currentUser, dateObjects)
      }

      // Add cloned dates
      if (Manager.isValid(clonedDates, true)) {
        addSingleEvent = false
        const clonedDatesList = createEventList()
        await CalendarManager.addMultipleCalEvents(currentUser, clonedDatesList)
      }

      // Repeating
      if (eventIsRepeating) {
        addSingleEvent = false
        const repeatingDates = createEventList('repeating')
        await CalendarManager.addMultipleCalEvents(currentUser, repeatingDates)
      }

      // Add single date
      if (addSingleEvent) {
        await CalendarManager.addCalendarEvent(cleanedObject).finally(async () => {
          NotificationManager.sendToShareWith(
            eventShareWith,
            currentUser,
            'New Calendar Event',
            `${eventTitle} on ${moment(eventStartDate).format('ddd DD')}`
          )

          // Repeating Events
          if (navigator.setAppBadge) {
            await navigator.setAppBadge(1)
          }
        })
      }
      await resetForm()
    }
  }

  // await CalendarManager.addMultipleCalEvents(currentUser, repeatingEvents)
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
    console.log(shareWithNumbers)
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

  const createEventList = () => {
    let datesToPush = []
    let datesToIterate = []

    // DATE RANGE
    if (eventLength === 'multiple') {
      datesToIterate = DateManager.getDateRangeDates(eventStartDate, eventEndDate)
    }

    // REPEATING
    if (eventIsRepeating) {
      datesToIterate = CalendarMapper.repeatingEvents(
        repeatInterval,
        moment(eventStartDate, DateFormats.fullDatetime).format(DateFormats.monthDayYear),
        repeatingEndDate
      )
      if (datesToIterate) {
        datesToIterate.push(eventStartDate)
      }
    }

    // CLONED DATES
    if (clonedDates.length > 0) {
      datesToIterate = clonedDates
      // Add initial start date
      datesToIterate.push(new Date(eventStartDate))
    }

    datesToIterate.forEach((date) => {
      let dateObject = new CalendarEvent()
      // Required
      dateObject.title = eventTitle
      dateObject.id = Manager.getUid()
      dateObject.startDate = DateManager.dateIsValid(date) ? moment(date).format(DateFormats.dateForDb) : ''
      dateObject.endDate = DateManager.dateIsValid(eventEndDate) ? moment(eventEndDate).format(DateFormats.dateForDb) : ''
      // Not Required
      dateObject.directionsLink = eventLocation
      dateObject.location = eventLocation
      dateObject.children = eventChildren
      dateObject.ownerPhone = currentUser?.phone
      dateObject.createdBy = currentUser?.name
      dateObject.shareWith = DatasetManager.getUniqueArray(eventShareWith).flat()
      dateObject.notes = eventNotes
      dateObject.websiteUrl = eventWebsite
      dateObject.startTime = DateManager.dateIsValid(eventStartTime) ? eventStartTime.format(DateFormats.timeForDb) : ''
      dateObject.endTime = DateManager.dateIsValid(eventEndTime) ? eventEndTime.format(DateFormats.timeForDb) : ''
      dateObject.reminderTimes = eventReminderTimes
      dateObject.endDate = ''
      dateObject.repeatInterval = ''
      dateObject = ObjectManager.cleanObject(dateObject, ModelNames.calendarEvent)
      datesToPush.push(dateObject)
    })

    if (clonedDates.length > 0) {
      // Reset Multidate Picker
      const multidatePicker = document.querySelector('.multidate-picker')
      if (multidatePicker) {
        multidatePicker.classList.remove('active')
        const addCloneButton = document.querySelector('.add-clone-button')
        if (addCloneButton) {
          addCloneButton.style.display = 'block'
        }
      }
    }

    return datesToPush
  }

  const addThemeToDatePickers = () => {
    setTimeout(() => {
      const datetimeParent = document.querySelector('.MuiDialog-root.MuiModal-root')
      datetimeParent.classList.add(currentUser?.settings?.theme)
    }, 100)
  }

  useEffect(() => {
    if (selectedNewEventDay) {
      setEventStartDate(moment(selectedNewEventDay).format(DateFormats.dateForDb))
    }
  }, [selectedNewEventDay])

  useEffect(() => {
    const multiDatePicker = document.querySelector('.rs-picker-popup.rs-picker-popup-date')
    const multiDateInput = document.querySelector('.rs-input')
    if (multiDatePicker && multiDateInput) {
      multiDateInput.onBlur()
      const screenHeight = window.screen.height
      multiDatePicker.style.top = `${screenHeight / 4}px`
    }
    Manager.showPageContainer('show')
  }, [])

  return (
    <div>
      {/* FORM WRAPPER */}
      <BottomCard
        submitText={'Create Event'}
        className={`${theme} new-event-form new-calendar-event`}
        onClose={resetForm}
        onSubmit={submit}
        submitIcon={<FaRegCalendarCheck />}
        showCard={showCard}
        title={'Add New Event'}>
        <div id="calendar-event-form-container" className={`form ${theme}`}>
          {/* Event Length */}
          <div id="duration-options" className="action-pills calendar">
            <div className={`duration-option  ${eventLength === 'single' ? 'active' : ''}`} onClick={() => setEventLength(EventLengths.single)}>
              <IoTodayOutline className={'single-day-icon'} />
              <p>Single Day</p>
            </div>
            <div className={`duration-option  ${eventLength === 'multiple' ? 'active' : ''}`} onClick={() => setEventLength(EventLengths.multiple)}>
              <HiOutlineCalendarDays className={'multiple-day-icon'} />
              <p>Multiple Days</p>
            </div>
          </div>

          {/* CALENDAR FORM */}
          <div className="title-suggestion-wrapper">
            {/* TITLE */}
            <InputWrapper
              refreshKey={refreshKey}
              inputClasses="event-title-input"
              inputType={'input'}
              labelText={'Title'}
              defaultValue={eventTitle}
              required={true}
              inputValue={eventTitle}
              onChange={async (e) => {
                const inputValue = e.target.value
                if (inputValue.length > 1) {
                  const dbSuggestions = await SecurityManager.getInputSuggestions(currentUser)

                  if (Manager.isValid(dbSuggestions, true)) {
                    const matching = dbSuggestions.filter(
                      (x) =>
                        x.formName === 'calendar' &&
                        x.ownerPhone === currentUser?.phone &&
                        contains(x.suggestion.toLowerCase(), inputValue.toLowerCase())
                    )
                    setInputSuggestions(DatasetManager.getUniqueArray(matching, true))
                  }
                } else {
                  setInputSuggestions([])
                }
                setEventTitle(inputValue)
              }}
            />
            <InputSuggestionWrapper
              suggestions={inputSuggestions}
              setSuggestions={() => setInputSuggestions([])}
              onClick={(e) => {
                const suggestion = e.target.textContent
                setEventTitle(suggestion)
                setInputSuggestions([])
              }}
            />
          </div>

          {/* FROM DATE */}
          <div className="flex gap mb-15">
            {eventLength === EventLengths.single && (
              <>
                <div className="w-100">
                  <InputWrapper labelText={'Date'} required={true} inputType={'date'}>
                    <MobileDatePicker
                      onOpen={addThemeToDatePickers}
                      value={moment(selectedNewEventDay)}
                      className={`${theme} m-0 w-100 event-from-date mui-input`}
                      onAccept={(e) => {
                        setEventStartDate(e)
                      }}
                    />
                  </InputWrapper>
                </div>
              </>
            )}
          </div>

          {/* DATE RANGE */}
          {eventLength === EventLengths.multiple && (
            <InputWrapper wrapperClasses="date-range-input" labelText={'Date Range'} required={true} inputType={'date'}>
              <MobileDateRangePicker
                onOpen={addThemeToDatePickers}
                className={'w-100'}
                onOpen={() => Manager.hideKeyboard('date-range-input')}
                onAccept={(dateArray) => {
                  if (Manager.isValid(dateArray, true)) {
                    setEventStartDate(moment(dateArray[0]).format('MM/DD/YYYY'))
                    setEventEndDate(moment(dateArray[1]).format('MM/DD/YYYY'))
                    setEventIsDateRange(true)
                  }
                }}
                slots={{ field: SingleInputDateRangeField }}
                name="allowedRange"
              />
            </InputWrapper>
          )}

          {/* EVENT WITH TIME */}
          {!isAllDay && (
            <div className={'flex gap event-times-wrapper'}>
              <div>
                <InputWrapper wrapperClasses="higher-label" labelText={'Start Time'} required={false} inputType={'date'}>
                  <MobileTimePicker onOpen={addThemeToDatePickers} minutesStep={5} className={`${theme}`} onAccept={(e) => setEventStartTime(e)} />
                </InputWrapper>
              </div>
              <span>&nbsp;to&nbsp;</span>
              <div>
                <InputWrapper wrapperClasses="higher-label" labelText={'End Time'} required={false} inputType={'date'}>
                  <MobileTimePicker
                    onOpen={addThemeToDatePickers}
                    format={'h:mma'}
                    defaultValue={null}
                    minutesStep={5}
                    className={`${theme} `}
                    onAccept={(e) => setEventEndTime(e)}
                  />
                </InputWrapper>
              </div>
            </div>
          )}

          {/* WHO IS ALLOWED TO SEE IT? */}
          {Manager.isValid(currentUser?.coparents, true) && (
            <ShareWithCheckboxes required={true} onCheck={handleShareWithSelection} containerClass={'share-with-coparents'} />
          )}
          {Manager.isValid(currentUser?.parents, true) && (
            <ShareWithCheckboxes required={true} onCheck={handleShareWithSelection} containerClass={'share-with-coparents'} />
          )}
          {/* ALL DAY / HAS END DATE */}
          <div className="share-with-container">
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
          </div>

          {/* REMINDER */}
          {!isAllDay && (
            <>
              <div className="share-with-container">
                <Accordion id={'checkboxes'} expanded={showReminders}>
                  <AccordionSummary>
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
                  </AccordionSummary>
                  <AccordionDetails>
                    <CheckboxGroup
                      containerClass={'reminder-times'}
                      elClass={`${theme}`}
                      skipNameFormatting={true}
                      checkboxLabels={['At time of event', '5 minutes before', '30 minutes before', '1 hour before']}
                      onCheck={handleReminderSelection}
                    />
                  </AccordionDetails>
                </Accordion>
              </div>
            </>
          )}

          {/* IS VISITATION? */}
          <div className="share-with-container">
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
          </div>

          {/* REMIND COPARENTS*/}
          {Manager.isValid(currentUser?.coparents, true) && (
            <div className="share-with-container">
              <Accordion id={'checkboxes'} expanded={showCoparentReminderToggle}>
                <AccordionSummary>
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
                </AccordionSummary>
                <AccordionDetails>
                  {currentUser?.accountType === 'parent' && (
                    <CheckboxGroup
                      elClass={`${theme} `}
                      dataPhone={currentUser?.coparents?.map((x) => x?.phone)}
                      checkboxLabels={currentUser?.coparents?.map((x) => x?.name)}
                      onCheck={handleCoparentsToRemindSelection}
                    />
                  )}
                  {currentUser?.accountType === 'child' && (
                    <CheckboxGroup
                      elClass={`${theme} `}
                      dataPhone={currentUser?.parents?.map((x) => x?.phone)}
                      checkboxLabels={currentUser?.parents?.map((x) => x?.name)}
                      onCheck={handleCoparentsToRemindSelection}
                    />
                  )}
                </AccordionDetails>
              </Accordion>
            </div>
          )}

          {/* INCLUDING WHICH CHILDREN */}
          {Manager.isValid(currentUser?.children !== undefined, true) && (
            <div className="share-with-container">
              <Accordion id={'checkboxes'} expanded={includeChildren}>
                <AccordionSummary>
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
                </AccordionSummary>
                <AccordionDetails>
                  <CheckboxGroup
                    elClass={`${theme} `}
                    checkboxLabels={currentUser?.children?.map((x) => x['general'].name)}
                    onCheck={handleChildSelection}
                  />
                </AccordionDetails>
              </Accordion>
            </div>
          )}

          {/* REPEATING/CLONED */}
          {(!currentUser?.accountType || currentUser?.accountType === 'parent') && eventLength === 'single' && (
            <>
              {/* REPEATING */}
              <div className="share-with-container" id="repeating-container">
                <Accordion id={'checkboxes'} expanded={eventIsRepeating}>
                  <AccordionSummary>
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
                  </AccordionSummary>
                  <AccordionDetails>
                    <CheckboxGroup
                      elClass={`${theme} `}
                      onCheck={handleRepeatingSelection}
                      checkboxLabels={['Daily', 'Weekly', 'Biweekly', 'Monthly']}
                    />
                    {repeatInterval && (
                      <InputWrapper inputType={'date'}>
                        <Label text={'Month to End Repeating Events'} required={true} classes="mt-15 mb-0" />
                        <DatetimePicker
                          className={`mt-0 w-100`}
                          format={DateFormats.readableMonth}
                          views={DatetimePickerViews.monthAndYear}
                          hasAmPm={false}
                          onAccept={(e) => setRepeatingEndDate(moment(e).format('MM-DD-yyyy'))}
                        />
                      </InputWrapper>
                    )}
                  </AccordionDetails>
                </Accordion>
              </div>

              {/* CLONE */}
              <div className="share-with-container">
                <div className="flex">
                  <p>Copy Event to Other Dates</p>
                  <Toggle
                    icons={{
                      checked: <FaClone />,
                      unchecked: null,
                    }}
                    className={'ml-auto clone-toggle'}
                    onChange={(e) => setShowCloneInput(!showCloneInput)}
                  />
                </div>
              </div>

              {/* CLONED */}
              {showCloneInput && (
                <div>
                  <InputWrapper wrapperClasses="cloned-date-wrapper" labelText={'Other Dates'} required={false} inputType={'date'}>
                    <MultiDatePicker
                      className={`${theme} multidate-picker`}
                      placement="auto"
                      placeholder={null}
                      label=""
                      onOpen={() => Manager.hideKeyboard()}
                      onChange={(e) => setClonedDates(e)}
                    />
                  </InputWrapper>
                </div>
              )}
            </>
          )}

          {/* URL/WEBSITE */}
          <InputWrapper
            wrapperClasses="mt-15"
            refreshKey={refreshKey}
            labelText={'Website'}
            required={false}
            inputType={'input'}
            inputValueType="url"
            onChange={(e) => setEventWebsite(e.target.value)}></InputWrapper>

          {/* LOCATION/ADDRESS */}
          <InputWrapper refreshKey={refreshKey} labelText={'Location'} required={false} inputType={'location'}>
            <Autocomplete
              placeholder={'Location'}
              apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
              options={{
                types: ['geocode', 'establishment'],
                componentRestrictions: { country: 'usa' },
              }}
              onPlaceSelected={(place) => {
                setEventLocation(place.formatted_address)
              }}
            />
          </InputWrapper>

          {/* NOTES */}
          <InputWrapper
            refreshKey={refreshKey}
            labelText={'Notes'}
            required={false}
            inputType={'textarea'}
            onChange={(e) => setEventNotes(e.target.value)}></InputWrapper>
        </div>
      </BottomCard>
    </div>
  )
}