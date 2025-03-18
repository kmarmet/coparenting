// Path: src\components\forms\newCalendarEvent.jsx
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import { MobileDatePicker, MobileDateRangePicker, MobileTimePicker, SingleInputDateRangeField } from '@mui/x-date-pickers-pro'
import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import { FaClone } from 'react-icons/fa6'
import { MdEventRepeat, MdNotificationsActive, MdOutlineFaceUnlock } from 'react-icons/md'
import Toggle from 'react-toggle'
import { Fade } from 'react-awesome-reveal'
import { BsCalendar2CheckFill } from 'react-icons/bs'

import validator from 'validator'
import globalState from '../../context'
import DomManager from '../../managers/domManager.coffee'
import AddressInput from '../shared/addressInput'
import Spacer from '../shared/spacer.jsx'
import ViewSelector from '../shared/viewSelector'
import BottomCard from '/src/components/shared/bottomCard'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import InputWrapper from '/src/components/shared/inputWrapper'
import MyConfetti from '/src/components/shared/myConfetti.js'
import ShareWithCheckboxes from '/src/components/shared/shareWithCheckboxes'
import DateFormats from '/src/constants/dateFormats'
import EventLengths from '/src/constants/eventLengths'
import AlertManager from '/src/managers/alertManager'
import DatasetManager from '/src/managers/datasetManager'
import CalendarManager from '../../managers/calendarManager'
import Manager from '/src/managers/manager'
import NotificationManager from '/src/managers/notificationManager.js'
import ObjectManager from '/src/managers/objectManager'
import StringManager from '/src/managers/stringManager'
import CalendarMapper from '/src/mappers/calMapper'
import ActivityCategory from '/src/models/activityCategory'
import CalendarEvent from '/src/models/calendarEvent'
import ModelNames from '/src/models/modelNames'

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
    setShowCloneInput(false)
    setShowReminders(false)
    setIncludeChildren(false)
    setIsVisitation(false)
    // const updatedCurrentUser = await DB_UserScoped.getCurrentUser(authUser?.email)
    // setState({ ...state, currentUser: updatedCurrentUser, refreshKey: Manager.getUid() })
  }

  const submit = async () => {
    //#region FILL NEW EVENT
    const newEvent = new CalendarEvent()

    // Required
    newEvent.title = eventTitle.trim()
    if (Manager.contains(eventTitle, 'birthday')) {
      newEvent.title += ' 🎂'
    }
    if (isVisitation) {
      newEvent.title = `${StringManager.getFirstNameOnly(currentUser?.name)}'s Visitation`
    }
    newEvent.startDate = moment(eventStartDate).format(DateFormats.dateForDb)

    newEvent.endDate = moment(eventEndDate).format(DateFormats.dateForDb)
    newEvent.startTime = moment(eventStartTime).format(DateFormats.timeForDb)
    newEvent.endTime = moment(eventEndTime).format(DateFormats.timeForDb)

    // Not Required
    newEvent.directionsLink = Manager.getDirectionsLink(eventLocation)
    newEvent.location = eventLocation
    newEvent.children = eventChildren
    newEvent.ownerKey = currentUser?.key
    newEvent.createdBy = currentUser?.name
    newEvent.shareWith = DatasetManager.getUniqueArray(eventShareWith, true)
    newEvent.notes = eventNotes
    newEvent.phone = eventPhone
    newEvent.websiteUrl = eventWebsite
    newEvent.reminderTimes = eventReminderTimes
    newEvent.repeatInterval = repeatInterval
    newEvent.fromVisitationSchedule = isVisitation
    newEvent.isRepeating = eventIsRepeating
    newEvent.isCloned = Manager.isValid(clonedDates)
    newEvent.isDateRange = eventIsDateRange
    //#endregion FILL NEW EVENT

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
        const dates = CalendarManager.buildArrayOfEvents(currentUser, newEvent, 'range', eventStartDate, eventEndDate)
        await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
      }

      // Add cloned dates
      if (Manager.isValid(clonedDates)) {
        const dates = CalendarManager.buildArrayOfEvents(currentUser, newEvent, 'cloned', clonedDates[0], clonedDates[clonedDates.length - 1])
        await CalendarManager.addMultipleCalEvents(currentUser, dates)
      }

      // Repeating
      if (eventIsRepeating) {
        const dates = CalendarManager.buildArrayOfEvents(currentUser, newEvent, 'recurring', eventStartDate, eventEndDate)
        await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
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
        submitIcon={<BsCalendar2CheckFill />}
        showCard={showCard}
        wrapperClass="new-calendar-event"
        title={'Create New Event'}>
        <div id="calendar-event-form-container" className={`form ${theme}`}>
          <Fade direction={'up'} duration={600} delay={200} triggerOnce={true}>
            {/* Event Length */}
            <ViewSelector
              defaultView={'Single Day'}
              labels={['Single Day', 'Multiple Days']}
              updateState={(labelText) => {
                if (Manager.contains(labelText, 'Single')) {
                  setEventLength(EventLengths.single)
                } else {
                  setEventLength(EventLengths.multiple)
                }
              }}
            />

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
            <div className={'flex event-times-wrapper'}>
              <InputWrapper
                labelText={'Start Time'}
                wrapperClasses={`${Manager.isValid(eventStartTime) ? 'has-value' : ''} start-time`}
                inputType="date">
                <MobileTimePicker
                  slotProps={{
                    actionBar: {
                      actions: ['clear', 'accept'],
                    },
                  }}
                  onOpen={addThemeToDatePickers}
                  minutesStep={5}
                  key={refreshKey}
                  onAccept={(e) => setEventStartTime(e)}
                />
              </InputWrapper>
              <InputWrapper labelText={'End Time'} wrapperClasses={`${Manager.isValid(eventEndTime) ? 'has-value' : ''} end-time`} inputType="date">
                <MobileTimePicker
                  slotProps={{
                    actionBar: {
                      actions: ['clear', 'accept'],
                    },
                  }}
                  key={refreshKey}
                  onOpen={addThemeToDatePickers}
                  minutesStep={5}
                  onAccept={(e) => setEventEndTime(e)}
                />
              </InputWrapper>
            </div>
            <Spacer height={5} />

            {/* Share with */}
            <ShareWithCheckboxes required={false} onCheck={handleShareWithSelection} containerClass={`share-with`} />

            {/* REMINDER */}
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
                    onChange={() => setShowReminders(!showReminders)}
                  />
                </div>
              </AccordionSummary>
              <AccordionDetails>
                <CheckboxGroup
                  elClass={`${theme} reminder-times`}
                  checkboxArray={Manager.buildCheckboxGroup({
                    currentUser,
                    labelType: 'reminder-times',
                  })}
                  containerClass={'reminder-times'}
                  skipNameFormatting={true}
                  onCheck={handleReminderSelection}
                />
              </AccordionDetails>
            </Accordion>

            <Spacer height={1} />

            {/* IS VISITATION? */}
            <div>
              <div className="flex">
                <p>Visitation Event</p>
                <Toggle
                  icons={{
                    unchecked: null,
                  }}
                  className={'ml-auto visitation-toggle'}
                  onChange={() => setIsVisitation(!isVisitation)}
                />
              </div>
            </div>

            <Spacer height={1} />

            {/* INCLUDING WHICH CHILDREN */}
            {Manager.isValid(currentUser?.children) && (
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
                      onChange={() => setIncludeChildren(!includeChildren)}
                    />
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  <CheckboxGroup
                    elClass={`${theme} children`}
                    skipNameFormatting={true}
                    checkboxArray={Manager.buildCheckboxGroup({
                      currentUser,
                      labelType: 'children',
                    })}
                    onCheck={handleChildSelection}
                  />
                </AccordionDetails>
              </Accordion>
            )}

            {/* RECURRING/CLONED */}
            {(!currentUser?.accountType || currentUser?.accountType === 'parent') && eventLength === 'single' && (
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
                        onChange={() => setEventIsRepeating(!eventIsRepeating)}
                      />
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    <CheckboxGroup
                      elClass={`${theme}`}
                      onCheck={handleRepeatingSelection}
                      checkboxArray={Manager.buildCheckboxGroup({
                        currentUser,
                        labelType: 'recurring-intervals',
                      })}
                    />

                    <Spacer height={5} />
                    {Manager.isValid(repeatInterval) && (
                      <InputWrapper inputType={'date'} labelText={'Date to End Recurring Events'} required={true}>
                        {!DomManager.isMobile() && (
                          <MobileDatePicker
                            onOpen={addThemeToDatePickers}
                            className={`${theme}  w-100`}
                            onChange={(e) => setEventEndDate(moment(e).format('MM-DD-yyyy'))}
                          />
                        )}
                        {DomManager.isMobile() && (
                          <input
                            type="date"
                            onChange={(e) => {
                              setEventEndDate(moment(e.target.value).format('MM-DD-yyyy'))
                            }}
                          />
                        )}
                      </InputWrapper>
                    )}
                  </AccordionDetails>
                </Accordion>
              </div>
            )}

            {/* CLONE */}
            {(!currentUser?.accountType || currentUser?.accountType === 'parent') && eventLength === 'single' && (
              <>
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

                {/* CLONED INPUTS */}
                <div className={`cloned-date-wrapper form ${showCloneInput ? 'active' : ''}`}></div>
                {Manager.isValid(clonedDates) && (
                  <button className="default button" onClick={addDateInput}>
                    Add Another Date
                  </button>
                )}
              </>
            )}

            <Spacer height={5} />
            {/* URL/WEBSITE */}
            <InputWrapper
              labelText={'Website'}
              required={false}
              inputType={'input'}
              inputValueType="url"
              onChange={(e) => setEventWebsite(e.target.value)}></InputWrapper>

            {/* ADDRESS */}
            <InputWrapper labelText={'Location'} required={false} inputType={'location'}>
              <AddressInput onSelection={(address) => setEventLocation(address)} />
            </InputWrapper>

            {/* PHONE */}
            <InputWrapper inputValueType="tel" labelText={'Phone'} onChange={(e) => setEventPhone(e.target.value)} />

            {/* NOTES */}
            <InputWrapper
              wrapperClasses="textarea"
              labelText={'Notes'}
              required={false}
              inputType={'textarea'}
              onChange={(e) => setEventNotes(e.target.value)}></InputWrapper>
          </Fade>
        </div>
      </BottomCard>
    </>
  )
}