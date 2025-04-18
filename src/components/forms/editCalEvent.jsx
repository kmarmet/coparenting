// Path: src\components\forms\editCalEvent.jsx
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import moment from 'moment'
import {BsCalendar2CheckFill} from 'react-icons/bs'
import {MdEventRepeat} from 'react-icons/md'
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context'
import Spacer from '../shared/spacer.jsx'
import {Fade} from 'react-awesome-reveal'
import ViewSelector from '../shared/viewSelector'
import Modal from '/src/components/shared/modal'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import InputWrapper from '/src/components/shared/inputWrapper'
import ShareWithCheckboxes from '/src/components/shared/shareWithCheckboxes'
import DatetimeFormats from '/src/constants/datetimeFormats'
import DB from '/src/database/DB'
import DB_UserScoped from '/src/database/db_userScoped'
import AlertManager from '/src/managers/alertManager'
import CalendarManager from '/src/managers/calendarManager.js'
import Manager from '/src/managers/manager'
import NotificationManager from '/src/managers/notificationManager'
import ObjectManager from '/src/managers/objectManager'
import SecurityManager from '/src/managers/securityManager'
import StringManager from '/src/managers/stringManager'
import {default as CalendarMapper, default as CalMapper} from '/src/mappers/calMapper'
import ActivityCategory from '/src/models/activityCategory'
import ModelNames from '/src/models/modelNames'
import ToggleButton from '../shared/toggleButton'
import InputTypes from '../../constants/inputTypes'
import DetailBlock from '../shared/detailBlock'
import Map from '../shared/map'

export default function EditCalEvent({event, showCard, hideCard}) {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, refreshKey, dateToEdit} = state

  // Event Details
  const [eventStartDate, setEventStartDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventWebsiteUrl, setEventWebsiteUrl] = useState('')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventNotes, setEventNotes] = useState('')
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [eventPhone, setEventPhone] = useState('')
  const [eventChildren, setEventChildren] = useState(event?.chatMessages || [])
  const [eventReminderTimes, setEventReminderTimes] = useState([])
  const [eventShareWith, setEventShareWith] = useState(event?.shareWith || [])
  const [eventIsDateRange, setEventIsDateRange] = useState(false)
  const [eventIsRecurring, setEventIsRecurring] = useState(false)
  const [eventIsCloned, setEventIsCloned] = useState(false)
  const [recurInterval, setRecurInterval] = useState('')

  // State
  const [clonedDates, setClonedDates] = useState([])
  const [repeatingDatesToSubmit, setRepeatingDatesToSubmit] = useState([])
  const [includeChildren, setIncludeChildren] = useState(false)
  const [showReminders, setShowReminders] = useState(false)
  const [isVisitation, setIsVisitation] = useState(false)
  const [view, setView] = useState('Details')
  const [shareWithNames, setShareWithNames] = useState([])
  const [dataIsLoading, setDataIsLoading] = useState(true)

  const ResetForm = async (alertMessage = '') => {
    Manager.ResetForm('edit-event-form')
    setEventStartDate('')
    setEventLocation('')
    setEventName('')
    setEventWebsiteUrl('')
    setEventStartTime('')
    setEventNotes('')
    setEventEndDate('')
    setEventEndTime('')
    setEventChildren(event?.chatMessages || [])
    setEventReminderTimes([])
    setEventShareWith(event?.shareWith || [])
    setEventIsDateRange(false)
    setClonedDates([])
    setRepeatingDatesToSubmit([])
    setIncludeChildren(false)
    setShowReminders(false)
    setIsVisitation(false)
    setEventIsRecurring(false)
    setEventIsCloned(false)
    const updatedUser = await DB_UserScoped.getCurrentUser(currentUser?.email)

    setState({
      ...state,
      currentUser: updatedUser,
      successAlertMessage: alertMessage,
      dateToEdit: moment().format(DatetimeFormats.dateForDb),
      refreshKey: Manager.getUid(),
    })
    hideCard()
  }

  const nonOwnerSubmit = async () => {
    // Fill/overwrite
    // Required
    const updatedEvent = {...event}

    updatedEvent.title = eventName.trim()
    updatedEvent.reminderTimes = eventReminderTimes
    updatedEvent.shareWith = eventShareWith
    updatedEvent.startDate = moment(eventStartDate).format(DatetimeFormats.dateForDb)
    updatedEvent.endDate = moment(eventEndDate).format(DatetimeFormats.dateForDb)

    if (Manager.isValid(eventStartTime) && Manager.isValid(eventEndTime)) {
      updatedEvent.startTime = moment(eventStartTime, DatetimeFormats.timeForDb).format(DatetimeFormats.timeForDb)
      updatedEvent.endTime = moment(eventEndTime, DatetimeFormats.timeForDb).format(DatetimeFormats.timeForDb)
    }

    // Not Required
    updatedEvent.ownerKey = currentUser?.key
    updatedEvent.createdBy = currentUser?.name
    updatedEvent.notes = eventNotes
    updatedEvent.reminderTimes = eventReminderTimes || []
    updatedEvent.chatMessages = eventChildren
    updatedEvent.directionsLink = Manager.getDirectionsLink(eventLocation)
    updatedEvent.location = eventLocation
    updatedEvent.phone = StringManager.formatPhone(eventPhone)
    updatedEvent.isDateRange = eventIsDateRange
    updatedEvent.isCloned = eventIsCloned
    updatedEvent.repeatInterval = recurInterval
    updatedEvent.isRecurring = eventIsRecurring

    // Add birthday cake
    if (Manager.contains(eventName, 'birthday')) {
      updatedEvent.title += ' 🎂'
    }
    updatedEvent.websiteUrl = eventWebsiteUrl
    updatedEvent.fromVisitationSchedule = isVisitation
    updatedEvent.sentReminders = []

    if (Manager.isValid(updatedEvent)) {
      if (!Manager.isValid(eventName)) {
        AlertManager.throwError('Event name is required')
        return false
      }

      if (!Manager.isValid(eventStartDate)) {
        AlertManager.throwError('Please select a date for this event')
        return false
      }

      const dbPath = `${DB.tables.calendarEvents}/${currentUser?.key}`
      const eventKey = await DB.getSnapshotKey(`${DB.tables.users}/${event?.ownerKey}`, event, 'id')
      const shareWithWithoutCurrentUser = event.shareWith.filter((x) => x !== currentUser?.key)
      await DB_UserScoped.updateByPath(`${DB.tables.users}/${event?.ownerKey}/${eventKey}/shareWith`, shareWithWithoutCurrentUser)

      // Update dates with multiple dates
      if (event?.isRecurring || event?.isDateRange || event?.isCloned) {
        const allEvents = await DB.getTable(`${DB.tables.calendarEvents}/${currentUser?.key}`)
        const existing = allEvents.filter((x) => x.multipleDatesId === event?.multipleDatesId)

        if (!Manager.isValid(existing)) {
          return false
        }

        hideCard()

        // Add cloned dates
        if (Manager.isValid(clonedDates)) {
          const dates = await CalendarManager.buildArrayOfEvents(
            currentUser,
            updatedEvent,
            'cloned',
            clonedDates[0],
            clonedDates[clonedDates.length - 1]
          )
          await CalendarManager.addMultipleCalEvents(currentUser, dates)
        }

        // Date range
        if (eventIsDateRange) {
          const dates = await CalendarManager.buildArrayOfEvents(currentUser, updatedEvent, 'range', existing[0].startDate, eventEndDate)
          await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
        }

        // Add repeating dates
        if (Manager.isValid(repeatingDatesToSubmit)) {
          const dates = await CalendarManager.buildArrayOfEvents(currentUser, updatedEvent, 'recurring', existing[0]?.startDate, eventEndDate)
          await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
        }

        // Delete all before updated
        await DB.deleteMultipleRows(`${DB.tables.calendarEvents}/${currentUser?.key}`, existing, currentUser)
      }

      // Update Single Event
      else {
        // If event is shared with you AND you are not the owner of the event
        const cleanedEvent = ObjectManager.cleanObject(updatedEvent, ModelNames.calendarEvent)
        await editNonOwnerEvent(dbPath, cleanedEvent)
        if (Manager.isValid(eventShareWith)) {
          NotificationManager.sendToShareWith(
            eventShareWith,
            currentUser,
            'Event Updated',
            `${eventName} has been updated`,
            ActivityCategory.calendar
          )
        }
      }
      if (Manager.isValid(eventShareWith)) {
        NotificationManager.sendToShareWith(eventShareWith, currentUser, 'Event Updated', `${eventName} has been updated`, ActivityCategory.calendar)
      }
    }

    await ResetForm('Event Updated')
  }

  const editNonOwnerEvent = async (dbPath, newEvent) => {
    if (Manager.isValid(event?.shareWith)) {
      // Add cloned event for currentUser
      await CalendarManager.addCalendarEvent(currentUser, newEvent)
      const filteredShareWith = event?.shareWith.filter((x) => x !== currentUser?.key)
      await CalendarManager.updateEvent(event?.ownerKey, 'shareWith', filteredShareWith, event?.id)
    }
  }

  // SUBMIT
  const submit = async () => {
    // Set new event values
    const updatedEvent = {...event}

    // Required
    updatedEvent.title = eventName
    updatedEvent.reminderTimes = eventReminderTimes
    updatedEvent.shareWith = eventShareWith
    updatedEvent.startDate = moment(eventStartDate).format(DatetimeFormats.dateForDb)
    updatedEvent.endDate = moment(eventEndDate).format(DatetimeFormats.dateForDb)
    updatedEvent.phone = StringManager.formatPhone(eventPhone)
    updatedEvent.repeatInterval = recurInterval
    updatedEvent.isDateRange = eventIsDateRange
    updatedEvent.isCloned = eventIsCloned
    updatedEvent.isRecurring = eventIsRecurring

    if (Manager.isValid(eventStartTime) || Manager.isValid(eventEndTime)) {
      updatedEvent.startTime = moment(eventStartTime, DatetimeFormats.timeForDb).format(DatetimeFormats.timeForDb)
      updatedEvent.endTime = moment(eventEndTime, DatetimeFormats.timeForDb).format(DatetimeFormats.timeForDb)
    }

    // Not Required
    updatedEvent.ownerKey = event.ownerKey === currentUser?.key ? currentUser?.key : event.ownerKey
    updatedEvent.createdBy = currentUser?.name
    updatedEvent.notes = eventNotes
    updatedEvent.reminderTimes = eventReminderTimes || []
    updatedEvent.chatMessages = eventChildren
    updatedEvent.directionsLink = Manager.getDirectionsLink(eventLocation)
    updatedEvent.location = eventLocation

    // Add birthday cake
    if (Manager.contains(eventName, 'birthday')) {
      updatedEvent.title += ' 🎂'
    }
    updatedEvent.websiteUrl = eventWebsiteUrl
    updatedEvent.fromVisitationSchedule = isVisitation
    updatedEvent.morningSummaryReminderSent = false
    updatedEvent.eveningSummaryReminderSent = false
    updatedEvent.sentReminders = []

    if (Manager.isValid(updatedEvent)) {
      if (!Manager.isValid(eventName)) {
        AlertManager.throwError('Event name is required')
        return false
      }

      if (!Manager.isValid(eventStartDate)) {
        AlertManager.throwError('Please select a date for this event')
        return false
      }

      const cleanedEvent = ObjectManager.cleanObject(updatedEvent, ModelNames.calendarEvent)
      const dbPath = `${DB.tables.calendarEvents}/${currentUser?.key}`

      // Events with multiple days
      if (event?.isRecurring || event?.isDateRange || event?.isCloned) {
        const allEvents = await DB.getTable(`${DB.tables.calendarEvents}/${currentUser?.key}`)
        const existing = allEvents.filter((x) => x.multipleDatesId === event?.multipleDatesId)

        if (!Manager.isValid(existing)) {
          return false
        }

        // Add cloned dates
        if (Manager.isValid(clonedDates)) {
          // await CalendarManager.addMultipleCalEvents(currentUser, clonedDatesToSubmit)
        }

        if (eventIsDateRange) {
          const dates = await CalendarManager.buildArrayOfEvents(currentUser, updatedEvent, 'range', existing[0].startDate, eventEndDate)
          await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
        }

        // Add repeating dates
        if (eventIsRecurring) {
          const dates = await CalendarManager.buildArrayOfEvents(currentUser, updatedEvent, 'recurring', existing[0]?.startDate, eventEndDate)
          await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
        }

        // Delete all before updated
        await DB.deleteMultipleRows(`${DB.tables.calendarEvents}/${currentUser?.key}`, existing, currentUser)
      }

      // Update Single Event
      else {
        await DB.updateEntireRecord(`${dbPath}`, cleanedEvent, updatedEvent.id)
      }
    }

    await ResetForm('Event Updated')
  }

  // CHECKBOX HANDLERS
  const handleChildSelection = (e) => {
    let childrenArr = []
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        childrenArr = [...eventChildren, e]
        setEventChildren(childrenArr)
      },
      (e) => {
        let filtered = eventChildren.filter((x) => x !== e)
        setEventChildren(filtered)
      },
      true
    )
  }

  const handleShareWithSelection = async (e) => {
    const shareWithNumbers = Manager.handleShareWithSelection(e, currentUser, eventShareWith)
    setEventShareWith(shareWithNumbers)
  }

  const handleReminderSelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        let timeframe = CalendarMapper.reminderTimes(e)
        if (eventReminderTimes?.length === 0) {
          setEventReminderTimes([timeframe])
        } else {
          if (!eventReminderTimes?.includes(timeframe)) {
            setEventReminderTimes([...eventReminderTimes, timeframe])
          }
        }
      },
      (e) => {
        let mapped = CalendarMapper.reminderTimes(e)
        let filtered = eventReminderTimes?.filter((x) => x !== mapped)
        setEventReminderTimes(filtered)
      },
      true
    )
  }

  const setDefaultValues = async () => {
    setView('Details')
    setEventName(event?.title)
    setEventStartDate(event?.startDate)
    setEventEndDate(event?.endDate)
    setEventLocation(event?.location)
    setEventReminderTimes(event?.reminderTimes || [])
    setEventStartTime(event?.startTime)
    setEventEndTime(event?.endTime)
    setEventNotes(event?.notes)
    setEventShareWith(event?.shareWith ?? [])
    setEventIsRecurring(event?.isRecurring)
    setEventPhone(event?.phone)
    setRecurInterval(event?.repeatInterval)
    setEventIsDateRange(event?.isDateRange)
    setEventWebsiteUrl(event?.websiteUrl)
    setIncludeChildren(Manager.isValid(event?.chatMessages))
    setShowReminders(Manager.isValid(event?.reminderTimes))

    if (Manager.isValid(event?.shareWith)) {
      let names = []
      for (let key of event.shareWith) {
        let user = await DB_UserScoped.getCoparentByKey(key, currentUser)
        if (Manager.isValid(user)) {
          if (user.key === currentUser?.key) {
            names.push('Me')
          } else {
            names.push(StringManager.getFirstNameOnly(user.name))
          }
        }
      }
      setShareWithNames(names)
    }

    // Repeating
    if (Manager.isValid(event?.repeatInterval)) {
      Manager.setDefaultCheckboxes('repeating', event, 'repeatInterval', false).then((r) => r)
    }
  }

  const deleteEvent = async () => {
    const dbPath = `${DB.tables.calendarEvents}/${currentUser?.key}`

    const allEvents = await SecurityManager.getCalendarEvents(currentUser).then((r) => r)
    const eventCount = allEvents.filter((x) => x.title === eventName).length

    if (eventCount === 1) {
      await CalendarManager.deleteEvent(currentUser, event.id)
      await ResetForm('Event Deleted')
    } else {
      let clonedEvents = await DB.getTable(`${dbPath}`)
      if (Manager.isValid(clonedEvents)) {
        clonedEvents = clonedEvents.filter((x) => x.title === event?.title)
        await CalendarManager.deleteMultipleEvents(clonedEvents, currentUser)
        await ResetForm('Event Deleted')
      }
    }
  }

  const setLocalConfirmMessage = () => {
    let message = 'Are you sure you want to delete this event?'

    if (event?.isRecurring || event?.isCloned || event?.isDateRange) {
      message = 'Are you sure you would like to delete ALL events with these details?'
    }

    return message
  }

  const getCreatedBy = () => {
    if (Manager.isValid(event?.createdBy)) {
      if (event?.ownerKey === currentUser?.key) {
        return 'Me'
      } else {
        return currentUser?.coparents.find((x) => x.key === event?.ownerKey)?.name
      }
    }
  }

  // Loading until date/name are loaded
  useEffect(() => {
    if (Manager.isValid(eventName) && Manager.isValid(eventStartDate)) {
      setDataIsLoading(false)
    }
  }, [eventName, eventStartDate])

  useEffect(() => {
    if (Manager.isValid(event)) {
      setDefaultValues().then((r) => r)
    }
  }, [event])

  return (
    <Modal
      onDelete={() => {
        AlertManager.confirmAlert(setLocalConfirmMessage(), "I'm Sure", true, async () => {
          await deleteEvent()
        })
      }}
      hasDelete={currentUser?.key === event?.ownerKey}
      onSubmit={currentUser?.key === event?.ownerKey ? submit : nonOwnerSubmit}
      submitText={'Update Event'}
      submitIcon={<BsCalendar2CheckFill className={'edit-calendar-icon'} />}
      hasSubmitButton={view === 'Edit'}
      onClose={async () => {
        await ResetForm()
      }}
      title={StringManager.formatEventTitle(StringManager.uppercaseFirstLetterOfAllWords(event?.title))}
      showCard={showCard}
      deleteButtonText="Delete Event"
      className="edit-calendar-event"
      viewSelector={
        <>
          {currentUser?.accountType !== 'child' && (
            <ViewSelector
              key={refreshKey}
              labels={['Details', 'Edit']}
              updateState={(labelText) => {
                setView(labelText)
              }}
            />
          )}
        </>
      }
      wrapperClass={`edit-calendar-event`}>
      <div id="edit-cal-event-container" className={`${theme} form edit-event-form'`}>
        {!dataIsLoading && (
          <>
            {/* DETAILS */}
            <div id="details" className={view === 'Details' ? 'view-wrapper details active' : 'view-wrapper'}>
              <hr className="top" />
              <Fade direction={'up'} duration={800} triggerOnce={true}>
                <div className="blocks">
                  {/*  Date */}
                  <DetailBlock
                    valueToValidate={event?.startDate}
                    text={moment(event?.startDate).format(DatetimeFormats.readableMonthAndDayWithDayDigitOnly)}
                    title={event?.isDateRange ? 'Start Date' : 'Date'}
                  />

                  {/*  End Date */}
                  <DetailBlock
                    valueToValidate={event?.endDate}
                    text={moment(event?.endDate).format(DatetimeFormats.readableMonthAndDayWithDayDigitOnly)}
                    title={'End Date'}
                  />

                  {/*  Start Time */}
                  <DetailBlock
                    valueToValidate={event?.startTime}
                    text={moment(event?.startTime, DatetimeFormats.timeForDb).format('h:mma')}
                    title={'Start Time'}
                  />

                  {/*  End Time */}
                  <DetailBlock
                    valueToValidate={event?.endTime}
                    text={moment(event?.endTime, DatetimeFormats.timeForDb).format('h:mma')}
                    title={'End time'}
                  />

                  {/*  Created By */}
                  <DetailBlock valueToValidate={event?.createdBy} text={getCreatedBy()} title={'Created By'} />

                  {/*  Shared With */}
                  <DetailBlock valueToValidate={event?.shareWith} text={shareWithNames?.join(', ')} title={'Shared With'} />

                  {/* Reminders */}
                  {Manager.isValid(event?.reminderTimes) && (
                    <div className="block">
                      {Manager.isValid(event?.reminderTimes) &&
                        event?.reminderTimes.map((time, index) => {
                          time = CalMapper.readableReminderBeforeTimeframes(time).replace('before', '')
                          time = time.replace('At', '')
                          time = StringManager.uppercaseFirstLetterOfAllWords(time)
                          return (
                            <p className="block-text" key={index}>
                              {time}
                            </p>
                          )
                        })}
                      <p className="block-title">Reminders</p>
                    </div>
                  )}

                  {/* Children */}
                  {Manager.isValid(event?.chatMessages) && (
                    <div className="block">
                      {Manager.isValid(event?.chatMessages) &&
                        event?.chatMessages.map((child, index) => {
                          return (
                            <p className="block-text" key={index}>
                              {child}
                            </p>
                          )
                        })}
                      <p className="block-title">Children</p>
                    </div>
                  )}

                  {/*  Notes */}
                  <DetailBlock valueToValidate={event?.notes} text={event?.notes} isFullWidth={true} title={'Notes'} />
                </div>
                <hr className="bottom" />

                <div className="blocks">
                  {/*  Phone */}
                  <DetailBlock valueToValidate={event?.phone} isPhone={true} text={StringManager.formatPhone(event?.phone)} title={'Call'} />

                  {/*  Website */}
                  <DetailBlock
                    valueToValidate={event?.websiteUrl}
                    linkUrl={event?.websiteUrl}
                    text={decodeURIComponent(event?.websiteUrl)}
                    isLink={true}
                    title={'Website'}
                  />

                  {/*  Location */}
                  <DetailBlock valueToValidate={event?.location} isNavLink={true} text={event?.location} linkUrl={event?.location} title={'Go'} />
                </div>

                {/* Recurring Frequency */}
                {event?.isRecurring && (
                  <div className="flex">
                    <b>
                      <MdEventRepeat />
                      DatetimeFormats
                    </b>
                    <span>{StringManager.uppercaseFirstLetterOfAllWords(event?.recurringFrequency)}</span>
                  </div>
                )}

                {/* Map */}
                {Manager.isValid(event?.location) && <Map locationString={event?.location} />}
              </Fade>
            </div>

            {/* EDIT */}
            <div id="edit" className={view === 'Edit' ? 'view-wrapper edit active content' : 'view-wrapper content'}>
              <Spacer height={5} />
              {/* EVENT NAME */}
              <InputWrapper
                inputType={InputTypes.text}
                labelText={'Event Name'}
                defaultValue={event?.title}
                wrapperClasses="show-label"
                required={true}
                onChange={async (e) => {
                  const inputValue = e.target.value
                  if (inputValue.length > 1) {
                    setEventName(inputValue)
                  }
                }}
              />

              {/* DATE */}
              {!eventIsDateRange && (
                <InputWrapper
                  labelText={'Date'}
                  required={true}
                  inputType={InputTypes.date}
                  onDateOrTimeSelection={(date) => setEventStartDate(date)}
                  defaultValue={dateToEdit}
                />
              )}

              {/* EVENT START/END TIME */}
              {!eventIsDateRange && (
                <>
                  {/* START TIME */}
                  <InputWrapper
                    wrapperClasses="start-time"
                    labelText={'Start Time'}
                    uidClass="event-start-time"
                    required={false}
                    inputType={InputTypes.time}
                    defaultValue={event?.startTime}
                    onDateOrTimeSelection={(e) => setEventStartTime(e)}
                  />

                  {/* END TIME */}
                  <InputWrapper
                    uidClass="event-end-time"
                    wrapperClasses="end-time"
                    labelText={'End Time'}
                    required={false}
                    defaultValue={event?.endTime}
                    inputType={InputTypes.time}
                    onDateOrTimeSelection={(e) => setEventEndTime(e)}
                  />
                </>
              )}

              <Spacer height={5} />

              {/* Share with */}
              {Manager.isValid(currentUser?.coparents) && currentUser?.accountType === 'parent' && (
                <ShareWithCheckboxes
                  defaultKeys={event?.shareWith}
                  required={false}
                  onCheck={handleShareWithSelection}
                  containerClass={`share-with-coparents`}
                />
              )}

              {/* REMINDER */}
              <Accordion expanded={showReminders} id={'checkboxes'}>
                <AccordionSummary>
                  <div className="flex reminder-times-toggle">
                    <p className="label">Remind Me</p>
                    <ToggleButton
                      isDefaultChecked={event?.reminderTimes?.length > 0}
                      onCheck={() => setShowReminders(!showReminders)}
                      onUncheck={() => setShowReminders(!showReminders)}
                    />
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  <CheckboxGroup
                    checkboxArray={Manager.buildCheckboxGroup({
                      currentUser,
                      labelType: 'reminder-times',
                      defaultLabels: event?.reminderTimes,
                    })}
                    elClass={`${theme}`}
                    containerClass={'reminder-times'}
                    skipNameFormatting={true}
                    onCheck={handleReminderSelection}
                  />
                </AccordionDetails>
              </Accordion>

              {/* IS VISITATION? */}
              <div className="flex visitation-toggle">
                <p className="label">Visitation Event</p>
                <ToggleButton
                  isDefaultChecked={event?.fromVisitationSchedule}
                  onCheck={() => setIsVisitation(!isVisitation)}
                  onUncheck={() => setIsVisitation(!isVisitation)}
                />
              </div>

              {/* INCLUDING WHICH CHILDREN */}
              {currentUser?.accountType === 'parent' && (
                <Accordion expanded={includeChildren} id={'checkboxes'}>
                  <AccordionSummary>
                    <div className="flex chatMessages-toggle">
                      <p className="label">Include Children</p>
                      <ToggleButton
                        isDefaultChecked={event?.chatMessages?.length > 0}
                        onCheck={() => setIncludeChildren(!includeChildren)}
                        onUncheck={() => setIncludeChildren(!includeChildren)}
                      />
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    <div id="include-chatMessages-checkbox-container">
                      <CheckboxGroup
                        checkboxArray={Manager.buildCheckboxGroup({
                          currentUser,
                          labelType: 'chatMessages',
                          defaultLabels: event?.chatMessages,
                        })}
                        elClass={`${theme} `}
                        containerClass={'include-chatMessages-checkbox-container'}
                        onCheck={handleChildSelection}
                      />
                    </div>
                  </AccordionDetails>
                </Accordion>
              )}

              <Spacer height={5} />

              {/* URL/WEBSITE */}
              <InputWrapper
                defaultValue={event?.websiteUrl}
                labelText={'URL/Website'}
                wrapperClasses={Manager.isValid(event?.websiteUrl) ? 'show-label' : ''}
                required={false}
                inputType={InputTypes.url}
                onChange={(e) => setEventWebsiteUrl(e.target.value)}
              />
              {/* LOCATION/ADDRESS */}
              <InputWrapper
                defaultValue={event?.location}
                wrapperClasses={Manager.isValid(event?.location) ? 'show-label' : ''}
                labelText={'Location'}
                required={false}
                onChange={(address) => setEventLocation(address)}
                inputType={InputTypes.address}
              />

              {/* PHONE */}
              <InputWrapper
                wrapperClasses={Manager.isValid(event?.phone) ? 'show-label' : ''}
                defaultValue={event?.phone}
                inputType={InputTypes.phone}
                labelText={'Phone'}
                onChange={(e) => setEventPhone(e.target.value)}
              />

              {/* NOTES */}
              <InputWrapper
                defaultValue={event?.notes}
                labelText={'Notes'}
                required={false}
                wrapperClasses={Manager.isValid(event?.notes) ? 'show-label textarea' : 'textarea'}
                inputType={InputTypes.textarea}
                onChange={(e) => setEventNotes(e.target.value)}
              />
            </div>
          </>
        )}
        {dataIsLoading && <img id="modal-loading-gif" src={require('../../img/loading.gif')} alt="Loading" />}
      </div>
    </Modal>
  )
}