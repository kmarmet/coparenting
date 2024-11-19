/* eslint-disable no-unused-vars */
import { default as MultiDatePicker } from '@rsuite/multi-date-picker'
import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import { Accordion } from 'rsuite'
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
import CalendarManager from '../../managers/calendarManager'
import InputSuggestionWrapper from '../shared/inputSuggestionWrapper'
import { FaClone, FaRegCalendarCheck } from 'react-icons/fa6'
import Toggle from 'react-toggle'
import '../../styles/reactToggle.css'
import { ImEye } from 'react-icons/im'
import SecurityManager from '../../managers/securityManager'
import ModelNames from '../../models/modelNames'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import InputWrapper from '../shared/inputWrapper'
import NotificationManager from '../../managers/notificationManager'
import BottomCard from '../shared/bottomCard'
import { IoTodayOutline } from 'react-icons/io5'
import { HiOutlineCalendarDays } from 'react-icons/hi2'
import { MobileDatePicker, MobileDateRangePicker, MobileTimePicker, SingleInputDateRangeField } from '@mui/x-date-pickers-pro'
import AlertManager from '../../managers/alertManager'
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

// COMPONENT
export default function NewCalendarEvent({ showCard, onClose, selectedNewEventDay }) {
  // APP STATE
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

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
  const [inputSuggestions, setInputSuggestions] = useState([])
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
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [suggestionRefreshKey, setSuggestionRefreshKey] = useState(Manager.getUid())
  const resetForm = () => {
    Manager.resetForm('new-event-form')
    setRefreshKey(Manager.getUid())
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
    newEvent.directionsLink = !_.isEmpty(eventLocation) ? Manager.getDirectionsLink(eventLocation) : ''
    newEvent.location = eventLocation
    newEvent.children = eventChildren
    newEvent.ownerPhone = currentUser.phone
    newEvent.createdBy = currentUser.name
    newEvent.shareWith = DatasetManager.getUniqueArray(eventShareWith, true)
    newEvent.notes = eventNotes
    newEvent.websiteUrl = eventWebsite
    newEvent.reminderTimes = eventReminderTimes
    newEvent.repeatInterval = repeatInterval
    newEvent.fromVisitationSchedule = isVisitation ? true : false

    if (Manager.isValid(newEvent)) {
      // Repeating Events Validation
      if (repeatingEndDate.length === 0 && repeatInterval.length > 0) {
        AlertManager.throwError('If you have chosen to repeat this event, please select an end month')
        return false
      }

      const validation = DateManager.formValidation(eventTitle, eventShareWith, eventFromDate)
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
          return row.suggestion === newEvent.title && row.ownerPhone === currentUser.phone
        }).length > 0

      if (!alreadyExists) {
        const newSuggestion = new InputSuggestion()
        newSuggestion.ownerPhone = currentUser.phone
        newSuggestion.formName = FormNames.calendar
        newSuggestion.suggestion = newEvent.title
        newSuggestion.id = Manager.getUid()
        await DB.addSuggestion(newSuggestion)
      }

      const cleanedObject = ObjectManager.cleanObject(newEvent, ModelNames.calendarEvent)
      MyConfetti.fire()
      onClose()

      // Add first/initial date before adding repeating/cloned
      await CalendarManager.addCalendarEvent(cleanedObject).finally(async () => {
        NotificationManager.sendToShareWith(eventShareWith, 'New Calendar Event', `${eventTitle} on ${moment(eventFromDate).format('ddd DD')}`)

        // Add cloned dates
        if (Manager.isValid(clonedDatesToSubmit, true)) {
          await CalendarManager.addMultipleCalEvents(currentUser, DatasetManager.getUniqueArray(clonedDatesToSubmit).flat())
        }

        // Repeating Events
        await addRepeatingEventsToDb()
        if (navigator.setAppBadge) {
          await navigator.setAppBadge(1)
        }
      })
    }
    resetForm()
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
        let repeatingDateObject = new CalendarEvent()

        // Required
        repeatingDateObject.id = Manager.getUid()
        repeatingDateObject.title = eventTitle
        repeatingDateObject.startDate = moment(date).format(DateFormats.monthDayYear)
        repeatingDateObject.shareWith = DatasetManager.getUniqueArray(eventShareWith).flat()

        // Not Required
        repeatingDateObject.directionsLink = eventLocation
        repeatingDateObject.location = eventLocation
        repeatingDateObject.children = eventChildren
        repeatingDateObject.createdBy = currentUser.name
        repeatingDateObject.notes = eventNotes
        repeatingDateObject.ownerPhone = currentUser.phone
        repeatingDateObject.websiteUrl = eventWebsite
        repeatingDateObject.startTime = eventStartTime
        repeatingDateObject.endTime = eventEndTime
        repeatingDateObject.reminderTimes = eventReminderTimes
        repeatingDateObject.endDate = eventToDate
        repeatingDateObject.repeatInterval = repeatInterval

        if (!isAllDay) {
          repeatingDateObject.startTime = moment(eventStartTime, DateFormats.fullDatetime).format(DateFormats.timeForDb)
          repeatingDateObject.endTime = moment(eventEndTime, DateFormats.fullDatetime).format(DateFormats.timeForDb)
        }
        // repeatingDateObject = ObjectManager.cleanObject(repeatingDateObject)
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
    let datesToPush = []
    clonedDates.forEach((date) => {
      let clonedDateObject = new CalendarEvent()
      // Required
      clonedDateObject.title = eventTitle
      clonedDateObject.id = Manager.getUid()
      clonedDateObject.startDate = DateManager.dateIsValid(date) ? moment(date).format(DateFormats.dateForDb) : ''
      clonedDateObject.endDate = DateManager.dateIsValid(eventToDate) ? moment(eventToDate).format(DateFormats.dateForDb) : ''
      // Not Required
      clonedDateObject.directionsLink = eventLocation
      clonedDateObject.location = eventLocation
      clonedDateObject.children = eventChildren
      clonedDateObject.ownerPhone = currentUser.phone
      clonedDateObject.createdBy = currentUser.name
      clonedDateObject.shareWith = DatasetManager.getUniqueArray(eventShareWith).flat()
      clonedDateObject.notes = eventNotes
      clonedDateObject.websiteUrl = eventWebsite
      clonedDateObject.startTime = ''
      clonedDateObject.endTime = ''
      clonedDateObject.reminderTimes = eventReminderTimes
      clonedDateObject.endDate = ''
      clonedDateObject.repeatInterval = ''
      clonedDateObject = ObjectManager.cleanObject(clonedDateObject, ModelNames.calendarEvent)

      if (!isAllDay) {
        clonedDateObject.startTime = DateManager.dateIsValid(eventStartTime) ? eventStartTime.format(DateFormats.timeForDb) : ''
        clonedDateObject.endTime = DateManager.dateIsValid(eventEndTime) ? eventEndTime.format(DateFormats.timeForDb) : ''
      }

      datesToPush.push(clonedDateObject)

      setTimeout(() => {
        console.log(clonedDatesToSubmit)
      }, 500)
    })
    setClonedDatesToSubmit(DatasetManager.mergeMultiple([clonedDatesToSubmit, datesToPush]))
    // Reset Multidate Picker
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
        onClose={() => {
          resetForm()
          onClose()
        }}
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
          {/* TITLE */}
          <div className="title-suggestion-wrapper">
            <InputWrapper
              refreshKey={suggestionRefreshKey}
              inputClasses="event-title-input"
              inputType={'input'}
              labelText={'Title'}
              defaultValue={eventTitle}
              required={true}
              onChange={async (e) => {
                const inputValue = e.target.value
                if (inputValue.length > 1) {
                  const dbSuggestions = await SecurityManager.getInputSuggestions(currentUser)

                  if (Manager.isValid(dbSuggestions, true)) {
                    const matching = dbSuggestions.filter(
                      (x) =>
                        x.formName === 'calendar' &&
                        x.ownerPhone === currentUser.phone &&
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
              <InputWrapper labelText={'Date Range'} required={true} inputType={'date'}></InputWrapper>
              <MobileDateRangePicker
                className={'w-100'}
                onAccept={(dateArray) => {
                  if (Manager.isValid(dateArray, true)) {
                    setEventFromDate(moment(dateArray[0]).format('MM/DD/YYYY'))
                    setEventToDate(moment(dateArray[1]).format('MM/DD/YYYY'))
                  }
                }}
                slots={{ field: SingleInputDateRangeField }}
                name="allowedRange"
              />
            </>
          )}

          {/* EVENT WITH TIME */}
          {!isAllDay && (
            <div className={'flex gap event-times-wrapper'}>
              <div>
                <InputWrapper wrapperClasses="higher-label" labelText={'Start Time'} required={false} inputType={'date'}>
                  <MobileTimePicker
                    disablePast={true}
                    defaultValue={null}
                    minutesStep={5}
                    className={`${theme}`}
                    onAccept={(e) => setEventStartTime(e)}
                  />
                </InputWrapper>
              </div>
              <span>&nbsp;to&nbsp;</span>
              <div>
                <InputWrapper wrapperClasses="higher-label" labelText={'End Time'} required={false} inputType={'date'}>
                  <MobileTimePicker
                    disablePast={true}
                    defaultValue={null}
                    minutesStep={5}
                    className={`${theme} `}
                    onAccept={(e) => setEventEndTime(e)}
                  />
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

              {/* CLONE */}
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

              {/* CLONED */}
              {showCloneInput && (
                <div>
                  <InputWrapper wrapperClasses="cloned-date-wrapper" labelText={''} required={false} inputType={'date'}>
                    <MultiDatePicker
                      className={`${theme} multidate-picker`}
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

          <hr />

          {/* URL/WEBSITE */}
          <InputWrapper
            labelText={'Website'}
            required={false}
            inputType={'input'}
            inputValueType="url"
            onChange={(e) => setEventWebsite(e.target.value)}></InputWrapper>

          {/* LOCATION/ADDRESS */}
          <InputWrapper labelText={'Location'} required={false} inputType={'location'}>
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
          <InputWrapper labelText={'Notes'} required={false} inputType={'textarea'} onChange={(e) => setEventNotes(e.target.value)}></InputWrapper>
        </div>
      </BottomCard>
    </div>
  )
}