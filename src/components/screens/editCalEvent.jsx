import { child, getDatabase, ref, set } from 'firebase/database'
import moment from 'moment'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import { Accordion, DateRangePicker } from 'rsuite'
import EventLengths from '@constants/eventLengths'
import globalState from '../../context'
import DB from '@db'
import CalendarEvent from '@models/calendarEvent'
import Manager from '@manager'
import CheckboxGroup from '@shared/checkboxGroup'
import PushAlertApi from '@api/pushAlert'
import DateManager from '@managers/dateManager'
import NotificationManager from '@managers/notificationManager'
import ScreenNames from '@screenNames'
import { useSwipeable } from '../../../node_modules/react-swipeable/es/index'
import CalendarMapper from 'mappers/calMapper'
import DateFormats from '../../constants/dateFormats'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import { MobileTimePicker } from '@mui/x-date-pickers'
import CalendarManager from '../../managers/calendarManager'
import BottomCard from '../shared/bottomCard'
import Toggle from 'react-toggle'

import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  displayAlert,
  uniqueArray,
  getFileExtension,
} from '../../globalFunctions'
import SecurityManager from '../../managers/securityManager'
import ModelNames from '../../models/modelNames'
import Swal from 'sweetalert2'

export default function EditCalEvent({ event, showCard, hideCard }) {
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
  const [eventReminderTimes, setEventReminderTimes] = useState('')
  const [eventShareWith, setEventShareWith] = useState(event?.shareWith)
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

  const resetForm = () => {
    Manager.resetForm('edit-event-form')
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
    eventToEdit.shareWith = Manager.getUniqueArray(eventShareWith).flat()
    eventToEdit.fromDate = moment(eventFromDate).format(DateFormats.dateForDb)
    eventToEdit.toDate = moment(eventEndDate).format(DateFormats.dateForDb)
    eventToEdit.startTime = moment(eventStartTime, DateFormats.timeForDb).format(DateFormats.timeForDb)
    eventToEdit.endTime = moment(eventEndTime, DateFormats.timeForDb).format(DateFormats.timeForDb)

    // Not Required
    eventToEdit.phone = currentUser.phone
    eventToEdit.createdBy = currentUser.name
    eventToEdit.notes = eventNotes
    eventToEdit.reminderTimes = eventReminderTimes
    eventToEdit.children = eventChildren
    eventToEdit.directionsLink = Manager.getDirectionsLink(eventLocation)
    eventToEdit.location = eventLocation

    // Add birthday cake
    if (eventToEdit.title.toLowerCase().indexOf('birthday') > -1) {
      eventToEdit.title += ' 🎂'
    }
    eventToEdit.websiteUrl = eventWebsiteUrl
    eventToEdit.repeatInterval = event?.repeatInterval
    eventToEdit.fromVisitationSchedule = false
    eventToEdit.morningSummaryReminderSent = false
    eventToEdit.eveningSummaryReminderSent = false
    eventToEdit.sentReminders = []

    const validation = DateManager.formValidation(eventTitle, eventShareWith, eventFromDate)
    if (validation) {
      Swal.fire({
        icon: 'error',
        title: 'Oops',
        text: validation,
        showClass: {
          popup: `
            animate__animated
            animate__fadeInUp
            animate__faster
          `,
        },
        hideClass: {
          popup: `
            animate__animated
            animate__fadeOutDown
            animate__faster
          `,
        },
      })
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
      // Get record key and Update DB
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
    Swal.fire({
      text: 'Event has been created',
      icon: 'success',
      showClass: {
        popup: `
            animate__animated
            animate__fadeInUp
            animate__faster
          `,
      },
      hideClass: {
        popup: `
            animate__animated
            animate__fadeOutDown
            animate__faster
          `,
      },
    })
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
    await Manager.handleShareWithSelection(e, currentUser, event.shareWith).then((updated) => {
      setEventShareWith(updated)
    })
  }

  const handleReminderSelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        let timeframe = CalendarMapper.reminderTimes(e)
        if (eventReminderTimes.length === 0) {
          setEventReminderTimes([timeframe])
        } else {
          setEventReminderTimes([...eventReminderTimes, timeframe])
        }
      },
      (e) => {
        let mapped = CalendarMapper.reminderTimes(e)
        let filtered = eventReminderTimes.filter((x) => x !== mapped)
        setEventReminderTimes(filtered)
      },
      true
    )
  }

  const setDefaultValues = () => {
    setEventTitle(event?.title)
    setEventFromDate(event?.fromDate)
    setEventEndDate(event?.toDate)
    setEventLocation(event?.location)
    setEventStartTime(event?.startTime)
    setEventEndTime(event?.endTime)
    setEventLength(EventLengths.single)

    // Reminders
    const times = Manager.setDefaultCheckboxes('reminderTimes', event, 'reminderTimes', true)
    setEventReminderTimes(times || [])

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
      hideCard()
    } else {
      let clonedEvents = await SecurityManager.getCalendarEvents(currentUser).then((r) => r)
      if (Manager.isValid(clonedEvents, true)) {
        clonedEvents = clonedEvents.filter((x) => x.title === event?.title)
        for (const event of clonedEvents) {
          await CalendarManager.deleteEvent(DB.tables.calendarEvents, event.id)
        }
        hideCard()
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
    <BottomCard className={`${theme} edit-event-form`} onClose={resetForm} showCard={showCard} error={error} title={`Edit Event`}>
      <div id="edit-cal-event-container" className={`${theme} form`}>
        <div className="content">
          {/* SINGLE DAY / MULTIPLE DAYS */}
          <div className="action-pills calendar-event">
            <div className={`flex left ${eventLength === 'single' ? 'active' : ''}`} onClick={() => setEventLength(EventLengths.single)}>
              <span className="material-icons-round">event</span>
              <p>Single Day</p>
            </div>
            <div className={`flex right ${eventLength === 'multiple' ? 'active' : ''}`} onClick={() => setEventLength(EventLengths.multiple)}>
              <span className="material-icons-round">date_range</span>
              <p>Multiple Days</p>
            </div>
          </div>

          {/* TITLE */}
          <label>
            Title<span className="asterisk">*</span>
          </label>
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
                  <label className="mb-0">
                    Date <span className="asterisk">*</span>
                  </label>
                  <MobileDatePicker
                    defaultValue={moment(event?.fromDate)}
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
                  <label>
                    Date Range <span className="asterisk">*</span>
                  </label>
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
          {!isAllDay && (
            <div className="flex gap mb-15">
              <div>
                <label>Start time</label>
                <MobileTimePicker
                  className={`${theme} event-date-range m-0 w-100`}
                  onAccept={(e) => setEventStartTime(e)}
                  minutesStep={5}
                  defaultValue={DateManager.dateIsValid(event?.startTime) ? moment(event?.startTime, DateFormats.timeForDb) : null}
                />
              </div>
              <div>
                <label>End time</label>
                <MobileTimePicker
                  className={`${theme} event-date-range m-0 w-100`}
                  minutesStep={5}
                  onAccept={(e) => setEventEndTime(e)}
                  defaultValue={DateManager.dateIsValid(event?.endTime) ? moment(event?.endTime, DateFormats.timeForDb) : null}
                />
              </div>
            </div>
          )}

          {/* ALL DAY / HAS END DATE */}
          <div className="flex">
            <p>All Day</p>
            <Toggle
              icons={{
                // checked: <span className="material-icons-round">notifications</span>,
                unchecked: null,
              }}
              className={'ml-auto reminder-toggle'}
              onChange={(e) => setIsAllDay(!isAllDay)}
            />
          </div>

          {/* WHO IS ALLOWED TO SEE IT? */}
          {Manager.isValid(currentUser?.coparents, true) ||
            (Manager.isValid(currentUser?.parents, true) && (
              <div className={`share-with-container `}>
                <label>
                  <span className="material-icons-round mr-10">visibility</span> Who is allowed to see it?
                  <span className="asterisk">*</span>
                </label>
                <CheckboxGroup
                  elClass={`${theme} ${errorFields.includes('share-with') ? 'required-field-error' : ''}`}
                  dataPhone={
                    currentUser.accountType === 'parent' ? currentUser?.coparents.map((x) => x.phone) : currentUser.parents.map((x) => x.phone)
                  }
                  labels={currentUser.accountType === 'parent' ? currentUser?.coparents.map((x) => x.name) : currentUser.parents.map((x) => x.name)}
                  onCheck={handleShareWithSelection}
                />
              </div>
            ))}

          {/* REMINDER */}
          {Manager.isValid(currentUser?.coparents, true) ||
            (Manager.isValid(currentUser?.parents, true) && !isAllDay && (
              <>
                <div className="flex">
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
                        boxWidth={50}
                        skipNameFormatting={true}
                        dataPhone={
                          currentUser.accountType === 'parent' ? currentUser?.coparents.map((x) => x.phone) : currentUser.parents.map((x) => x.phone)
                        }
                        labels={['At time of event', '5 minutes before', '30 minutes before', '1 hour before']}
                        onCheck={handleReminderSelection}
                      />
                    </Accordion.Panel>
                  </Accordion>
                </div>
              </>
            ))}

          {/* SEND NOTIFICATION TO */}
          {Manager.isValid(currentUser?.coparents, true) && (!currentUser.accountType || currentUser.accountType === 'parent') && (
            <div className="share-with-container mb-5">
              <div className="flex">
                <p>Remind Coparent(s)</p>
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
                    labels={currentUser.accountType === 'parent' ? currentUser?.coparents.map((x) => x.name) : currentUser.parents.map((x) => x.name)}
                    onCheck={handleShareWithSelection}
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
                  <CheckboxGroup elClass={`${theme} `} labels={currentUser.children.map((x) => x['general'].name)} onCheck={handleChildSelection} />
                </Accordion.Panel>
              </Accordion>
            </div>
          )}
        </div>

        {/* URL/WEBSITE */}
        <label>URL/Website</label>
        <input type="url" onChange={(e) => setEventWebsiteUrl(e.target.value)} className="mb-10" />

        {/* LOCATION/ADDRESS */}
        <label>Location</label>
        <Autocomplete
          placeholder={``}
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
        <label>Notes</label>
        <textarea defaultValue={eventNotes} onChange={(e) => setEventNotes(e.target.value)}></textarea>
        <div className="flex buttons gap">
          <button className="button card-button" onClick={submit}>
            Done Editing <span className="material-icons-round ml-10 fs-22">check</span>
          </button>
          <button
            className="button card-button delete"
            onClick={() => {
              displayAlert('confirm', setLocalConfirmMessage(), setLocalConfirmMessage(), async () => {
                hideCard()
                await deleteEvent()
                displayAlert('success', 'Event Deleted', 'Event Deleted')
              })
            }}>
            Delete <span className="material-icons-round ml-10 fs-22">delete</span>
          </button>
        </div>
      </div>
    </BottomCard>
  )
}
