// Path: src\components\forms\EditCalEvent.jsx
import Form from '/src/components/shared/form'
import InputWrapper from '/src/components/shared/inputWrapper'
import ShareWithCheckboxes from '/src/components/shared/shareWithCheckboxes'
import ActivityCategory from '/src/constants/activityCategory'
import DatetimeFormats from '/src/constants/datetimeFormats'
import ModelNames from '/src/constants/modelNames'
import DB from '/src/database/DB'
import AlertManager from '/src/managers/alertManager'
import CalendarManager from '/src/managers/calendarManager.js'
import Manager from '/src/managers/manager'
import ObjectManager from '/src/managers/objectManager'
import StringManager from '/src/managers/stringManager'
import UpdateManager from '/src/managers/updateManager'
import {default as CalMapper} from '/src/mappers/calMapper'
import moment from 'moment'
import React, {useContext, useEffect, useRef, useState} from 'react'
import {MdEventRepeat} from 'react-icons/md'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context'
import useCalendarEvents from '../../hooks/useCalendarEvents'
import useCurrentUser from '../../hooks/useCurrentUser'
import useUsers from '../../hooks/useUsers'
import DatasetManager from '../../managers/datasetManager'
import DomManager from '../../managers/domManager'
import LogManager from '../../managers/logManager'
import AddressInput from '../shared/addressInput'
import DetailBlock from '../shared/detailBlock'
import Label from '../shared/label'
import Map from '../shared/map'
import MultilineDetailBlock from '../shared/multilineDetailBlock'
import Spacer from '../shared/spacer.jsx'
import ToggleButton from '../shared/toggleButton'
import ViewSelector from '../shared/viewSelector'
import SelectDropdown from '../shared/selectDropdown'
import useChildren from '../../hooks/useChildren'

export default function EditCalEvent({event, showCard, hideCard}) {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey, dateToEdit} = state

  // Hooks
  const {currentUser} = useCurrentUser()
  const {calendarEvents} = useCalendarEvents(event?.ownerKey)
  const {users} = useUsers()
  const {children, childrenDropdownOptions} = useChildren()

  // Event Details
  const [eventIsDateRange, setEventIsDateRange] = useState(false)
  const [eventIsRecurring, setEventIsRecurring] = useState(false)
  const [eventIsCloned, setEventIsCloned] = useState(false)

  // State
  const [includeChildren, setIncludeChildren] = useState(false)
  const [showReminders, setShowReminders] = useState(false)
  const [isVisitation, setIsVisitation] = useState(false)
  const [shareWithNames, setShareWithNames] = useState([])
  const [clonedDates, setClonedDates] = useState([])
  const [view, setView] = useState('Details')

  // REF
  const updatedEvent = useRef({...event, children: event?.children || [], startDate: moment(dateToEdit).format(DatetimeFormats.dateForDb)})

  const ResetForm = async (alertMessage = '') => {
    Manager.ResetForm('Edit-event-form')
    setEventIsDateRange(false)
    setClonedDates([])
    setIncludeChildren(false)
    setShowReminders(false)
    setIsVisitation(false)
    setEventIsRecurring(false)
    setEventIsCloned(false)

    setState({
      ...state,
      successAlertMessage: alertMessage,
      dateToEdit: moment().format(DatetimeFormats.dateForDb),
      refreshKey: Manager.GetUid(),
    })
    hideCard()
  }

  const EditNonOwnerEvent = async (_updatedEvent) => {
    if (Manager.IsValid(updatedEvent?.current?.shareWith)) {
      // Remove currentUser from original event shareWith
      const shareWithWithoutCurrentUser = event.shareWith.filter((x) => x !== currentUser?.key)
      event.shareWith = shareWithWithoutCurrentUser
      const updateIndex = DB.GetTableIndexById(calendarEvents, updatedEvent?.current?.id)

      if (!Manager.IsValid(updateIndex)) {
        return false
      }

      await CalendarManager.UpdateEvent(updatedEvent?.current?.ownerKey, updateIndex, event)

      // Add cloned event for currentUser
      await CalendarManager.addCalendarEvent(currentUser, _updatedEvent)
      UpdateManager.SendToShareWith(
        shareWithWithoutCurrentUser,
        currentUser,
        'Event Updated',
        `${updatedEvent?.current?.title} has been updated`,
        ActivityCategory.calendar
      )
    }
  }

  // SUBMIT
  const Submit = async () => {
    try {
      const updated = {...event}

      updated.isDateRange = eventIsDateRange
      updated.isCloned = eventIsCloned
      updated.isRecurring = eventIsRecurring
      updated.ownerKey = currentUser?.key
      updated.createdBy = currentUser?.name
      updated.directionsLink = Manager.GetDirectionsLink(updatedEvent?.current?.address)
      updated.websiteUrl = updatedEvent?.current?.websiteUrl
      updated.fromVisitationSchedule = isVisitation

      // Add birthday cake
      if (Manager.Contains(updatedEvent?.current?.title, 'birthday')) {
        updated.title += ' 🎂'
      }

      if (Manager.IsValid(updated)) {
        if (!Manager.IsValid(updatedEvent?.current?.title)) {
          AlertManager.throwError('Event name is required')
          return false
        }

        if (!Manager.IsValid(updatedEvent?.current?.startDate)) {
          AlertManager.throwError('Please select a date for this event')
          return false
        }

        const cleanedEvent = ObjectManager.GetModelValidatedObject(updated, ModelNames.calendarEvent)
        const dbPath = `${DB.tables.calendarEvents}/${currentUser?.key}`

        // Events with multiple days
        if (updatedEvent?.current?.isRecurring || updatedEvent?.current?.isDateRange || updatedEvent?.current?.isCloned) {
          const existing = calendarEvents.filter((x) => x.multipleDatesId === updatedEvent?.current?.multipleDatesId)

          if (!Manager.IsValid(existing)) {
            return false
          }

          // Add cloned dates
          if (Manager.IsValid(clonedDates)) {
            // await CalendarManager.addMultipleCalEvents(currentUser, clonedDatesToSubmit)
          }

          if (eventIsDateRange) {
            const dates = await CalendarManager.buildArrayOfEvents(
              currentUser,
              updated,
              'range',
              existing[0].startDate,
              updatedEvent?.current?.endDate
            )
            await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
          }

          // Add repeating dates
          if (eventIsRecurring) {
            const dates = await CalendarManager.buildArrayOfEvents(
              currentUser,
              updated,
              'recurring',
              existing[0]?.startDate,
              updatedEvent?.current?.endDate
            )
            await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
          }

          // Delete all before updated
          await DB.deleteMultipleRows(`${DB.tables.calendarEvents}/${currentUser?.key}`, existing, currentUser)
        }

        // Update Single Event
        else {
          if (updatedEvent?.current?.ownerKey === currentUser?.key) {
            await DB.updateEntireRecord(`${dbPath}`, cleanedEvent, updated.id)
          }
        }
        if (updatedEvent?.current?.ownerKey === currentUser?.key) {
          if (Manager.IsValid(updatedEvent?.current?.shareWith)) {
            UpdateManager.SendToShareWith(
              updatedEvent?.current?.shareWith,
              currentUser,
              'Event Updated',
              `${updatedEvent?.current?.title} has been updated`,
              ActivityCategory.calendar
            )
          }
        }
      }

      if (updatedEvent?.current?.ownerKey !== currentUser?.key) {
        await EditNonOwnerEvent(updated)
      }
      await ResetForm('Event Updated')
    } catch (error) {
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
    }
  }

  // CHECKBOX HANDLERS
  const HandleChildSelection = (e) => (updatedEvent.current.children = e?.map((x) => x?.label?.trim()))

  const HandleShareWithSelection = (e) => {
    updatedEvent.current.shareWith = e.map((x) => x.value)
  }

  const HandleReminderSelection = (e) => (updatedEvent.current.reminderTimes = e?.map((x) => x?.value?.trim()))

  const SetDefaultValues = async () => {
    setView('Details')
    setEventIsRecurring(updatedEvent?.current?.isRecurring)
    setEventIsDateRange(updatedEvent?.current?.isDateRange)
    setIncludeChildren(Manager.IsValid(updatedEvent?.current?.children))
    setShowReminders(Manager.IsValid(updatedEvent?.current?.reminderTimes))

    // Get shareWith Names
    const securedShareWith =
      updatedEvent?.current?.shareWith?.filter((x) => x !== currentUser?.key && currentUser?.sharedDataUsers.includes(x)) ||
      updatedEvent?.current?.shareWith
    let mappedShareWithNames = Manager.MapKeysToUsers(securedShareWith, users)
    mappedShareWithNames = mappedShareWithNames.filter((x) => x?.name !== StringManager.GetFirstNameOnly(currentUser?.name)).flat()
    setShareWithNames(DatasetManager.GetValidArray(mappedShareWithNames))

    // Repeating
    if (Manager.IsValid(updatedEvent?.current?.recurringInterval)) {
      DomManager.SetDefaultCheckboxes('repeating', event, 'recurringInterval', false).then((r) => r)
    }
  }

  const DeleteEvent = async () => {
    const eventCount = calendarEvents.filter((x) => x?.title.toLowerCase() === updatedEvent?.current?.title.toLowerCase())?.length

    if (eventCount === 1) {
      await CalendarManager.deleteEvent(currentUser, event.id)
      await ResetForm('Event Deleted')
    } else {
      let clonedEvents = await DB.getTable(`${DB.tables.calendarEvents}/${currentUser?.key}`)
      if (Manager.IsValid(clonedEvents)) {
        clonedEvents = clonedEvents.filter((x) => x.title === updatedEvent?.current?.title)
        await CalendarManager.deleteMultipleEvents(clonedEvents, currentUser)
        await ResetForm('Event Deleted')
      }
    }
  }

  const SetLocalConfirmMessage = () => {
    let message = 'Are you sure you want to Delete this event?'

    if (updatedEvent?.current?.isRecurring || updatedEvent?.current?.isCloned || updatedEvent?.current?.isDateRange) {
      message = 'Are you sure you would like to Delete ALL events with these Details?'
    }

    return message
  }

  const GetCreatedBy = () => {
    if (Manager.IsValid(updatedEvent?.current?.createdBy)) {
      if (updatedEvent?.current?.ownerKey === currentUser?.key) {
        return 'Me'
      } else {
        return StringManager.GetFirstNameOnly(updatedEvent?.current?.createdBy)
      }
    }
  }

  const GetReadableReminder = (timeframe) => {
    let readable = timeframe
    readable = CalMapper.readableReminderBeforeTimeframes(readable).replace('before', '')
    readable = readable.replace('At', '')
    readable = StringManager.uppercaseFirstLetterOfAllWords(readable)
    return readable
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
    if (Manager.IsValid(event)) {
      updatedEvent.current = event
      SetDefaultValues().then((r) => r)
    }
  }, [event])

  return (
    <>
      <Form
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
        hasDelete={currentUser?.key === updatedEvent?.current?.ownerKey}
        onSubmit={Submit}
        submitText={'Update'}
        hasSubmitButton={view === 'Edit'}
        onClose={async () => {
          await ResetForm()
        }}
        title={StringManager.formatEventTitle(StringManager.uppercaseFirstLetterOfAllWords(updatedEvent?.current?.title))}
        showCard={showCard}
        deleteButtonText="Delete"
        className="Edit-calendar-event"
        viewSelector={
          <ViewSelector
            show={showCard}
            dropdownPlaceholder="Select View"
            labels={['Details', 'Edit']}
            updateState={(labelText) => {
              setView(labelText)
            }}
          />
        }
        wrapperClass={`Edit-calendar-event at-top ${updatedEvent?.current?.ownerKey === currentUser?.key ? 'owner' : 'non-owner'}`}>
        <div id="Edit-cal-event-container" className={`${theme} Edit-event-form'`}>
          {/* DETAILS */}
          <div className={view === 'Details' ? 'view-wrapper details active' : 'view-wrapper'}>
            <div className="blocks">
              {/*  Date */}
              <DetailBlock
                valueToValidate={updatedEvent?.current?.isDateRange ? updatedEvent?.current?.staticStartDate : updatedEvent?.current?.startDate}
                text={moment(updatedEvent?.current?.isDateRange ? updatedEvent?.current?.staticStartDate : updatedEvent?.current?.startDate).format(
                  DatetimeFormats.readableMonthAndDayWithDayDigitOnly
                )}
                title={updatedEvent?.current?.isDateRange ? 'Start Date' : 'Date'}
              />

              {/*  End Date */}
              <DetailBlock
                valueToValidate={updatedEvent?.current?.endDate}
                text={moment(updatedEvent?.current?.endDate).format(DatetimeFormats.readableMonthAndDayWithDayDigitOnly)}
                title={'End Date'}
              />

              {/*  Start Time */}
              <DetailBlock
                valueToValidate={updatedEvent?.current?.startTime}
                text={moment(updatedEvent?.current?.startTime, DatetimeFormats.timeForDb).format('h:mma')}
                title={'Start Time'}
              />

              {/*  End Time */}
              <DetailBlock
                valueToValidate={updatedEvent?.current?.endTime}
                text={moment(updatedEvent?.current?.endTime, DatetimeFormats.timeForDb).format('h:mma')}
                title={'End time'}
              />

              {/*  Created By */}
              <DetailBlock valueToValidate={updatedEvent?.current?.createdBy} text={GetCreatedBy()} title={'Creator'} />

              {/*  Shared With */}
              <MultilineDetailBlock title={'Shared with'} array={shareWithNames} />

              {/* Reminders */}
              <MultilineDetailBlock title={'Reminders'} array={updatedEvent?.current?.reminderTimes?.map((x) => GetReadableReminder(x))} />

              {/* Children */}
              <MultilineDetailBlock title={'Children'} array={updatedEvent?.current?.children} />

              {/*  Notes */}
              <DetailBlock valueToValidate={updatedEvent?.current?.notes} text={updatedEvent?.current?.notes} isFullWidth={true} title={'Notes'} />
            </div>

            {(Manager.IsValid(updatedEvent?.current?.address) ||
              Manager.IsValid(updatedEvent?.current?.phone) ||
              Manager.IsValid(updatedEvent?.current?.websiteUrl)) && (
              <>
                <div className="blocks">
                  {/*  Phone */}
                  <DetailBlock
                    valueToValidate={updatedEvent?.current?.phone}
                    isPhone={true}
                    text={StringManager.FormatPhone(updatedEvent?.current?.phone)}
                    title={'Call'}
                    topSpacerMargin={8}
                    bottomSpacerMargin={8}
                  />

                  {/*  Website */}
                  <DetailBlock
                    valueToValidate={updatedEvent?.current?.websiteUrl}
                    linkUrl={updatedEvent?.current?.websiteUrl}
                    text={decodeURIComponent(updatedEvent?.current?.websiteUrl)}
                    isLink={true}
                    title={'Website/Link'}
                  />

                  {Manager.IsValid(updatedEvent?.current?.address) && (
                    <>
                      {/*  Location */}
                      <DetailBlock
                        topSpacerMargin={8}
                        bottomSpacerMargin={8}
                        valueToValidate={updatedEvent?.current?.address}
                        isNavLink={true}
                        text={updatedEvent?.current?.address}
                        linkUrl={updatedEvent?.current?.address}
                        title={'Go'}
                      />
                    </>
                  )}
                </div>
              </>
            )}

            {/* Recurring Frequency */}
            {updatedEvent?.current?.isRecurring && (
              <div className="flex">
                <b>
                  <MdEventRepeat />
                  DatetimeFormats
                </b>
                <span>{StringManager.uppercaseFirstLetterOfAllWords(updatedEvent?.current?.recurringFrequency)}</span>
              </div>
            )}

            {/* Map */}
            {Manager.IsValid(updatedEvent?.current?.address) && <Map locationString={updatedEvent?.current?.address} />}
          </div>

          {/* EDIT */}
          <div className={view === 'Edit' ? 'view-wrapper edit active content' : 'view-wrapper content edit'}>
            {/* EVENT NAME */}
            <InputWrapper
              inputType={InputTypes.text}
              placeholder={'Event Name'}
              defaultValue={updatedEvent.current?.title}
              wrapperClasses="show-label"
              required={true}
              onChange={async (e) => {
                const inputValue = e.target.value
                if (inputValue.length > 1) {
                  updatedEvent.current.title = StringManager.formatEventTitle(inputValue)
                }
              }}
            />

            {/* DATE */}
            {!eventIsDateRange && (
              <InputWrapper
                placeholder={'Date'}
                required={true}
                inputType={InputTypes.date}
                onDateOrTimeSelection={(date) => (updatedEvent.current.startDate = moment(date).format(DatetimeFormats.dateForDb))}
                defaultValue={updatedEvent.current.startDate}
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
                  defaultValue={updatedEvent?.current?.startTime}
                  onDateOrTimeSelection={(e) => (updatedEvent.current.startTime = moment(e).format(DatetimeFormats.timeForDb))}
                />

                {/* END TIME */}
                <InputWrapper
                  uidClass="event-end-time"
                  wrapperClasses="end-time"
                  labelText={'End Time'}
                  required={false}
                  defaultValue={updatedEvent?.current?.endTime}
                  inputType={InputTypes.time}
                  onDateOrTimeSelection={(e) => (updatedEvent.current.endTime = moment(e).format(DatetimeFormats.timeForDb))}
                />
              </>
            )}

            <hr />

            {/* Share with */}
            <ShareWithCheckboxes
              defaultKeys={updatedEvent?.current?.shareWith}
              required={false}
              onCheck={HandleShareWithSelection}
              containerClass={`share-with-parents`}
            />

            <Spacer height={2} />

            <SelectDropdown isMultiple={true} labelText={'Select Reminders'} options={GetReminderOptions()} onChange={HandleReminderSelection} />
            <Spacer height={2} />

            {/* INCLUDING WHICH CHILDREN */}
            {Manager.IsValid(children) && (
              <SelectDropdown
                options={childrenDropdownOptions}
                labelText={'Select Children to Include'}
                onChange={HandleChildSelection}
                isMultiple={true}
              />
            )}

            <hr />

            {/* URL/WEBSITE */}
            <InputWrapper
              defaultValue={updatedEvent?.current?.websiteUrl}
              placeholder={'URL/Website'}
              wrapperClasses={Manager.IsValid(updatedEvent?.current?.websiteUrl) ? 'show-label' : ''}
              required={false}
              inputType={InputTypes.url}
              onChange={(e) => (updatedEvent.current.websiteUrl = e.target.value)}
            />

            <AddressInput
              defaultValue={updatedEvent?.current?.address}
              placeholder={'Location'}
              onChange={(address) => (updatedEvent.current.address = address)}
            />

            {/* PHONE */}
            <InputWrapper
              wrapperClasses={Manager.IsValid(updatedEvent?.current?.phone) ? 'show-label' : ''}
              defaultValue={updatedEvent?.current?.phone}
              inputType={InputTypes.phone}
              placeholder={'Phone'}
              onChange={(e) => (updatedEvent.current.phone = StringManager.FormatPhone(e.target.value))}
            />

            {/* NOTES */}
            <InputWrapper
              defaultValue={updatedEvent?.current?.notes}
              placeholder={'Notes'}
              required={false}
              wrapperClasses={Manager.IsValid(updatedEvent?.current?.notes) ? 'show-label textarea' : 'textarea'}
              inputType={InputTypes.textarea}
              onChange={(e) => (updatedEvent.current.notes = e.target.value)}
            />

            {/* IS VISITATION? */}
            <div className="flex visitation-toggle">
              <Label classes="toggle" text={'Visitation Event'} />
              <ToggleButton
                isDefaultChecked={updatedEvent?.current?.fromVisitationSchedule}
                onCheck={() => setIsVisitation(!isVisitation)}
                onUncheck={() => setIsVisitation(!isVisitation)}
              />
            </div>
          </div>
        </div>
      </Form>
    </>
  )
}