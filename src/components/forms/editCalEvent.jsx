// Path: src\components\forms\EditCalEvent.jsx
import MultilineDetailBlockDataTypes from 'firebase/compat'
import moment from 'moment'
import React, {useContext, useEffect, useRef, useState} from 'react'
import {MdEventRepeat} from 'react-icons/md'
import ActivityCategory from '../../constants/activityCategory'
import DatetimeFormats from '../../constants/datetimeFormats'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context'
import DB from '../../database/DB'
import useCalendarEvents from '../../hooks/useCalendarEvents'
import useChildren from '../../hooks/useChildren'
import useCurrentUser from '../../hooks/useCurrentUser'
import useUsers from '../../hooks/useUsers'
import AlertManager from '../../managers/alertManager'
import CalendarManager from '../../managers/calendarManager.js'
import DomManager from '../../managers/domManager'
import LogManager from '../../managers/logManager'
import Manager from '../../managers/manager'
import SelectDropdownManager from '../../managers/selectDropdownManager'
import StringManager from '../../managers/stringManager'
import UpdateManager from '../../managers/updateManager'
import AddressInput from '../shared/addressInput'
import DetailBlock from '../shared/detailBlock'
import Form from '../shared/form'
import InputField from '../shared/inputField'
import Label from '../shared/label'
import Map from '../shared/map'
import MultilineDetailBlock from '../shared/multilineDetailBlock'
import SelectDropdown from '../shared/selectDropdown'
import ShareWithDropdown from '../shared/shareWithDropdown'
import Spacer from '../shared/spacer.jsx'
import ToggleButton from '../shared/toggleButton'
import ViewDropdown from '../shared/viewDropdown'

export default function EditCalEvent({event, showCard, hideCard}) {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey, dateToEdit} = state

  // Hooks
  const {currentUser} = useCurrentUser()
  const {calendarEvents} = useCalendarEvents(event?.ownerKey)
  const {users} = useUsers()
  const {children} = useChildren()

  // Event Details
  const [eventIsDateRange, setEventIsDateRange] = useState(false)
  const [eventIsRecurring, setEventIsRecurring] = useState(false)
  const [eventIsCloned, setEventIsCloned] = useState(false)

  // State
  const [isVisitation, setIsVisitation] = useState(false)
  const [clonedDates, setClonedDates] = useState([])
  const [view, setView] = useState('Details')
  const [selectedChildrenOptions, setSelectedChildrenOptions] = useState(
    SelectDropdownManager.GetSelected.Children(event?.children?.map((x) => x?.general?.name))
  )
  const [selectedReminderOptions, setSelectedReminderOptions] = useState(SelectDropdownManager.GetSelected.Reminders(event?.reminderTimes))

  // REF
  const updatedEvent = useRef({...event, startDate: moment(dateToEdit).format(DatetimeFormats.dateForDb)})

  const ResetForm = async (alertMessage = '') => {
    Manager.ResetForm('edit-event-form')
    setEventIsDateRange(false)
    setClonedDates([])
    setIsVisitation(false)
    setEventIsRecurring(false)
    setEventIsCloned(false)
    setView('Details')

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
      updatedEvent.current.isDateRange = eventIsDateRange
      updatedEvent.current.isCloned = eventIsCloned
      updatedEvent.current.isRecurring = eventIsRecurring
      updatedEvent.current.ownerKey = currentUser?.key
      updatedEvent.current.createdBy = currentUser?.name
      updatedEvent.current.directionsLink = Manager.GetDirectionsLink(updatedEvent?.current?.address)
      updatedEvent.current.websiteUrl = updatedEvent?.current?.websiteUrl
      updatedEvent.current.fromVisitationSchedule = isVisitation
      updatedEvent.current.children = Manager.IsValid(selectedChildrenOptions) ? selectedChildrenOptions : event?.children
      updatedEvent.current.reminderTimes = Manager.IsValid(selectedReminderOptions) ? selectedReminderOptions : event?.reminderTimes

      // Add birthday cake
      if (Manager.Contains(updatedEvent?.current?.title, 'birthday')) {
        updatedEvent.current.title += ' 🎂'
      }

      if (Manager.IsValid(updatedEvent.current)) {
        if (!Manager.IsValid(updatedEvent?.current?.title)) {
          AlertManager.throwError('Event name is required')
          return false
        }

        if (!Manager.IsValid(updatedEvent?.current?.startDate)) {
          AlertManager.throwError('Please select a date for this event')
          return false
        }

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
            const dates = await CalendarManager.BuildArrayOfEvents(
              currentUser,
              updatedEvent.current,
              'range',
              existing[0].startDate,
              updatedEvent?.current?.endDate
            )
            await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
          }

          // Add repeating dates
          if (eventIsRecurring) {
            const dates = await CalendarManager.BuildArrayOfEvents(
              currentUser,
              updatedEvent.current,
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
            await DB.updateEntireRecord(`${dbPath}`, updatedEvent?.current, updatedEvent.current.id)
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
        await EditNonOwnerEvent(updatedEvent.current)
      }
      await ResetForm('Event Updated')
    } catch (error) {
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
    }
  }

  const SetDefaultValues = async () => {
    setView('Details')
    setEventIsRecurring(updatedEvent?.current?.isRecurring)
    setEventIsDateRange(updatedEvent?.current?.isDateRange)

    // Repeating
    if (Manager.IsValid(updatedEvent?.current?.recurringInterval)) {
      DomManager.SetDefaultCheckboxes('repeating', event, 'recurringInterval', false)
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

  useEffect(() => {
    if (Manager.IsValid(event)) {
      updatedEvent.current = event
      SetDefaultValues().then((r) => r)
    }
  }, [event])

  return (
    <>
      <Form
        key={refreshKey}
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
        title={StringManager.formatEventTitle(StringManager.UppercaseFirstLetterOfAllWords(updatedEvent?.current?.title))}
        showCard={showCard}
        deleteButtonText="Delete"
        className="Edit-calendar-event"
        viewSelector={
          <ViewDropdown
            show={showCard}
            isMultiple={false}
            dropdownPlaceholder="Details"
            selectedView={[{label: view, value: view}]}
            updateState={(view) => {
              setView(view)
            }}
          />
        }
        wrapperClass={`Edit-calendar-event at-top ${updatedEvent?.current?.ownerKey === currentUser?.key ? 'owner' : 'non-owner'}`}>
        <div id="edit-cal-event-container" className={`${theme} edit-event-form'`}>
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
              <MultilineDetailBlock
                title={'Shared with'}
                array={SelectDropdownManager.GetSelected.ShareWithFromKeys(event?.shareWith, users, true)}
              />

              {/* Reminders */}
              <MultilineDetailBlock
                title={'Reminders'}
                dataType={MultilineDetailBlockDataTypes.Reminders}
                array={SelectDropdownManager.GetReadableReminderTimes(event?.reminderTimes)}
              />

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
                        title={'Navigation'}
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
                <span>{StringManager.UppercaseFirstLetterOfAllWords(updatedEvent?.current?.recurringFrequency)}</span>
              </div>
            )}

            {/* Map */}
            {!DomManager.isMobile() && Manager.IsValid(updatedEvent?.current?.address) && <Map locationString={updatedEvent?.current?.address} />}
          </div>

          {/* EDIT */}
          <div className={view === 'Edit' ? 'view-wrapper edit active content' : 'view-wrapper content edit'}>
            {/* EVENT NAME */}
            <InputField
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
              <InputField
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
                <InputField
                  wrapperClasses="start-time"
                  labelText={'Start Time'}
                  uidClass="event-start-time"
                  required={false}
                  inputType={InputTypes.time}
                  defaultValue={updatedEvent?.current?.startTime}
                  onDateOrTimeSelection={(e) => (updatedEvent.current.startTime = moment(e).format(DatetimeFormats.timeForDb))}
                />

                {/* END TIME */}
                <InputField
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
            <ShareWithDropdown
              selectedValues={Manager.IsValid(updatedEvent?.current?.shareWith) ? updatedEvent?.current?.shareWith : event?.shareWith}
              placeholder={'Share with'}
              required={false}
              onSelection={(e) => (updatedEvent.current.shareWith = e?.map((x) => x.value))}
              containerClass={`share-with-parents`}
            />

            <Spacer height={2} />

            {/* REMINDERS */}
            <SelectDropdown
              options={SelectDropdownManager.GetDefault.Reminders}
              value={SelectDropdownManager.GetSelected.Reminders(selectedReminderOptions ? selectedReminderOptions : event?.reminderTimes)}
              isMultiple={true}
              placeholder={'Select Reminders'}
              onSelection={(e) => setSelectedReminderOptions(e.map((x) => x.value))}
            />

            <Spacer height={2} />

            {/* INCLUDING WHICH CHILDREN */}
            <SelectDropdown
              options={SelectDropdownManager.GetDefault.Children(children)}
              value={SelectDropdownManager.GetSelected.Children(selectedChildrenOptions ? selectedChildrenOptions : event?.children)}
              placeholder={'Select Children to Include'}
              onSelection={(e) => {
                console.log(e)
                setSelectedChildrenOptions(e.map((x) => x.label))
              }}
              isMultiple={true}
            />

            <hr />

            {/* URL/WEBSITE */}
            <InputField
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
            <InputField
              wrapperClasses={Manager.IsValid(updatedEvent?.current?.phone) ? 'show-label' : ''}
              defaultValue={updatedEvent?.current?.phone}
              inputType={InputTypes.phone}
              placeholder={'Phone'}
              onChange={(e) => (updatedEvent.current.phone = StringManager.FormatPhone(e.target.value))}
            />

            {/* NOTES */}
            <InputField
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