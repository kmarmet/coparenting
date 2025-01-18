import { child, getDatabase, ref, set } from 'firebase/database'
import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import globalState from '../../context'
import DB from '../../database/DB'
import Manager from '../../managers/manager'
import CheckboxGroup from '../../components/shared/checkboxGroup'
import NotificationManager from '../../managers/notificationManager'
import CalendarMapper from '../../mappers/calMapper'
import DateFormats from '../../constants/dateFormats'
import { MobileDatePicker, MobileDateRangePicker, MobileTimePicker, SingleInputDateRangeField } from '@mui/x-date-pickers-pro'
import CalendarManager from '../../managers/calendarManager.js'
import Toggle from 'react-toggle'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import { BiSolidNavigation } from 'react-icons/bi'
import 'react-toggle/style.css'
import { Fade } from 'react-awesome-reveal'
import SecurityManager from '../../managers/securityManager'
import ModelNames from '../../models/modelNames'
import ShareWithCheckboxes from '../../components/shared/shareWithCheckboxes'
import InputWrapper from '../../components/shared/inputWrapper'
import DateManager from '../../managers/dateManager'
import BottomCard from '../../components/shared/bottomCard'
import ObjectManager from '../../managers/objectManager'
import DatasetManager from '../../managers/datasetManager'
import AlertManager from '../../managers/alertManager'
import DB_UserScoped from '../../database/db_userScoped'
import ActivityCategory from '../../models/activityCategory'
import StringManager from '../../managers/stringManager'
import { LuCalendarCheck } from 'react-icons/lu'
import { MdNotificationsActive, MdOutlineFaceUnlock } from 'react-icons/md'

export default function EditCalEvent({ event, showCard, onClose }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

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
  const [eventIsRepeating, setEventIsRepeating] = useState(false)
  const [eventIsCloned, setEventIsCloned] = useState(false)

  // State
  const [clonedDatesToSubmit, setClonedDatesToSubmit] = useState([])
  const [repeatingDatesToSubmit, setRepeatingDatesToSubmit] = useState([])
  const [isAllDay, setIsAllDay] = useState(false)
  const [includeChildren, setIncludeChildren] = useState(false)
  const [showReminders, setShowReminders] = useState(false)
  const [isVisitation, setIsVisitation] = useState(false)
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [view, setView] = useState('details')
  const [isDateRange, setIsDateRange] = useState(false)
  const [shareWithNames, setShareWithNames] = useState([])
  const [dataIsLoading, setDataIsLoading] = useState(true)

  const resetForm = async () => {
    Manager.resetForm('edit-event-form')
    setEventStartDate('')
    setEventLocation('')
    setEventName('')
    setEventWebsiteUrl('')
    setEventStartTime('')
    setEventNotes('')
    setEventEndDate('')
    setEventEndTime('')
    setEventChildren(event?.children || [])
    setEventReminderTimes([])
    setEventShareWith(event?.shareWith || [])
    setEventIsDateRange(false)
    setClonedDatesToSubmit([])
    setRepeatingDatesToSubmit([])
    setIsAllDay(false)
    setIncludeChildren(false)
    setShowReminders(false)
    setIsVisitation(false)
    setEventIsRepeating(false)
    setEventIsCloned(false)
    setRefreshKey(Manager.getUid())
    onClose(moment(event.startDate))
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(currentUser.phone)
    setState({ ...state, currentUser: updatedCurrentUser })
  }

  const nonOwnerSubmit = async () => {
    const dbRef = ref(getDatabase())

    // Fill/overwrite
    // Required
    const updatedEvent = { ...event }
    updatedEvent.id = Manager.getUid()
    updatedEvent.title = eventName
    updatedEvent.reminderTimes = eventReminderTimes
    updatedEvent.shareWith = DatasetManager.getUniqueArray(eventShareWith).flat() || []
    updatedEvent.startDate = moment(eventStartDate).format(DateFormats.dateForDb)
    updatedEvent.endDate = moment(eventEndDate).format(DateFormats.dateForDb)

    if (!isAllDay) {
      updatedEvent.startTime = moment(eventStartTime, DateFormats.timeForDb).format(DateFormats.timeForDb)
      updatedEvent.endTime = moment(eventEndTime, DateFormats.timeForDb).format(DateFormats.timeForDb)
    }

    // Not Required
    updatedEvent.ownerPhone = currentUser?.phone
    updatedEvent.createdBy = currentUser?.name
    updatedEvent.notes = eventNotes
    updatedEvent.reminderTimes = eventReminderTimes || []
    updatedEvent.children = eventChildren
    updatedEvent.directionsLink = Manager.getDirectionsLink(eventLocation)
    updatedEvent.location = eventLocation
    updatedEvent.phone = eventPhone
    updatedEvent.isDateRange = eventIsDateRange
    updatedEvent.isCloned = eventIsCloned
    updatedEvent.isRepeating = eventIsRepeating

    // Add birthday cake
    if (Manager.contains(eventName, 'birthday')) {
      updatedEvent.title += ' 🎂'
    }
    updatedEvent.websiteUrl = eventWebsiteUrl
    updatedEvent.fromVisitationSchedule = isVisitation
    updatedEvent.sentReminders = []

    if (Manager.isValid(updatedEvent)) {
      if (!Manager.isValid(eventName)) {
        AlertManager.throwError('Event title is required')
        return false
      }

      if (!Manager.isValid(eventStartDate)) {
        AlertManager.throwError('Please select a date for this event')
        return false
      }

      const cleanedObject = ObjectManager.cleanObject(updatedEvent, ModelNames.calendarEvent)
      const dbPath = `${DB.tables.calendarEvents}/${currentUser.phone}`

      // Update dates with multiple dates
      if (event?.isRepeating || event?.isDateRange || event?.isCloned) {
        // Get record key
        const key = await DB.getSnapshotKey(dbPath, event, 'id')

        // Update DB
        await set(child(dbRef, `${dbPath}/${key}`), cleanedObject).finally(async () => {
          await afterUpdateCallback()
        })

        // Events with multiple dates
        if (Manager.isValid(clonedDatesToSubmit)) {
          await CalendarManager.addMultipleCalEvents(currentUser, clonedDatesToSubmit)
        }

        // Date range
        if (eventIsDateRange) {
          const dates = DateManager.getDateRangeDates(updatedEvent.startDate, eventEndDate)
          await CalendarManager.addMultipleCalEvents(currentUser, dates)
        }

        // Add repeating dates
        if (Manager.isValid(repeatingDatesToSubmit)) {
          await CalendarManager.addMultipleCalEvents(currentUser, repeatingDatesToSubmit)
        }
      }

      // Update Single Event
      else {
        // If event is shared with you AND you are not the owner of the event
        const cleanedEvent = ObjectManager.cleanObject(updatedEvent, ModelNames.calendarEvent)
        await editNonOwnerEvent(dbPath, cleanedEvent)
        await afterUpdateCallback()
      }
    }

    AlertManager.successAlert('Event Updated')
    await resetForm()
  }

  const editNonOwnerEvent = async (dbPath, newEvent) => {
    if (Manager.isValid(event?.shareWith)) {
      // Add cloned event for currentUser
      await CalendarManager.addCalendarEvent(currentUser, newEvent)
      const filteredShareWith = event?.shareWith.filter((x) => x !== currentUser?.phone)
      await CalendarManager.updateEvent(event?.ownerPhone, 'shareWith', filteredShareWith, event?.id)
    }
  }

  // SUBMIT
  const submit = async () => {
    // Set new event values
    const updatedEvent = { ...event }

    // Required
    updatedEvent.title = eventName
    updatedEvent.reminderTimes = eventReminderTimes
    updatedEvent.shareWith = eventShareWith
    console.log(eventStartDate)
    updatedEvent.startDate = moment(eventStartDate).format(DateFormats.dateForDb)
    updatedEvent.endDate = moment(eventEndDate).format(DateFormats.dateForDb)
    updatedEvent.phone = eventPhone
    updatedEvent.isDateRange = eventIsDateRange
    updatedEvent.isCloned = eventIsCloned
    updatedEvent.isRepeating = eventIsRepeating

    if (!isAllDay) {
      updatedEvent.startTime = moment(eventStartTime, DateFormats.timeForDb).format(DateFormats.timeForDb)
      updatedEvent.endTime = moment(eventEndTime, DateFormats.timeForDb).format(DateFormats.timeForDb)
    }

    // Not Required
    updatedEvent.ownerPhone = event.ownerPhone === currentUser?.phone ? currentUser.phone : event.ownerPhone
    updatedEvent.createdBy = currentUser?.name
    updatedEvent.notes = eventNotes
    updatedEvent.reminderTimes = eventReminderTimes || []
    updatedEvent.children = eventChildren
    updatedEvent.directionsLink = Manager.getDirectionsLink(eventLocation)
    updatedEvent.location = eventLocation

    // Add birthday cake
    if (Manager.contains(updatedEvent, 'birthday')) {
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
      const dbPath = `${DB.tables.calendarEvents}/${currentUser.phone}`

      // Events with multiple days
      if (event?.isRepeating || event?.isDateRange || event?.isCloned) {
        // Get record key
        const key = await DB.getSnapshotKey(dbPath, event, 'id')

        // Update DB
        // await set(child(dbRef, `${DB.tables.calendarEvents}/${key}`), cleanedObject).finally(async () => {
        //   await afterUpdateCallback()
        // })

        // Add cloned dates
        if (Manager.isValid(clonedDatesToSubmit)) {
          // await CalendarManager.addMultipleCalEvents(currentUser, clonedDatesToSubmit)
        }

        if (eventIsDateRange) {
          const dates = DateManager.getDateRangeDates(updatedEvent.startDate, eventEndDate)
          // await CalendarManager.addMultipleCalEvents(currentUser, dates)
        }

        // Add repeating dates
        if (Manager.isValid(repeatingDatesToSubmit)) {
          // await CalendarManager.addMultipleCalEvents(currentUser, clonedDatesToSubmit)
        }
      }

      // Update Single Event
      else {
        await DB.updateEntireRecord(`${dbPath}`, cleanedEvent, updatedEvent.id)
        await afterUpdateCallback()
      }
    }

    AlertManager.successAlert('Event Updated')
    await resetForm()
  }

  const afterUpdateCallback = async () => {
    // Share with Notifications
    NotificationManager.sendToShareWith(eventShareWith, currentUser, 'Event Updated', `${eventName} has been updated`, ActivityCategory.calendar)

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

  const setDefaultValues = async () => {
    setEventName(event?.title)
    setEventStartDate(event?.startDate)
    setEventEndDate(event?.endDate)
    setEventLocation(event?.location)
    setEventReminderTimes(event?.reminderTimes || [])
    setEventStartTime(event?.startTime)
    setEventEndTime(event?.endTime)
    setEventNotes(event?.notes)
    setEventShareWith(event?.shareWith ?? [])
    setView('details')
    setIsDateRange(event?.isDateRange)
    setIncludeChildren(Manager.isValid(event?.children))
    setShowReminders(Manager.isValid(event?.reminderTimes))

    if (Manager.isValid(event?.shareWith)) {
      let names = []
      for (let userPhone of event?.shareWith) {
        const coparent = await DB_UserScoped.getCoparentByPhone(userPhone, currentUser)
        names.push(StringManager.formatNameFirstNameOnly(coparent?.name))
      }
      setShareWithNames(names)
    }

    // Repeating
    if (Manager.isValid(event?.repeatInterval)) {
      Manager.setDefaultCheckboxes('repeating', event, 'repeatInterval', false).then((r) => r)
    }
  }

  const deleteEvent = async () => {
    const dbPath = `${DB.tables.calendarEvents}/${currentUser.phone}`

    const allEvents = await SecurityManager.getCalendarEvents(currentUser).then((r) => r)
    const eventCount = allEvents.filter((x) => x.title === eventName).length
    if (eventCount === 1) {
      await CalendarManager.deleteEvent(currentUser, event.id)
      await resetForm()
    } else {
      let clonedEvents = await DB.getTable(`${dbPath}`)
      if (Manager.isValid(clonedEvents)) {
        clonedEvents = clonedEvents.filter((x) => x.title === event?.title)
        await CalendarManager.deleteMultipleEvents(clonedEvents, currentUser)
        await resetForm()
      }
    }
  }

  const setLocalConfirmMessage = () => {
    let message = 'Are you sure you want to delete this event?'

    if (event?.isRepeating) {
      message = 'Are you sure you would like to delete ALL events with these details?'
    }

    return message
  }

  const addThemeToDatePickers = () => {
    setTimeout(() => {
      const datetimeParent = document.querySelector('.MuiDialog-root.MuiModal-root')
      datetimeParent.classList.add(currentUser?.settings?.theme)
    }, 100)
  }

  useEffect(() => {
    const pickers = document.querySelectorAll('[aria-label="Choose time"]')
    if (pickers) {
      pickers.forEach((x) => (x.value = ''))
    }
    if (isAllDay) {
      setEventStartTime('')
      setEventEndTime('')
    }
  }, [isAllDay])

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

  useEffect(() => {
    const confirmButton = document.querySelector('.swal2-confirm')
    const denyButton = document.querySelector('.swal2-deny')
    if (confirmButton && denyButton) {
      confirmButton.classList.add('red')
      denyButton.classList.add('blue')
    }
  }, [document.querySelector('.swal2-confirm')])

  return (
    <BottomCard
      refreshKey={refreshKey}
      onDelete={() => {
        AlertManager.confirmAlert(setLocalConfirmMessage(), "I'm Sure", true, async () => {
          await deleteEvent()
          AlertManager.successAlert('Event Deleted')
        })
      }}
      hasDelete={view === 'edit' && currentUser?.phone === event?.ownerPhone}
      onSubmit={currentUser?.phone === event?.ownerPhone ? submit : nonOwnerSubmit}
      submitText={'Update'}
      submitIcon={<LuCalendarCheck />}
      hasSubmitButton={view === 'edit'}
      onClose={async () => {
        onClose(moment(event.startDate))
        await resetForm()
      }}
      title={'Edit Event'}
      showCard={showCard}
      className="edit-calendar-event"
      wrapperClass="edit-calendar-event">
      <div id="edit-cal-event-container" className={`${theme} form edit-event-form'`}>
        <div className="views-wrapper flex">
          <p className={view === 'details' ? 'view active' : 'view'} onClick={() => setView('details')}>
            Details
          </p>
          <p className={view === 'edit' ? 'view active' : 'view'} onClick={() => setView('edit')}>
            Edit
          </p>
        </div>

        {!dataIsLoading && (
          <>
            {view === 'details' && (
              <Fade direction={'up'} duration={600} triggerOnce={true}>
                <div id="details">
                  <div className="flex">
                    <b>Event Name:</b>
                    <span className="low-opacity-text">{StringManager.uppercaseFirstLetterOfAllWords(event?.title)}</span>
                  </div>
                  {!event?.isDateRange && DateManager.isValidDate(event?.startDate) && (
                    <div className="flex">
                      <b>Date:</b>
                      <span className="low-opacity-text">{moment(event?.startDate).format(DateFormats.readableMonthAndDay)}</span>
                    </div>
                  )}
                  {event?.isDateRange && DateManager.isValidDate(event?.endDate) && (
                    <div className="flex wrap no-gap">
                      <b className="w-100">Dates</b>
                      <span className="low-opacity-text">
                        {moment(event?.startDate).format(DateFormats.readableMonthAndDay)}&nbsp;to&nbsp;
                        {moment(event?.endDate).format(DateFormats.readableMonthAndDay)}
                      </span>
                    </div>
                  )}
                  {DateManager.isValidDate(event?.startTime) && DateManager.isValidDate(event?.endTime) && (
                    <div className="flex">
                      <b>Time:</b>
                      <span className="low-opacity-text">
                        {event?.startTime} to {event?.endTime}
                      </span>
                    </div>
                  )}
                  {DateManager.isValidDate(event?.startTime) && !DateManager.isValidDate(event?.endTime) && (
                    <div className="flex">
                      <b>Time:</b>
                      <span className="low-opacity-text">{event?.startTime}</span>
                    </div>
                  )}
                  {Manager.isValid(event?.reminderTimes) && (
                    <div className="flex wrap no-gap">
                      <b className="w-100">Reminders</b>
                      <span
                        className="low-opacity-text"
                        dangerouslySetInnerHTML={{
                          __html: `${event?.reminderTimes
                            .map((x) => CalendarMapper.readableReminderBeforeTimeframes(x))
                            .join('|')
                            .replaceAll('|', '<span class="divider">|</span>')}`,
                        }}></span>
                    </div>
                  )}
                  {Manager.isValid(eventShareWith) && (
                    <div className="flex mt-10">
                      <b>Shared with:</b>
                      <span className="low-opacity-text">{shareWithNames?.join(', ')}</span>
                    </div>
                  )}
                  {Manager.isValid(event?.children) && (
                    <div className="flex wrap no-gap">
                      <b className="w-100">Children</b>
                      <p
                        dangerouslySetInnerHTML={{
                          __html: `${event?.children.join('|').replaceAll('|', '<span class="divider">|</span>')}`,
                        }}></p>
                    </div>
                  )}
                  {Manager.isValid(event?.websiteUrl) && (
                    <div className="flex">
                      <b>Website:</b>
                      <a href={event?.websiteUrl} target="_blank">
                        {event?.websiteUrl}
                      </a>
                    </div>
                  )}
                  {Manager.isValid(event?.phone) && (
                    <div className="flex">
                      <b>Phone:</b>
                      <a href={`tel:${event?.phone}`} target="_blank">
                        {StringManager.getReadablePhoneNumber(event?.phone)}
                      </a>
                    </div>
                  )}
                  {Manager.isValid(event?.notes) && (
                    <div className="flex wrap no-gap">
                      <p className="w-100">
                        <b>Notes</b>
                      </p>
                      <span>{event?.notes}</span>
                    </div>
                  )}
                  {Manager.isValid(event?.location) && (
                    <>
                      <div className="flex wrap location">
                        <b className="w-100">Location</b>
                        <p>{event?.location}</p>
                      </div>
                      <a className="nav-detail" href={event?.directionsLink} target="_blank" rel="noreferrer">
                        <BiSolidNavigation /> Nav
                      </a>
                    </>
                  )}
                  {Manager.isValid(event?.repeatInterval) && (
                    <div className="flex">
                      <b>Repeat Interval:</b>
                      <span className="low-opacity-text">{StringManager.uppercaseFirstLetterOfAllWords(event?.repeatInterval)}</span>
                    </div>
                  )}
                </div>
              </Fade>
            )}

            {view === 'edit' && (
              <Fade direction={'up'} duration={600} triggerOnce={true}>
                <div className="content">
                  {/* SINGLE DAY / MULTIPLE DAYS */}
                  {/*<div id="duration-options" className="action-pills calendar">*/}
                  {/*  <div className={`duration-option  ${eventLength === 'single' ? 'active' : ''}`} onClick={() => setEventLength(EventLengths.single)}>*/}
                  {/*    <p>Single Day</p>*/}
                  {/*  </div>*/}
                  {/*  <div*/}
                  {/*    className={`duration-option  ${eventLength === 'multiple' ? 'active' : ''}`}*/}
                  {/*    onClick={() => setEventLength(EventLengths.multiple)}>*/}
                  {/*    <p>Multiple Days</p>*/}
                  {/*  </div>*/}
                  {/*</div>*/}

                  {/* EVENT NAME */}
                  <div className="title-suggestion-wrapper">
                    <InputWrapper
                      inputType={'input'}
                      labelText={'Event Name'}
                      defaultValue={eventName}
                      required={true}
                      onChange={async (e) => {
                        const inputValue = e.target.value
                        if (inputValue.length > 1) {
                          setEventName(inputValue)
                        }
                      }}
                    />
                  </div>
                  {/* DATE */}
                  <div className="flex" id={'date-input-container'}>
                    {!isDateRange && (
                      <InputWrapper labelText={'Date'} required={true} inputType={'date'}>
                        <MobileDatePicker
                          onOpen={addThemeToDatePickers}
                          defaultValue={DateManager.dateOrNull(moment(eventStartDate))}
                          className={`${theme} m-0 w-100 event-from-date mui-input`}
                          yearsPerRow={4}
                          onAccept={(e) => {
                            setEventStartDate(e)
                          }}
                        />
                      </InputWrapper>
                    )}

                    {/* DATE RANGE */}
                    {isDateRange && (
                      <div className="w-100">
                        <InputWrapper wrapperClasses="date-range-input" labelText={'Date Range'} required={true} inputType={'date'}>
                          <MobileDateRangePicker
                            className={'w-100'}
                            onOpen={() => {
                              Manager.hideKeyboard('date-range-input')
                              addThemeToDatePickers()
                            }}
                            defaultValue={[moment(event?.startDate), moment(event?.endDate)]}
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
                      </div>
                    )}
                  </div>

                  {/* EVENT START/END TIME */}
                  <div className="flex gap">
                    {/* START TIME */}
                    <div>
                      <InputWrapper labelText={'Start Time'} required={false} inputType={'date'}>
                        <MobileTimePicker
                          onOpen={addThemeToDatePickers}
                          format={'h:mma'}
                          placeholder={''}
                          value={moment(eventStartTime, 'hh:mma')}
                          minutesStep={5}
                          className={`${theme} m-0`}
                          onAccept={(e) => setEventStartTime(e)}
                        />
                      </InputWrapper>
                    </div>

                    {/* END TIME */}
                    <div>
                      <InputWrapper labelText={'End Time'} required={false} inputType={'date'}>
                        <MobileTimePicker
                          onOpen={addThemeToDatePickers}
                          format={'h:mma'}
                          value={moment(eventEndTime, 'hh:mma')}
                          minutesStep={5}
                          className={`${theme} m-0`}
                          onAccept={(e) => setEventEndTime(e)}
                        />
                      </InputWrapper>
                    </div>
                  </div>
                  {/* Share with */}
                  {Manager.isValid(currentUser?.coparents) && currentUser?.accountType === 'parent' && (
                    <ShareWithCheckboxes
                      required={false}
                      onCheck={handleShareWithSelection}
                      defaultActiveShareWith={eventShareWith}
                      containerClass={`share-with-coparents`}
                    />
                  )}
                  {/* ALL DAY / HAS END DATE */}
                  <div className={!DateManager.isValidDate(event?.startTime) ? 'flex all-day-toggle default-checked' : 'flex all-day-toggle'}>
                    <p>All Day</p>
                    <Toggle
                      icons={{
                        unchecked: null,
                      }}
                      className={'ml-auto'}
                      defaultChecked={!DateManager.isValidDate(event?.startTime) && !DateManager.isValidDate(event?.endTime)}
                      onChange={(e) => setIsAllDay(!!e.target.checked)}
                    />
                  </div>

                  {/* REMINDER */}
                  {!isAllDay && (
                    <>
                      <Accordion expanded={showReminders} id={'checkboxes'}>
                        <AccordionSummary>
                          <div className="flex reminder-times-toggle">
                            <p>Remind Me</p>
                            <Toggle
                              icons={{
                                checked: <MdNotificationsActive />,
                                unchecked: null,
                              }}
                              defaultChecked={Manager.isValid(event?.reminderTimes)}
                              className={'ml-auto reminder-toggle'}
                              onChange={(e) => setShowReminders(!showReminders)}
                            />
                          </div>
                        </AccordionSummary>
                        <AccordionDetails>
                          <CheckboxGroup
                            elClass={`${theme} `}
                            containerClass={'reminder-times'}
                            defaultLabels={event?.reminderTimes?.map((x) => CalendarMapper.readableReminderBeforeTimeframes(x))}
                            skipNameFormatting={true}
                            dataPhone={
                              currentUser?.accountType === 'parent'
                                ? currentUser?.coparents?.map((x) => x.phone)
                                : currentUser?.parents?.map((x) => x.phone)
                            }
                            checkboxLabels={['At time of event', '5 minutes before', '30 minutes before', '1 hour before']}
                            onCheck={handleReminderSelection}
                          />
                        </AccordionDetails>
                      </Accordion>
                    </>
                  )}

                  {/* IS VISITATION? */}
                  <div className="flex visitation-toggle">
                    <p>Visitation Event</p>
                    <Toggle
                      icons={{
                        unchecked: null,
                      }}
                      defaultChecked={event?.fromVisitationSchedule}
                      className={'ml-auto'}
                      onChange={(e) => setIsVisitation(!!e.target.checked)}
                    />
                  </div>

                  {/* INCLUDING WHICH CHILDREN */}
                  {currentUser?.accountType === 'parent' && (
                    <Accordion expanded={includeChildren} id={'checkboxes'}>
                      <AccordionSummary>
                        <div className="flex children-toggle">
                          <p>Include Children</p>
                          <Toggle
                            icons={{
                              checked: <MdOutlineFaceUnlock />,
                              unchecked: null,
                            }}
                            defaultChecked={Manager.isValid(event?.children)}
                            className={'ml-auto'}
                            onChange={(e) => setIncludeChildren(!includeChildren)}
                          />
                        </div>
                      </AccordionSummary>
                      <AccordionDetails>
                        <div id="include-children-checkbox-container">
                          <CheckboxGroup
                            defaultLabels={event?.children}
                            containerClass={'include-children-checkbox-container'}
                            checkboxLabels={currentUser?.children?.map((x) => x['general']?.name)}
                            onCheck={handleChildSelection}
                          />
                        </div>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </div>

                {/* URL/WEBSITE */}
                <InputWrapper
                  wrapperClasses="mt-15"
                  defaultValue={event?.websiteUrl}
                  labelText={'URL/Website'}
                  required={false}
                  inputType={'input'}
                  onChange={(e) => setEventWebsiteUrl(e.target.value)}
                />

                {/* LOCATION/ADDRESS */}
                <InputWrapper defaultValue={event?.location} labelText={'Location'} required={false} inputType={'location'}>
                  <Autocomplete
                    defaultValue={Manager.isValid(event?.location, true) ? event?.location : ''}
                    apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
                    options={{
                      types: ['geocode', 'establishment'],
                      componentRestrictions: { country: 'usa' },
                    }}
                    placeholder={''}
                    onPlaceSelected={(place) => {
                      setEventLocation(place.formatted_address)
                    }}
                  />
                </InputWrapper>

                {/* PHONE */}
                <InputWrapper defaultValue={event?.phone} inputValueType="tel" labelText={'Phone'} onChange={(e) => setEventPhone(e.target.value)} />

                {/* NOTES */}
                <InputWrapper
                  defaultValue={event?.notes}
                  labelText={'Notes'}
                  required={false}
                  inputType={'textarea'}
                  onChange={(e) => setEventNotes(e.target.value)}
                />
              </Fade>
            )}
          </>
        )}
        {dataIsLoading && <img id="bottom-card-loading-gif" src={require('../../img/loading.gif')} />}
      </div>
    </BottomCard>
  )
}