/* eslint-disable no-unused-vars */
import { default as MultiDatePicker } from '@rsuite/multi-date-picker'
import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import EventLengths from '../../constants/eventLengths'
import globalState from '../../context'
import Manager from '../../managers/manager'
import MyConfetti from '../../components/shared/myConfetti.js'
import CheckboxGroup from '../../components/shared/checkboxGroup'
import CalendarEvent from '../../models/calendarEvent'
import CalendarMapper from '../../mappers/calMapper'
import DatetimePicker from '../../components/shared/datetimePicker.jsx'
import DateFormats from '../../constants/dateFormats'
import DatetimePickerViews from '../../constants/datetimePickerViews'
import DB from '../../database/DB'
import DateManager from '../../managers/dateManager'
import InputSuggestionWrapper from '../../components/shared/inputSuggestionWrapper'
import { FaClone, FaRegCalendarCheck } from 'react-icons/fa6'
import Toggle from 'react-toggle'
import SecurityManager from '../../managers/securityManager'
import ModelNames from '../../models/modelNames'
import ShareWithCheckboxes from '../../components/shared/shareWithCheckboxes'
import InputWrapper from '../../components/shared/inputWrapper'
import BottomCard from '../../components/shared/bottomCard'
import { MobileDatePicker, MobileDateRangePicker, MobileTimePicker, SingleInputDateRangeField } from '@mui/x-date-pickers-pro'
import AlertManager from '../../managers/alertManager'
import AccordionSummary from '@mui/material/AccordionSummary'
import Accordion from '@mui/material/Accordion'
import validator from 'validator'
import AccordionDetails from '@mui/material/AccordionDetails'
import ObjectManager from '../../managers/objectManager'
import DatasetManager from '../../managers/datasetManager'
import InputSuggestion from '../../models/inputSuggestion' // COMPONENT
import _ from 'lodash'
import FormNames from '../../models/formNames'
import CalendarManager from '../../managers/calendarManager.js'
import NotificationManager from '../../managers/notificationManager.js'
import DB_UserScoped from '../../database/db_userScoped'
import ActivityCategory from '../../models/activityCategory'
import StringManager from '../../managers/stringManager' // COMPONENT

// COMPONENT
export default function NewCalendarEvent({ showCard, hideCard, selectedNewEventDay }) {
  // APP STATE
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

  // EVENT STATE
  const [eventLength, setEventLength] = useState(EventLengths.single)
  const [eventStartDate, setEventStartDate] = useState(moment(selectedNewEventDay).format(DateFormats.dateForDb))
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventWebsite, setEventWebsite] = useState('')
  const [eventNotes, setEventNotes] = useState('')
  const [repeatingEndDate, setRepeatingEndDate] = useState('')
  const [repeatInterval, setRepeatInterval] = useState('')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [eventPhone, setEventPhone] = useState('')
  const [eventShareWith, setEventShareWith] = useState([])
  const [clonedDates, setClonedDates] = useState([])
  const [inputSuggestions, setInputSuggestions] = useState([])
  const [eventChildren, setEventChildren] = useState([])
  const [eventReminderTimes, setEventReminderTimes] = useState([])
  const [coparentsToRemind, setCoparentsToRemind] = useState([])
  const [eventIsRepeating, setEventIsRepeating] = useState(false)
  const [eventIsDateRange, setEventIsDateRange] = useState(false)
  const [eventIsCloned, setEventIsCloned] = useState(false)

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
    hideCard()
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
  }

  const submit = async () => {
    const newEvent = new CalendarEvent()
    // Required
    newEvent.title = eventTitle
    if (Manager.contains(eventTitle, 'birthday')) {
      newEvent.title += ' 🎂'
    }
    if (isVisitation) {
      newEvent.title = `${StringManager.formatNameFirstNameOnly(currentUser?.name)}'s Visitation`
    }
    newEvent.startDate = Manager.isValid(eventStartDate) ? moment(eventStartDate).format(DateFormats.dateForDb) : ''
    newEvent.endDate = Manager.isValid(eventEndDate) ? moment(eventEndDate).format(DateFormats.dateForDb) : ''
    newEvent.startTime = Manager.isValid(eventStartTime) ? moment(eventStartTime).format(DateFormats.timeForDb) : ''
    newEvent.endTime = Manager.isValid(eventEndTime) ? moment(eventEndTime).format(DateFormats.timeForDb) : ''
    // Not Required
    newEvent.id = Manager.getUid()
    newEvent.directionsLink = !_.isEmpty(eventLocation) ? Manager.getDirectionsLink(eventLocation) : ''
    newEvent.location = eventLocation
    newEvent.children = eventChildren
    newEvent.ownerPhone = currentUser?.phone
    newEvent.createdBy = currentUser?.name
    newEvent.shareWith = DatasetManager.getUniqueArray(eventShareWith, true)
    newEvent.notes = eventNotes
    newEvent.websiteUrl = eventWebsite
    newEvent.reminderTimes = eventReminderTimes
    newEvent.repeatInterval = repeatInterval
    newEvent.fromVisitationSchedule = isVisitation
    newEvent.isRepeating = eventIsRepeating
    newEvent.isCloned = eventIsCloned
    newEvent.isDateRange = eventIsDateRange

    if (Manager.isValid(eventPhone, true)) {
      if (!validator.isMobilePhone(eventPhone)) {
        AlertManager.throwError('Phone number is not valid')
        return false
      }
    } else {
      newEvent.phone = eventPhone
    }

    if (Manager.isValid(newEvent)) {
      // Repeating Events Validation
      if (Manager.isValid(repeatingEndDate) && !Manager.isValid(repeatInterval)) {
        AlertManager.throwError('If you have chosen to repeat this event, please select an end month')
        return false
      }

      if (!Manager.isValid(eventTitle, true)) {
        AlertManager.throwError('Please enter an event title')
        return false
      }

      if (!Manager.isValid(eventStartDate, true)) {
        AlertManager.throwError('Please select an event date')
        return false
      }

      hideCard()
      MyConfetti.fire()

      // Insert Suggestion
      const alreadyExists =
        _.filter(inputSuggestions, (row) => {
          return row.suggestion.toLowerCase() === newEvent.title.toLowerCase() && row.ownerPhone === currentUser?.phone
        }).length > 0

      if (!alreadyExists) {
        const newSuggestion = new InputSuggestion()
        newSuggestion.ownerPhone = currentUser?.phone
        newSuggestion.formName = FormNames.calendar
        newSuggestion.suggestion = newEvent.title
        await DB.addSuggestion(newSuggestion)
      }

      const cleanedObject = ObjectManager.cleanObject(newEvent, ModelNames.calendarEvent)

      // Date Range
      if (eventIsDateRange) {
        const dateObjects = createEventList()
        await CalendarManager.addMultipleCalEvents(currentUser, dateObjects)
      }

      // Add cloned dates
      if (eventIsCloned) {
        const clonedDatesList = createEventList()
        await CalendarManager.addMultipleCalEvents(currentUser, clonedDatesList)
      }

      // Repeating
      if (eventIsRepeating) {
        const repeatingDates = createEventList('repeating')
        await CalendarManager.addMultipleCalEvents(currentUser, repeatingDates)
      }

      // SINGLE DATE --------------------------------------------------------------------------------------------------
      if (!eventIsRepeating && !eventIsDateRange && !eventIsCloned) {
        await CalendarManager.addCalendarEvent(currentUser, cleanedObject)

        // Send notification
        await NotificationManager.sendToShareWith(
          eventShareWith,
          currentUser,
          'New Calendar Event',
          `${eventTitle} on ${moment(eventStartDate).format('ddd DD')}`,
          ActivityCategory.calendar
        )
      }
      await navigator.setAppBadge(1)
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
    setEventShareWith(shareWithNumbers)
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
      setEventIsDateRange(true)
    }

    // REPEATING
    if (eventIsRepeating) {
      datesToIterate = CalendarMapper.repeatingEvents(
        repeatInterval,
        moment(eventStartDate, DateFormats.fullDatetime).format(DateFormats.monthDayYear),
        repeatingEndDate
      )
      setEventIsRepeating(true)
    }

    // CLONED DATES
    if (Manager.isValid(clonedDates)) {
      datesToIterate = clonedDates
      setEventIsCloned(true)
    }

    datesToIterate.forEach((date) => {
      let dateObject = new CalendarEvent()
      // Required
      dateObject.title = eventTitle
      dateObject.id = Manager.getUid()
      dateObject.startDate = moment(date).format(DateFormats.dateForDb)
      dateObject.endDate = moment(eventEndDate).format(DateFormats.dateForDb)

      // Not Required
      dateObject.directionsLink = Manager.getDirectionsLink(eventLocation)
      dateObject.location = eventLocation
      dateObject.children = eventChildren
      dateObject.ownerPhone = currentUser?.phone
      dateObject.createdBy = currentUser?.name
      dateObject.phone = eventPhone
      dateObject.shareWith = DatasetManager.getUniqueArray(eventShareWith, true)
      dateObject.notes = eventNotes
      dateObject.websiteUrl = eventWebsite
      dateObject.isRepeating = eventIsRepeating
      dateObject.isDateRange = eventIsDateRange
      dateObject.isCloned = eventIsCloned
      if (Manager.isValid(eventStartTime)) {
        dateObject.startTime = eventStartTime.format(DateFormats.timeForDb)
      }
      if (Manager.isValid(eventEndTime)) {
        dateObject.endTime = eventEndTime.format(DateFormats.timeForDb)
      }
      dateObject.reminderTimes = eventReminderTimes
      dateObject.repeatInterval = repeatInterval
      dateObject = ObjectManager.cleanObject(dateObject, ModelNames.calendarEvent)
      datesToPush.push(dateObject)
    })

    if (!Manager.isValid(clonedDates)) {
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
      if (datetimeParent) {
        datetimeParent.classList.add(currentUser?.settings?.theme)
      }
    }, 100)
  }

  useEffect(() => {
    if (selectedNewEventDay) {
      setEventStartDate(moment(selectedNewEventDay).format(DateFormats.dateForDb))
    }
  }, [selectedNewEventDay])

  useEffect(() => {
    // Date Picker Stuff
    const multiDatePicker = document.querySelector('.rs-picker-popup.rs-picker-popup-date')
    const multiDateInput = document.querySelector('.rs-input')
    if (multiDatePicker && multiDateInput) {
      multiDateInput.onBlur()
      const screenHeight = window.screen.height
      multiDatePicker.style.top = `${screenHeight / 4}px`
    }
    const pickers = document.querySelectorAll('.MuiInputBase-input')
    if (pickers) {
      pickers.forEach((x) => (x.value = ''))
    }
    if (selectedNewEventDay) {
      setEventStartDate(moment().format(DateFormats.dateForDb))
    }
  }, [])

  return (
    <>
      {/* FORM WRAPPER */}
      <BottomCard
        refreshKey={refreshKey}
        submitText={'Create Event'}
        className={`${theme} new-event-form new-calendar-event`}
        onClose={resetForm}
        onSubmit={submit}
        submitIcon={<FaRegCalendarCheck />}
        showCard={showCard}
        wrapperClass="new-calendar-event"
        title={'Add New Event'}>
        <div id="calendar-event-form-container" className={`form ${theme}`}>
          {/* Event Length */}
          <div className="calendar views-wrapper">
            <p className={`view  ${eventLength === 'single' ? 'active' : ''}`} onClick={() => setEventLength(EventLengths.single)}>
              Single Day
            </p>
            <p className={`view  ${eventLength === 'multiple' ? 'active' : ''}`} onClick={() => setEventLength(EventLengths.multiple)}>
              Multiple Days
            </p>
          </div>

          {/* CALENDAR FORM */}
          {/* EVENT NAME */}
          <InputWrapper
            inputClasses="event-title-input"
            inputType={'input'}
            labelText={'Event Name'}
            defaultValue={eventTitle}
            refreshKey={refreshKey}
            required={true}
            isDebounced={false}
            inputValue={eventTitle}
            onChange={async (e) => {
              const inputValue = e.target.value
              if (inputValue.length > 1) {
                const dbSuggestions = await SecurityManager.getInputSuggestions(currentUser)

                if (Manager.isValid(dbSuggestions)) {
                  const matching = dbSuggestions.filter(
                    (x) =>
                      x.formName === 'calendar' &&
                      x.ownerPhone === currentUser?.phone &&
                      Manager.contains(x.suggestion.toLowerCase(), inputValue.toLowerCase())
                  )
                  setInputSuggestions(DatasetManager.getUniqueArray(matching, true))
                }
              } else {
                setInputSuggestions([])
              }
              setEventTitle(inputValue)
            }}
          />

          {/* SUGGESTIONS DROPDOWN */}
          {Manager.isValid(eventTitle) && (
            <div className="title-suggestion-wrapper">
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
          )}

          {/* FROM DATE */}
          <div className="flex gap">
            {eventLength === EventLengths.single && (
              <InputWrapper labelText={'Date'} inputType={'date'} required={true}>
                <MobileDatePicker
                  onOpen={addThemeToDatePickers}
                  value={moment(selectedNewEventDay)}
                  className={`${theme} m-0 w-100 event-from-date mui-input`}
                  onAccept={(e) => {
                    setEventStartDate(e)
                  }}
                />
              </InputWrapper>
            )}
          </div>

          {/* DATE RANGE */}
          {eventLength === EventLengths.multiple && (
            <InputWrapper wrapperClasses="date-range-input" labelText={'Date Range'} required={true} inputType={'date'}>
              <MobileDateRangePicker
                className={'w-100'}
                onOpen={() => {
                  Manager.hideKeyboard('date-range-input')
                  addThemeToDatePickers()
                }}
                onAccept={(dateArray) => {
                  if (Manager.isValid(dateArray)) {
                    setEventStartDate(moment(dateArray[0]).format(DateFormats.dateForDb))
                    setEventEndDate(moment(dateArray[1]).format(DateFormats.dateForDb))
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
            <div className={'flex  event-times-wrapper'}>
              <MobileTimePicker
                onOpen={addThemeToDatePickers}
                minutesStep={5}
                format={'h:mma'}
                label={'Start Time'}
                className={`${theme} w-50`}
                value={moment(eventStartTime)}
                onAccept={(e) => setEventStartTime(e)}
              />
              <MobileTimePicker
                onOpen={addThemeToDatePickers}
                format={'h:mma'}
                minutesStep={5}
                label={'End Time'}
                className={`${theme} w-50`}
                MuiFormLabel-root
                onAccept={(e) => setEventEndTime(e)}
              />
            </div>
          )}

          {/* Share with */}
          {Manager.isValid(currentUser?.coparents) && (
            <ShareWithCheckboxes required={false} onCheck={handleShareWithSelection} containerClass={'share-with-coparents'} />
          )}
          {Manager.isValid(currentUser?.parents) && (
            <ShareWithCheckboxes required={false} onCheck={handleShareWithSelection} containerClass={'share-with-coparents'} />
          )}

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

          {/* INCLUDING WHICH CHILDREN */}
          {Manager.isValid(currentUser?.children) && (
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
                      defaultLabels={[]}
                      checkboxLabels={['Daily', 'Weekly', 'Biweekly', 'Monthly']}
                    />
                    {Manager.isValid(repeatInterval) && (
                      <InputWrapper inputType={'date'} labelText={'Month to End Repeating Events'} required={true}>
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
            labelText={'Website'}
            required={false}
            refreshKey={refreshKey}
            inputType={'input'}
            inputValueType="url"
            onChange={(e) => setEventWebsite(e.target.value)}></InputWrapper>

          {/* LOCATION/ADDRESS */}
          <InputWrapper refreshKey={refreshKey} labelText={'Location'} required={false} inputType={'location'}>
            <Autocomplete
              apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
              options={{
                types: ['geocode', 'establishment'],
                componentRestrictions: { country: 'usa' },
              }}
              onPlaceSelected={(place) => {
                setEventLocation(place.formatted_address)
              }}
              placeholder={''}
            />
          </InputWrapper>

          {/* PHONE */}
          <InputWrapper inputValueType="tel" labelText={'Phone'} onChange={(e) => setEventPhone(e.target.value)} />

          {/* NOTES */}
          <InputWrapper
            labelText={'Notes'}
            refreshKey={refreshKey}
            required={false}
            inputType={'textarea'}
            onChange={(e) => setEventNotes(e.target.value)}></InputWrapper>
        </div>
      </BottomCard>
    </>
  )
}