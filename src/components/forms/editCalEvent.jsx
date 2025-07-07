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
import useCoParents from '../../hooks/useCoParents'
import useCurrentUser from '../../hooks/useCurrentUser'
import useUsers from '../../hooks/useUsers'
import AlertManager from '../../managers/alertManager'
import CalendarManager from '../../managers/calendarManager.js'
import DropdownManager from '../../managers/dropdownManager'
import LogManager from '../../managers/logManager'
import Manager from '../../managers/manager'
import ObjectManager from '../../managers/objectManager'
import StringManager from '../../managers/stringManager'
import UpdateManager from '../../managers/updateManager'
import CalendarEvent from '../../models/new/calendarEvent'
import AddressInput from '../shared/addressInput'
import DetailBlock from '../shared/detailBlock'
import Form from '../shared/form'
import FormDivider from '../shared/formDivider'
import InputField from '../shared/inputField'
import Label from '../shared/label'
import Map from '../shared/map'
import MultilineDetailBlock from '../shared/multilineDetailBlock'
import SelectDropdown from '../shared/selectDropdown'
import Spacer from '../shared/spacer.jsx'
import ToggleButton from '../shared/toggleButton'
import ViewDropdown from '../shared/viewDropdown'

export default function EditCalEvent({event, showCard, hideCard}) {
  const {state, setState} = useContext(globalState)
  const {theme, dateToEdit} = state

  // Hooks
  const {currentUser} = useCurrentUser()
  const {calendarEvents} = useCalendarEvents(event?.owner?.key)
  const {users} = useUsers()
  const {children} = useChildren()
  const {coParents} = useCoParents()

  // Event Details
  const [eventIsDateRange, setEventIsDateRange] = useState(false)
  const [eventIsRecurring, setEventIsRecurring] = useState(false)
  const [eventIsCloned, setEventIsCloned] = useState(false)

  // State
  const [isVisitation, setIsVisitation] = useState(false)
  const [clonedDates, setClonedDates] = useState([])
  const [view, setView] = useState({label: 'Details', value: 'Details'})

  // Set Default Dropdown Options
  const [selectedChildrenOptions, setSelectedChildrenOptions] = useState(
    DropdownManager.GetSelected.Children(event?.children?.map((x) => x?.general?.name))
  )
  const [selectedReminderOptions, setSelectedReminderOptions] = useState(DropdownManager.GetSelected.Reminders(event?.reminderTimes))
  const [selectedShareWithOptions, setSelectedShareWithOptions] = useState(DropdownManager.GetSelected.ShareWithFromKeys(event?.shareWith, users))
  const [defaultShareWithOptions, setDefaultShareWithOptions] = useState([])

  // REF
  const formRef = useRef({...new CalendarEvent()})

  const ResetForm = async (alertMessage = '') => {
    setTimeout(() => {
      Manager.ResetForm('edit-event-form')
      setEventIsDateRange(false)
      setClonedDates([])
      setIsVisitation(false)
      setEventIsRecurring(false)
      setEventIsCloned(false)
      setView({label: 'Details', value: 'Details'})
      setState({
        ...state,
        successAlertMessage: alertMessage,
        dateToEdit: moment().format(DatetimeFormats.dateForDb),
      })
      hideCard()
    }, 10)
  }

  const EditNonOwnerEvent = async (_formRef) => {
    if (Manager.IsValid(formRef?.current?.shareWith)) {
      // Remove currentUser from original event shareWith
      const shareWithWithoutCurrentUser = event.shareWith.filter((x) => x !== currentUser?.key)
      event.shareWith = shareWithWithoutCurrentUser
      const updateIndex = DB.GetTableIndexById(calendarEvents, formRef?.current?.id)

      if (!Manager.IsValid(updateIndex)) {
        return false
      }

      await CalendarManager.UpdateEvent(formRef?.current?.owner?.key, updateIndex, event)

      // Add cloned event for currentUser
      await CalendarManager.addCalendarEvent(currentUser, _formRef)
      UpdateManager.SendToShareWith(
        shareWithWithoutCurrentUser,
        currentUser,
        'Event Updated',
        `${formRef?.current?.title} has been updated`,
        ActivityCategory.calendar
      )
    }
  }

  // SUBMIT
  const Submit = async () => {
    try {
      let updatedEvent = ObjectManager.merge(event, formRef.current, 'deep')
      console.log(event)
      // Map Dropdown to Database
      updatedEvent.children = DropdownManager.MappedForDatabase.ChildrenFromArray(selectedChildrenOptions)
      updatedEvent.reminderTimes = DropdownManager.MappedForDatabase.RemindersFromArray(selectedReminderOptions)
      updatedEvent.shareWith = DropdownManager.MappedForDatabase.ShareWithFromArray(selectedShareWithOptions)
      updatedEvent.address = formRef.current.address

      // Set Owner
      updatedEvent.owner = {
        key: currentUser?.key,
        name: currentUser?.name,
      }

      // Add birthday cake emoji to title
      if (Manager.Contains(updatedEvent?.title, 'birthday')) {
        updatedEvent.title += ' 🎂'
      }

      if (Manager.IsValid(updatedEvent)) {
        if (!Manager.IsValid(updatedEvent?.title)) {
          AlertManager.throwError('Event name is required')
          return false
        }

        if (!Manager.IsValid(updatedEvent?.startDate)) {
          AlertManager.throwError('Please select a date for this event')
          return false
        }

        if (Manager.IsValid(formRef.current.reminderTimes) && !Manager.IsValid(formRef.current.startTime)) {
          AlertManager.throwError('Please select a start time when using reminders')
          return false
        }

        const dbPath = `${DB.tables.calendarEvents}/${currentUser?.key}`
        const cleaned = ObjectManager.CleanObject(updatedEvent)

        //#region MULTIPLE DAYS
        if (cleaned.isRecurring || cleaned.isDateRange || cleaned.isCloned) {
          //#endregion MULTIPLE DAYS
          const existing = calendarEvents.filter((x) => x.multipleDatesId === cleaned.multipleDatesId)

          if (!Manager.IsValid(existing)) {
            return false
          }

          // Add cloned dates
          if (Manager.IsValid(clonedDates)) {
            // await CalendarManager.addMultipleCalEvents(currentUser, clonedDatesToSubmit)
          }

          if (eventIsDateRange) {
            const dates = await CalendarManager.BuildArrayOfEvents(currentUser, cleaned, 'range', existing[0].startDate, cleaned.endDate)
            await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
          }

          // Add repeating dates
          if (eventIsRecurring) {
            const dates = await CalendarManager.BuildArrayOfEvents(currentUser, cleaned, 'recurring', existing[0]?.startDate, cleaned.endDate)
            await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
          }

          // Delete all before updated
          await DB.deleteMultipleRows(`${DB.tables.calendarEvents}/${currentUser?.key}`, existing, currentUser)
        }
        // Update Single Event
        else {
          if (cleaned?.owner?.key === currentUser?.key) {
            console.log(cleaned?.id)
            const index = DB.GetTableIndexById(calendarEvents, cleaned?.id)
            if (parseInt(index) === -1) return false
            await DB.ReplaceEntireRecord(`${dbPath}/${index}`, cleaned)
          }
        }
        if (cleaned.owner?.key === currentUser?.key) {
          if (Manager.IsValid(updatedEvent?.shareWith)) {
            UpdateManager.SendToShareWith(
              updatedEvent?.shareWith,
              currentUser,
              'Event Updated',
              `${updatedEvent?.title} has been updated`,
              ActivityCategory.calendar
            )
          }
        }
      }

      if (updatedEvent?.owner?.key !== currentUser?.key) {
        await EditNonOwnerEvent(formRef.current)
      }
      await ResetForm('Event Updated')
    } catch (error) {
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
    }
  }

  const DeleteEvent = async () => {
    const eventCount = calendarEvents.filter((x) => x?.title.toLowerCase() === event?.title.toLowerCase())?.length

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
    let message = 'Are you sure you want to delete this event?'

    if (formRef?.current?.isRecurring || formRef?.current?.isCloned || formRef?.current?.isDateRange) {
      message = 'Are you sure you would like to delete ALL events with these details?'
    }

    return message
  }

  const SetDropdownOptions = async () => {
    setSelectedChildrenOptions(DropdownManager.GetSelected.Children(event?.children, children))
    setSelectedReminderOptions(DropdownManager.GetSelected.Reminders(event?.reminderTimes))
    setSelectedShareWithOptions(DropdownManager.GetSelected.ShareWithFromKeys(event?.shareWith, users, false, currentUser?.key))
    setDefaultShareWithOptions(DropdownManager.GetDefault.ShareWith(children, coParents))
    setView({label: 'Details', value: 'Details'})
  }

  useEffect(() => {
    if (Manager.IsValid(event)) {
      const index = DB.GetTableIndexById(calendarEvents, event?.id)
      SetDropdownOptions().then((r) => r)
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
        hasDelete={currentUser?.key === event?.owner?.key}
        onSubmit={Submit}
        submitText={'Update'}
        hasSubmitButton={view?.label === 'Edit'}
        onClose={() => ResetForm()}
        title={StringManager.FormatEventTitle(StringManager.UppercaseFirstLetterOfAllWords(event?.title))}
        showCard={showCard}
        deleteButtonText="Delete"
        wrapperClass={`edit-calendar-event at-top${event?.owner?.key === currentUser?.key ? ' owner' : ' non-owner'}`}
        viewDropdown={<ViewDropdown dropdownPlaceholder="Details" selectedView={view} onSelect={(view) => setView(view)} />}>
        <div id="edit-cal-event-container" className={`${theme} edit-event-form form-container`}>
          <div className={'content-wrapper'}>
            {/* DETAILS */}
            <div className={`view-wrapper${view?.label === 'Details' ? ' details active' : ' details'}`}>
              <Spacer height={15} />
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
                <DetailBlock valueToValidate={event?.owner?.name} text={event?.owner?.name} title={'Creator'} />

                {/*  Shared With */}
                <MultilineDetailBlock
                  title={'Shared with'}
                  array={DropdownManager.GetSelected.ShareWithFromKeys(event?.shareWith, users, true, currentUser?.key)}
                />

                {/* Reminders */}
                <MultilineDetailBlock
                  title={'Reminders'}
                  dataType={MultilineDetailBlockDataTypes.Reminders}
                  array={DropdownManager.GetReadableReminderTimes(event?.reminderTimes)}
                />

                {/* Children */}
                <MultilineDetailBlock title={'Children'} array={event?.children} />

                {/*  Notes */}
                {Manager.IsValid(event?.notes, true) && (
                  <DetailBlock valueToValidate={event?.notes} text={event?.notes} isFullWidth={true} title={'Notes'} />
                )}
              </div>

              {/* Recurring Frequency */}
              {event?.isRecurring && (
                <div className="flex">
                  <MdEventRepeat />
                  <b>DatetimeFormats</b>
                  <span>{StringManager.UppercaseFirstLetterOfAllWords(event?.recurringFrequency)}</span>
                </div>
              )}

              <div className="multiline-blocks">
                {(Manager.IsValid(event?.address) || Manager.IsValid(event?.phone) || Manager.IsValid(event?.websiteUrl)) && (
                  <>
                    <div className="blocks">
                      {/*  Phone */}
                      <DetailBlock
                        valueToValidate={event?.phone}
                        isPhone={true}
                        text={StringManager.FormatPhone(event?.phone)}
                        title={'Call'}
                        topSpacerMargin={8}
                        bottomSpacerMargin={8}
                      />

                      {/*  Website */}
                      <DetailBlock
                        valueToValidate={event?.websiteUrl}
                        linkUrl={event?.websiteUrl}
                        text={decodeURIComponent(event?.websiteUrl)}
                        isLink={true}
                        title={'Website/Link'}
                      />

                      {Manager.IsValid(event?.address) && (
                        <>
                          {/*  Location */}
                          <DetailBlock
                            topSpacerMargin={8}
                            bottomSpacerMargin={8}
                            valueToValidate={event?.address}
                            isNavLink={true}
                            text={event?.address}
                            linkUrl={event?.address}
                            title={'Go'}
                          />
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Map */}
              {Manager.IsValid(event?.address) && <Map locationString={event?.address} />}
            </div>

            {/* EDIT */}
            <div className={`view-wrapper${view?.label === 'Edit' ? ' edit active' : ''}`}>
              <FormDivider text={'Required'} />
              {/* EVENT NAME */}
              <InputField
                inputType={InputTypes.text}
                placeholder={'Event Name'}
                defaultValue={event?.title}
                wrapperClasses="show-label"
                required={true}
                onChange={async (e) => {
                  const inputValue = e.target.value
                  if (inputValue.length > 1) {
                    formRef.current.title = StringManager.FormatEventTitle(inputValue)
                  }
                }}
              />

              <Spacer height={3} />

              {/* DATE */}
              {!eventIsDateRange && (
                <InputField
                  placeholder={'Date'}
                  required={true}
                  inputType={InputTypes.date}
                  onDateOrTimeSelection={(date) => (formRef.current.startDate = moment(date).format(DatetimeFormats.dateForDb))}
                  defaultValue={event?.startDate}
                />
              )}

              <FormDivider text={'Optional'} />

              {/* EVENT START/END TIME */}
              {!eventIsDateRange && (
                <div className={'flex gap'}>
                  {/* START TIME */}
                  <InputField
                    wrapperClasses="start-time"
                    placeholder={'Start Time'}
                    uidClass="event-start-time"
                    required={false}
                    inputType={InputTypes.time}
                    defaultValue={event?.startTime}
                    onDateOrTimeSelection={(e) => (formRef.current.startTime = moment(e).format(DatetimeFormats.timeForDb))}
                  />

                  {/* END TIME */}
                  <InputField
                    uidClass="event-end-time"
                    wrapperClasses="end-time"
                    placeholder={'End Time'}
                    required={false}
                    defaultValue={event?.endTime}
                    inputType={InputTypes.time}
                    onDateOrTimeSelection={(e) => (formRef.current.endTime = moment(e).format(DatetimeFormats.timeForDb))}
                  />
                </div>
              )}

              <Spacer height={3} />

              {/* SHARE WITH */}
              <SelectDropdown
                options={defaultShareWithOptions}
                selectMultiple={true}
                value={selectedShareWithOptions}
                placeholder={'Select Contacts to Share With'}
                onSelect={setSelectedShareWithOptions}
              />

              <Spacer height={3} />

              {/* REMINDERS */}
              <SelectDropdown
                options={DropdownManager.GetDefault.Reminders}
                value={selectedReminderOptions}
                selectMultiple={true}
                placeholder={'Select Reminders'}
                onSelect={setSelectedReminderOptions}
              />

              <Spacer height={3} />

              {/* INCLUDING WHICH CHILDREN */}
              <SelectDropdown
                options={DropdownManager.GetDefault.Children(children)}
                value={selectedChildrenOptions}
                placeholder={'Select Children to Include'}
                onSelect={setSelectedChildrenOptions}
                selectMultiple={true}
              />

              <Spacer height={3} />

              {/* URL/WEBSITE */}
              <InputField
                defaultValue={event?.websiteUrl}
                placeholder={'URL/Website'}
                wrapperClasses={Manager.IsValid(formRef?.current?.websiteUrl) ? 'show-label' : ''}
                required={false}
                inputType={InputTypes.url}
                onChange={(e) => (formRef.current.websiteUrl = e.target.value)}
              />

              <Spacer height={3} />

              {/* ADDRESS */}
              <AddressInput defaultValue={event?.address} placeholder={'Location'} onChange={(address) => (formRef.current.address = address)} />

              <Spacer height={3} />

              {/* PHONE */}
              <InputField
                wrapperClasses={Manager.IsValid(event?.phone) ? 'show-label' : ''}
                defaultValue={event?.phone}
                inputType={InputTypes.phone}
                placeholder={'Phone'}
                onChange={(e) => (formRef.current.phone = StringManager.FormatPhone(e.target.value))}
              />

              <Spacer height={3} />

              {/* NOTES */}
              <InputField
                defaultValue={event?.notes}
                placeholder={'Notes'}
                required={false}
                wrapperClasses={Manager.IsValid(event?.notes) ? 'show-label textarea' : 'textarea'}
                inputType={InputTypes.textarea}
                onChange={(e) => (formRef.current.notes = e.target.value)}
              />

              <Spacer height={3} />

              {/* IS VISITATION? */}
              <div className="flex visitation-toggle">
                <Label classes="toggle" text={'Visitation Event'} />
                <ToggleButton
                  isDefaultChecked={event?.fromVisitationSchedule}
                  onCheck={() => setIsVisitation(!isVisitation)}
                  onUncheck={() => setIsVisitation(!isVisitation)}
                />
              </div>
            </div>
          </div>
        </div>
      </Form>
    </>
  )
}