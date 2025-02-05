import BottomCard from '/src/components/shared/bottomCard'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import DatetimePicker from '/src/components/shared/datetimePicker.jsx'
import InputWrapper from '/src/components/shared/inputWrapper'
import MyConfetti from '/src/components/shared/myConfetti.js'
import ShareWithCheckboxes from '/src/components/shared/shareWithCheckboxes'
import DateFormats from '/src/constants/dateFormats'
import DatetimePickerViews from '/src/constants/datetimePickerViews'
import EventLengths from '/src/constants/eventLengths'
import DB_UserScoped from '/src/database/db_userScoped'
import AlertManager from '/src/managers/alertManager'
import CalendarManager from '/src/managers/calendarManager.js'
import DatasetManager from '/src/managers/datasetManager'
import DateManager from '/src/managers/dateManager'
import Manager from '/src/managers/manager'
import NotificationManager from '/src/managers/notificationManager.js'
import ObjectManager from '/src/managers/objectManager'
import StringManager from '/src/managers/stringManager'
import CalendarMapper from '/src/mappers/calMapper'
import ActivityCategory from '/src/models/activityCategory'
import CalendarEvent from '/src/models/calendarEvent'
import ModelNames from '/src/models/modelNames'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import { MobileDatePicker, MobileDateRangePicker, MobileTimePicker, SingleInputDateRangeField } from '@mui/x-date-pickers-pro'
import _ from 'lodash'
import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import { FaClone, FaRegCalendarCheck } from 'react-icons/fa6'
import { MdEventRepeat, MdNotificationsActive, MdOutlineFaceUnlock } from 'react-icons/md'
import Toggle from 'react-toggle'
import validator from 'validator'
import globalState from '../../context'
import DomManager from '../../managers/domManager.coffee'
import Spacer from '../shared/spacer.jsx'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'

export default function NewCalendarEvent({ showCard, hideCard, selectedNewEventDay }) {
  // APP STATE
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, refreshKey } = state

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
  const [eventChildren, setEventChildren] = useState([])
  const [eventReminderTimes, setEventReminderTimes] = useState([])
  const [eventIsRepeating, setEventIsRepeating] = useState(false)
  const [eventIsDateRange, setEventIsDateRange] = useState(false)
  const [eventIsCloned, setEventIsCloned] = useState(false)

  // COMPONENT STATE
  const [isAllDay, setIsAllDay] = useState(false)
  const [showCloneInput, setShowCloneInput] = useState(false)
  const [showReminders, setShowReminders] = useState(false)
  const [includeChildren, setIncludeChildren] = useState(false)
  const [isVisitation, setIsVisitation] = useState(false)

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
    setEventChildren([])
    setEventReminderTimes([])
    setEventIsDateRange(false)
    setEventIsRepeating(false)
    setIsAllDay(false)
    setShowCloneInput(false)
    setShowReminders(false)
    setIncludeChildren(false)
    setIsVisitation(false)
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(currentUser.phone)
    setState({ ...state, currentUser: updatedCurrentUser, refreshKey: Manager.getUid() })
  }

  const submit = async () => {
    //#region FILL NEW EVENT
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
    newEvent.isCloned = Manager.isValid(clonedDates)
    newEvent.isDateRange = eventIsDateRange
    //#endregion FILL NEW EVENT

    console.log(newEvent)

    if (Manager.isValid(eventPhone, true)) {
      if (!validator.isMobilePhone(eventPhone)) {
        AlertManager.throwError('Phone number is not valid')
        return false
      }
    } else {
      newEvent.phone = eventPhone
    }

    if (Manager.isValid(newEvent)) {
      //#region VALIDATION
      if (Manager.isValid(repeatingEndDate) && !Manager.isValid(repeatInterval)) {
        AlertManager.throwError('If you have chosen to repeat this event, please select an end month')
        return false
      }

      if (!Manager.isValid(eventTitle, true)) {
        AlertManager.throwError('Please enter an event title')
        return false
      }

      if (!Manager.isValid(eventStartDate)) {
        AlertManager.throwError('Please select an event date')
        return false
      }

      //#endregion VALIDATION

      hideCard()
      MyConfetti.fire()

      const cleanedObject = ObjectManager.cleanObject(newEvent, ModelNames.calendarEvent)

      //#region MULTIPLE DATES
      // Date Range
      if (eventIsDateRange) {
        const dateObjects = createEventList()
        await CalendarManager.addMultipleCalEvents(currentUser, dateObjects)
      }

      // Add cloned dates
      if (Manager.isValid(clonedDates)) {
        const clonedDatesList = createEventList()
        await CalendarManager.addMultipleCalEvents(currentUser, clonedDatesList)
      }

      // Repeating
      if (eventIsRepeating) {
        const repeatingDates = createEventList('repeating')
        await CalendarManager.addMultipleCalEvents(currentUser, repeatingDates)
      }
      //#endregion MULTIPLE DATES

      //#region SINGLE DATE
      if (!eventIsRepeating && !eventIsDateRange && !eventIsCloned) {
        await CalendarManager.addCalendarEvent(currentUser, cleanedObject)

        // Send notification
        await NotificationManager.sendToShareWith(
          eventShareWith,
          currentUser,
          `New Calendar Event`,
          `${eventTitle} on ${moment(eventStartDate).format(DateFormats.readableMonthAndDay)}`,
          ActivityCategory.calendar
        )
      }
      //#endregion SINGLE DATE
      await resetForm()
    }
  }

  const handleChildSelection = (e) => {
    let childrenArr = []
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        childrenArr = [...eventChildren, e]
      },
      (e) => {
        childrenArr = childrenArr.filter((x) => x !== e)
      },
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
        const value = e.textContent
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
        if (e.toLowerCase()?.indexOf('week') > -1) {
          selection = 'weekly'
        }
        if (e.toLowerCase()?.indexOf('bi') > -1) {
          selection = 'biweekly'
        }
        if (e.toLowerCase()?.indexOf('daily') > -1) {
          selection = 'daily'
        }
        if (e.toLowerCase()?.indexOf('monthly') > -1) {
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
      let startDate = eventStartDate
      if (typeof startDate === 'object') {
        startDate = moment(eventStartDate).format(DateFormats.dateForDb)
      }
      datesToIterate = DatasetManager.getUniqueArray([...clonedDates, startDate], true)
      setEventIsCloned(true)
    }

    console.log(datesToIterate)
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
      dateObject.isCloned = Manager.isValid(clonedDates)

      // Times
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
    console.log(datesToPush)
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

  const addDateInput = () => {
    const input = document.createElement('input')
    const cloneDateWrapper = document.querySelector('.cloned-date-wrapper')
    const removeInputButton = document.createElement('button')
    const wrapper = document.createElement('div')
    wrapper.classList.add('input-wrapper', 'flex')

    input.type = 'date'
    input.classList.add('date-input')
    removeInputButton.innerText = 'REMOVE'
    removeInputButton.classList.add('remove-cloned-date-button')

    input.addEventListener('change', (e) => {
      const formattedDate = moment(e.target.value).format(DateFormats.dateForDb)
      setClonedDates([...clonedDates, formattedDate])
    })
    wrapper.append(input)

    // Delete button
    removeInputButton.addEventListener('click', (e) => {
      const inputSibling = e.target.previousSibling
      const formattedDate = moment(inputSibling.value).format(DateFormats.dateForDb)
      setClonedDates(clonedDates.filter((x) => x !== moment(formattedDate).format(DateFormats.dateForDb)))
      inputSibling.remove()
      e.target.remove()
    })
    wrapper.append(removeInputButton)

    cloneDateWrapper.append(wrapper)
  }

  useEffect(() => {
    if (selectedNewEventDay) {
      setEventStartDate(moment(selectedNewEventDay).format(DateFormats.dateForDb))
    }
  }, [selectedNewEventDay])

  useEffect(() => {
    if (selectedNewEventDay) {
      setEventStartDate(moment().format(DateFormats.dateForDb))
    }
  }, [])

  return (
    <>
      {/* FORM WRAPPER */}
      <BottomCard
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
          <Spacer height={5} />
          <div className="calendar views-wrapper">
            <p className={`view  ${eventLength === 'single' ? 'active' : ''}`} onClick={() => setEventLength(EventLengths.single)}>
              Single Day
            </p>
            <p className={`view  ${eventLength === 'multiple' ? 'active' : ''}`} onClick={() => setEventLength(EventLengths.multiple)}>
              Multiple Days
            </p>
          </div>

          {/* EVENT NAME */}
          <InputWrapper
            inputClasses="event-title-input"
            inputType={'input'}
            labelText={'Event Name'}
            defaultValue={eventTitle}
            placeholder="Event Name"
            required={true}
            isDebounced={false}
            inputValue={eventTitle}
            onChange={async (e) => {
              const inputValue = e.target.value
              setEventTitle(inputValue)
            }}
          />

          {/* FROM DATE */}
          <div className="flex gap">
            {eventLength === EventLengths.single && !DomManager.isMobile() && (
              <InputWrapper labelText={'Date'} inputType={'date'} required={true}>
                <MobileDatePicker
                  onOpen={addThemeToDatePickers}
                  value={moment(selectedNewEventDay)}
                  className={`${theme} m-0  event-from-date mui-input`}
                  onAccept={(e) => {
                    setEventStartDate(e)
                  }}
                />
              </InputWrapper>
            )}
            {eventLength === EventLengths.single && DomManager.isMobile() && (
              <InputWrapper
                defaultValue={moment(selectedNewEventDay)}
                onChange={(e) => setEventStartDate(moment(e.target.value).format(DateFormats.dateForDb))}
                useNativeDate={true}
                labelText={'Date'}
                inputType={'date'}
                required={true}
              />
            )}
          </div>

          {/* DATE RANGE */}
          {eventLength === EventLengths.multiple && (
            <InputWrapper wrapperClasses="date-range-input" labelText={'Date Range'} required={true} inputType={'date'}>
              <MobileDateRangePicker
                className={''}
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
            <div className={'flex event-times-wrapper'}>
              <InputWrapper labelText={'Start Time'} wrapperClasses="start-time" inputType="date">
                <MobileTimePicker onOpen={addThemeToDatePickers} minutesStep={5} key={refreshKey} onAccept={(e) => setEventStartTime(e)} />
              </InputWrapper>
              <InputWrapper labelText={'End Time'} wrapperClasses="end-time" inputType="date">
                <MobileTimePicker key={refreshKey} onOpen={addThemeToDatePickers} minutesStep={5} onAccept={(e) => setEventEndTime(e)} />
              </InputWrapper>
            </div>
          )}

          {/* Share with */}
          {Manager.isValid(currentUser?.coparents) && (
            <ShareWithCheckboxes required={false} onCheck={handleShareWithSelection} containerClass={'share-with-coparents'} />
          )}
          {Manager.isValid(currentUser?.parents) && (
            <ShareWithCheckboxes required={false} onCheck={handleShareWithSelection} containerClass={'share-with-coparents'} />
          )}

          <Spacer height={5} />

          {/* REMINDER */}
          {!isAllDay && (
            <>
              <div>
                <Accordion id={'checkboxes'} expanded={showReminders}>
                  <AccordionSummary>
                    <div className="flex">
                      <p>Remind Me</p>
                      <Toggle
                        icons={{
                          checked: <MdNotificationsActive />,
                          unchecked: null,
                        }}
                        className={'ml-auto reminder-toggle'}
                        onChange={(e) => setShowReminders(!showReminders)}
                      />
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    <CheckboxGroup
                      elClass={`${theme} reminder-times`}
                      skipNameFormatting={true}
                      defaultLabels={[]}
                      checkboxLabels={['At time of event', '5 minutes before', '30 minutes before', '1 hour before']}
                      onCheck={handleReminderSelection}
                    />
                  </AccordionDetails>
                </Accordion>
              </div>
            </>
          )}

          <Spacer height={3} />
          {/* IS VISITATION? */}
          <div>
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
            <div>
              <Accordion id={'checkboxes'} expanded={includeChildren}>
                <AccordionSummary>
                  <div className="flex">
                    <p>Include Children</p>
                    <Toggle
                      icons={{
                        checked: <MdOutlineFaceUnlock />,
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
              <div id="repeating-container">
                <Accordion id={'checkboxes'} expanded={eventIsRepeating}>
                  <AccordionSummary>
                    <div className="flex">
                      <p>Recurring</p>
                      <Toggle
                        icons={{
                          checked: <MdEventRepeat />,
                          unchecked: null,
                        }}
                        className={'ml-auto reminder-toggle'}
                        onChange={(e) => setEventIsRepeating(!eventIsRepeating)}
                      />
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    <CheckboxGroup
                      elClass={`${theme}`}
                      onCheck={handleRepeatingSelection}
                      defaultLabels={[]}
                      checkboxLabels={['Daily', 'Weekly', 'Biweekly', 'Monthly']}
                    />
                    <Spacer height={5} />
                    {Manager.isValid(repeatInterval) && (
                      <InputWrapper inputType={'date'} labelText={'Month to End Repeating Events'} required={true}>
                        {!DomManager.isMobile() && (
                          <DatetimePicker
                            format={DateFormats.readableMonth}
                            views={DatetimePickerViews.monthAndYear}
                            hasAmPm={false}
                            onAccept={(e) => setRepeatingEndDate(moment(e).format('MM-DD-yyyy'))}
                          />
                        )}
                        {DomManager.isMobile() && (
                          <input
                            type="date"
                            onChange={(e) => {
                              setRepeatingEndDate(moment(e.target.value).format('MM-DD-yyyy'))
                            }}
                          />
                        )}
                      </InputWrapper>
                    )}
                  </AccordionDetails>
                </Accordion>
              </div>

              <Spacer height={2} />

              {/* CLONE */}
              <div>
                <div className="flex">
                  <p>Copy Event to other Dates</p>
                  <Toggle
                    icons={{
                      checked: <FaClone />,
                      unchecked: null,
                    }}
                    className={'ml-auto clone-toggle clone'}
                    onChange={(e) => {
                      setShowCloneInput(e.target.checked)
                      const dateWrapperElements = document.querySelectorAll('.cloned-date-wrapper input')
                      if (e.target.checked && dateWrapperElements.length === 0) {
                        addDateInput()
                      }
                    }}
                  />
                </div>
              </div>

              {/* CLONED */}
              <div className={`cloned-date-wrapper form ${showCloneInput ? 'active' : ''}`}></div>
              {Manager.isValid(clonedDates) && (
                <button className="default button" onClick={addDateInput}>
                  Add Another Date
                </button>
              )}
            </>
          )}
          <Spacer height={2} />

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
              apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
              options={{
                types: ['geocode', 'establishment'],
                componentRestrictions: { country: 'usa' },
              }}
              onPlaceSelected={(place) => {
                setEventLocation(place.formatted_address)
              }}
              placeholder={'Address'}
            />
          </InputWrapper>

          {/* PHONE */}
          <InputWrapper inputValueType="tel" labelText={'Phone'} onChange={(e) => setEventPhone(e.target.value)} />

          {/* NOTES */}
          <InputWrapper labelText={'Notes'} required={false} inputType={'textarea'} onChange={(e) => setEventNotes(e.target.value)}></InputWrapper>
        </div>
      </BottomCard>
    </>
  )
}