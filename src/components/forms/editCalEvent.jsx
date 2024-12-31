import { child, getDatabase, ref, set } from 'firebase/database'
import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import globalState from '../../context'
import DB from '@db'
import Manager from '@manager'
import CheckboxGroup from '@shared/checkboxGroup'
import NotificationManager from '@managers/notificationManager.js'
import CalendarMapper from '../../mappers/calMapper'
import CalMapper from '../../mappers/calMapper'
import DateFormats from '../../constants/dateFormats'
import { MobileDatePicker, MobileDateRangePicker, MobileTimePicker, SingleInputDateRangeField } from '@mui/x-date-pickers-pro'
import CalendarManager from '../../managers/calendarManager'
import Toggle from 'react-toggle'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import { BiSolidNavigation } from 'react-icons/bi'
import 'react-toggle/style.css'
import { Fade } from 'react-awesome-reveal'

import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  hasClass,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../globalFunctions'
import SecurityManager from '../../managers/securityManager'
import ModelNames from '../../models/modelNames'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import InputWrapper from '../shared/inputWrapper'
import DateManager from '../../managers/dateManager'
import BottomCard from '../shared/bottomCard'
import ObjectManager from '../../managers/objectManager'
import DatasetManager from '../../managers/datasetManager'
import AlertManager from '../../managers/alertManager'
import DB_UserScoped from '@userScoped'
import ActivityCategory from '../../models/activityCategory'

export default function EditCalEvent({ event, showCard, onClose }) {
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
  const [eventIsDateRange, setEventIsDateRange] = useState(false)
  // State
  const [clonedDatesToSubmit, setClonedDatesToSubmit] = useState([])
  const [repeatingDatesToSubmit, setRepeatingDatesToSubmit] = useState([])
  const [isAllDay, setIsAllDay] = useState(false)
  const [coparentsToRemind, setCoparentsToRemind] = useState([])
  const [includeChildren, setIncludeChildren] = useState(false)
  const [showReminders, setShowReminders] = useState(false)
  const [allEvents, setAllEvents] = useState([])
  const [isVisitation, setIsVisitation] = useState(false)
  const [showCoparentsToRemind, setShowCoparentsToRemind] = useState(false)
  const [defaultStartTime, setDefaultStartTime] = useState(moment())
  const [defaultEndTime, setDefaultEndTime] = useState(moment())
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [view, setView] = useState('details')
  const [isDateRange, setIsDateRange] = useState(false)
  const resetForm = async () => {
    Manager.resetForm('edit-event-form')
    setEventFromDate('')
    setEventLocation('')
    setEventTitle('')
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
    setCoparentsToRemind([])
    setIncludeChildren(false)
    setShowReminders(false)
    setAllEvents([])
    setIsVisitation(false)
    setShowCoparentsToRemind(false)
    setDefaultEndTime(moment())
    setRefreshKey(Manager.getUid())
    onClose(moment(event.startDate))
    setRefreshKey(Manager.getUid())
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(currentUser.phone)
    setState({ ...state, currentUser: updatedCurrentUser })
  }

  // SUBMIT
  const submit = async () => {
    const dbRef = ref(getDatabase())

    // Set new event values
    const eventToEdit = { ...event }

    // Required
    eventToEdit.title = eventTitle
    eventToEdit.reminderTimes = eventReminderTimes
    eventToEdit.shareWith = DatasetManager.getUniqueArray(eventShareWith).flat() || []
    eventToEdit.startDate = moment(eventFromDate).format(DateFormats.dateForDb)
    eventToEdit.endDate = moment(eventEndDate).format(DateFormats.dateForDb)
    if (!isAllDay) {
      eventToEdit.startTime = moment(eventStartTime, DateFormats.timeForDb).format(DateFormats.timeForDb)
      eventToEdit.endTime = moment(eventEndTime, DateFormats.timeForDb).format(DateFormats.timeForDb)
    }

    // Not Required
    eventToEdit.ownerPhone = currentUser?.phone
    eventToEdit.createdBy = currentUser?.name
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
    eventToEdit.fromVisitationSchedule = isVisitation
    eventToEdit.morningSummaryReminderSent = false
    eventToEdit.eveningSummaryReminderSent = false
    eventToEdit.sentReminders = []

    if (Manager.isValid(eventToEdit)) {
      if (!Manager.isValid(eventTitle)) {
        AlertManager.throwError('Event title is required')
        return false
      }

      const validAccounts = await DB_UserScoped.getValidAccountsForUser(currentUser)

      if (validAccounts > 0) {
        if (!Manager.isValid(eventShareWith)) {
          AlertManager.throwError('Please choose who you would like to share this event with')
          return false
        }
      }
      if (!Manager.isValid(eventFromDate)) {
        AlertManager.throwError('Please select a date for this event')
        return false
      }

      const cleanedObject = ObjectManager.cleanObject(eventToEdit, ModelNames.calendarEvent)
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
        if (Manager.isValid(clonedDatesToSubmit)) {
          await CalendarManager.addMultipleCalEvents(currentUser, clonedDatesToSubmit)
        }

        if (eventIsDateRange) {
          const dates = DateManager.getDateRangeDates(eventToEdit.startDate, eventEndDate)
          await CalendarManager.addMultipleCalEvents(currentUser, dates)
        }

        // Add repeating dates
        if (Manager.isValid(repeatingDatesToSubmit)) {
          await CalendarManager.addMultipleCalEvents(currentUser, clonedDatesToSubmit)
        }
      }

      // Update Single Event
      else {
        const key = await DB.getSnapshotKey(DB.tables.calendarEvents, event, 'id')
        await DB.updateEntireRecord(`${DB.tables.calendarEvents}/${key}`, cleanedObject).then(async (result) => {
          await afterUpdateCallback()
        })

        if (eventIsDateRange) {
          const dates = DateManager.getDateRangeDates(eventToEdit.startDate, eventEndDate)
          const evts = await DB.getTable(DB.tables.calendarEvents)
          const filtered = evts.filter((x) => x.title === event.title && x.isDateRange === true)
          await CalendarManager.addMultipleCalEvents(currentUser, dates)
        }

        // Add cloned dates
        if (Manager.isValid(clonedDatesToSubmit)) {
          await CalendarManager.addMultipleCalEvents(DatasetManager.getUniqueArray(clonedDatesToSubmit, true))
        }

        // Add repeating dates
        if (Manager.isValid(repeatingDatesToSubmit)) {
          await CalendarManager.addMultipleCalEvents(clonedDatesToSubmit)
        }
      }
    }

    AlertManager.successAlert('Event Updated')
    await resetForm()
  }

  const afterUpdateCallback = async () => {
    // Share with Notifications
    NotificationManager.sendToShareWith(eventShareWith, currentUser, 'Event Updated', `${eventTitle} has been updated`, ActivityCategory.calendar)

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

  const setDefaultValues = () => {
    setEventTitle(event?.title)
    setEventFromDate(event?.startDate)
    setEventEndDate(event?.endDate)
    setEventLocation(event?.location)
    setEventReminderTimes(event?.reminderTimes || [])
    setEventStartTime(event?.startTime)
    setEventEndTime(event?.endTime)
    setEventNotes(event?.notes)
    setEventShareWith(event?.shareWith)
    setDefaultEndTime(DateManager.isValidDate(event?.endTime) ? moment(event?.endTime, 'hh:mma') : '')
    setDefaultStartTime(DateManager.isValidDate(event?.startTime) ? moment(event?.startTime, 'hh:mma') : '')
    setView('details')
    setIsDateRange(event?.isDateRange)
    setIncludeChildren(Manager.isValid(event?.children))
    setShowReminders(Manager.isValid(event?.reminderTimes))

    // Repeating
    if (Manager.isValid(event?.repeatInterval)) {
      Manager.setDefaultCheckboxes('repeating', event, 'repeatInterval', false).then((r) => r)
    }
  }

  const deleteEvent = async () => {
    const allEvents = await SecurityManager.getCalendarEvents(currentUser).then((r) => r)
    const eventCount = allEvents.filter((x) => x.title === eventTitle).length
    if (eventCount === 1) {
      await DB.delete(DB.tables.calendarEvents, event?.id)
      await resetForm()
    } else {
      let clonedEvents = await SecurityManager.getCalendarEvents(currentUser).then((r) => r)
      if (Manager.isValid(clonedEvents)) {
        clonedEvents = clonedEvents.filter((x) => x.title === event?.title)
        for (const event of clonedEvents) {
          await CalendarManager.deleteEvent(DB.tables.calendarEvents, event.id)
        }
        await resetForm()
      }
    }
  }

  const getEventCount = () => allEvents.filter((x) => x.title === eventTitle).length

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

  useEffect(() => {
    if (Manager.isValid(event)) {
      setDefaultValues()
    }
  }, [event])

  useEffect(() => {
    setAllCalEvents().then((r) => r)
  }, [])

  return (
    <BottomCard
      refreshKey={refreshKey}
      onDelete={() => {
        AlertManager.confirmAlert(setLocalConfirmMessage(), "I'm Sure", true, async () => {
          await deleteEvent()
          AlertManager.successAlert('Event Deleted')
        })
      }}
      hasDelete={view === 'edit'}
      onSubmit={submit}
      submitText={'Done Editing'}
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

        {view === 'details' && (
          <Fade direction={'up'} duration={600} triggerOnce={true}>
            <div id="details">
              <div className="flex">
                <b>Title:</b>
                <p>{uppercaseFirstLetterOfAllWords(event?.title)}</p>
              </div>
              {!event?.isDateRange && DateManager.isValidDate(event?.startDate) && (
                <div className="flex">
                  <b>Date:</b>
                  <p>{moment(event?.startDate).format(DateFormats.readableMonthAndDay)}</p>
                </div>
              )}
              {event?.isDateRange && DateManager.isValidDate(event?.endDate) && (
                <>
                  <b>Dates</b>
                  <p>
                    {moment(event?.startDate).format(DateFormats.readableMonthAndDay)}&nbsp;to&nbsp;
                    {moment(event?.endDate).format(DateFormats.readableMonthAndDay)}
                  </p>
                </>
              )}
              {DateManager.isValidDate(event?.startTime) && DateManager.isValidDate(event?.endTime) && (
                <div className="flex">
                  <b>Time:</b>
                  <p>
                    {event?.startTime} to {event?.endTime}
                  </p>
                </div>
              )}
              {DateManager.isValidDate(event?.startTime) && !DateManager.isValidDate(event?.endTime) && (
                <div className="flex">
                  <b>Time:</b>
                  <p>{event?.startTime}</p>
                </div>
              )}
              {Manager.isValid(event?.children) && (
                <div id="children">
                  <b>Children</b>
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
              {Manager.isValid(event?.notes) && (
                <>
                  <b>Notes</b>
                  <p>{event?.notes}</p>
                </>
              )}
              {Manager.isValid(event?.location) && (
                <>
                  <b>Location</b>
                  <p className="mb-10">{event?.location}</p>
                </>
              )}
              {Manager.isValid(event?.location) && (
                <a className="nav-detail" href={event?.directionsLink} target="_blank" rel="noreferrer">
                  <BiSolidNavigation /> Nav
                </a>
              )}
              {Manager.isValid(event?.repeatInterval) && (
                <div className="flex">
                  <b>Repeat Interval:</b>
                  <p>{uppercaseFirstLetterOfAllWords(event?.repeatInterval)}</p>
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

              {/* TITLE */}
              <div className="title-suggestion-wrapper">
                <InputWrapper
                  inputType={'input'}
                  labelText={'Title'}
                  defaultValue={eventTitle}
                  required={true}
                  onChange={async (e) => {
                    const inputValue = e.target.value
                    if (inputValue.length > 1) {
                      setEventTitle(inputValue)
                    }
                  }}
                />
              </div>
              {/* DATE */}
              <div className="flex" id={'date-input-container'}>
                {!isDateRange && (
                  <>
                    <div className="w-100">
                      <InputWrapper labelText={'Date'} required={true} inputType={'date'}>
                        <MobileDatePicker
                          onOpen={addThemeToDatePickers}
                          value={moment(event?.startDate)}
                          className={`${theme} m-0 w-100 event-from-date mui-input`}
                          onAccept={(e) => {
                            setEventFromDate(e)
                          }}
                        />
                      </InputWrapper>
                    </div>
                  </>
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
                            setEventFromDate(moment(dateArray[0]).format('MM/DD/YYYY'))
                            setEventEndDate(moment(dateArray[1]).format('MM/DD/YYYY'))
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
                      value={moment(defaultEndTime, 'hh:mma')}
                      minutesStep={5}
                      className={`${theme} m-0`}
                      onAccept={(e) => setEventEndTime(e)}
                    />
                  </InputWrapper>
                </div>
              </div>
              {/* Share with */}
              {Manager.isValid(currentUser?.coparents) && currentUser?.accountType === 'parent' && (
                <ShareWithCheckboxes required={true} onCheck={handleShareWithSelection} containerClass={'share-with-coparents'} />
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
                            checked: <span className="material-icons-round">notifications</span>,
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
                        defaultLabels={event?.reminderTimes?.map((x) => CalMapper.readableReminderBeforeTimeframes(x))}
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
                          checked: <span className="material-icons-round">face</span>,
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
              defaultValue={event?.websiteUrl}
              labelText={'URL/Website'}
              required={false}
              inputType={'input'}
              onChange={(e) => setEventWebsiteUrl(e.target.value)}
            />

            {/* LOCATION/ADDRESS */}
            <InputWrapper defaultValue={event?.location} labelText={'Location'} required={false} inputType={'location'}>
              <Autocomplete
                placeholder={'Location'}
                defaultValue={event?.location}
                apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
                options={{
                  types: ['geocode', 'establishment'],
                  componentRestrictions: { country: 'usa' },
                }}
                onPlaceSelected={(place) => {
                  setEventLocation(place.formatted_address)
                }}
              />
            </InputWrapper>

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
      </div>
    </BottomCard>
  )
}