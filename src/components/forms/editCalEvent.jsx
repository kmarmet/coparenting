import { child, getDatabase, ref, set } from 'firebase/database'
import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
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
import { MobileDatePicker, MobileDateRangePicker, MobileTimePicker, SingleInputDateRangeField } from '@mui/x-date-pickers-pro'
import CalendarManager from '../../managers/calendarManager'
import Toggle from 'react-toggle'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import 'react-toggle/style.css'
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
import { IoTodayOutline } from 'react-icons/io5'
import { HiOutlineCalendarDays } from 'react-icons/hi2'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import InputWrapper from '../shared/inputWrapper'
import DateManager from '../../managers/dateManager'
import BottomCard from '../shared/bottomCard'
import ObjectManager from '../../managers/objectManager'
import DatasetManager from '../../managers/datasetManager'
import AlertManager from '../../managers/alertManager'
import DB_UserScoped from '@userScoped'

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
  const [eventIsRepeating, setEventIsRepeating] = useState(false)
  const [eventIsDateRange, setEventIsDateRange] = useState(false)
  // State
  const [clonedDatesToSubmit, setClonedDatesToSubmit] = useState([])
  const [repeatingDatesToSubmit, setRepeatingDatesToSubmit] = useState([])
  const [eventLength, setEventLength] = useState(EventLengths.single)
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
    setEventIsRepeating(false)
    setEventIsDateRange(false)
    setClonedDatesToSubmit([])
    setRepeatingDatesToSubmit([])
    setEventLength(EventLengths.single)
    setIsAllDay(false)
    setCoparentsToRemind([])
    setIncludeChildren(false)
    setShowReminders(false)
    setAllEvents([])
    setIsVisitation(false)
    setShowCoparentsToRemind(false)
    setDefaultStartTime(moment())
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
    const eventToEdit = new CalendarEvent()

    // Required
    eventToEdit.id = event?.id
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
    eventToEdit.repeatInterval = event?.repeatInterval
    eventToEdit.fromVisitationSchedule = isVisitation ? true : false
    eventToEdit.morningSummaryReminderSent = false
    eventToEdit.eveningSummaryReminderSent = false
    eventToEdit.sentReminders = []

    if (Manager.isValid(eventToEdit)) {
      if (!eventTitle || eventTitle.length === 0) {
        AlertManager.throwError('Event title is required')
        return false
      }

      if (!Manager.isValid(eventShareWith, true)) {
        AlertManager.throwError('Please select who you would like to share with event with')
        return false
      }
      if (!eventFromDate || eventFromDate.length === 0) {
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
        if (Manager.isValid(clonedDatesToSubmit, true)) {
          await CalendarManager.addMultipleCalEvents(currentUser, clonedDatesToSubmit)
        }

        if (eventIsDateRange) {
          const dates = DateManager.getDateRangeDates(eventToEdit.startDate, eventEndDate)
          await CalendarManager.addMultipleCalEvents(currentUser, dates)
        }

        // Add repeating dates
        if (Manager.isValid(repeatingDatesToSubmit, true)) {
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
          await CalendarManager.addMultipleCalEvents(currentUser, dates)
        }

        // Add cloned dates
        if (Manager.isValid(clonedDatesToSubmit, true)) {
          await CalendarManager.addMultipleCalEvents(DatasetManager.getUniqueArray(clonedDatesToSubmit, true))
        }

        // Add repeating dates
        if (Manager.isValid(repeatingDatesToSubmit, true)) {
          await CalendarManager.addMultipleCalEvents(clonedDatesToSubmit)
        }
      }
    }

    AlertManager.successAlert('Event Updated')
    resetForm()
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

  const handleRemindOthersSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        console.log(coparentsToRemind)
        if (coparentsToRemind?.length === 0) {
          setCoparentsToRemind([e])
        } else {
          if (!coparentsToRemind?.includes(e)) {
            setCoparentsToRemind([...coparentsToRemind, e])
          }
        }
      },
      (e) => {
        let filtered = coparentsToRemind?.filter((x) => x !== e)
        setCoparentsToRemind(filtered)
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
    setEventNotes(event?.notes)
    setEventShareWith(event?.shareWith)
    setDefaultEndTime(DateManager.dateIsValid(event?.endTime) ? moment(event?.endTime, 'hh:mma') : null)
    setDefaultStartTime(DateManager.dateIsValid(event?.startTime) ? moment(event?.startTime, 'hh:mma') : null)

    const checkboxClasses = []

    // Reminder Toggle
    if (Manager.isValid(event?.reminderTimes, true)) {
      checkboxClasses.push('.reminder-times-toggle')
      setShowReminders(true)
    }

    // All Day
    if (event.startTime.length === 0 && event.endTime.length === 0) {
      checkboxClasses.push('.all-day-toggle')
      setIsAllDay(true)
    }

    // Is Visitation
    if (event.fromVisitationSchedule === true) {
      checkboxClasses.push('.visitation-toggle')
      setIsVisitation(true)
    }

    // Includes Children
    if (Manager.isValid(event?.children, true)) {
      document.querySelectorAll('.include-children-checkbox-container').forEach((container) => {
        if (event?.children.includes(container.getAttribute('data-phone'))) {
          container.querySelector('.box').classList.add('active')
          checkboxClasses.push('.children-toggle')
          setIncludeChildren(true)
        }
      })
    }

    if (Manager.isValid(checkboxClasses, true)) {
      for (let checkboxClass of checkboxClasses) {
        const toggle = document.querySelector(`${checkboxClass} .react-toggle`)
        if (toggle) {
          toggle.classList.add('react-toggle--checked')
          toggle.querySelector('input').value = 'on'
        }
      }
    }

    // Repeating
    if (Manager.isValid(event?.repeatInterval) && event?.repeatInterval.length > 0) {
      Manager.setDefaultCheckboxes('repeating', event, 'repeatInterval', false).then((r) => r)
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
    <BottomCard
      refreshKey={refreshKey}
      onDelete={() => {
        AlertManager.confirmAlert(setLocalConfirmMessage(), "I'm Sure", true, async () => {
          await deleteEvent()
          AlertManager.successAlert('Event Deleted')
        })
      }}
      hasDelete={true}
      onSubmit={submit}
      submitText={'Done Editing'}
      onClose={() => {
        onClose(moment(event.startDate))
        resetForm()
      }}
      title={'Edit Event'}
      showCard={showCard}
      className="edit-calendar-event">
      <div id="edit-cal-event-container" className={`${theme} form edit-event-form'`}>
        <div className="content">
          {/* SINGLE DAY / MULTIPLE DAYS */}
          <div id="duration-options" className="action-pills calendar">
            <div className={`duration-option  ${eventLength === 'single' ? 'active' : ''}`} onClick={() => setEventLength(EventLengths.single)}>
              <IoTodayOutline className={'single-day-icon'} />
              <p>Single Day</p>
            </div>
            <div className={`duration-option  ${eventLength === 'multiple' ? 'active' : ''}`} onClick={() => setEventLength(EventLengths.multiple)}>
              <HiOutlineCalendarDays className={'multiple-day-icon'} />
              <p>Multiple Days</p>
            </div>
          </div>

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
            {eventLength === EventLengths.single && (
              <>
                <div className="w-100">
                  <InputWrapper labelText={'Date'} required={true} inputType={'date'}>
                    <MobileDatePicker
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
            {eventLength === EventLengths.multiple && (
              <>
                <div>
                  <InputWrapper wrapperClasses="date-range-input" labelText={'Date Range'} required={true} inputType={'date'}>
                    <MobileDateRangePicker
                      className={'w-100'}
                      onOpen={() => Manager.hideKeyboard('date-range-input')}
                      onAccept={(dateArray) => {
                        if (Manager.isValid(dateArray, true)) {
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
              </>
            )}
          </div>

          {/* EVENT START/END TIME */}
          {!isAllDay && (
            <div className="flex gap">
              {/* START TIME */}
              <div>
                <InputWrapper labelText={'Start Time'} required={false} inputType={'date'}>
                  <MobileTimePicker
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
                    format={'h:mma'}
                    value={moment(defaultEndTime, 'hh:mma')}
                    minutesStep={5}
                    className={`${theme} m-0`}
                    onAccept={(e) => setEventEndTime(e)}
                  />
                </InputWrapper>
              </div>
            </div>
          )}
          {/* WHO IS ALLOWED TO SEE IT? */}
          {Manager.isValid(currentUser?.coparents, true) && currentUser?.accountType === 'parent' && (
            <ShareWithCheckboxes required={true} onCheck={handleShareWithSelection} containerClass={'share-with-coparents'} />
          )}
          {/* ALL DAY / HAS END DATE */}
          <div className="flex all-day-toggle">
            <p>All Day</p>
            <Toggle
              icons={{
                unchecked: null,
              }}
              className={'ml-auto'}
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
                      currentUser?.accountType === 'parent' ? currentUser?.coparents?.map((x) => x.phone) : currentUser?.parents?.map((x) => x.phone)
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
              className={'ml-auto'}
              onChange={(e) => setIsVisitation(!!e.target.checked)}
            />
          </div>
          {/* REMIND COPARENTS */}
          {Manager.isValid(currentUser?.coparents, true) && currentUser?.accountType === 'parent' && (
            <div className="share-with-container">
              <Accordion expanded={showCoparentsToRemind} id={'checkboxes'}>
                <AccordionSummary>
                  <div className="flex">
                    <p>Remind Co-parent(s)</p>
                    <Toggle
                      icons={{
                        checked: <span className="material-icons-round">person</span>,
                        unchecked: null,
                      }}
                      className={'ml-auto reminder-toggle'}
                      onChange={(e) => setShowCoparentsToRemind(!showCoparentsToRemind)}
                    />
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  {currentUser?.accountType === 'parent' && (
                    <CheckboxGroup
                      elClass={`${theme} `}
                      dataPhone={currentUser?.coparents?.map((x) => x.phone)}
                      checkboxLabels={currentUser?.coparents?.map((x) => x.name)}
                      onCheck={handleRemindOthersSelection}
                    />
                  )}
                  {currentUser?.accountType === 'child' && (
                    <CheckboxGroup
                      elClass={`${theme} `}
                      dataPhone={currentUser?.parents?.map((x) => x.phone)}
                      checkboxLabels={currentUser?.parents?.map((x) => x.name)}
                      onCheck={handleRemindOthersSelection}
                    />
                  )}
                </AccordionDetails>
              </Accordion>
            </div>
          )}

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
                    className={'ml-auto'}
                    onChange={(e) => setIncludeChildren(!includeChildren)}
                  />
                </div>
              </AccordionSummary>
              <AccordionDetails>
                <div id="include-children-checkbox-container">
                  <CheckboxGroup
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
          defaultValue={eventWebsiteUrl}
          labelText={'URL/Website'}
          required={false}
          inputType={'input'}
          inputClasses="mt-15"
          onChange={(e) => setEventWebsiteUrl(e.target.value)}></InputWrapper>

        {/* LOCATION/ADDRESS */}
        <InputWrapper labelText={'Location'} required={false} inputType={'location'}>
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
          onChange={(e) => setEventNotes(e.target.value)}></InputWrapper>
      </div>
    </BottomCard>
  )
}