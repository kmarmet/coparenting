// Path: src\components\forms\newCalendarEvent.jsx
import CheckboxGroup from '../shared/checkboxGroup'
import Form from '../shared/form'
import InputWrapper from '../shared/inputWrapper'
import MyConfetti from '../shared/myConfetti.js'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import ActivityCategory from '../../constants/activityCategory'
import DatetimeFormats from '../../constants/datetimeFormats'
import EventLengths from '../../constants/eventLengths'
import ModelNames from '../../constants/modelNames'
import AlertManager from '../../managers/alertManager'
import Manager from '../../managers/manager'
import ObjectManager from '../../managers/objectManager'
import StringManager from '../../managers/stringManager'
import CalendarEvent from '../../models/new/calendarEvent'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import {MobileDatePicker} from '@mui/x-date-pickers-pro'
import moment from 'moment'
import React, {useContext, useEffect, useRef, useState} from 'react'
import {BsCalendarCheck} from 'react-icons/bs'
import validator from 'validator'
import CreationForms from '../../constants/creationForms'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context'
import useCurrentUser from '../../hooks/useCurrentUser'
import CalendarManager from '../../managers/calendarManager'
import DomManager from '../../managers/domManager'
import LogManager from '../../managers/logManager'
import UpdateManager from '../../managers/updateManager'
import AddressInput from '../shared/addressInput'
import Label from '../shared/label'
import Spacer from '../shared/spacer.jsx'
import ToggleButton from '../shared/toggleButton'
import ViewSelector from '../shared/viewSelector'
import useChildren from '../../hooks/useChildren'
import SelectDropdown from '../shared/selectDropdown'
import CalMapper from '../../mappers/calMapper'

export default function NewCalendarEvent() {
  // APP STATE
  const {state, setState} = useContext(globalState)
  const {theme, creationFormToShow, dateToEdit} = state

  // EVENT STATE
  const [eventLength, setEventLength] = useState(EventLengths.single)
  const [recurringFrequency, setRecurringFrequency] = useState('')
  const [clonedDates, setClonedDates] = useState([])
  const [eventChildren, setEventChildren] = useState([])
  const [eventReminderTimes, setEventReminderTimes] = useState([])
  const [eventIsRecurring, setEventIsRecurring] = useState(false)
  const [eventIsDateRange, setEventIsDateRange] = useState(false)
  const [eventIsCloned, setEventIsCloned] = useState(false)
  const {currentUser} = useCurrentUser()
  const {children, childrenDropdownOptions} = useChildren()

  // COMPONENT STATE
  const [showCloneInput, setShowCloneInput] = useState(false)
  const [showReminders, setShowReminders] = useState(false)
  const [includeChildren, setIncludeChildren] = useState(false)
  const [isVisitation, setIsVisitation] = useState(false)

  // REF
  const newEvent = useRef(new CalendarEvent({startDate: moment(dateToEdit).format(DatetimeFormats.dateForDb)}))

  const ResetForm = async (showSuccessAlert = false) => {
    setEventLength(EventLengths.single)
    setClonedDates([])
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

      if (isVisitation) {
        newEvent.current.title = `${StringManager.formatEventTitle(newEvent.current.title)} (Visitation)`
      }
      newEvent.current.directionsLink = Manager.GetDirectionsLink(newEvent.current.address)
      newEvent.current.children = eventChildren
      newEvent.current.ownerKey = currentUser?.key
      newEvent.current.createdBy = StringManager.GetFirstNameOnly(currentUser?.name)
      newEvent.current.reminderTimes = eventReminderTimes
      newEvent.current.recurringInterval = recurringFrequency
      newEvent.current.fromVisitationSchedule = isVisitation
      newEvent.current.isRecurring = eventIsRecurring
      newEvent.current.isCloned = Manager.IsValid(clonedDates)
      newEvent.current.isDateRange = eventIsDateRange

      console.log(newEvent.current)
      // return false

      const cleaned = ObjectManager.GetModelValidatedObject(newEvent.current, ModelNames.calendarEvent)

      //#endregion FILL NEW EVENT

      if (Manager.IsValid(newEvent.current)) {
        //#region VALIDATION
        if (Manager.IsValid(newEvent.current.phone, true)) {
          if (!validator.isMobilePhone(newEvent.current.phone)) {
            AlertManager.throwError('Phone number is not valid')
            return false
          }
        }

        const errorString = Manager.GetInvalidInputsErrorString([
          {name: 'Event Name', value: newEvent.current.title},
          {name: 'Date', value: newEvent.current.startDate},
        ])

        if (Manager.IsValid(errorString)) {
          AlertManager.throwError(errorString)
          return false
        }

        if (showReminders && !Manager.IsValid(newEvent.current.startTime)) {
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

        //#region MULTIPLE DATES
        // Date Range
        if (eventIsDateRange) {
          const dates = CalendarManager.buildArrayOfEvents(
            currentUser,
            newEvent.current,
            'range',
            newEvent.current.startDate,
            newEvent.current.endDate
          )
          await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
        }

        // Add cloned dates
        if (Manager.IsValid(clonedDates)) {
          const dates = CalendarManager.buildArrayOfEvents(
            currentUser,
            newEvent.current,
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
            newEvent.current,
            'recurring',
            newEvent.current.startDate,
            newEvent.current.endDate
          )
          await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
        }

        //#endregion MULTIPLE DATES

        //#region SINGLE DATE
        if (!eventIsRecurring && !eventIsDateRange && !eventIsCloned) {
          await CalendarManager.addCalendarEvent(currentUser, cleaned)

          // Send notification
          await UpdateManager.SendToShareWith(
            newEvent.current.shareWith,
            currentUser,
            `New Event 📅`,
            `${newEvent.current.title} on ${moment(newEvent.current.startDate).format(DatetimeFormats.readableMonthAndDay)}`,
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

  const HandleChildSelection = (e) => setEventChildren(e?.map((x) => x?.label?.trim()))

  const HandleShareWithSelection = (e) => (newEvent.current.shareWith = e.map((x) => x.value))

  const HandleReminderSelection = (e) => setEventReminderTimes(e?.map((x) => x?.value?.trim()))

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

  const GetReminderOptions = () => {
    const unformatted = CalMapper.allUnformattedTimes()
    let options = []
    if (Manager.IsValid(unformatted)) {
      for (let reminder of unformatted) {
        if (Manager.IsValid(reminder)) {
          options.push({
            label: CalMapper.readableReminderBeforeTimeframes(reminder),
            value: reminder,
          })
        }
      }
    }
    return options
  }

  useEffect(() => {
    if (dateToEdit) {
      newEvent.current.startDate = moment(dateToEdit).format(DatetimeFormats.dateForDb)
    }
  }, [dateToEdit])

  return (
    <>
      {/* FORM WRAPPER */}
      <Form
        submitText={`Done`}
        className={`${theme} new-event-form new-calendar-event`}
        onClose={ResetForm}
        onSubmit={Submit}
        showCard={creationFormToShow === CreationForms.calendar}
        wrapperClass={`new-calendar-event at-top`}
        contentClass={eventLength === EventLengths.single ? 'single-view' : 'multiple-view'}
        title={`Create Event`}
        submitIcon={<BsCalendarCheck />}
        viewSelector={
          <ViewSelector
            show={true}
            labels={['Single Day', 'Multiple Days']}
            dropdownPlaceholder={'View'}
            updateState={(labelText) => {
              console.log(labelText)
              if (Manager.Contains(labelText.toLowerCase(), 'single')) {
                setEventLength(EventLengths.single)
              } else {
                setEventLength(EventLengths.multiple)
              }
            }}
          />
        }>
        <div id="calendar-event-form-container" className={`${theme}`}>
          {/* EVENT NAME */}
          <InputWrapper
            inputClasses="event-title-input"
            inputType={InputTypes.text}
            placeholder="Event Name"
            required={true}
            inputValueType="input"
            inputValue={newEvent.current.title}
            onChange={async (e) => {
              const inputValue = e.target.value
              newEvent.current.title = StringManager.formatEventTitle(inputValue)
            }}
          />

          {/* START DATE */}
          {eventLength === EventLengths.single && (
            <InputWrapper
              defaultValue={dateToEdit}
              placeholder="Date"
              uidClass="event-start-date"
              inputType={InputTypes.date}
              required={true}
              onDateOrTimeSelection={(e) => {
                newEvent.current.startDate = moment(e).format(DatetimeFormats.dateForDb)
              }}
            />
          )}

          {/* DATE RANGE */}
          {eventLength === EventLengths.multiple && (
            <InputWrapper
              wrapperClasses="date-range-input"
              placeholder={'Date Range'}
              required={true}
              inputType={InputTypes.dateRange}
              onDateOrTimeSelection={(dateArray) => {
                if (Manager.IsValid(dateArray)) {
                  newEvent.current.startDate = moment(dateArray[0]).format(DatetimeFormats.dateForDb)
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
                onDateOrTimeSelection={(e) => (newEvent.current.startTime = moment(e).format(DatetimeFormats.timeForDb))}
              />
              <InputWrapper
                labelText={'End Time'}
                uidClass="event-end-time time"
                inputType={InputTypes.time}
                onDateOrTimeSelection={(e) => (newEvent.current.endTime = moment(e).format(DatetimeFormats.timeForDb))}
              />
            </>
          )}

          {/* Share with */}
          <ShareWithCheckboxes required={false} onCheck={HandleShareWithSelection} containerClass={`share-with`} />
          <Spacer height={3} />

          {/* INCLUDING WHICH CHILDREN */}
          {Manager.IsValid(children) && (
            <SelectDropdown
              options={childrenDropdownOptions}
              labelText={'Select Children to Include'}
              onChange={HandleChildSelection}
              isMultiple={true}
            />
          )}
          <Spacer height={3} />

          {/* REMINDER */}
          {eventLength === EventLengths.single && (
            <SelectDropdown isMultiple={true} labelText={'Select Reminders'} options={GetReminderOptions()} onChange={HandleReminderSelection} />
          )}
          <Spacer height={8} />

          {eventLength === EventLengths.single && (
            <>
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

          {/* IS VISITATION? */}
          <div>
            <div className="flex">
              <Label text={'Visitation Event'} classes="toggle" />
              <ToggleButton isDefaultChecked={false} onCheck={() => setIsVisitation(true)} onUncheck={() => setIsVisitation(false)} />
            </div>
          </div>

          {/* RECURRING */}
          {eventLength === EventLengths.single && (
            <div id="repeating-container">
              <Accordion id={'checkboxes'} expanded={eventIsRecurring}>
                <AccordionSummary>
                  <div className="flex">
                    <Label text={'Recurring'} classes="toggle" />
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
                    <InputWrapper inputType={'date'} placeholder={'Date to End Recurring Events'} required={true}>
                      <MobileDatePicker
                        className={`${theme}  w-100`}
                        onChange={(e) => (newEvent.current.endDate = moment(e).format(DatetimeFormats.dateForDb))}
                      />
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
                <Label text={'Duplicate'} classes="toggle" />
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
              <div className={`cloned-date-wrapper ${showCloneInput === true ? 'active' : ''}`}></div>
              {showCloneInput && (
                <button className="default button" id="add-date-button" onClick={AddDateInput}>
                  Add Date
                </button>
              )}
            </>
          )}

          <Spacer height={10} />

          {/* URL/WEBSITE */}
          <InputWrapper
            placeholder={'Website/Link'}
            required={false}
            inputType={InputTypes.url}
            onChange={(e) => (newEvent.current.websiteUrl = e.target.value)}
          />
          {/* ADDRESS */}
          <AddressInput
            wrapperClasses={Manager.IsValid(newEvent.current.address, true) ? 'show-label' : ''}
            placeholder={'Location'}
            required={false}
            onChange={(address) => (newEvent.current.address = address)}
          />
          {/* PHONE */}
          <InputWrapper
            inputType={InputTypes.phone}
            placeholder="Phone"
            onChange={(e) => (newEvent.current.phone = StringManager.FormatPhone(e.target.value))}
          />
          {/* NOTES */}
          <InputWrapper
            placeholder={'Notes'}
            required={false}
            inputType={InputTypes.textarea}
            onChange={(e) => (newEvent.current.notes = e.target.value)}></InputWrapper>
        </div>
      </Form>
    </>
  )
}