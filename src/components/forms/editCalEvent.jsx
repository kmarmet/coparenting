import { child, getDatabase, ref, set } from 'firebase/database'
import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import { Accordion, DateRangePicker } from 'rsuite'
import EventLengths from '@constants/eventLengths'
import globalState from '../../context'
import DB from '@db'
import CalendarEvent from '@models/calendarEvent'
import Manager from '@manager'
import CheckboxGroup from '@shared/checkboxGroup'
import PushAlertApi from '@api/pushAlert'
import NotificationManager from '@managers/notificationManager'
import CalendarMapper from '../../mappers/calMapper'
import CalMapper from '../../mappers/calMapper'
import DateFormats from '../../constants/dateFormats'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import { MobileTimePicker } from '@mui/x-date-pickers'
import CalendarManager from '../../managers/calendarManager'
import Toggle from 'react-toggle'

import {
  confirmAlert,
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  successAlert,
  throwError,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../globalFunctions'
import SecurityManager from '../../managers/securityManager'
import ModelNames from '../../models/modelNames'
import { IoTodayOutline } from 'react-icons/io5'
import { HiOutlineCalendarDays } from 'react-icons/hi2'
import { AiOutlineDelete } from 'react-icons/ai'
import Label from '../shared/label'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'

export default function EditCalEvent({ event, hideCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

  // Event Details
  const [eventFromDate, setEventFromDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventWebsiteUrl, setEventWebsiteUrl] = useState('')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventNotes, setEventNotes] = useState('')
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [eventChildren, setEventChildren] = useState(event?.children || [])
  const [eventReminderTimes, setEventReminderTimes] = useState([])
  const [eventShareWith, setEventShareWith] = useState(event?.shareWith || [])
  // State
  const [clonedDatesToSubmit, setClonedDatesToSubmit] = useState([])
  const [repeatingDatesToSubmit, setRepeatingDatesToSubmit] = useState([])
  const [errorFields, setErrorFields] = useState([])
  const [eventLength, setEventLength] = useState(EventLengths.single)
  const [error, setError] = useState('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [remindCoparents, setRemindCoparents] = useState(false)
  const [includeChildren, setIncludeChildren] = useState(false)
  const [showReminders, setShowReminders] = useState(false)
  const [allEvents, setAllEvents] = useState([])
  const [isVisitation, setIsVisitation] = useState(false)

  const resetForm = () => {
    Manager.resetForm('edit-event-form')
    const toggles = document.querySelectorAll(`.react-toggle`)
    for (let toggle of toggles) {
      toggle.classList.remove('react-toggle--checked')
      toggle.querySelector('input').value = 'off'
    }
    document.querySelectorAll(`.box`).forEach((box) => box.classList.remove('active'))
    setEventFromDate('')
    setEventLocation('')
    setEventTitle('')
    setEventWebsiteUrl('')
    setEventStartTime('')
    setEventNotes('')
    setEventEndDate('')
    setEventEndTime('')
    setEventChildren([])
    setEventReminderTimes([])
    setEventShareWith([])
    setEventLength(EventLengths.single)
    setClonedDatesToSubmit([])
    setRepeatingDatesToSubmit([])
    setIsAllDay(false)
    event = null
    setError('')
    hideCard()
  }

  // SUBMIT
  const submit = async () => {
    const dbRef = ref(getDatabase())

    // Set new event values
    const eventToEdit = new CalendarEvent()

    // Required
    eventToEdit.id = event?.id
    eventToEdit.title = eventTitle
    eventToEdit.reminderTimes = eventReminderTimes
    eventToEdit.shareWith = Manager.getUniqueArray(eventShareWith).flat() || []
    eventToEdit.startDate = moment(eventFromDate).format(DateFormats.dateForDb)
    eventToEdit.endDate = moment(eventEndDate).format(DateFormats.dateForDb)
    eventToEdit.startTime = moment(eventStartTime, DateFormats.timeForDb).format(DateFormats.timeForDb)
    eventToEdit.endTime = moment(eventEndTime, DateFormats.timeForDb).format(DateFormats.timeForDb)

    // Not Required
    eventToEdit.ownerPhone = currentUser.phone
    eventToEdit.createdBy = currentUser.name
    eventToEdit.notes = eventNotes
    eventToEdit.reminderTimes = eventReminderTimes || []
    eventToEdit.children = eventChildren
    eventToEdit.directionsLink = Manager.getDirectionsLink(eventLocation)
    eventToEdit.location = eventLocation

    // Add birthday cake
    if (eventToEdit.title.toLowerCase().indexOf('birthday') > -1) {
      eventToEdit.title += ' 🎂'
    }
    eventToEdit.websiteUrl = eventWebsiteUrl
    eventToEdit.repeatInterval = event?.repeatInterval
    eventToEdit.fromVisitationSchedule = isVisitation ? true : false
    eventToEdit.morningSummaryReminderSent = false
    eventToEdit.eveningSummaryReminderSent = false
    eventToEdit.sentReminders = []

    if (!eventTitle || eventTitle.length === 0) {
      throwError('Event title is required')
      return false
    }

    if (!Manager.isValid(eventShareWith, true)) {
      throwError('Please select who you would like to share with event with')
      return false
    }
    if (!eventFromDate || eventFromDate.length === 0) {
      throwError('Please select a date for this event')
      return false
    }

    const cleanedObject = Manager.cleanObject(eventToEdit, ModelNames.calendarEvent)
    const allEvents = await SecurityManager.getCalendarEvents(currentUser).then((r) => r)
    const eventCount = allEvents.filter((x) => x.title === eventTitle).length

    // Cloned Events
    if (eventCount > 1) {
      // Get record key
      const key = await DB.getSnapshotKey(DB.tables.calendarEvents, event, 'id')

      // Update DB
      await set(child(dbRef, `${DB.tables.calendarEvents}/${key}`), cleanedObject).finally(async () => {
        await afterUpdateCallback()
      })

      // Add cloned dates
      if (Manager.isValid(clonedDatesToSubmit, true)) {
        await CalendarManager.addMultipleCalEvents(Manager.getUniqueArray(clonedDatesToSubmit).flat())
      }

      // Add repeating dates
      if (Manager.isValid(repeatingDatesToSubmit, true)) {
        await CalendarManager.addMultipleCalEvents(clonedDatesToSubmit)
      }
    }

    // Update Single Event
    else {
      const key = await DB.getSnapshotKey(DB.tables.calendarEvents, event, 'id')
      await DB.updateEntireRecord(`${DB.tables.calendarEvents}/${key}`, cleanedObject).then(async (result) => {
        await afterUpdateCallback()
      })

      // Add cloned dates
      if (Manager.isValid(clonedDatesToSubmit, true)) {
        await CalendarManager.addMultipleCalEvents(Manager.getUniqueArray(clonedDatesToSubmit).flat())
      }

      // Add repeating dates
      if (Manager.isValid(repeatingDatesToSubmit, true)) {
        await CalendarManager.addMultipleCalEvents(clonedDatesToSubmit)
      }
    }

    successAlert('Event Updated')
    resetForm()
  }

  const removeError = (field) => {
    const filtered = errorFields.filter((x) => x !== field)
    setErrorFields(filtered)
  }

  const afterUpdateCallback = async () => {
    // Share with Notifications
    for (const phone of eventShareWith) {
      const subId = await NotificationManager.getUserSubId(phone)
      PushAlertApi.sendMessage('Event Updated', `${eventTitle} has been updated`, subId)
    }

    if (navigator.setAppBadge) {
      await navigator.setAppBadge(1)
    }
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

  const handleRemindCoparentsSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        if (remindCoparents?.length === 0) {
          setRemindCoparents([e])
        } else {
          if (!remindCoparents?.includes(e)) {
            setRemindCoparents([...remindCoparents, e])
          }
        }
      },
      (e) => {
        let filtered = remindCoparents?.filter((x) => x !== e)
        setRemindCoparents(filtered)
      },
      true
    )
  }

  const setDefaultValues = () => {
    setEventTitle(event?.title)
    setEventFromDate(event?.startDate)
    setEventEndDate(event?.endDate)
    setEventLocation(event?.location)
    setEventLength(EventLengths.single)
    setEventReminderTimes(event?.reminderTimes || [])
    setEventStartTime(event?.startTime)
    setEventEndTime(event?.endTime)

    const checkboxClasses = []

    // Reminder Toggle
    console.log(event?.reminderTimes)
    if (Manager.isValid(event?.reminderTimes, true)) {
      checkboxClasses.push('.reminder-times')
      setShowReminders(true)
    }

    if (Manager.isValid(checkboxClasses, true)) {
      for (let checkboxClass of checkboxClasses) {
        const toggle = document.querySelector(`${checkboxClass} .react-toggle`)
        toggle.classList.add('react-toggle--checked')
        toggle.querySelector('input').value = 'on'
      }
    }

    // Repeating
    if (Manager.isValid(event?.repeatInterval) && event?.repeatInterval.length > 0) {
      Manager.setDefaultCheckboxes('repeating', event, 'repeatInterval', false)
    }
  }

  const deleteEvent = async () => {
    const allEvents = await SecurityManager.getCalendarEvents(currentUser).then((r) => r)
    const eventCount = allEvents.filter((x) => x.title === eventTitle).length
    if (eventCount === 1) {
      await DB.delete(DB.tables.calendarEvents, event?.id)
      resetForm()
    } else {
      let clonedEvents = await SecurityManager.getCalendarEvents(currentUser).then((r) => r)
      if (Manager.isValid(clonedEvents, true)) {
        clonedEvents = clonedEvents.filter((x) => x.title === event?.title)
        for (const event of clonedEvents) {
          await CalendarManager.deleteEvent(DB.tables.calendarEvents, event.id)
        }
        resetForm()
      }
    }
  }

  const getEventCount = () => {
    const eventCount = allEvents.filter((x) => x.title === eventTitle).length
    return eventCount
  }

  const setLocalConfirmMessage = () => {
    let message = 'Are you sure you want to delete this event?'
    const eventCount = getEventCount()

    if (eventCount > 1) {
      message = 'Are you sure you would like to delete ALL events with these details?'
    }

    return message
  }

  const setAllCalEvents = async () => {
    const allEvents = await SecurityManager.getCalendarEvents(currentUser).then((r) => r)
    setAllEvents(allEvents)
  }

  useEffect(() => {
    if (Manager.isValid(event)) {
      setDefaultValues()
    }
  }, [event])

  useEffect(() => {
    setAllCalEvents().then((r) => r)
    Manager.showPageContainer('show')
  }, [])

  return (
    <div id="edit-cal-event-container" className={`${theme} form edit-event-form'`}>
      <div className="content">
        {/* SINGLE DAY / MULTIPLE DAYS */}
        <div className="action-pills calendar-event">
          <div className={`flex left ${eventLength === 'single' ? 'active' : ''}`} onClick={() => setEventLength(EventLengths.single)}>
            <IoTodayOutline className={'single-day-icon'} />
            <p>Single Day</p>
          </div>
          <div className={`flex right ${eventLength === 'multiple' ? 'active' : ''}`} onClick={() => setEventLength(EventLengths.multiple)}>
            <HiOutlineCalendarDays className={'multiple-day-icon'} />
            <p>Multiple Days</p>
          </div>
        </div>

        {/* TITLE */}
        <Label text={'Title'} required={true}></Label>
        <input
          id="event-title-input"
          value={eventTitle.length > 0 ? eventTitle : ''}
          onChange={(e) => setEventTitle(e.target.value)}
          className={`${errorFields.includes('title') ? 'required-field-error mb-0 w-100' : 'mb-0 w-100'}`}
          type="text"
        />
        {/* DATE */}
        <div className="flex mt-15 mb-15" id={'date-input-container'}>
          {eventLength === EventLengths.single && (
            <>
              <div className="w-100">
                <Label text={'Date'} className="mb-0"></Label>
                <MobileDatePicker
                  defaultValue={moment(event?.startDate)}
                  className={`${theme} ${errorFields.includes('date') ? 'required-field-error' : ''} m-0 w-100 event-from-date mui-input`}
                  onAccept={(e) => {
                    removeError('date')
                    setEventFromDate(e)
                  }}
                />
              </div>
            </>
          )}

          {eventLength === EventLengths.multiple && (
            <>
              <div>
                <Label text={'Date Range'}></Label>
                <DateRangePicker
                  showOneCalendar
                  showHeader={false}
                  editable={false}
                  id="event-date"
                  placement="auto"
                  character=" to "
                  className={`${theme} event-date-range m-0 w-100`}
                  format={'MM/dd/yyyy'}
                  onChange={(e) => {
                    let formattedDates = []
                    if (e && e?.length > 0) {
                      e.forEach((date) => {
                        formattedDates.push(new Date(moment(date).format('MM/DD/YYYY')))
                      })
                      setEventFromDate(formattedDates[0])
                      setEventEndDate(formattedDates[1])
                    }
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* START TIME */}
        {!isAllDay && (
          <div className="flex gap mb-15">
            <div>
              <Label text={'Start Time'}></Label>
              {Manager.isValid(event) && (
                <MobileTimePicker
                  className={`${theme}`}
                  onAccept={(e) => setEventStartTime(e)}
                  minutesStep={5}
                  defaultValue={moment(event?.startTime, 'hh:mma')}
                />
              )}
            </div>

            {/* END TIME */}
            <div>
              <Label text={'End Time'}></Label>
              {Manager.isValid(event) && (
                <MobileTimePicker
                  className={`${theme}`}
                  minutesStep={5}
                  onAccept={(e) => setEventEndTime(e)}
                  defaultValue={moment(event?.endTime, 'hh:mma')}
                />
              )}
            </div>
          </div>
        )}

        {/* ALL DAY / HAS END DATE */}
        <div className="flex">
          <p>All Day</p>
          <Toggle
            icons={{
              unchecked: null,
            }}
            className={'ml-auto reminder-toggle'}
            onChange={(e) => setIsAllDay(!isAllDay)}
          />
        </div>

        {/* IS VISITATION? */}
        <div className="flex">
          <p>Visitation Event</p>
          <Toggle
            icons={{
              unchecked: null,
            }}
            className={'ml-auto reminder-toggle'}
            onChange={(e) => setIsVisitation(!isVisitation)}
          />
        </div>

        {/* WHO IS ALLOWED TO SEE IT? */}
        {Manager.isValid(currentUser?.coparents, true) && currentUser.accountType === 'parent' && (
          <ShareWithCheckboxes
            shareWith={event?.shareWith}
            onCheck={(e) => handleShareWithSelection(e)}
            defaultPhones={event?.shareWith}
            labelText={'Who is allowed to see it?*'}
            containerClass={'share-with-coparents'}
            checkboxLabels={event?.shareWith}
          />
        )}

        {/* REMINDER */}
        {!isAllDay && (
          <>
            <div className="flex reminder-times">
              <p>Remind Me</p>
              <Toggle
                icons={{
                  checked: <span className="material-icons-round">notifications</span>,
                  unchecked: null,
                }}
                className={'ml-auto reminder-toggle'}
                onChange={(e) => setShowReminders(!showReminders)}
              />
            </div>
            <div className="share-with-container mb-5">
              <Accordion>
                <Accordion.Panel expanded={showReminders}>
                  <CheckboxGroup
                    elClass={`${theme} `}
                    containerClass={'reminder-times'}
                    boxWidth={50}
                    defaultLabels={event?.reminderTimes?.map((x) => CalMapper.readableReminderBeforeTimeframes(x))}
                    skipNameFormatting={true}
                    dataPhone={
                      currentUser.accountType === 'parent' ? currentUser?.coparents?.map((x) => x.phone) : currentUser?.parents?.map((x) => x.phone)
                    }
                    checkboxLabels={['At time of event', '5 minutes before', '30 minutes before', '1 hour before']}
                    onCheck={handleReminderSelection}
                  />
                </Accordion.Panel>
              </Accordion>
            </div>
          </>
        )}

        {/* SEND NOTIFICATION TO */}
        {Manager.isValid(currentUser?.coparents, true) && currentUser.accountType === 'parent' && (
          <div className="share-with-container mb-5">
            <div className="flex">
              <p>Remind Co-parent(s)</p>
              <Toggle
                icons={{
                  checked: <span className="material-icons-round">person</span>,
                  unchecked: null,
                }}
                className={'ml-auto reminder-toggle'}
                onChange={(e) => setRemindCoparents(!remindCoparents)}
              />
            </div>
            <Accordion>
              <Accordion.Panel expanded={remindCoparents}>
                <CheckboxGroup
                  elClass={`${theme} `}
                  dataPhone={
                    currentUser.accountType === 'parent' ? currentUser?.coparents.map((x) => x.phone) : currentUser.parents.map((x) => x.phone)
                  }
                  checkboxLabels={
                    currentUser.accountType === 'parent' ? currentUser?.coparents.map((x) => x.name) : currentUser.parents.map((x) => x.name)
                  }
                  onCheck={handleRemindCoparentsSelection}
                />
              </Accordion.Panel>
            </Accordion>
          </div>
        )}

        {/* INCLUDING WHICH CHILDREN */}
        {Manager.isValid(currentUser.children !== undefined, true) && (
          <div className="share-with-container mb-5">
            <div className="flex">
              <p>Include Children</p>
              <Toggle
                icons={{
                  checked: <span className="material-icons-round">face</span>,
                  unchecked: null,
                }}
                className={'ml-auto reminder-toggle'}
                onChange={(e) => setIncludeChildren(!includeChildren)}
              />
            </div>
            <Accordion>
              <Accordion.Panel expanded={includeChildren}>
                <CheckboxGroup
                  elClass={`${theme} `}
                  checkboxLabels={currentUser.children.map((x) => x['general'].name)}
                  onCheck={handleChildSelection}
                />
              </Accordion.Panel>
            </Accordion>
          </div>
        )}
      </div>

      {/* URL/WEBSITE */}
      <Label text={'URL/Website'}></Label>
      <input defaultValue={event?.websiteUrl} type="url" onChange={(e) => setEventWebsiteUrl(e.target.value)} className="mb-10" />

      {/* LOCATION/ADDRESS */}
      <Label text={'Location'}></Label>
      <Autocomplete
        placeholder={event?.location}
        apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
        options={{
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'usa' },
        }}
        className="mb-10"
        onPlaceSelected={(place) => {
          setEventLocation(place.formatted_address)
        }}
      />

      {/* NOTES */}
      <Label text={'Notes'}></Label>
      <textarea defaultValue={event?.notes} onChange={(e) => setEventNotes(e.target.value)}></textarea>
      <div className="flex buttons gap">
        <button className="button card-button" onClick={submit}>
          Done <span className="material-icons-round ml-10 fs-22">check</span>
        </button>
        <button
          className="button card-button delete"
          onClick={() => {
            confirmAlert(setLocalConfirmMessage(), "I'm Sure", true, async () => {
              hideCard()
              await deleteEvent()
              displayAlert('success', 'Event Deleted', 'Event Deleted')
            })
          }}>
          Delete <AiOutlineDelete className={'fs-22 ml-5'} />
        </button>
        <button className="button card-button cancel" onClick={resetForm}>
          Cancel
        </button>
      </div>
    </div>
  )
}
