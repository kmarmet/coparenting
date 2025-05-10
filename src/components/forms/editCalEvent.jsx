// Path: src\components\forms\editCalEvent.jsx
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import InputWrapper from '/src/components/shared/inputWrapper'
import Modal from '/src/components/shared/modal'
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
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {BsCalendar2CheckFill} from 'react-icons/bs'
import {MdEventRepeat} from 'react-icons/md'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context'
import useCalendarEvents from '../../hooks/useCalendarEvents'
import useCurrentUser from '../../hooks/useCurrentUser'
import useUsers from '../../hooks/useUsers'
import DomManager from '../../managers/domManager'
import LogManager from '../../managers/logManager'
import AddressInput from '../shared/addressInput'
import DetailBlock from '../shared/detailBlock'
import Map from '../shared/map'
import MultilineDetailBlock from '../shared/multilineDetailBlock'
import Spacer from '../shared/spacer.jsx'
import ToggleButton from '../shared/toggleButton'
import ViewSelector from '../shared/viewSelector'

export default function EditCalEvent({event, showCard, hideCard}) {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey, dateToEdit} = state
  const {currentUser, currentUserIsLoading} = useCurrentUser()
  const {calendarEvents, eventsAreLoading} = useCalendarEvents(event?.ownerKey)
  const {users, usersAreLoading} = useUsers()

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
      refreshKey: Manager.GetUid(),
    })
    hideCard()
  }

  const EditNonOwnerEvent = async (_updatedEvent) => {
    if (Manager.IsValid(event?.shareWith)) {
      // Remove currentUser from original event shareWith
      const shareWithWithoutCurrentUser = event.shareWith.filter((x) => x !== currentUser?.key)
      event.shareWith = shareWithWithoutCurrentUser
      const updateIndex = DB.GetTableIndexById(calendarEvents, event?.id)
      await CalendarManager.UpdateEvent(event?.ownerKey, updateIndex, event)
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

      if (Manager.IsValid(eventStartTime) || Manager.IsValid(eventEndTime)) {
        updatedEvent.startTime = moment(eventStartTime, DatetimeFormats.timeForDb).format(DatetimeFormats.timeForDb)
        updatedEvent.endTime = moment(eventEndTime, DatetimeFormats.timeForDb).format(DatetimeFormats.timeForDb)
      }

      // Not Required
      updatedEvent.ownerKey = currentUser?.key
      updatedEvent.createdBy = currentUser?.name
      updatedEvent.notes = eventNotes
      updatedEvent.reminderTimes = eventReminderTimes || []
      updatedEvent.children = eventChildren
      updatedEvent.directionsLink = Manager.GetDirectionsLink(eventLocation)
      updatedEvent.location = eventLocation

      // Add birthday cake
      if (Manager.Contains(eventName, 'birthday')) {
        updatedEvent.title += ' 🎂'
      }

      updatedEvent.websiteUrl = eventWebsiteUrl
      updatedEvent.fromVisitationSchedule = isVisitation
      updatedEvent.morningSummaryReminderSent = false
      updatedEvent.eveningSummaryReminderSent = false
      updatedEvent.sentReminders = []

      if (Manager.IsValid(updatedEvent)) {
        if (!Manager.IsValid(eventName)) {
          AlertManager.throwError('Event name is required')
          return false
        }

        if (!Manager.IsValid(eventStartDate)) {
          AlertManager.throwError('Please select a date for this event')
          return false
        }

        const cleanedEvent = ObjectManager.cleanObject(updatedEvent, ModelNames.calendarEvent)
        const dbPath = `${DB.tables.calendarEvents}/${currentUser?.key}`

        // Events with multiple days
        if (event?.isRecurring || event?.isDateRange || event?.isCloned) {
          const allEvents = await DB.getTable(`${DB.tables.calendarEvents}/${currentUser?.key}`)
          const existing = allEvents.filter((x) => x.multipleDatesId === event?.multipleDatesId)

          if (!Manager.IsValid(existing)) {
            return false
          }

          // Add cloned dates
          if (Manager.IsValid(clonedDates)) {
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
          if (Manager.IsValid(eventShareWith)) {
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
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
    }
  }

  // CHECKBOX HANDLERS
  const HandleChildSelection = (e) => {
    let childrenArr = []
    DomManager.HandleCheckboxSelection(
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
    const shareWithNumbers = DomManager.HandleShareWithSelection(e, currentUser, eventShareWith)
    setEventShareWith(shareWithNumbers)
  }

  const HandleReminderSelection = async (e) => {
    DomManager.HandleCheckboxSelection(
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
    setIncludeChildren(Manager.IsValid(event?.children))
    setShowReminders(Manager.IsValid(event?.reminderTimes))

    // Get shareWith Names
    const securedShareWith = event?.shareWith?.filter((x) => x !== currentUser?.key && currentUser?.sharedDataUsers.includes(x)) || event?.shareWith
    let mappedShareWithNames = Manager.MapKeysToUsers(securedShareWith, users)
    mappedShareWithNames = mappedShareWithNames.filter((x) => x?.name !== StringManager.getFirstNameOnly(currentUser?.name)).flat()
    setShareWithNames(mappedShareWithNames)

    // Repeating
    if (Manager.IsValid(event?.recurringInterval)) {
      DomManager.SetDefaultCheckboxes('repeating', event, 'repeatInterval', false).then((r) => r)
    }
  }

  const DeleteEvent = async () => {
    const eventCount = calendarEvents.filter((x) => x?.title.toLowerCase() === eventName.toLowerCase())?.length

    if (eventCount === 1) {
      await CalendarManager.deleteEvent(currentUser, event.id)
      await ResetForm('Event Deleted')
    } else {
      let clonedEvents = await DB.getTable(`${DB.tables.calendarEvents}/${currentUser?.key}`)
      if (Manager.IsValid(clonedEvents)) {
        clonedEvents = clonedEvents.filter((x) => x.title === event?.title)
        await CalendarManager.deleteMultipleEvents(clonedEvents, currentUser)
        await ResetForm('Event Deleted')
      }
    }
  }

  const SetLocalConfirmMessage = () => {
    let message = 'Are you sure you want to Delete this event?'

    if (event?.isRecurring || event?.isCloned || event?.isDateRange) {
      message = 'Are you sure you would like to Delete ALL events with these details?'
    }

    return message
  }

  const GetCreatedBy = () => {
    if (Manager.IsValid(event?.createdBy)) {
      if (event?.ownerKey === currentUser?.key) {
        return 'Me'
      } else {
        return StringManager.getFirstNameOnly(event?.createdBy)
      }
    }
  }

  useEffect(() => {
    if (Manager.IsValid(event)) {
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
        <Spacer height={5} />
        {/* DETAILS */}
        <div id="details" className={view === 'details' ? 'view-wrapper details active' : 'view-wrapper'}>
          <div className="blocks">
            {/*  Date */}
            <DetailBlock
              valueToValidate={event?.isDateRange ? event?.staticStartDate : event?.startDate}
              text={moment(event?.isDateRange ? event?.staticStartDate : event?.startDate).format(
                DatetimeFormats.readableMonthAndDayWithDayDigitOnly
              )}
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
            {Manager.IsValid(event?.reminderTimes) && (
              <div className="block">
                {Manager.IsValid(event?.reminderTimes) &&
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

          {(Manager.IsValid(event?.location) || Manager.IsValid(event?.phone) || Manager.IsValid(event?.websiteUrl)) && (
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

              {Manager.IsValid(event?.location) && (
                <>
                  <Spacer height={5} />
                  {/*  Location */}
                  <DetailBlock valueToValidate={event?.location} isNavLink={true} text={event?.location} linkUrl={event?.location} title={'Go'} />
                  <Spacer height={5} />
                </>
              )}
            </div>
          )}

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
          {Manager.IsValid(event?.location) && <Map locationString={event?.location} />}
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
                  isDefaultChecked={Manager.IsValid(event?.reminderTimes)}
                  onCheck={() => setShowReminders(true)}
                  onUncheck={() => setShowReminders(false)}
                />
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <CheckboxGroup
                checkboxArray={DomManager.BuildCheckboxGroup({
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
                    checkboxArray={DomManager.BuildCheckboxGroup({
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
            wrapperClasses={Manager.IsValid(event?.websiteUrl) ? 'show-label' : ''}
            required={false}
            inputType={InputTypes.url}
            onChange={(e) => setEventWebsiteUrl(e.target.value)}
          />
          {/* LOCATION/ADDRESS */}
          {/*<InputWrapper*/}
          {/*  defaultValue={event?.location}*/}
          {/*  wrapperClasses={Manager.IsValid(event?.location) ? 'show-label' : ''}*/}
          {/*  labelText={'Location'}*/}
          {/*  required={false}*/}
          {/*  onChange={(address) => setEventLocation(address)}*/}
          {/*  inputType={InputTypes.address}*/}
          {/*/>*/}

          <AddressInput defaultValue={event?.location} labelText={'Location'} onChange={(address) => setEventLocation(address)} />

          {/* PHONE */}
          <InputWrapper
            wrapperClasses={Manager.IsValid(event?.phone) ? 'show-label' : ''}
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
            wrapperClasses={Manager.IsValid(event?.notes) ? 'show-label textarea' : 'textarea'}
            inputType={InputTypes.textarea}
            onChange={(e) => setEventNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}