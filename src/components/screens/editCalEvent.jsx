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

export default function EditCalEvent() {
  const { state, setState } = useContext(globalState)
  const { currentUser, calEventToEdit } = state
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
  const [eventRepeatInterval, setEventRepeatInterval] = useState('')
  const [eventLength, setEventLength] = useState(EventLengths.single)
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('')
  const [deleteRepeatingConfirmTitle, setDeleteRepeatingConfirmTitle] = useState('')
  const [editRepeatingConfirmTitle, setEditRepeatingConfirmTitle] = useState('')
  const [editSingleConfirmTitle, setEditSingleConfirmTitle] = useState('')
  const [expandAccordion, setExpandAccordion] = useState(false)
  const [clonedDatesToSubmit, setClonedDatesToSubmit] = useState([])
  const [repeatingDatesToSubmit, setRepeatingDatesToSubmit] = useState([])
  const [childrenAccIsExpanded, setChildrenAccIsExpanded] = useState(false)
  const [reminderAccIsExpanded, setReminderAccIsExpanded] = useState(false)
  const [repeatAccIsExpanded, setRepeatAccIsExpanded] = useState(false)
  const [shareWithAccIsExpanded, setShareWithAccIsExpanded] = useState(false)
  const [isAllDay, setIsAllDay] = useState(false)
  const [showCloneInput, setShowCloneInput] = useState(false)
  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      console.log('User Swiped!', eventData)
      setState({ ...state, currentScreen: ScreenNames.calendar })
    },
    preventScrollOnSwipe: true,
  })

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

  const handleRepeatingSelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        let selection = ''
        if (e.toLowerCase().indexOf('week') > -1) {
          selection = 'weekly'
        }
        if (e.toLowerCase().indexOf('bi') > -1) {
          selection = 'biweekly'
        }
        if (e.toLowerCase().indexOf('daily') > -1) {
          selection = 'daily'
        }
        if (e.toLowerCase().indexOf('monthly') > -1) {
          selection = 'monthly'
        }
        setEventRepeatInterval(selection)
        setShowCloneInput(false)
      },
      (e) => {
        if (eventRepeatInterval.toLowerCase() === e.toLowerCase()) {
          setEventRepeatInterval('')
          setShowCloneInput(true)
        }
      },
      false
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

    // CHECKBOXES
    // All Day
    if (calEventToEdit.startTime.length === 0) {
      const allDayCheckbox = document.querySelector(`[data-label='All Day']`)
      allDayCheckbox.querySelector('.box').classList.remove('active')
    }

    // Coparent sharewith
    const coparentCheckboxes = document.querySelector('.share-with-container.share-with').querySelectorAll('[data-phone]')
    coparentCheckboxes.forEach((checkboxContainer) => {
      const shareWithIsValid = Manager.isValid(calEventToEdit.shareWith, true, false, false)
      if (shareWithIsValid && calEventToEdit.shareWith.includes(checkboxContainer.getAttribute('data-phone'))) {
        checkboxContainer.querySelector('.box').classList.add('active')
        setEventShareWith(Manager.getUniqueArray([...calEventToEdit.shareWith, checkboxContainer.getAttribute('data-phone')]) || [])
      }
    })

    // Children
    const childrenShareWithContainer = document.querySelector('.share-with-container.children')
    if (Manager.isValid(childrenShareWithContainer)) {
      const childrenCheckboxes = childrenShareWithContainer.querySelectorAll('[data-label]')
      childrenCheckboxes.forEach((childLabel) => {
        const childrenIsValid = Manager.isValid(calEventToEdit.children, true, false, false)
        if (childrenIsValid && calEventToEdit.children.includes(childLabel.getAttribute('data-label'))) {
          childLabel.querySelector('.box').classList.add('active')
          setEventChildren(Manager.getUniqueArray([...calEventToEdit.children, childLabel.getAttribute('data-label')]) || [])
        }
      })
    }

    // Reminders
    const times = Manager.setDefaultCheckboxes('reminderTimes', calEventToEdit, 'reminderTimes', true)
    setEventReminderTimes(times || [])

    // Repeating
    if (Manager.isValid(calEventToEdit.repeatInterval) && calEventToEdit.repeatInterval.length > 0) {
      Manager.setDefaultCheckboxes('repeating', calEventToEdit, 'repeatInterval', false)
    }
  }

  const deleteEvent = async (eventCount) => {
    const whenDone = () => {
      setState({
        ...state,
        currentScreen: ScreenNames.calendar,
      })
    }
    if (eventCount === 'single') {
      console.log(calEventToEdit)
      await DB.delete(DB.tables.calendarEvents, calEventToEdit.id).finally(whenDone)
    } else {
      let clonedEvents = await DB.getTable(DB.tables.calendarEvents)
      clonedEvents = clonedEvents.filter((x) => x.title === calEventToEdit.title)
      for (const event of clonedEvents) {
        await CalendarManager.deleteEvent(DB.tables.calendarEvents, event.id).finally(whenDone)
      }
    }
  }

  const setClonedAndRepeating = (arr, type) => {
    let returnArr = []

    // Build date object
    arr.forEach((date) => {
      const dateObject = new CalendarEvent()
      console.log(DateManager.dateIsValid(eventStartTime))
      // Required
      dateObject.title = calEventToEdit.title || eventTitle
      dateObject.id = Manager.getUid()
      dateObject.fromDate = DateManager.dateIsValid(eventFromDate) ? moment(eventFromDate).format(DateFormats.dateForDb) : ''
      dateObject.toDate = DateManager.dateIsValid(eventEndDate) ? moment(eventEndDate).format(DateFormats.dateForDb) : ''
      dateObject.startTime = DateManager.dateIsValid(eventStartTime) ? moment(eventStartTime).format(DateFormats.timeForDb) : ''
      dateObject.endTime = DateManager.dateIsValid(eventEndTime) ? moment(eventEndTime).format(DateFormats.timeForDb) : ''
      dateObject.shareWith = eventShareWith
      // Not Required
      dateObject.phone = currentUser.phone
      dateObject.createdBy = currentUser.name
      dateObject.directionsLink = eventLocation || ''
      dateObject.location = eventLocation || ''
      dateObject.children = eventChildren || []
      dateObject.notes = eventNotes || ''
      dateObject.websiteUrl = eventWebsiteUrl || ''
      dateObject.reminderTimes = eventReminderTimes || []
      dateObject.sentReminders = []
      dateObject.repeatInterval = eventRepeatInterval || ''
      dateObject.fromVisitationSchedule = false
      dateObject.morningSummaryReminderSent = false
      dateObject.eveningSummaryReminderSent = false

      // Push
      returnArr.push(dateObject)
    })

    if (type === 'cloned') {
      setClonedDatesToSubmit(returnArr)
    } else {
      setRepeatingDatesToSubmit(arr)
    }
    return returnArr
  }

  useEffect(() => {
    setDefaultValues()
    setState({
      ...state,
      currentScreen: ScreenNames.editCalendarEvent,
      previousScreen: ScreenNames.calendar,
      showBackButton: true,
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
                setState({ ...state, showAlert: true, alertMessage: 'Please' + ' fill out required fields' })
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
            console.log(Manager.validation([eventTitle, eventShareWith]) > 0)
            if (Manager.validation([eventTitle, eventShareWith]) > 0) {
              setState({ ...state, showAlert: true, alertMessage: 'Please fill out required fields' })
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
      <div {...handlers} id="edit-cal-event-container" className={`${currentUser?.settings?.theme} page-container form`}>
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
          <input defaultValue={calEventToEdit.title} className="mb-0 w-100 event-title" type="text" onChange={(e) => setEventTitle(e.target.value)} />
          {/* DATE */}
          <div className="flex mt-15 mb-15" id={'date-input-container'}>
            {eventLength === EventLengths.single && (
              <>
                <div className="w-100">
                  <label>
                    Date <span className="asterisk">*</span>
                  </label>
                  <MobileDatePicker
                    className={`${currentUser?.settings?.theme} m-0 w-100 event-from-date`}
                    onAccept={(e) => setEventFromDate(e)}
                    defaultValue={moment(calEventToEdit.fromDate)}
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

            {!isAllDay && (
              <>
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
              </>
            )}
          </div>

          {/* ALL DAY / HAS END DATE */}
          <CheckboxGroup
            defaultLabel={!DateManager.dateIsValid(calEventToEdit?.startTime) ? 'All Day' : null}
            labels={['All Day']}
            skipNameFormatting={true}
            onCheck={handleAllDaySelection}
          />

          {/* NOTES/LOCATION/URL */}
          <Accordion className="mb-15">
            <p
              className={expandAccordion ? 'accordion-header open' : 'accordion-header'}
              onClick={(e) => {
                setExpandAccordion(!expandAccordion)
              }}>
              Add Website-Notes-Location <span className={'material-icons-round'}>{expandAccordion ? 'remove' : 'add'}</span>
            </p>
            <Accordion.Panel expanded={expandAccordion === true}>
              <div id="url-notes-container">
                <input
                  placeholder={Manager.isValid(calEventToEdit.link, false, false, true) ? calEventToEdit.link : 'Website'}
                  type="url"
                  onChange={(e) => setEventWebsiteUrl(e.target.value)}
                  className="mb-10"
                />

                {/* LOCATION/ADDRESS */}
                <Autocomplete
                  defaultValue={calEventToEdit.location}
                  placeholder={`Location`}
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
                <textarea
                  defaultValue={calEventToEdit?.notes}
                  placeholder={Manager.isValid(calEventToEdit.notes, false, false, true) ? calEventToEdit.notes : 'Notes'}
                  onChange={(e) => setEventNotes(e.target.value)}></textarea>
              </div>
            </Accordion.Panel>
          </Accordion>

          {/* SHARE WITH */}
          <p className="requirement-text">Required</p>
          <div className="share-with-container share-with">
            <label>
              <span className="material-icons-round warning">visibility</span> Who is allowed to see it? <span className="asterisk">*</span>
            </label>
            <CheckboxGroup
              dataPhone={currentUser.accountType === 'parent' ? currentUser.coparents.map((x) => x.phone) : currentUser.parents.map((x) => x.phone)}
              labels={currentUser.accountType === 'parent' ? currentUser.coparents.map((x) => x.name) : currentUser.parents.map((x) => x.name)}
              onCheck={handleShareWithSelection}
            />
          </div>
          <p className="requirement-text">Optional</p>

          {/* REMINDER */}
          {currentUser && !isAllDay && (
            <>
              <div className="share-with-container mb-5">
                <Accordion>
                  <label onClick={() => setReminderAccIsExpanded(!reminderAccIsExpanded)}>
                    <span className="material-icons mr-10">notification_add</span> Set Reminders
                    <span className={'material-icons-round plus-minus-symbol'}>{reminderAccIsExpanded ? 'remove' : 'add'}</span>
                  </label>
                  <Accordion.Panel expanded={reminderAccIsExpanded}>
                    <CheckboxGroup
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

          {/* NOTIFICATION */}
          <div className="share-with-container mb-5">
            <Accordion>
              <label onClick={() => setShareWithAccIsExpanded(!shareWithAccIsExpanded)}>
                <span className="material-icons-round notifications mr-10">campaign</span>Set Notification Recipient(s)
                <span className={'material-icons-round plus-minus-symbol'}>{shareWithAccIsExpanded ? 'remove' : 'add'}</span>
              </label>
              <Accordion.Panel expanded={shareWithAccIsExpanded}>
                <CheckboxGroup
                  dataPhone={
                    currentUser.accountType === 'parent' ? currentUser.coparents.map((x) => x.phone) : currentUser.parents.map((x) => x.phone)
                  }
                  labels={currentUser.accountType === 'parent' ? currentUser.coparents.map((x) => x.name) : currentUser.parents.map((x) => x.name)}
                  onCheck={handleShareWithSelection}
                />
              </Accordion.Panel>
            </Accordion>
          </div>

          {/* INCLUDING WHICH CHILDREN */}
          {currentUser && Manager.isValid(currentUser.children, true) && (
            <div className="share-with-container mb-5">
              <Accordion>
                <label onClick={() => setChildrenAccIsExpanded(!childrenAccIsExpanded)}>
                  <span className="material-icons mr-10">face</span> Set Included Child(ren)
                  <span className={'material-icons-round plus-minus-symbol'}>{childrenAccIsExpanded ? 'remove' : 'add'}</span>
                </label>
                <Accordion.Panel expanded={childrenAccIsExpanded}>
                  <CheckboxGroup labels={currentUser.children.map((x) => x['general'].name)} onCheck={handleChildSelection} />
                </Accordion.Panel>
              </Accordion>
            </div>
          )}

          {/* REPEATING? */}
          {currentUser.accountType === 'parent' && (
            <>
              {clonedDatesToSubmit.length === 0 && (
                <div className="share-with-container" id="repeating-container">
                  <Accordion>
                    <label onClick={() => setRepeatAccIsExpanded(!repeatAccIsExpanded)}>
                      <span className="material-icons mr-10">event_repeat</span> Set Repeat Interval
                      <span className={'material-icons-round plus-minus-symbol'}>{repeatAccIsExpanded ? 'remove' : 'add'}</span>
                    </label>
                    {/* MONTH TO END REPEATING */}
                    <Accordion.Panel expanded={repeatAccIsExpanded}>
                      <CheckboxGroup onCheck={handleRepeatingSelection} labels={['Daily', 'Weekly', 'Biweekly', 'Monthly']} />
                      {eventRepeatInterval && (
                        <MobileDatePicker
                          className={'mt-0 w-100'}
                          label={'Month to end repeating events'}
                          format={DateFormats.readableMonth}
                          views={DatetimePickerViews.monthAndYear}
                          hasAmPm={false}
                          onAccept={async (e) => {
                            let datesToRepeat = CalendarMapper.repeatingEvents(eventRepeatInterval, eventFromDate, e)
                            setClonedAndRepeating(datesToRepeat, 'repeating')
                          }}
                        />
                      )}
                    </Accordion.Panel>
                  </Accordion>
                </div>
              )}
              {/* ADD TO ANOTHER DATE? - CLONED */}
              {eventRepeatInterval.length === 0 && (
                <>
                  <button
                    className={`${currentUser?.settings?.theme} default center add-clone-button mt-20 mb-10`}
                    onClick={() => setShowCloneInput(true)}>
                    Copy Event to Other Dates
                  </button>
                  {showCloneInput && (
                    <>
                      <label>Set dates to add event to</label>
                      <MultiDatePicker
                        className="multidate-picker"
                        placeholder=""
                        placement="auto"
                        label=""
                        onOpen={() => Manager.hideKeyboard()}
                        onChange={(e) => {
                          const cloned = setClonedAndRepeating(e)
                          setClonedDatesToSubmit(cloned, 'cloned')
                        }}
                      />
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
