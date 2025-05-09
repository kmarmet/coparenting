// Path: src\components\forms\newCalendarEvent.jsx
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import InputWrapper from '/src/components/shared/inputWrapper'
import Modal from '/src/components/shared/modal'
import MyConfetti from '/src/components/shared/myConfetti.js'
import ShareWithCheckboxes from '/src/components/shared/shareWithCheckboxes'
import DatetimeFormats from '/src/constants/datetimeFormats'
import EventLengths from '/src/constants/eventLengths'
import AlertManager from '/src/managers/alertManager'
import DatasetManager from '/src/managers/datasetManager'
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
import {MobileDatePicker} from '@mui/x-date-pickers-pro'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import validator from 'validator'
import CreationForms from '../../constants/creationForms'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context'
import useCurrentUser from '../../hooks/useCurrentUser'
import CalendarManager from '../../managers/calendarManager'
import DomManager from '../../managers/domManager.coffee'
import LogManager from '../../managers/logManager'
import AddressInput from '../shared/addressInput'
import Label from '../shared/label'
import Spacer from '../shared/spacer.jsx'
import ToggleButton from '../shared/toggleButton'
import ViewSelector from '../shared/viewSelector'

export default function NewCalendarEvent() {
  // APP STATE
  const {state, setState} = useContext(globalState)
  const {theme, creationFormToShow, dateToEdit} = state

  // EVENT STATE
  const [eventLength, setEventLength] = useState(EventLengths.single)
  const [eventStartDate, setEventStartDate] = useState(moment(dateToEdit).format(DatetimeFormats.dateForDb))
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventWebsite, setEventWebsite] = useState('')
  const [eventNotes, setEventNotes] = useState('')

  const [recurringFrequency, setRecurringFrequency] = useState('')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [eventPhone, setEventPhone] = useState('')
  const [eventShareWith, setEventShareWith] = useState([])
  const [clonedDates, setClonedDates] = useState([])
  const [eventChildren, setEventChildren] = useState([])
  const [eventReminderTimes, setEventReminderTimes] = useState([])
  const [eventIsRecurring, setEventIsRecurring] = useState(false)
  const [eventIsDateRange, setEventIsDateRange] = useState(false)
  const [eventIsCloned, setEventIsCloned] = useState(false)
  const {currentUser} = useCurrentUser()

  // COMPONENT STATE
  const [showCloneInput, setShowCloneInput] = useState(false)
  const [showReminders, setShowReminders] = useState(false)
  const [includeChildren, setIncludeChildren] = useState(false)
  const [isVisitation, setIsVisitation] = useState(false)

  const ResetForm = async (showSuccessAlert = false) => {
    Manager.ResetForm('new-event-form')
    setEventLength(EventLengths.single)
    setEventStartDate('')
    setEventEndDate('')
    setEventLocation('')
    setEventName('')
    setEventWebsite('')
    setEventNotes('')
    setRecurringFrequency('')
    setEventStartTime('')
    setEventEndTime('')
    setEventShareWith([])
    setClonedDates([])
    setEventPhone('')
    setEventChildren([])
    setEventReminderTimes([])
    setEventIsDateRange(false)
    setEventIsRecurring(false)
    setShowCloneInput(false)
    setShowReminders(false)
    setIncludeChildren(false)
    setIsVisitation(false)
    setState({
      ...state,
      showBottomMenu: false,
      creationFormToShow: '',
      refreshKey: Manager.GetUid(),
      successAlertMessage: showSuccessAlert ? 'Event Created' : null,
    })
  }

  const Submit = async () => {
    try {
      //#region FILL NEW EVENT
      const newEvent = new CalendarEvent()
      newEvent.id = Manager.GetUid()

      // Required
      newEvent.title = StringManager.formatEventTitle(eventName)
      if (isVisitation) {
        newEvent.title = `${StringManager.formatEventTitle(eventName)} (Visitation)`
      }
      if (DomManager.isMobile()) {
        newEvent.startDate = moment(eventStartDate).format(DatetimeFormats.dateForDb)
      } else {
        newEvent.startDate = moment(eventEndDate).format(DatetimeFormats.dateForDb)
      }
      newEvent.endDate = moment(eventEndDate).format(DatetimeFormats.dateForDb)
      newEvent.startTime = moment(eventStartTime).format(DatetimeFormats.timeForDb)
      newEvent.endTime = moment(eventEndTime).format(DatetimeFormats.timeForDb)

      // Not Required
      newEvent.directionsLink = Manager.GetDirectionsLink(eventLocation)
      newEvent.location = eventLocation
      newEvent.children = eventChildren
      newEvent.ownerKey = currentUser?.key
      newEvent.createdBy = currentUser?.name
      newEvent.shareWith = DatasetManager.getUniqueArray(eventShareWith, true)
      newEvent.notes = eventNotes
      newEvent.phone = StringManager.FormatPhone(eventPhone)
      newEvent.websiteUrl = eventWebsite
      newEvent.reminderTimes = eventReminderTimes
      newEvent.repeatInterval = recurringFrequency
      newEvent.fromVisitationSchedule = isVisitation
      newEvent.isRecurring = eventIsRecurring
      newEvent.isCloned = Manager.IsValid(clonedDates)
      newEvent.isDateRange = eventIsDateRange
      //#endregion FILL NEW EVENT

      if (Manager.IsValid(newEvent)) {
        //#region VALIDATION
        if (Manager.IsValid(eventPhone, true)) {
          if (!validator.isMobilePhone(eventPhone)) {
            AlertManager.throwError('Phone number is not valid')
            return false
          }
        } else {
          newEvent.phone = eventPhone
        }

        const errorString = Manager.GetInvalidInputsErrorString([
          {name: 'Event Name', value: eventName},
          {name: 'Date', value: eventStartDate},
        ])

        if (Manager.IsValid(errorString)) {
          AlertManager.throwError(errorString)
          return false
        }

        if (showReminders && !Manager.IsValid(eventStartTime)) {
          AlertManager.throwError('Please select a start time when using reminders')
          return false
        }

        if (eventIsRecurring && !Manager.IsValid(recurringFrequency)) {
          AlertManager.throwError('If event is recurring, please select a frequency')
          return false
        }

        //#endregion VALIDATION

        MyConfetti.fire()
        setState({...state, creationFormToShow: ''})

        const cleanedObject = ObjectManager.cleanObject(newEvent, ModelNames.calendarEvent)

        //#region MULTIPLE DATES
        // Date Range
        if (eventIsDateRange) {
          const dates = CalendarManager.buildArrayOfEvents(
            currentUser,
            newEvent,
            'range',
            moment(eventStartDate).format(DatetimeFormats.dateForDb),
            moment(eventEndDate).format(DatetimeFormats.dateForDb)
          )
          await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
        }

        // Add cloned dates
        if (Manager.IsValid(clonedDates)) {
          const dates = CalendarManager.buildArrayOfEvents(
            currentUser,
            newEvent,
            'cloned',
            moment(clonedDates[0]).format(DatetimeFormats.dateForDb),
            moment(clonedDates[clonedDates.length - 1]).format(DatetimeFormats.dateForDb)
          )
          await CalendarManager.addMultipleCalEvents(currentUser, dates)
        }

        // Recurring
        if (eventIsRecurring) {
          const dates = CalendarManager.buildArrayOfEvents(
            currentUser,
            newEvent,
            'recurring',
            moment(eventStartDate).format(DatetimeFormats.dateForDb),
            moment(eventEndDate).format(DatetimeFormats.dateForDb)
          )
          await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
        }

        //#endregion MULTIPLE DATES

        //#region SINGLE DATE
        if (!eventIsRecurring && !eventIsDateRange && !eventIsCloned) {
          await CalendarManager.addCalendarEvent(currentUser, cleanedObject)

          // Send notification
          await NotificationManager.sendToShareWith(
            eventShareWith,
            currentUser,
            `New Event 📅`,
            `${eventName} on ${moment(eventStartDate).format(DatetimeFormats.readableMonthAndDay)}`,
            ActivityCategory.calendar
          )
        }
        //#endregion SINGLE DATE
        await ResetForm()
      }
    } catch (error) {
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
    }
  }

  const HandleChildSelection = (e) => {
    let childrenArr = []
    DomManager.HandleCheckboxSelection(
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

  const HandleShareWithSelection = (e) => {
    const shareWithNumbers = DomManager.HandleShareWithSelection(e, currentUser, eventShareWith)
    setEventShareWith(shareWithNumbers)
  }

  const HandleReminderSelection = (e) => {
    DomManager.HandleCheckboxSelection(
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

  const HandleRepeatingSelection = async (e) => {
    DomManager.HandleCheckboxSelection(
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
        setRecurringFrequency(selection)
        setShowCloneInput(false)
      },
      (e) => {
        if (recurringFrequency.toLowerCase() === e.toLowerCase()) {
          setRecurringFrequency(null)
          setShowCloneInput(true)
        }
      },
      false
    )
  }

  const AddDateInput = () => {
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
      const formattedDate = moment(e.target.value).format(DatetimeFormats.dateForDb)
      setClonedDates([...clonedDates, formattedDate])
    })
    wrapper.append(input)

    // Delete button
    removeInputButton.addEventListener('click', (e) => {
      const inputSibling = e.target.previousSibling
      const formattedDate = moment(inputSibling.value).format(DatetimeFormats.dateForDb)
      setClonedDates(clonedDates.filter((x) => x !== moment(formattedDate).format(DatetimeFormats.dateForDb)))
      inputSibling.remove()
      e.target.remove()
    })
    wrapper.append(removeInputButton)

    cloneDateWrapper.append(wrapper)
  }

  useEffect(() => {
    if (dateToEdit) {
      setEventStartDate(moment(dateToEdit).format(DatetimeFormats.dateForDb))
    }
  }, [dateToEdit])

  return (
    <>
      {/* FORM WRAPPER */}
      <Modal
        submitText={`Create Event`}
        className={`${theme} new-event-form new-calendar-event`}
        onClose={ResetForm}
        onSubmit={Submit}
        showCard={creationFormToShow === CreationForms.calendar}
        wrapperClass={`new-calendar-event`}
        contentClass={eventLength === EventLengths.single ? 'single-view' : 'multiple-view'}
        title={`Create New Event`}
        viewSelector={
          <ViewSelector
            defaultView={'Single Day'}
            labels={['Single Day', 'Multiple Days']}
            updateState={(labelText) => {
              if (Manager.Contains(labelText, 'Single')) {
                setEventLength(EventLengths.single)
              } else {
                setEventLength(EventLengths.multiple)
              }
            }}
          />
        }>
        <div id="calendar-event-form-container" className={`form ${theme}`}>
          <Spacer height={8} />
          {/* EVENT NAME */}
          <InputWrapper
            inputClasses="event-title-input"
            inputType={InputTypes.text}
            labelText={'Event Name'}
            defaultValue={eventName}
            required={true}
            isDebounced={false}
            inputValueType="input"
            inputValue={eventName}
            onChange={async (e) => {
              const inputValue = e.target.value
              setEventName(inputValue)
            }}
          />

          {/* START DATE */}
          {eventLength === EventLengths.single && (
            <InputWrapper
              defaultValue={dateToEdit}
              labelText={'Date'}
              uidClass="event-start-date"
              inputType={InputTypes.date}
              required={true}
              onDateOrTimeSelection={(e) => setEventStartDate(e)}
            />
          )}

          {/* DATE RANGE */}
          {eventLength === EventLengths.multiple && (
            <InputWrapper
              wrapperClasses="date-range-input"
              labelText={'Date Range'}
              required={true}
              inputType={InputTypes.dateRange}
              onDateOrTimeSelection={(dateArray) => {
                if (Manager.IsValid(dateArray)) {
                  setEventStartDate(moment(dateArray[0]).format(DatetimeFormats.dateForDb))
                  setEventEndDate(moment(dateArray[1]).format(DatetimeFormats.dateForDb))
                  setEventIsDateRange(true)
                }
              }}
            />
          )}

          {eventLength === EventLengths.single && (
            <>
              {/* EVENT WITH TIME */}
              <InputWrapper
                labelText={'Start Time'}
                uidClass="event-start-time time"
                inputType={InputTypes.time}
                onDateOrTimeSelection={(e) => setEventStartTime(e)}
              />
              <InputWrapper
                labelText={'End Time'}
                uidClass="event-end-time time"
                inputType={InputTypes.time}
                onDateOrTimeSelection={(e) => setEventEndTime(e)}
              />
            </>
          )}
          <Spacer height={5} />

          {/* Share with */}
          <ShareWithCheckboxes required={false} onCheck={HandleShareWithSelection} containerClass={`share-with`} />

          {eventLength === EventLengths.single && (
            <>
              {/* REMINDER */}
              <Accordion id={'checkboxes'} expanded={showReminders}>
                <AccordionSummary>
                  <div className="flex">
                    <p className="label">Remind Me</p>
                    <ToggleButton onCheck={() => setShowReminders(true)} onUncheck={() => setShowReminders(false)} />
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  <CheckboxGroup
                    elClass={`${theme} reminder-times`}
                    checkboxArray={DomManager.BuildCheckboxGroup({
                      currentUser,
                      labelType: 'reminder-times',
                    })}
                    containerClass={'reminder-times'}
                    skipNameFormatting={true}
                    onCheck={HandleReminderSelection}
                  />
                </AccordionDetails>
              </Accordion>
            </>
          )}

          <Spacer height={1} />

          {/* IS VISITATION? */}
          <div>
            <div className="flex">
              <Label text={'Visitation Event'} />
              <ToggleButton isDefaultChecked={false} onCheck={() => setIsVisitation(true)} onUncheck={() => setIsVisitation(false)} />
            </div>
          </div>

          <Spacer height={1} />

          {/* INCLUDING WHICH CHILDREN */}
          {Manager.IsValid(currentUser?.children) && (
            <Accordion id={'checkboxes'} expanded={includeChildren}>
              <AccordionSummary>
                <div className="flex">
                  <Label text={'Include Children'} />
                  <ToggleButton
                    isDefaultChecked={false}
                    onCheck={() => setIncludeChildren(!includeChildren)}
                    onUncheck={() => setIncludeChildren(!includeChildren)}
                  />
                </div>
              </AccordionSummary>
              <AccordionDetails>
                <CheckboxGroup
                  elClass={`${theme} children`}
                  skipNameFormatting={true}
                  checkboxArray={DomManager.BuildCheckboxGroup({
                    currentUser,
                    labelType: 'children',
                  })}
                  onCheck={HandleChildSelection}
                />
              </AccordionDetails>
            </Accordion>
          )}

          {/* RECURRING */}
          {eventLength === EventLengths.single && (
            <div id="repeating-container">
              <Accordion id={'checkboxes'} expanded={eventIsRecurring}>
                <AccordionSummary>
                  <div className="flex">
                    <p className="label">Recurring</p>
                    <ToggleButton onCheck={() => setEventIsRecurring(true)} onUncheck={() => setEventIsRecurring(false)} />
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  <CheckboxGroup
                    elClass={`${theme}`}
                    onCheck={HandleRepeatingSelection}
                    checkboxArray={DomManager.BuildCheckboxGroup({
                      currentUser,
                      labelType: 'recurring-intervals',
                    })}
                  />

                  {Manager.IsValid(recurringFrequency) && (
                    <InputWrapper inputType={'date'} labelText={'Date to End Recurring Events'} required={true}>
                      <MobileDatePicker className={`${theme}  w-100`} onChange={(e) => setEventEndDate(moment(e).format('MM-DD-yyyy'))} />
                    </InputWrapper>
                  )}
                </AccordionDetails>
              </Accordion>
            </div>
          )}

          {/* DUPLICATE */}
          {eventLength === EventLengths.single && (
            <>
              <div className="flex">
                <Label text={'Duplicate'} />
                <ToggleButton
                  isDefaultChecked={false}
                  onCheck={() => {
                    setShowCloneInput(true)
                    const dateWrapperElements = document.querySelectorAll('.cloned-date-wrapper input')
                    if (showCloneInput && dateWrapperElements.length === 0) {
                      AddDateInput()
                    }
                  }}
                  onUncheck={() => setShowCloneInput(false)}
                />
              </div>

              {/* CLONED INPUTS */}
              <div className={`cloned-date-wrapper form  ${showCloneInput === true ? 'active' : ''}`}></div>
              {showCloneInput && (
                <button className="default button" id="add-date-button" onClick={AddDateInput}>
                  Add Date
                </button>
              )}
            </>
          )}

          <Spacer height={5} />

          {/* URL/WEBSITE */}
          <InputWrapper labelText={'Website/Link'} required={false} inputType={InputTypes.url} onChange={(e) => setEventWebsite(e.target.value)} />

          {/* ADDRESS */}
          <AddressInput
            wrapperClasses={Manager.IsValid(eventLocation, true) ? 'show-label' : ''}
            labelText={'Location'}
            required={false}
            onChange={(address) => setEventLocation(address)}
          />

          {/* PHONE */}
          <InputWrapper inputType={InputTypes.phone} labelText={'Phone'} onChange={(e) => setEventPhone(e.target.value)} />

          {/* NOTES */}
          <InputWrapper
            labelText={'Notes'}
            required={false}
            inputType={InputTypes.textarea}
            onChange={(e) => setEventNotes(e.target.value)}></InputWrapper>
        </div>
      </Modal>
    </>
  )
}