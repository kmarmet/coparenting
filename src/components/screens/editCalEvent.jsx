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
import Confirm from '@components/shared/confirm'
import BottomButton from 'components/shared/bottomButton'
import { useSwipeable } from '../../../node_modules/react-swipeable/es/index'
import CalendarMapper from 'mappers/calMapper'
import { default as MultiDatePicker } from '@rsuite/multi-date-picker'
import DateFormats from '../../constants/dateFormats'
import DatetimePickerViews from '../../constants/datetimePickerViews'
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
  uniqueArray,
  getFileExtension,
} from '../../globalFunctions'
import CardConfirm from '../shared/cardConfirm'
import SecurityManager from '../../managers/securityManager'

export default function EditCalEvent() {
  const { state, setState } = useContext(globalState)
  const { currentUser, calEventToEdit, formToShow } = state
  const [eventFromDate, setEventFromDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventWebsiteUrl, setEventWebsiteUrl] = useState('')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventNotes, setEventNotes] = useState('')
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [eventChildren, setEventChildren] = useState([])
  const [eventReminderTimes, setEventReminderTimes] = useState([])
  const [eventShareWith, setEventShareWith] = useState([])
  const [eventLength, setEventLength] = useState(EventLengths.single)
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('')
  const [deleteRepeatingConfirmTitle, setDeleteRepeatingConfirmTitle] = useState('')
  const [editRepeatingConfirmTitle, setEditRepeatingConfirmTitle] = useState('')
  const [editSingleConfirmTitle, setEditSingleConfirmTitle] = useState('')
  const [clonedDatesToSubmit, setClonedDatesToSubmit] = useState([])
  const [repeatingDatesToSubmit, setRepeatingDatesToSubmit] = useState([])
  const [isAllDay, setIsAllDay] = useState(false)
  const [error, setError] = useState('')
  const [errorFields, setErrorFields] = useState([])
  const [remindCoparents, setRemindCoparents] = useState(false)
  const [includeChildren, setIncludeChildren] = useState(false)
  const [showReminders, setShowReminders] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {},
    onSwipedDown: () => {
      resetForm()
      setState({ ...state, formToShow: '', showShortcutMenu: true })
    },
    preventScrollOnSwipe: true,
  })

  const resetForm = () => {
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
    setDeleteConfirmTitle('')
    setDeleteRepeatingConfirmTitle('')
    setEditRepeatingConfirmTitle('')
    setEditSingleConfirmTitle('')
    setClonedDatesToSubmit([])
    setRepeatingDatesToSubmit([])
    setIsAllDay(false)
    setError('')
  }

  // SUBMIT
  const submit = async (eventEditCount) => {
    const dbRef = ref(getDatabase())

    // Set new event values
    const eventToEdit = new CalendarEvent()

    // Required
    eventToEdit.id = calEventToEdit.id
    eventToEdit.title = Manager.isValid(eventTitle) ? eventTitle : ''
    eventToEdit.shareWith = Manager.isValid(eventShareWith)
      ? Manager.getUniqueArray(eventShareWith).flat()
      : Manager.getUniqueArray(calEventToEdit.shareWith).flat() || []
    eventToEdit.fromDate = DateManager.dateIsValid(eventFromDate) ? moment(eventFromDate).format(DateFormats.dateForDb) : ''
    eventToEdit.toDate = DateManager.dateIsValid(eventEndDate) ? moment(eventEndDate).format(DateFormats.dateForDb) : ''
    eventToEdit.startTime = DateManager.dateIsValid(eventStartTime) ? moment(eventStartTime, DateFormats.timeForDb).format(DateFormats.timeForDb) : ''
    eventToEdit.endTime = DateManager.dateIsValid(eventEndTime) ? moment(eventEndTime, DateFormats.timeForDb).format(DateFormats.timeForDb) : ''

    // Not Required
    eventToEdit.phone = currentUser.phone
    eventToEdit.createdBy = currentUser.name
    eventToEdit.notes = eventNotes || ''
    eventToEdit.reminderTimes = eventReminderTimes || []
    eventToEdit.children = eventChildren || []
    eventToEdit.directionsLink = Manager.isValid(eventLocation) ? Manager.getDirectionsLink(eventLocation) : ''
    eventToEdit.location = eventLocation || ''

    // Add birthday cake
    if (eventToEdit.title.toLowerCase().indexOf('birthday') > -1) {
      eventToEdit.title += ' 🎂'
    }
    eventToEdit.websiteUrl = eventWebsiteUrl || ''
    eventToEdit.repeatInterval = ''
    eventToEdit.fromVisitationSchedule = false
    eventToEdit.morningSummaryReminderSent = false
    eventToEdit.eveningSummaryReminderSent = false
    eventToEdit.sentReminders = []

    // Cloned Events
    if (eventEditCount === 'multiple') {
      // Get record key
      const key = await DB.getSnapshotKey(DB.tables.calendarEvents, calEventToEdit, 'id')

      // Update DB
      await set(child(dbRef, `${DB.tables.calendarEvents}/${key}`), eventToEdit).finally(async () => {
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
      const key = await DB.getSnapshotKey(DB.tables.calendarEvents, calEventToEdit, 'id')
      await DB.updateEntireRecord(`${DB.tables.calendarEvents}/${key}`, eventToEdit).then(async (result) => {
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
    setState({ ...state, currentScreen: ScreenNames.calendar, showBackButton: false })
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
    await Manager.handleShareWithSelection(e, currentUser, eventShareWith).then((updated) => {
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

  const handleAllDaySelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setIsAllDay(true)
      },
      (e) => {
        setIsAllDay(false)
      },
      false
    )
  }

  const setDefaultValues = () => {
    setEventTitle(calEventToEdit.title)
    setEventFromDate(calEventToEdit.fromDate)
    setEventEndDate(calEventToEdit.toDate)
    setEventLocation(calEventToEdit.location)
    setEventStartTime(calEventToEdit.startTime)
    setEventEndTime(calEventToEdit.endTime)

    // Coparent sharewith

    // Children

    // Reminders
    const times = Manager.setDefaultCheckboxes('reminderTimes', calEventToEdit, 'reminderTimes', true)
    setEventReminderTimes(times || [])

    // Repeating
    if (Manager.isValid(calEventToEdit.repeatInterval) && calEventToEdit.repeatInterval.length > 0) {
      Manager.setDefaultCheckboxes('repeating', calEventToEdit, 'repeatInterval', false)
    }
  }

  const deleteEvent = async () => {
    const whenDone = () => {
      setState({ ...state, formToShow: '' })
    }

    const allEvents = await SecurityManager.getCalendarEvents(currentUser)
    const eventCount = allEvents.filter((x) => x.title === calEventToEdit.title).length
    if (eventCount === 1) {
      await DB.delete(DB.tables.calendarEvents, calEventToEdit.id).finally(whenDone)
    } else {
      let clonedEvents = await DB.getTable(DB.tables.calendarEvents)
      clonedEvents = clonedEvents.filter((x) => x.title === calEventToEdit.title)
      for (const event of clonedEvents) {
        await CalendarManager.deleteEvent(DB.tables.calendarEvents, event.id).finally(whenDone)
      }
    }
  }

  useEffect(() => {
    if (calEventToEdit.hasOwnProperty('title') && calEventToEdit !== undefined) {
      setDefaultValues()
    }
    setState({
      ...state,
      showBackButton: false,
      showMenuButton: false,
    })
    Manager.toggleForModalOrNewForm('show')
    setEventLength(EventLengths.single)
  }, [])

  return (
    <div id="edit-cal-wrapper">
      {/* CONFIRMS */}
      <>
        {/* DELETE - SINGLE */}
        <Confirm
          onAccept={async () => {
            await deleteEvent('single')
            setDeleteConfirmTitle('')
          }}
          onReject={() => setDeleteConfirmTitle('')}
          onCancel={() => setDeleteConfirmTitle('')}
          title={deleteConfirmTitle}
          message={`Are you sure you would like to delete ${calEventToEdit?.title}?`}
        />
        {/*  EDIT -SINGLE */}
        <Confirm
          onAccept={async () => {
            if (eventTitle.length > 0 && eventShareWith.length > 0) {
              await submit('single')
            } else {
              setTimeout(() => {
                setState({ ...state, showAlert: true, alertMessage: 'Please' + ' fill out required fields', alertType: 'error' })
              }, 500)
            }
            setEditSingleConfirmTitle('')
          }}
          type="default"
          buttonsText={["I'm Sure", 'Nevermind']}
          onReject={() => {
            setEditSingleConfirmTitle('')
          }}
          onCancel={() => setEditSingleConfirmTitle('')}
          title={editSingleConfirmTitle}
          message={`Are you sure you would like to edit this event?`}
        />
        {/*  MULTIPLE CONFIRM - DELETE */}
        <Confirm
          onAccept={async () => {
            await deleteEvent('multiple')
            setDeleteRepeatingConfirmTitle('')
          }}
          onCancel={() => setDeleteRepeatingConfirmTitle('')}
          buttonsText={['All Events', 'Just this Event']}
          onReject={async () => {
            await deleteEvent('single')
          }}
          title={deleteRepeatingConfirmTitle}
          message={`Would you like to delete all events with this information or just this one?`}
        />
        {/*  MULTIPLE CONFIRM - EDIT*/}
        <Confirm
          onAccept={async () => {
            if (Manager.validation([eventTitle, eventShareWith]) > 0) {
              setState({ ...state, showAlert: true, alertMessage: 'Please fill out required fields', alertType: 'error' })
              return false
            }
            await submit('multiple')
            setEditRepeatingConfirmTitle('')
          }}
          type="default"
          onCancel={() => setEditRepeatingConfirmTitle('')}
          buttonsText={['All Events', 'Just this Event']}
          onReject={async () => {
            await submit('single')
          }}
          title={editRepeatingConfirmTitle}
          message={`Would you like to edit all events that include these details or just this one?`}
        />
      </>
      <p className="screen-title ">Edit Event</p>
      <BottomButton
        elClass={'submit green'}
        onClick={async () => {
          const clonedEvents = (await DB.getTable(DB.tables.calendarEvents)).filter((x) => x.title === calEventToEdit.title)
          if (clonedEvents.length > 1) {
            setEditRepeatingConfirmTitle('EDIT REPEATING EVENTS')
          } else {
            setEditSingleConfirmTitle('EDITING EVENT')
          }
        }}
        iconName={'check'}
      />
      <BottomButton
        elClass={'cancel-delete red'}
        onClick={async () => {
          const clonedEvents = (await DB.getTable(DB.tables.calendarEvents)).filter((x) => x.title === calEventToEdit.title)
          if (clonedEvents.length > 1) {
            setDeleteRepeatingConfirmTitle('DELETE REPEATING EVENTS')
          } else {
            setDeleteConfirmTitle('DELETING EVENT')
          }
          setState({ ...state, alertType: 'warning' })
        }}
        iconName={'event_busy'}
        text="DELETE"
      />
      <BottomCard
        className={`${currentUser?.settings?.theme} edit-event-form`}
        onClose={() => {}}
        showCard={formToShow === ScreenNames.editCalendarEvent}
        error={error}
        title={`Edit ${calEventToEdit.title}`}>
        <div {...handlers} id="edit-cal-event-container" className={`${currentUser?.settings?.theme} form`}>
          <CardConfirm
            className={confirmTitle.length > 0 ? 'active' : ''}
            title={confirmTitle}
            message={` Are you sure you would like to delete this event?`}
            onAccept={deleteEvent}
            nevermind={() => setConfirmTitle('')}
          />
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
              defaultValue={calEventToEdit.title}
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
                      defaultValue={moment(calEventToEdit.fromDate)}
                      className={`${currentUser?.settings?.theme} ${errorFields.includes('date') ? 'required-field-error' : ''} m-0 w-100 event-from-date mui-input`}
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
                      className={`${currentUser?.settings?.theme} event-date-range m-0 w-100`}
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
                    className={`${currentUser?.settings?.theme} event-date-range m-0 w-100`}
                    onAccept={(e) => setEventStartTime(e)}
                    minutesStep={5}
                    defaultValue={DateManager.dateIsValid(calEventToEdit.startTime) ? moment(calEventToEdit?.startTime, DateFormats.timeForDb) : null}
                  />
                </div>
                <div>
                  <label>End time</label>
                  <MobileTimePicker
                    className={`${currentUser?.settings?.theme} event-date-range m-0 w-100`}
                    minutesStep={5}
                    onAccept={(e) => setEventEndTime(e)}
                    defaultValue={DateManager.dateIsValid(calEventToEdit.endTime) ? moment(calEventToEdit?.endTime, DateFormats.timeForDb) : null}
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
            {(currentUser.coparents.length > 0 || currentUser.parents.length > 0) && (
              <div className={`share-with-container `}>
                <label>
                  <span className="material-icons-round mr-10">visibility</span> Who is allowed to see it?
                  <span className="asterisk">*</span>
                </label>
                <CheckboxGroup
                  elClass={`${currentUser?.settings?.theme} ${errorFields.includes('share-with') ? 'required-field-error' : ''}`}
                  dataPhone={
                    currentUser.accountType === 'parent' ? currentUser.coparents.map((x) => x.phone) : currentUser.parents.map((x) => x.phone)
                  }
                  labels={currentUser.accountType === 'parent' ? currentUser.coparents.map((x) => x.name) : currentUser.parents.map((x) => x.name)}
                  onCheck={handleShareWithSelection}
                />
              </div>
            )}

            {/* REMINDER */}
            {(currentUser.coparents.length > 0 || currentUser.parents.length > 0) && !isAllDay && (
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
                        elClass={`${currentUser?.settings?.theme} `}
                        boxWidth={50}
                        skipNameFormatting={true}
                        dataPhone={
                          currentUser.accountType === 'parent' ? currentUser.coparents.map((x) => x.phone) : currentUser.parents.map((x) => x.phone)
                        }
                        labels={['At time of event', '5 minutes before', '30 minutes before', '1 hour before']}
                        onCheck={handleReminderSelection}
                      />
                    </Accordion.Panel>
                  </Accordion>
                </div>
              </>
            )}

            {/* SEND NOTIFICATION TO */}
            {(!currentUser.accountType || currentUser.accountType === 'parent') && (
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
                      elClass={`${currentUser?.settings?.theme} `}
                      dataPhone={
                        currentUser.accountType === 'parent' ? currentUser.coparents.map((x) => x.phone) : currentUser.parents.map((x) => x.phone)
                      }
                      labels={
                        currentUser.accountType === 'parent' ? currentUser.coparents.map((x) => x.name) : currentUser.parents.map((x) => x.name)
                      }
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
                    <CheckboxGroup
                      elClass={`${currentUser?.settings?.theme} `}
                      labels={currentUser.children.map((x) => x['general'].name)}
                      onCheck={handleChildSelection}
                    />
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
          <textarea onChange={(e) => setEventNotes(e.target.value)}></textarea>
          <div className="flex buttons gap">
            <button className="button card-button" onClick={submit}>
              Done Editing <span className="material-icons-round ml-10 fs-22">check</span>
            </button>
            <button className="button card-button delete" onClick={async () => setConfirmTitle(`Deleting ${calEventToEdit.title}`)}>
              Delete <span className="material-icons-round ml-10 fs-22">delete</span>
            </button>
          </div>
        </div>
      </BottomCard>
    </div>
  )
}
