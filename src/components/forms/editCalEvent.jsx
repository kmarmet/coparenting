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
import * as Sentry from '@sentry/react'
import Modal from '/src/components/shared/modal'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import InputWrapper from '/src/components/shared/inputWrapper'
import ShareWithCheckboxes from '/src/components/shared/shareWithCheckboxes'
import DatetimeFormats from '/src/constants/datetimeFormats'
import DB from '/src/database/DB'
import AlertManager from '/src/managers/alertManager'
import CalendarManager from '/src/managers/calendarManager.js'
import Manager from '/src/managers/manager'
import NotificationManager from '/src/managers/notificationManager'
import ObjectManager from '/src/managers/objectManager'
import StringManager from '/src/managers/stringManager'
import {default as CalendarMapper, default as CalMapper} from '/src/mappers/calMapper'
import ActivityCategory from '/src/models/activityCategory'
import ModelNames from '/src/models/modelNames'
import ToggleButton from '../shared/toggleButton'
import InputTypes from '../../constants/inputTypes'
import DetailBlock from '../shared/detailBlock'
import Map from '../shared/map'
import useCurrentUser from '../../hooks/useCurrentUser'
import useCalendarEvents from '../../hooks/useCalendarEvents'
import useUsers from '../../hooks/useUsers'
import MultilineDetailBlock from '../shared/multilineDetailBlock'

export default function EditCalEvent({event, showCard, hideCard}) {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey, dateToEdit} = state
  const {currentUser} = useCurrentUser()
  const {calendarEvents} = useCalendarEvents()
  const {users} = useUsers()

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
  const [eventChildren, setEventChildren] = useState(event?.children || [])
  const [eventReminderTimes, setEventReminderTimes] = useState([])
  const [eventShareWith, setEventShareWith] = useState(event?.shareWith || [])
  const [eventIsDateRange, setEventIsDateRange] = useState(false)
  const [eventIsRecurring, setEventIsRecurring] = useState(false)
  const [eventIsCloned, setEventIsCloned] = useState(false)
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('')

  // State
  const [clonedDates, setClonedDates] = useState([])
  const [repeatingDatesToSubmit, setRepeatingDatesToSubmit] = useState([])
  const [includeChildren, setIncludeChildren] = useState(false)
  const [showReminders, setShowReminders] = useState(false)
  const [isVisitation, setIsVisitation] = useState(false)
  const [view, setView] = useState('details')
  const [shareWithNames, setShareWithNames] = useState([])

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
    setEventChildren([])
    setEventReminderTimes([])
    setEventShareWith([])
    setEventIsDateRange(false)
    setClonedDates([])
    setRepeatingDatesToSubmit([])
    setIncludeChildren(false)
    setShowReminders(false)
    setIsVisitation(false)
    setEventIsRecurring(false)
    setEventIsCloned(false)
    setEventPhone('')
    setRecurrenceFrequency('')

    setState({
      ...state,
      successAlertMessage: alertMessage,
      dateToEdit: moment().format(DatetimeFormats.dateForDb),
      refreshKey: Manager.getUid(),
    })
    hideCard()
  }

  const EditNonOwnerEvent = async (_updatedEvent) => {
    if (Manager.isValid(event?.shareWith)) {
      // Remove currentUser from original event shareWith
      const shareWithWithoutCurrentUser = event.shareWith.filter((x) => x !== currentUser?.key)
      await CalendarManager.UpdateEvent(event?.ownerKey, calendarEvents, event, 'shareWith', shareWithWithoutCurrentUser)
      // Add cloned event for currentUser
      await CalendarManager.addCalendarEvent(currentUser, _updatedEvent)
      NotificationManager.sendToShareWith(
        shareWithWithoutCurrentUser,
        currentUser,
        'Event Updated',
        `${eventName} has been updated`,
        ActivityCategory.calendar
      )
    }
  }

  // SUBMIT
  const Submit = async () => {
    try {
      // Set new event values
      const updatedEvent = {...event}

      // Required
      updatedEvent.title = eventName
      updatedEvent.reminderTimes = eventReminderTimes
      updatedEvent.shareWith = eventShareWith
      updatedEvent.startDate = moment(eventStartDate).format(DatetimeFormats.dateForDb)
      updatedEvent.endDate = moment(eventEndDate).format(DatetimeFormats.dateForDb)
      updatedEvent.phone = StringManager.FormatPhone(eventPhone)
      updatedEvent.repeatInterval = recurrenceFrequency
      updatedEvent.isDateRange = eventIsDateRange
      updatedEvent.isCloned = eventIsCloned
      updatedEvent.isRecurring = eventIsRecurring

      if (Manager.isValid(eventStartTime) || Manager.isValid(eventEndTime)) {
        updatedEvent.startTime = moment(eventStartTime, DatetimeFormats.timeForDb).format(DatetimeFormats.timeForDb)
        updatedEvent.endTime = moment(eventEndTime, DatetimeFormats.timeForDb).format(DatetimeFormats.timeForDb)
      }

      // Not Required
      updatedEvent.ownerKey = currentUser?.key
      updatedEvent.createdBy = currentUser?.name
      updatedEvent.notes = eventNotes
      updatedEvent.reminderTimes = eventReminderTimes || []
      updatedEvent.children = eventChildren
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
          if (event?.ownerKey === currentUser?.key) {
            await DB.updateEntireRecord(`${dbPath}`, cleanedEvent, updatedEvent.id)
          }
        }
        if (event?.ownerKey === currentUser?.key) {
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
      }

      if (event?.ownerKey !== currentUser?.key) {
        await EditNonOwnerEvent(updatedEvent)
      }
      await ResetForm('Event Updated')
    } catch (error) {
      Sentry.captureException(error)
    }
  }

  // CHECKBOX HANDLERS
  const HandleChildSelection = (e) => {
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

  const HandleShareWithSelection = (e) => {
    const shareWithNumbers = Manager.handleShareWithSelection(e, currentUser, eventShareWith)
    setEventShareWith(shareWithNumbers)
  }

  const HandleReminderSelection = async (e) => {
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

  const SetDefaultValues = async () => {
    setView('details')
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
    setRecurrenceFrequency(event?.repeatInterval)
    setEventIsDateRange(event?.isDateRange)
    setEventWebsiteUrl(event?.websiteUrl)
    setIncludeChildren(Manager.isValid(event?.children))
    setShowReminders(Manager.isValid(event?.reminderTimes))

    // Get shareWith Names
    const shareWithWithoutMe = event?.shareWith?.filter((x) => x !== currentUser?.key) || event?.shareWith
    let mappedShareWithNames = Manager.MapKeysToUsers(shareWithWithoutMe, users)
    mappedShareWithNames = mappedShareWithNames.filter((x) => x?.name !== StringManager.getFirstNameOnly(currentUser?.name)).flat()
    setShareWithNames(mappedShareWithNames)

    // Repeating
    if (Manager.isValid(event?.recurringInterval)) {
      Manager.setDefaultCheckboxes('repeating', event, 'repeatInterval', false).then((r) => r)
    }
  }

  const DeleteEvent = async () => {
    const eventCount = calendarEvents.filter((x) => x?.title.toLowerCase() === eventName.toLowerCase())?.length

    if (eventCount === 1) {
      await CalendarManager.deleteEvent(currentUser, event.id)
      await ResetForm('Event Deleted')
    } else {
      let clonedEvents = await DB.getTable(`${DB.tables.calendarEvents}/${currentUser?.key}`)
      if (Manager.isValid(clonedEvents)) {
        clonedEvents = clonedEvents.filter((x) => x.title === event?.title)
        await CalendarManager.deleteMultipleEvents(clonedEvents, currentUser)
        await ResetForm('Event Deleted')
      }
    }
  }

  const SetLocalConfirmMessage = () => {
    let message = 'Are you sure you want to delete this event?'

    if (event?.isRecurring || event?.isCloned || event?.isDateRange) {
      message = 'Are you sure you would like to delete ALL events with these details?'
    }

    return message
  }

  const GetCreatedBy = () => {
    if (Manager.isValid(event?.createdBy)) {
      if (event?.ownerKey === currentUser?.key) {
        return 'Me'
      } else {
        return StringManager.getFirstNameOnly(event?.createdBy)
      }
    }
  }

  useEffect(() => {
    if (Manager.isValid(event)) {
      SetDefaultValues().then((r) => r)
    }
  }, [event])

  return (
    <Modal
      onDelete={() => {
        AlertManager.confirmAlert(
          SetLocalConfirmMessage(),
          "I'm Sure",
          true,
          async () => {
            await DeleteEvent()
          },
          null,
          theme
        )
      }}
      hasDelete={currentUser?.key === event?.ownerKey}
      onSubmit={Submit}
      submitText={'Update Event'}
      submitIcon={<BsCalendar2CheckFill className={'edit-calendar-icon'} />}
      hasSubmitButton={view === 'edit'}
      onClose={async () => {
        await ResetForm()
      }}
      title={StringManager.formatEventTitle(StringManager.uppercaseFirstLetterOfAllWords(event?.title))}
      showCard={showCard}
      deleteButtonText="Delete Event"
      className="edit-calendar-event"
      viewSelector={
        <ViewSelector
          key={refreshKey}
          labels={['details', 'edit']}
          updateState={(labelText) => {
            setView(labelText)
          }}
        />
      }
      wrapperClass={`edit-calendar-event ${event?.ownerKey === currentUser?.key ? 'owner' : 'non-owner'}`}>
      <div id="edit-cal-event-container" className={`${theme} edit-event-form'`}>
        {/* DETAILS */}
        <div id="details" className={view === 'details' ? 'view-wrapper details active' : 'view-wrapper'}>
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
              <DetailBlock valueToValidate={event?.createdBy} text={GetCreatedBy()} title={'Created By'} />

              {/*  Shared With */}
              <MultilineDetailBlock title={'Shared With'} array={shareWithNames} />

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
              <MultilineDetailBlock title={'Children'} array={event?.children} />

              {/*  Notes */}
              <DetailBlock valueToValidate={event?.notes} text={event?.notes} isFullWidth={true} title={'Notes'} />
            </div>
            <hr className="bottom" />

            <div className="blocks">
              {/*  Phone */}
              <DetailBlock valueToValidate={event?.phone} isPhone={true} text={StringManager.FormatPhone(event?.phone)} title={'Call'} />

              {/*  Website */}
              <DetailBlock
                valueToValidate={event?.websiteUrl}
                linkUrl={event?.websiteUrl}
                text={decodeURIComponent(event?.websiteUrl)}
                isLink={true}
                title={'Website/Link'}
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
        <div id="edit" className={view === 'edit' ? 'view-wrapper edit active content' : 'view-wrapper content'}>
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
          <ShareWithCheckboxes
            defaultKeys={event?.shareWith}
            required={false}
            onCheck={HandleShareWithSelection}
            containerClass={`share-with-parents`}
          />

          {/* REMINDER */}
          <Accordion expanded={showReminders} id={'checkboxes'}>
            <AccordionSummary>
              <div className="flex reminder-times-toggle">
                <p className="label">Remind Me</p>
                <ToggleButton
                  isDefaultChecked={Manager.isValid(event?.reminderTimes)}
                  onCheck={() => setShowReminders(true)}
                  onUncheck={() => setShowReminders(false)}
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
                onCheck={HandleReminderSelection}
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
                <div className="flex children-toggle">
                  <p className="label">Include Children</p>
                  <ToggleButton
                    isDefaultChecked={event?.children?.length > 0}
                    onCheck={() => setIncludeChildren(!includeChildren)}
                    onUncheck={() => setIncludeChildren(!includeChildren)}
                  />
                </div>
              </AccordionSummary>
              <AccordionDetails>
                <div id="include-children-checkbox-container">
                  <CheckboxGroup
                    checkboxArray={Manager.buildCheckboxGroup({
                      currentUser,
                      labelType: 'children',
                      defaultLabels: event?.children,
                    })}
                    elClass={`${theme} `}
                    containerClass={'include-children-checkbox-container'}
                    onCheck={HandleChildSelection}
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
      </div>
    </Modal>
  )
}