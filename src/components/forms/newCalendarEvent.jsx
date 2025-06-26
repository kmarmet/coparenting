// Path: src\components\forms\newCalendarEvent.jsx
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import {MobileDatePicker} from '@mui/x-date-pickers-pro'
import moment from 'moment'
import React, {useContext, useEffect, useRef, useState} from 'react'
import {BsCalendarCheck} from 'react-icons/bs'
import validator from 'validator'
import ActivityCategory from '../../constants/activityCategory'
import ButtonThemes from '../../constants/buttonThemes'
import CreationForms from '../../constants/creationForms'
import DatetimeFormats from '../../constants/datetimeFormats'
import EventLengths from '../../constants/eventLengths'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context'
import useChildren from '../../hooks/useChildren'
import useCoParents from '../../hooks/useCoParents'
import useCurrentUser from '../../hooks/useCurrentUser'
import useUsers from '../../hooks/useUsers'
import AlertManager from '../../managers/alertManager'
import CalendarManager from '../../managers/calendarManager'
import DatasetManager from '../../managers/datasetManager'
import DomManager from '../../managers/domManager'
import DropdownManager from '../../managers/dropdownManager'
import LogManager from '../../managers/logManager'
import Manager from '../../managers/manager'
import ObjectManager from '../../managers/objectManager'
import StringManager from '../../managers/stringManager'
import UpdateManager from '../../managers/updateManager'
import CalendarEvent from '../../models/new/calendarEvent'
import AddressInput from '../shared/addressInput'
import Button from '../shared/button'
import CheckboxGroup from '../shared/checkboxGroup'
import Form from '../shared/form'
import InputField from '../shared/inputField'
import Label from '../shared/label'
import MyConfetti from '../shared/myConfetti.js'
import SelectDropdown from '../shared/selectDropdown'
import Spacer from '../shared/spacer.jsx'
import ToggleButton from '../shared/toggleButton'
import ViewDropdown from '../shared/viewDropdown'

export default function NewCalendarEvent() {
  // APP STATE
  const {state, setState} = useContext(globalState)
  const {theme, creationFormToShow, dateToEdit} = state

  // EVENT STATE
  const [eventLength, setEventLength] = useState(EventLengths.single)
  const [recurringFrequency, setRecurringFrequency] = useState('')
  const [clonedDates, setClonedDates] = useState([])
  const [eventIsRecurring, setEventIsRecurring] = useState(false)
  const [eventIsDateRange, setEventIsDateRange] = useState(false)
  const [eventIsCloned, setEventIsCloned] = useState(false)
  const {currentUser} = useCurrentUser()
  const {users} = useUsers()
  const {coParents} = useCoParents()
  const {children, childrenDropdownOptions} = useChildren()

  // COMPONENT STATE
  const [refresh, setRefresh] = useState('aeryhg')
  const [showCloneInput, setShowCloneInput] = useState(false)
  const [isVisitation, setIsVisitation] = useState(false)
  const [dynamicInputs, setDynamicInputs] = useState([])
  const [view, setView] = useState({label: 'Single Day', value: 'Single Day'})

  // DROPDOWN STATE
  const [selectedReminderOptions, setSelectedReminderOptions] = useState([])
  const [selectedChildrenOptions, setSelectedChildrenOptions] = useState([])
  const [selectedShareWithOptions, setSelectedShareWithOptions] = useState([])
  const [defaultShareWithOptions, setDefaultShareWithOptions] = useState([])
  // REF
  const formRef = useRef({...new CalendarEvent({startDate: moment(dateToEdit).format(DatetimeFormats.dateForDb)})})

  const ResetForm = async (showSuccessAlert = false) => {
    setEventLength(EventLengths.single)
    setEventIsDateRange(false)
    setEventIsRecurring(false)
    setShowCloneInput(false)
    setIsVisitation(false)
    setDynamicInputs([])
    setClonedDates([])
    setSelectedReminderOptions([])
    setSelectedChildrenOptions([])
    setSelectedShareWithOptions([])
    setDefaultShareWithOptions([])
    setTimeout(() => {
      setRefresh(Manager.GetUid())
    }, 500)
    setState({
      ...state,
      creationFormToShow: '',
      successAlertMessage: showSuccessAlert ? 'Event Created' : null,
    })
  }

  const Submit = async () => {
    try {
      //#region FILL NEW EVENT
      if (isVisitation) {
        formRef.current.title = `${StringManager.FormatEventTitle(formRef.current.title)} (Visitation)`
      }
      formRef.current.owner = {
        key: currentUser?.key,
        name: currentUser?.name,
      }
      formRef.current.directionsLink = Manager.GetDirectionsLink(formRef.current.address)
      formRef.current.recurringInterval = recurringFrequency
      formRef.current.fromVisitationSchedule = isVisitation
      formRef.current.isRecurring = eventIsRecurring
      formRef.current.isCloned = Manager.IsValid(clonedDates)
      formRef.current.isDateRange = eventIsDateRange

      // Map dropdown selections to database
      formRef.current.children = DropdownManager.MappedForDatabase.ChildrenFromArray(selectedChildrenOptions)
      formRef.current.reminderTimes = DropdownManager.MappedForDatabase.RemindersFromArray(selectedReminderOptions)
      formRef.current.shareWith = DropdownManager.MappedForDatabase.ShareWithFromArray(selectedShareWithOptions)
      // return false

      //#endregion FILL NEW EVENT
      const cleaned = ObjectManager.CleanObject(formRef.current)

      if (Manager.IsValid(formRef.current)) {
        //#region VALIDATION
        if (Manager.IsValid(formRef.current.phone, true)) {
          if (!validator.isMobilePhone(formRef.current.phone)) {
            AlertManager.throwError('Phone number is not valid')
            return false
          }
        }

        const errorString = Manager.GetInvalidInputsErrorString([
          {name: 'Event Name', value: formRef.current.title},
          {name: 'Date', value: formRef.current.startDate},
        ])

        if (Manager.IsValid(errorString)) {
          AlertManager.throwError(errorString)
          return false
        }

        if (Manager.IsValid(formRef.current.reminderTimes) && !Manager.IsValid(formRef.current.startTime)) {
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
          const dates = CalendarManager.BuildArrayOfEvents(currentUser, cleaned, 'range', cleaned.startDate, cleaned.endDate)
          await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
        }

        // Add cloned dates
        if (Manager.IsValid(clonedDates)) {
          const dates = CalendarManager.BuildArrayOfEvents(
            currentUser,
            cleaned,
            'cloned',
            moment(clonedDates[0]).format(DatetimeFormats.dateForDb),
            moment(clonedDates[clonedDates.length - 1]).format(DatetimeFormats.dateForDb)
          )
          await CalendarManager.addMultipleCalEvents(currentUser, dates)
        }

        // Recurring
        if (eventIsRecurring) {
          const dates = CalendarManager.BuildArrayOfEvents(currentUser, cleaned, 'recurring', cleaned.startDate, cleaned.endDate)
          await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
        }

        //#endregion MULTIPLE DATES

        //#region SINGLE DATE
        if (!eventIsRecurring && !eventIsDateRange && !eventIsCloned) {
          await CalendarManager.addCalendarEvent(currentUser, cleaned)

          // Send notification
          await UpdateManager.SendToShareWith(
            cleaned.shareWith,
            currentUser,
            `New Event 📅`,
            `${cleaned.title} on ${moment(cleaned.startDate).format(DatetimeFormats.readableMonthAndDay)}`,
            ActivityCategory.calendar
          )
        }
        //#endregion SINGLE DATE
        await ResetForm(true)
      }
    } catch (error) {
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
    }
  }

  const AppendDynamicInput = () => {
    setDynamicInputs([
      ...dynamicInputs,
      <InputField
        key={Date.now()}
        inputType={InputTypes.date}
        labelText="Date"
        onDateOrTimeSelection={(e) => {
          const formattedDate = moment(e).format(DatetimeFormats.dateForDb)
          setClonedDates(DatasetManager.AddToArray(clonedDates, formattedDate))
        }}
      />,
    ])
  }

  const SetDefaultDropdownOptions = async () => {
    setSelectedChildrenOptions(DropdownManager.GetSelected.Children([], children))
    setSelectedReminderOptions(DropdownManager.GetSelected.Reminders([]))
    setSelectedShareWithOptions(DropdownManager.GetSelected.ShareWithFromKeys([], users))
    setDefaultShareWithOptions(DropdownManager.GetDefault.ShareWith(children, coParents))
    setView({label: 'Single Day', value: 'Single Day'})
  }

  useEffect(() => {
    if (Manager.IsValid(children) && Manager.IsValid(users)) {
      SetDefaultDropdownOptions().then((r) => r)
    }
  }, [children, users])

  useEffect(() => {
    if (dateToEdit) {
      formRef.current.startDate = moment(dateToEdit).format(DatetimeFormats.dateForDb)
    }
  }, [dateToEdit])

  useEffect(() => {
    if (!eventIsCloned) {
      setShowCloneInput(false)
      const allDynamicInputs = document.querySelectorAll('.cloned-date-wrapper')
      if (Manager.IsValid(allDynamicInputs)) {
        // allDynamicInputs.forEach((x) => x.remove())
      }
    }
  }, [eventIsCloned])

  return (
    <>
      {/* FORM WRAPPER */}
      <Form
        key={refresh}
        submitText={`Create`}
        className={`${theme} new-event-form new-calendar-event`}
        onClose={() => ResetForm()}
        onSubmit={Submit}
        showCard={creationFormToShow === CreationForms.calendar}
        wrapperClass={`new-calendar-event at-top`}
        contentClass={eventLength === EventLengths.single ? 'single-view' : 'multiple-view'}
        title={`Create Event`}
        submitIcon={<BsCalendarCheck />}
        viewDropdown={
          <ViewDropdown
            show={true}
            views={[
              {label: 'Single Day', value: EventLengths.single},
              {label: 'Multiple Days', value: EventLengths.multiple},
            ]}
            selectedView={view}
            dropdownPlaceholder={'Single Day'}
            onSelect={(view) => {
              setView(view)
            }}
          />
        }>
        <div id="calendar-event-form-container" className={`${theme}`}>
          {/* EVENT NAME */}
          <InputField
            inputClasses="event-title-input"
            inputType={InputTypes.text}
            placeholder="Event Name"
            required={true}
            onChange={async (e) => {
              const inputValue = e.target.value
              formRef.current.title = StringManager.FormatEventTitle(inputValue)
            }}
          />

          {/* START DATE */}
          {view?.label === 'Single Day' && (
            <InputField
              defaultValue={dateToEdit}
              placeholder="Date"
              uidClass="event-start-date"
              inputType={InputTypes.date}
              required={true}
              onDateOrTimeSelection={(e) => {
                formRef.current.startDate = moment(e).format(DatetimeFormats.dateForDb)
              }}
            />
          )}

          {/* DATE RANGE */}
          {view?.label === 'Multiple Days' && (
            <InputField
              wrapperClasses="date-range-input"
              placeholder={'Date Range'}
              required={true}
              inputType={InputTypes.dateRange}
              onDateOrTimeSelection={(dateArray) => {
                if (Manager.IsValid(dateArray)) {
                  formRef.current.startDate = moment(dateArray[0]).format(DatetimeFormats.dateForDb)
                  formRef.current.endDate = moment(dateArray[dateArray.length - 1]).format(DatetimeFormats.dateForDb)
                  setEventIsDateRange(true)
                }
              }}
            />
          )}
          {view?.label === 'Single Day' && (
            <>
              {/* EVENT WITH TIME */}
              <InputField
                labelText={'Start Time'}
                uidClass="event-start-time time"
                inputType={InputTypes.time}
                onDateOrTimeSelection={(e) => (formRef.current.startTime = moment(e).format(DatetimeFormats.timeForDb))}
              />
              <InputField
                labelText={'End Time'}
                uidClass="event-end-time time"
                inputType={InputTypes.time}
                onDateOrTimeSelection={(e) => (formRef.current.endTime = moment(e).format(DatetimeFormats.timeForDb))}
              />
            </>
          )}

          <hr />

          {/* SHARE WITH */}
          <SelectDropdown
            options={defaultShareWithOptions}
            selectMultiple={true}
            placeholder={'Select Contacts to Share With'}
            onSelect={setSelectedShareWithOptions}
          />

          <Spacer height={2} />

          {/* REMINDER */}
          {view?.label === 'Single Day' && (
            <SelectDropdown
              selectMultiple={true}
              placeholder={'Select Reminders'}
              options={DropdownManager.GetDefault.Reminders}
              onSelect={(e) => {
                setSelectedReminderOptions(e)
              }}
            />
          )}

          <Spacer height={2} />

          {/* INCLUDING WHICH CHILDREN */}
          {Manager.IsValid(children) && (
            <SelectDropdown
              options={childrenDropdownOptions}
              placeholder={'Select Children to Include'}
              onSelect={setSelectedChildrenOptions}
              selectMultiple={true}
            />
          )}

          <Spacer height={8} />

          {/* IS VISITATION? */}
          <div>
            <div className="flex">
              <Label text={'Visitation Event'} classes="toggle lowercase always-show" />
              <ToggleButton isDefaultChecked={false} onCheck={() => setIsVisitation(true)} onUncheck={() => setIsVisitation(false)} />
            </div>
          </div>

          {/* RECURRING */}
          {view?.label === 'Single Day' && (
            <div id="repeating-container">
              <Accordion id={'checkboxes'} expanded={eventIsRecurring}>
                <AccordionSummary>
                  <div className="flex">
                    <Label text={'Recurring'} classes="toggle lowercase white" />
                    <ToggleButton onCheck={() => setEventIsRecurring(true)} onUncheck={() => setEventIsRecurring(false)} />
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  <Spacer height={2} />
                  <CheckboxGroup
                    elClass={`${theme}`}
                    // onCheck={HandleRepeatingSelection}
                    checkboxArray={DomManager.BuildCheckboxGroup({
                      currentUser,
                      labelType: 'recurring-intervals',
                    })}
                  />

                  {Manager.IsValid(recurringFrequency) && (
                    <InputField inputType={'date'} placeholder={'Date to End Recurring Events'} required={true}>
                      <MobileDatePicker
                        className={`${theme}`}
                        onChange={(e) => (formRef.current.endDate = moment(e).format(DatetimeFormats.dateForDb))}
                      />
                    </InputField>
                  )}
                </AccordionDetails>
              </Accordion>
            </div>
          )}

          {/* DUPLICATE */}
          {view?.label === 'Single Day' && (
            <>
              <div className="flex">
                <Label text={'Duplicate'} classes="toggle lowercase" />
                <ToggleButton
                  isDefaultChecked={false}
                  onCheck={() => {
                    setShowCloneInput(true)
                    const dateWrapperElements = document.querySelectorAll('.cloned-date-wrapper input')
                    if (showCloneInput && dateWrapperElements.length === 0) {
                      AppendDynamicInput()
                    }
                  }}
                  onUncheck={() => setShowCloneInput(false)}
                />
              </div>

              {/* CLONED INPUTS */}
              {showCloneInput && (
                <>
                  {Manager.IsValid(dynamicInputs) &&
                    dynamicInputs.map((input, index) => {
                      return <div key={index}>{input}</div>
                    })}
                  <Button text="Add Date" theme={ButtonThemes.grey} classes="add-date-button center block" onClick={AppendDynamicInput} />
                </>
              )}
            </>
          )}

          <Spacer height={10} />

          {/* URL/WEBSITE */}
          <InputField
            placeholder={'Website/Link'}
            required={false}
            inputType={InputTypes.url}
            onChange={(e) => (formRef.current.websiteUrl = e.target.value)}
          />
          {/* ADDRESS */}
          <AddressInput
            wrapperClasses={Manager.IsValid(formRef.current.address, true) ? 'show-label' : ''}
            placeholder={'Location'}
            required={false}
            onChange={(address) => (formRef.current.address = address)}
          />
          {/* PHONE */}
          <InputField
            inputType={InputTypes.phone}
            placeholder="Phone"
            onChange={(e) => (formRef.current.phone = StringManager.FormatPhone(e.target.value))}
          />
          {/* NOTES */}
          <InputField
            placeholder={'Notes'}
            required={false}
            inputType={InputTypes.textarea}
            onChange={(e) => (formRef.current.notes = e.target.value)}
          />
        </div>
      </Form>
    </>
  )
}