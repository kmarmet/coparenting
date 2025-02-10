import { child, getDatabase, ref, set } from 'firebase/database'
import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import globalState from '../../context'
import DB from '/src/database/DB'
import Manager from '/src/managers/manager'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import NotificationManager from '/src/managers/notificationManager'
import CalendarMapper from '/src/mappers/calMapper'
import CalMapper from '/src/mappers/calMapper'
import DateFormats from '/src/constants/dateFormats'
import { PiBellSimpleRingingDuotone, PiCalendarDotDuotone, PiGlobeDuotone, PiUserCircleDuotone } from 'react-icons/pi'
import { MobileDatePicker, MobileTimePicker } from '@mui/x-date-pickers-pro'
import { MdNotificationsActive, MdOutlineFaceUnlock } from 'react-icons/md'
import { MdEventRepeat } from 'react-icons/md'
import { CgDetailsMore } from 'react-icons/cg'
import { FaExternalLinkSquareAlt } from 'react-icons/fa'
import { LiaMapMarkedAltSolid } from 'react-icons/lia'
import { IoTimeOutline } from 'react-icons/io5'
import CalendarManager from '/src/managers/calendarManager.js'
import Toggle from 'react-toggle'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import { BiSolidNavigation } from 'react-icons/bi'
import 'react-toggle/style.css'
import { Fade } from 'react-awesome-reveal'
import SecurityManager from '/src/managers/securityManager'
import ModelNames from '/src/models/modelNames'
import ShareWithCheckboxes from '/src/components/shared/shareWithCheckboxes'
import InputWrapper from '/src/components/shared/inputWrapper'
import DateManager from '/src/managers/dateManager'
import BottomCard from '/src/components/shared/bottomCard'
import ObjectManager from '/src/managers/objectManager'
import DatasetManager from '/src/managers/datasetManager'
import AlertManager from '/src/managers/alertManager'
import DB_UserScoped from '/src/database/db_userScoped'
import ActivityCategory from '/src/models/activityCategory'
import StringManager from '/src/managers/stringManager'
import { LuCalendarCheck } from 'react-icons/lu'
import DomManager from '../../managers/domManager.coffee'
import Map from '../shared/map.jsx'
import { FaChildren } from 'react-icons/fa6'
import Spacer from '../shared/spacer.jsx'
import ViewSelector from '../shared/viewSelector'

export default function EditCalEvent({ event, showCard, hideCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, refreshKey } = state

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
  const [recurInterval, setRecurInterval] = useState('')

  // State
  const [clonedDates, setClonedDates] = useState([])
  const [repeatingDatesToSubmit, setRepeatingDatesToSubmit] = useState([])
  const [isAllDay, setIsAllDay] = useState(false)
  const [includeChildren, setIncludeChildren] = useState(false)
  const [showReminders, setShowReminders] = useState(false)
  const [isVisitation, setIsVisitation] = useState(false)
  const [view, setView] = useState('details')
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
    setClonedDates([])
    setRepeatingDatesToSubmit([])
    setIsAllDay(false)
    setIncludeChildren(false)
    setShowReminders(false)
    setIsVisitation(false)
    setEventIsRepeating(false)
    setEventIsCloned(false)
    hideCard()
    await afterUpdateCallback()
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(currentUser.phone)
    setState({ ...state, currentUser: updatedCurrentUser, refreshKey: Manager.getUid() })
  }

  const nonOwnerSubmit = async () => {
    const dbRef = ref(getDatabase())

    // Fill/overwrite
    // Required
    const updatedEvent = { ...event }
    updatedEvent.id = Manager.getUid()
    updatedEvent.title = eventName
    updatedEvent.reminderTimes = eventReminderTimes
    updatedEvent.shareWith = eventShareWith
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
    updatedEvent.repeatInterval = recurInterval
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
        AlertManager.throwError('Event name is required')
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
        const allEvents = await DB.getTable(`${DB.tables.calendarEvents}/${currentUser.phone}`)
        const existing = allEvents.filter((x) => x.multipleDatesId === event?.multipleDatesId)
        if (!Manager.isValid(existing)) {
          return false
        }

        hideCard()
        // Get record key
        const key = await DB.getSnapshotKey(dbPath, event, 'id')

        // Update DB
        await set(child(dbRef, `${dbPath}/${key}`), cleanedObject).finally(async () => {
          await afterUpdateCallback()
        })

        // Events with multiple dates
        if (Manager.isValid(clonedDates)) {
          await CalendarManager.addMultipleCalEvents(currentUser, clonedDates)
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
        await DB.deleteMultipleRows(`${DB.tables.calendarEvents}/${currentUser.phone}`, existing, currentUser)
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
    updatedEvent.startDate = moment(eventStartDate).format(DateFormats.dateForDb)
    updatedEvent.endDate = moment(eventEndDate).format(DateFormats.dateForDb)
    updatedEvent.phone = eventPhone
    updatedEvent.repeatInterval = recurInterval
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
      const dbPath = `${DB.tables.calendarEvents}/${currentUser.phone}`

      // Events with multiple days
      if (event?.isRepeating || event?.isDateRange || event?.isCloned) {
        const allEvents = await DB.getTable(`${DB.tables.calendarEvents}/${currentUser.phone}`)
        const existing = allEvents.filter((x) => x.multipleDatesId === event?.multipleDatesId)

        if (!Manager.isValid(existing)) {
          return false
        }

        hideCard()

        // Add cloned dates
        if (Manager.isValid(clonedDates)) {
          // await CalendarManager.addMultipleCalEvents(currentUser, clonedDatesToSubmit)
        }

        if (eventIsDateRange) {
          const dates = await CalendarManager.buildArrayOfEvents(currentUser, updatedEvent, 'range', existing[0].startDate, eventEndDate)
          await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
        }

        // Add repeating dates
        if (eventIsRepeating) {
          const dates = await CalendarManager.buildArrayOfEvents(currentUser, updatedEvent, 'recurring', existing[0]?.startDate, eventEndDate)
          await CalendarManager.addMultipleCalEvents(currentUser, dates, true)
        }

        // Delete all before updated
        await DB.deleteMultipleRows(`${DB.tables.calendarEvents}/${currentUser.phone}`, existing, currentUser)
      }

      // Update Single Event
      else {
        await DB.updateEntireRecord(`${dbPath}`, cleanedEvent, updatedEvent.id)
      }
    }

    AlertManager.successAlert('Event Updated')
    await resetForm()
  }

  const afterUpdateCallback = async () => {
    // Share with Notifications
    NotificationManager.sendToShareWith(eventShareWith, currentUser, 'Event Updated', `${eventName} has been updated`, ActivityCategory.calendar)
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
    setEventIsRepeating(event?.isRepeating)
    setView('details')
    setRecurInterval(event?.repeatInterval)
    setEventIsDateRange(event?.isDateRange)
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

    if (event?.isRepeating || event?.isCloned) {
      message = 'Are you sure you would like to delete ALL events with these details?'
    }

    return message
  }

  const getTime = (time) => {
    if (Manager.isValid(moment(time, 'hh:mma'))) {
      return moment(time, 'hh:mma')
    } else {
      return null
    }
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
        await resetForm()
      }}
      title={StringManager.uppercaseFirstLetterOfAllWords(event?.title)}
      showCard={showCard}
      className="edit-calendar-event"
      wrapperClass="edit-calendar-event">
      <div id="edit-cal-event-container" className={`${theme} form edit-event-form'`}>
        <ViewSelector
          labels={['details', 'edit']}
          updateState={(labelText) => {
            setView(labelText)
          }}
        />

        {!dataIsLoading && (
          <>
            {view === 'details' && (
              <Fade direction={'up'} duration={600} triggerOnce={true}>
                <div id="details">
                  {!event?.isDateRange && DateManager.isValidDate(event?.startDate) && (
                    <div className="flex">
                      <b>
                        <PiCalendarDotDuotone /> Date
                      </b>
                      <span className="">{moment(event?.startDate).format(DateFormats.readableMonthAndDay)}</span>
                    </div>
                  )}
                  {event?.isDateRange && DateManager.isValidDate(event?.endDate) && (
                    <div className="flex">
                      <b>Dates</b>
                      <span className="">
                        {moment(event?.startDate).format(DateFormats.readableMonthAndDay)}&nbsp;to&nbsp;
                        {moment(event?.endDate).format(DateFormats.readableMonthAndDay)}
                      </span>
                    </div>
                  )}

                  {/* START TIME */}
                  {DateManager.isValidDate(event?.startTime) && DateManager.isValidDate(event?.endTime) && (
                    <div className="flex">
                      <b>
                        <IoTimeOutline />
                        Time
                      </b>
                      <span className="">
                        {event?.startTime} to {event?.endTime}
                      </span>
                    </div>
                  )}

                  {/* END TIME */}
                  {DateManager.isValidDate(event?.startTime) && !DateManager.isValidDate(event?.endTime) && (
                    <div className="flex">
                      <b>
                        <IoTimeOutline />
                        Time
                      </b>
                      <span className="">{event?.startTime}</span>
                    </div>
                  )}

                  {/* SHARE WITH */}
                  {Manager.isValid(eventShareWith) && (
                    <div className="flex">
                      <b>
                        <PiUserCircleDuotone />
                        Shared with
                      </b>
                      <span className="">{shareWithNames?.join(', ')}</span>
                    </div>
                  )}

                  {/* REMINDERS */}
                  {Manager.isValid(event?.reminderTimes) && (
                    <div className="flex reminders">
                      <b>
                        <PiBellSimpleRingingDuotone />
                        Reminders
                      </b>
                      <div id="reminder-times">
                        {Manager.isValid(event?.reminderTimes) &&
                          event?.reminderTimes.map((time, index) => {
                            time = CalMapper.unformattedToReadableTimeframe(time)
                            time = StringManager.uppercaseFirstLetterOfAllWords(time).replaceAll('Of', 'of')
                            return <span key={index}>{time}</span>
                          })}
                      </div>
                    </div>
                  )}

                  {/* CHILDREN */}
                  {Manager.isValid(event?.children) && (
                    <div className="flex children">
                      <b>
                        <FaChildren />
                        Children
                      </b>
                      <div id="children">
                        {Manager.isValid(event?.children) &&
                          event?.children.map((child, index) => {
                            return <span key={index}>{child}</span>
                          })}
                      </div>
                    </div>
                  )}

                  {/* WEBSITE */}
                  {Manager.isValid(event?.websiteUrl) && (
                    <div className="flex" id="website">
                      <b>
                        <PiGlobeDuotone />
                        Website
                      </b>
                      <a className="" href={decodeURIComponent(event?.websiteUrl)} target="_blank">
                        {decodeURIComponent(event?.websiteUrl)}
                        <FaExternalLinkSquareAlt className={'external-icon'} />
                      </a>
                    </div>
                  )}

                  {/* PHONE */}
                  {Manager.isValid(event?.phone) && (
                    <div className="flex">
                      <b>Phone</b>
                      <a className="" href={`tel:${event?.phone}`} target="_blank">
                        {StringManager.getReadablePhoneNumber(event?.phone)}
                      </a>
                    </div>
                  )}

                  {/* NOTES */}
                  {Manager.isValid(event?.notes) && (
                    <div className={`${StringManager.addLongTextClass(event?.notes)} flex`}>
                      <b>
                        <CgDetailsMore />
                        Notes
                      </b>
                      <span className="notes">{event?.notes}</span>
                    </div>
                  )}

                  {/* LOCATION */}
                  {Manager.isValid(event?.location) && (
                    <>
                      <div className="flex">
                        <b>
                          <LiaMapMarkedAltSolid />
                          Location
                        </b>
                        <span>{event?.location}</span>
                      </div>
                      <a className=" nav-detail" href={event?.directionsLink} target="_blank" rel="noreferrer">
                        <BiSolidNavigation /> Navigation
                      </a>
                      <Map key={event?.id} locationString={event?.location} />
                    </>
                  )}

                  {/* REPEAT INTERVAL */}
                  {Manager.isValid(event?.repeatInterval) && (
                    <div className="flex">
                      <b>
                        <MdEventRepeat />
                        Recurrence Interval
                      </b>
                      <span className="">{StringManager.uppercaseFirstLetterOfAllWords(event?.repeatInterval)}</span>
                    </div>
                  )}
                </div>
              </Fade>
            )}

            {view === 'edit' && (
              <Fade direction={'up'} duration={600} triggerOnce={true}>
                <div className="content">
                  {/* EVENT NAME */}
                  <InputWrapper
                    inputType={'input'}
                    labelText={'Event Name'}
                    defaultValue={event?.title}
                    required={true}
                    onChange={async (e) => {
                      const inputValue = e.target.value
                      if (inputValue.length > 1) {
                        setEventName(inputValue)
                      }
                    }}
                  />
                  {/* DATE */}
                  <div className="flex" id={'date-input-container'}>
                    {!eventIsDateRange && (
                      <>
                        {!DomManager.isMobile() && (
                          <InputWrapper labelText={'Date'} required={true} inputType={'date'}>
                            <MobileDatePicker
                              onOpen={addThemeToDatePickers}
                              defaultValue={DateManager.dateOrNull(moment(event?.startDate))}
                              className={`${theme} m-0 w-100 event-from-date mui-input`}
                              yearsPerRow={4}
                              onAccept={(e) => {
                                setEventStartDate(e)
                              }}
                            />
                          </InputWrapper>
                        )}
                        {DomManager.isMobile() && (
                          <InputWrapper
                            defaultValue={moment(event?.startDate)}
                            onChange={(e) => setEventStartDate(moment(e.target.value).format(DateFormats.dateForDb))}
                            useNativeDate={true}
                            labelText={'Date'}
                            inputType={'date'}
                            required={true}
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* EVENT START/END TIME */}
                  {!eventIsDateRange && (
                    <div className="flex gap">
                      {/* START TIME */}
                      <InputWrapper wrapperClasses="start-time" labelText={'Start Time'} required={false} inputType={'date'}>
                        <MobileTimePicker
                          onOpen={addThemeToDatePickers}
                          value={getTime(event?.startTime)}
                          minutesStep={5}
                          key={refreshKey}
                          className={`${theme}`}
                          onAccept={(e) => setEventStartTime(e)}
                        />
                      </InputWrapper>

                      {/* END TIME */}
                      <InputWrapper wrapperClasses="end-time" labelText={'End Time'} required={false} inputType={'date'}>
                        <MobileTimePicker
                          key={refreshKey}
                          onOpen={addThemeToDatePickers}
                          value={getTime(event?.endTime)}
                          minutesStep={5}
                          className={`${theme}`}
                          onAccept={(e) => setEventEndTime(e)}
                        />
                      </InputWrapper>
                    </div>
                  )}
                  {/* Share with */}
                  {Manager.isValid(currentUser?.coparents) && currentUser?.accountType === 'parent' && (
                    <ShareWithCheckboxes
                      required={false}
                      onCheck={handleShareWithSelection}
                      defaultActiveShareWith={event?.shareWith}
                      containerClass={`share-with-coparents`}
                    />
                  )}
                  <Spacer height={5} />
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