import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import { Accordion, DatePicker, Dropdown, DateRangePicker } from 'rsuite'
import Autocomplete from 'react-google-autocomplete'
import scheduleTypes from '@constants/scheduleTypes'
import globalState from '../../context'
import DB from '@db'
import CalendarEvent from '@models/calendarEvent'
import Manager from '@manager'
import CheckboxGroup from '@shared/checkboxGroup'
import VisitationManager from '@managers/visitationManager'
import MyConfetti from '@shared/myConfetti'
import Confirm from '@shared/confirm'
import Note from '@shared/note'
import DB_UserScoped from '@userScoped'
import DateManager from 'managers/dateManager'
import VisitationMapper from 'mappers/visitationMapper'
import ScreenNames from '@screenNames'
import Manger from '@manager'
import BottomButton from '../shared/bottomButton'
import { MobileDatePicker } from '@mui/x-date-pickers'
import DateFormats from '../../constants/dateFormats'
import user from '../../models/user'
import CalendarManager from '../../managers/calendarManager'
import CalendarMapper from '../../mappers/calMapper'
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
  uniqueArray,
} from '../../globalFunctions'

export default function Visitation() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [scheduleType, setScheduleType] = useState('')
  const [defaultSelectedWeekends, setDefaultSelectedWeekends] = useState([])
  const [fifthWeekendSelection, setFifthWeekendSelection] = useState('')
  const [shareWith, setShareWith] = useState([])
  const [deleteMessage, setDeleteMessage] = useState('')
  const [firstFFPeriodStart, setFirstFFPeriodStart] = useState('')
  const [firstFFPeriodEnd, setFirstFFPeriodEnd] = useState('')
  const [secondFFPeriodStart, setSecondFFPeriodStart] = useState('')
  const [secondFFPeriodEnd, setSecondFFPeriodEnd] = useState('')
  const [thirdFFPeriodStart, setThirdFFPeriodStart] = useState('')
  const [thirdFFPeriodEnd, setThirdFFPeriodEnd] = useState('')
  const [showFFExample, setShowFFExample] = useState(false)
  const [scheduleAccordionExpanded, setScheduleAccordionExpanded] = useState(false)
  const [visitationAccordionExpanded, setVisitationAccordionExpanded] = useState(false)
  const [firstEveryOtherWeekend, setFirstEveryOtherWeekend] = useState('')
  // Holiday
  const [selectedHolidayDates, setSelectedHolidayDates] = useState([])
  const [holidayLabels, setHolidayLabels] = useState([])
  const [userHolidayEvents, setUserHolidayEvents] = useState([])
  const [dataDates, setDataDates] = useState([])

  const updatePreferredLocation = async (location, link) => {
    await DB_UserScoped.updateUserRecord(DB.tables.users, currentUser.phone, 'preferredTransferLocationDirectionsLink', link)
    await DB_UserScoped.updateUserRecord(DB.tables.users, currentUser.phone, 'preferredTransferLocation', location)
  }

  const deleteSchedule = async () => {
    const scheduleEvents = await VisitationManager.getSchedule(currentUser)
    await VisitationManager.deleteSchedule(scheduleEvents)
    setState({ ...state, alertType: 'success', showAlert: true, alertMessage: 'Schedule Deleted' })
    setDeleteMessage('')
  }

  const resetScreen = () => {
    setScheduleType('')
    setDefaultSelectedWeekends([])
    setFifthWeekendSelection('')
    setShareWith([])
    setDeleteMessage('')
    setFirstFFPeriodStart('')
    setFirstFFPeriodEnd('')
    setSecondFFPeriodStart('')
    setSecondFFPeriodEnd('')
    setThirdFFPeriodStart('')
    setThirdFFPeriodEnd('')
    setShowFFExample(false)
    setVisitationAccordionExpanded(false)
    const checkboxes = document.querySelectorAll('.box')
    checkboxes.forEach((box) => box.classList.remove('active'))
    setTimeout(() => {
      setState({ ...state, showMenuButton: true })
    }, 500)
  }

  // Specific Weekends
  const addSpecificWeekendsToCalendar = async () => {
    if (!Manager.isValid(defaultSelectedWeekends, true) || !Manager.isValid(fifthWeekendSelection)) {
      setState({ ...state, showAlert: true, alertMessage: 'Please choose default weekends and a five-month weekend', alertType: 'error' })
      return false
    }

    if (!Manager.isValid(shareWith, true)) {
      setState({ ...state, showAlert: true, alertMessage: 'Please set who can see the schedule', alertType: 'error' })
      return false
    }
    // Set end date to the end of the year
    const endDate = moment([moment().year()]).endOf('year').format('MM-DD-YYYY')
    let weekends = VisitationManager.getSpecificWeekends(scheduleTypes.variableWeekends, endDate, defaultSelectedWeekends, fifthWeekendSelection)

    // Standard Dates
    let events = []
    weekends.flat().forEach((date) => {
      const dateObject = new CalendarEvent()
      // Required
      dateObject.title = `${currentUser.name.formatNameFirstNameOnly()}'s Scheduled Visitation`
      dateObject.fromDate = moment(date).format(DateFormats.dateForDb)
      // Not Required
      dateObject.phone = currentUser.phone
      dateObject.createdBy = currentUser.name
      dateObject.fromVisitationSchedule = true
      dateObject.id = Manager.getUid()
      dateObject.shareWith = Manager.getUniqueArray(shareWith).flat()

      if (events.length === 0) {
        events = [dateObject]
      } else {
        events = [...events, dateObject]
      }
    })

    // Upload to DB
    DB.addVisitationSchedule(events).then((r) => r)
    MyConfetti.fire()
  }

  // Every Other Weekend
  const addEveryOtherWeekendToCalendar = async () => {
    if (firstEveryOtherWeekend.length === 0) {
      setState({
        ...state,
        showAlert: true,
        alertMessage: 'Please choose the Friday of the next weekend YOU have the child(ren)',
        alertType: 'error',
      })
      return false
    }

    if (!Manager.isValid(shareWith, true)) {
      setState({ ...state, showAlert: true, alertMessage: 'Please set who can see the schedule', alertType: 'error' })
      return false
    }
    // Set end date to the end of the year
    let weekends = VisitationManager.getEveryOtherWeekend(moment(firstEveryOtherWeekend).format(DateFormats.dateForDb))
    let events = []
    weekends.flat().forEach((date) => {
      const dateObject = new CalendarEvent()
      // Required
      dateObject.title = `${currentUser.name.formatNameFirstNameOnly()}'s Scheduled Visitation`
      dateObject.fromDate = moment(date).format(DateFormats.dateForDb)
      // Not Required
      dateObject.phone = currentUser.phone
      dateObject.createdBy = currentUser.name
      dateObject.fromVisitationSchedule = true
      dateObject.id = Manager.getUid()
      dateObject.shareWith = Manager.getUniqueArray(shareWith).flat()

      events.push(dateObject)
    })

    // Upload to DB
    DB.addVisitationSchedule(events).then((r) => r)
    MyConfetti.fire()
  }

  // Every Weekend
  const addEveryWeekendToCalendar = async () => {
    if (!Manager.isValid(shareWith, true)) {
      setState({ ...state, showAlert: true, alertMessage: 'Please set who can see the schedule', alertType: 'error' })
      return false
    }
    // Set end date to the end of the year
    let weekends = VisitationManager.getEveryWeekend()
    let events = []
    weekends.flat().forEach((date) => {
      const dateObject = new CalendarEvent()
      // Required
      dateObject.title = `${currentUser.name.formatNameFirstNameOnly()}'s Scheduled Visitation`
      dateObject.fromDate = moment(date).format(DateFormats.dateForDb)
      // Not Required
      dateObject.phone = currentUser.phone
      dateObject.createdBy = currentUser.name
      dateObject.fromVisitationSchedule = true
      dateObject.id = Manager.getUid()
      dateObject.shareWith = Manager.getUniqueArray(shareWith).flat()

      events.push(dateObject)
    })

    // Upload to DB
    DB.addVisitationSchedule(events).then((r) => r)
    MyConfetti.fire()
  }

  // 50/50
  const addFiftyFiftyToCal = async () => {
    if (firstFFPeriodEnd.length === 0 || firstFFPeriodStart.length === 0 || secondFFPeriodEnd.length === 0 || secondFFPeriodStart.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Both schedule ranges are required' })
      return false
    }

    if (shareWith.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please choose who can see this visitation schedule', alertType: 'error' })
      return false
    }

    let events = []
    const dates = {
      firstFFPeriodStart,
      firstFFPeriodEnd,
      secondFFPeriodStart,
      secondFFPeriodEnd,
      thirdFFPeriodStart,
      thirdFFPeriodEnd,
    }
    const scheduleDates = VisitationManager.getFiftyFifty(dates)
    scheduleDates.forEach((date, index) => {
      const dateObject = new CalendarEvent()
      // Required
      dateObject.title = `${currentUser.name.formatNameFirstNameOnly()}'s Scheduled Visitation`
      dateObject.fromDate = moment(date).format('MM/DD/yyyy')
      // Not Required
      dateObject.phone = currentUser.phone
      dateObject.createdBy = currentUser.name
      dateObject.fromVisitationSchedule = true
      dateObject.shareWith = shareWith
      dateObject.id = Manager.getUid()
      dateObject.shareWith = Manager.getUniqueArray(shareWith).flat()
      if (events.length === 0) {
        events = [dateObject]
      } else {
        events = [...events, dateObject]
      }
    })

    // Upload to DB
    await DB.addVisitationSchedule(events).then((r) => r)
    MyConfetti.fire()
  }

  const setHolidaysInDatabase = async () => {
    // Delete all user events before adding new
    await CalendarManager.deleteMultipleEvents(userHolidayEvents, currentUser).finally(async () => {
      // Holidays
      if (Manager.isValid(selectedHolidayDates, true)) {
        let events = []
        selectedHolidayDates.forEach((holidayDateString) => {
          const dateObject = new CalendarEvent()
          const holidayName = CalendarMapper.holidayDateToName(holidayDateString)
          // Required
          dateObject.title = `${formatNameFirstNameOnly(currentUser.name)}'s Holiday Visitation`
          dateObject.fromDate = moment(holidayDateString).format('MM/DD/yyyy')
          dateObject.holidayName = holidayName
          // Not Required
          dateObject.phone = currentUser.phone
          dateObject.createdBy = currentUser.name
          dateObject.fromVisitationSchedule = true
          dateObject.isHoliday = true
          dateObject.id = Manager.getUid()
          dateObject.shareWith = Manager.getUniqueArray(shareWith).flat()
          events = [...events, dateObject]
        })
        // Upload to DB
        await CalendarManager.addMultipleCalEvents(events)
      }
    })
  }

  const handleSpecificWeekendSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        if (defaultSelectedWeekends.length > 0) {
          setDefaultSelectedWeekends((defaultSelectedWeekends) => [...defaultSelectedWeekends, e])
        } else {
          setDefaultSelectedWeekends([e])
        }
      },
      (e) => {},
      true
    )
  }

  const handleFifthWeekendSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setFifthWeekendSelection(e)
      },
      (e) => {},
      false
    )
  }

  const handleShareWithSelection = async (e) => {
    await Manager.handleShareWithSelection(e, currentUser, theme, shareWith).then((updated) => {
      setShareWith(updated)
    })
  }

  const handleHolidaySelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        const dataDate = CalendarMapper.holidayNameToDate(e)
        const dateAsString = moment(`${dataDate}/${moment().year()}`, 'MM/DD/yyyy').format(DateFormats.dateForDb)
        setSelectedHolidayDates([...selectedHolidayDates, dateAsString])
      },
      (e) => {
        const dataDate = CalendarMapper.holidayNameToDate(e)
        const dateAsString = moment(`${dataDate}/${moment().year()}`, 'MM/DD/yyyy').format(DateFormats.dateForDb)
        let filtered = selectedHolidayDates.filter((x) => x !== dateAsString)
        setSelectedHolidayDates(filtered)
      },
      true
    )
  }

  const handleScheduleTypeSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        console.log(e)
        if (e === 'Every Weekend') {
          addEveryWeekendToCalendar()
        } else {
          setScheduleType(VisitationMapper.formattedScheduleTypes(e))
          setScheduleAccordionExpanded(false)
          setState({ ...state, showMenuButton: false })
        }
      },
      (e) => {}
    )
  }

  const getVisitationHolidays = async () => {
    const _holidays = []
    await DateManager.getVisitationHolidays().then((holiday) => {
      _holidays.push(holiday)
    })
    const userEvents = Manager.convertToArray(await DB.getTable(DB.tables.calendarEvents))
    let userHolidays = []
    if (Manager.isValid(userEvents, true)) {
      userHolidays = userEvents.filter((x) => x.phone === currentUser.phone && x.fromVisitationSchedule === true && x.isHoliday === true)
    }
    return {
      holidays: _holidays.flat(),
      userHolidays: userHolidays,
    }
  }

  const setDefaultHolidays = (allUserHolidayObjects) => {
    const holidayCheckboxesWrapper = document.querySelector('.holiday-checkboxes')
    if (Manager.isValid(holidayCheckboxesWrapper)) {
      const checkboxes = holidayCheckboxesWrapper.querySelectorAll('[data-date]')
      checkboxes.forEach((checkboxWrapper) => {
        const holidayLabel = checkboxWrapper.getAttribute('data-label')
        if (holidayLabel.length > 0) {
          const allUserHolidays = allUserHolidayObjects.map((x) => x.name)
          if (allUserHolidays.includes(holidayLabel)) {
            // Set checkboxes active
            holidayCheckboxesWrapper.querySelector(`[data-label="${holidayLabel}"]`).querySelector('.box').classList.add('active')
          }
        }
      })
    }
  }

  const setAllStates = async () => {
    await getVisitationHolidays().then((holidaysObject) => {
      const { holidays, userHolidays } = holidaysObject
      const userHolidaysList = Manger.convertToArray(CalendarMapper.eventsToHolidays(userHolidays))
      const userHolidaysDates = userHolidaysList.map((x) => x.date)
      const allHolidayDates = holidaysObject.holidays.map((x) => x.date)
      setDataDates(allHolidayDates)
      setSelectedHolidayDates(uniqueArray(userHolidaysDates).flat())
      setHolidayLabels(holidays)
      setUserHolidayEvents(uniqueArray(userHolidays).flat())
      setTimeout(() => {
        setDefaultHolidays(uniqueArray(userHolidaysList).flat())
      }, 300)
    })
  }

  useEffect(() => {
    Manager.showPageContainer('show')
    setAllStates().then((r) => r)
    setTimeout(() => {
      setState({ ...state, showMenuButton: true, showBackButton: false })
    }, 500)
  }, [])

  useEffect(() => {
    setState({ ...state, showMenuButton: false, showBackButton: false })
  }, [scheduleType])

  return (
    <div>
      {/* CONFIRM ALERT */}
      <Confirm
        message={'Are you sure you would like to delete your visitation schedule? You can add another one any time.'}
        title={deleteMessage}
        onReject={() => {
          setState({ ...state, showAlert: false })
          setDeleteMessage('')
        }}
        onCancel={() => {
          setState({ ...state, showAlert: false })
          setDeleteMessage('')
        }}
        onAccept={deleteSchedule}
      />
      {/* BOTTOM BUTTONS */}
      <BottomButton elClass={'blue'} onClick={resetScreen} iconName="undo" bottom="220" />
      <BottomButton elClass={'red'} onClick={() => setDeleteMessage('DELETING SCHEDULE')} iconName="delete" bottom="160" />
      {scheduleType === scheduleTypes.everyOtherWeekend && (
        <BottomButton elClass={'green visible'} onClick={addEveryOtherWeekendToCalendar} iconName="event_available" bottom="100" />
      )}
      {scheduleType === scheduleTypes.specificWeekends && (
        <BottomButton elClass={'green visible'} onClick={addSpecificWeekendsToCalendar} iconName="event_available" bottom="100" />
      )}
      {scheduleType === scheduleTypes.fiftyFifty && (
        <BottomButton elClass={'green visible'} onClick={addFiftyFiftyToCal} iconName="event_available" bottom="100" />
      )}
      {scheduleType === scheduleTypes.everyOtherWeekend && (
        <BottomButton elClass={'green visible'} onClick={addEveryOtherWeekendToCalendar} iconName="event_available" bottom="100" />
      )}

      {/* PAGE CONTAINER */}
      <div id="visitation-container" className={`${theme} page-container form`}>
        {/* SECTIONS */}
        <div className="sections">
          {/* VISITATION SCHEDULE */}
          <div className="note-container">
            <Note
              elClass={'mt-10'}
              message={'When you choose a visitation schedule, it will be visible in the calendar for you and chosen coparents to view.'}
            />
          </div>

          {/* SCHEDULE SELECTION ACCORDION */}
          <div className="section visitation-schedule mt-10 mb-10">
            {/* SCHEDULE SELECTION */}
            <label>Choose Visitation Schedule</label>
            <CheckboxGroup
              elClass="mt-10 gap-10"
              onCheck={handleScheduleTypeSelection}
              skipNameFormatting={true}
              labels={['50/50', 'Specific Weekends', 'Every Weekend', 'Every other Weekend']}
            />
          </div>

          {/* 50/50 SCHEDULE */}
          {scheduleType === scheduleTypes.fiftyFifty && (
            <>
              <div className="text pl-10 pr-10">
                <p className="mb-10 white-text">An arrangement where both you and your co-parent have equal time with your children.</p>
                <p className="mb-10 white-text">
                  For the start of the next visitation period (and next period ONLY) you have your children, enter the date ranges for both the first
                  half of the 50/50 and the second half of the 50/50.
                </p>
                <p className="white-text caption">
                  <i>
                    Use the <u>third period</u> date selector if it is necessary for your schedule.
                  </i>
                </p>
              </div>
              <span className="material-icons help-icon center-text fs-25" onClick={() => setShowFFExample(!showFFExample)}>
                {showFFExample ? 'close' : 'help'}
              </span>

              <div className="note-container">
                <Note
                  elClass={showFFExample ? 'mb-10 ff-note active white-text' : 'mb-10 white-text ff-note'}
                  message={`<b class="white-text">Example</b> <br/> If you have your children (in August) Wednesday-Friday and then Monday-Wednesday during the following week:<br/><span class="fs-15">You would choose: 8/14-8/16 for the first period and 8/19-8/21 for the second period.</span>`}
                />
              </div>
              {/* 50/50 DATE PICKERS */}
              <>
                <label className="h-20">
                  First Period <span className="asterisk">*</span>
                </label>
                <DateRangePicker
                  showOneCalendar
                  showHeader={false}
                  editable={false}
                  placement="auto"
                  character=" to "
                  className="mb-30 event-date"
                  format={'MM/dd/yyyy'}
                  onChange={(e) => {
                    let formattedDates = []
                    if (e && e.length > 0) {
                      e.forEach((date) => {
                        formattedDates.push(new Date(moment(date).format('MM/DD/YYYY')))
                      })
                      setFirstFFPeriodStart(formattedDates[0])
                      setFirstFFPeriodEnd(formattedDates[1])
                    }
                  }}
                />
                <label className="h-20">
                  Second Period <span className="asterisk">*</span>
                </label>
                <DateRangePicker
                  showOneCalendar
                  showHeader={false}
                  editable={false}
                  className="mb-30 event-date"
                  placement="auto"
                  label={''}
                  placeholder={''}
                  character=" to "
                  format={'MM/dd/yyyy'}
                  onChange={(e) => {
                    let formattedDates = []
                    if (e && e.length > 0) {
                      e.forEach((date) => {
                        formattedDates.push(new Date(moment(date).format('MM/DD/YYYY')))
                      })
                      setSecondFFPeriodStart(formattedDates[0])
                      setSecondFFPeriodEnd(formattedDates[1])
                    }
                  }}
                />
                <label className="h-20">Third Period</label>
                <DateRangePicker
                  showOneCalendar
                  showHeader={false}
                  editable={false}
                  className="event-date mb-20"
                  placement="auto"
                  character=" to "
                  format={'MM/dd/yyyy'}
                  onChange={(e) => {
                    let formattedDates = []
                    if (e && e.length > 0) {
                      e.forEach((date) => {
                        formattedDates.push(new Date(moment(date).format('MM/DD/YYYY')))
                      })
                      setThirdFFPeriodStart(formattedDates[0])
                      setThirdFFPeriodEnd(formattedDates[1])
                    }
                  }}
                />
              </>
            </>
          )}

          {/* EVERY OTHER WEEKEND */}
          {scheduleType === scheduleTypes.everyOtherWeekend && (
            <>
              <label>Friday of the next weekend you have your child(ren)</label>
              <MobileDatePicker onAccept={(e) => setFirstEveryOtherWeekend(e)} className={`${theme} w-100 mt-0`} />
            </>
          )}

          {/* SPECIFIC WEEKENDS SCHEDULE */}
          {scheduleType === scheduleTypes.specificWeekends && (
            <>
              <div className="form mb-20">
                <label>Which weekends will YOU have the child(ren)?</label>
                <CheckboxGroup
                  boxWidth={50}
                  elClass={'mb-15'}
                  onCheck={handleSpecificWeekendSelection}
                  labels={['1st Weekend', '2nd Weekend', '3rd Weekend', '4th Weekend']}
                />
                <label>If it is a month with 5 weekends, which additional weekend will YOU have the child(ren)?</label>
                <CheckboxGroup
                  boxWidth={50}
                  onCheck={handleFifthWeekendSelection}
                  labels={['1st Weekend', '2nd Weekend', '3rd Weekend', '4th Weekend', '5th Weekend']}
                />
              </div>
            </>
          )}

          {/* SHARE WITH */}
          <div className="share-with-container mt-20">
            <label>
              <span className="material-icons-round warning mr-10">visibility</span> Who is allowed to see this visitation schedule?
              <span className="asterisk">*</span>
            </label>
            <CheckboxGroup
              elClass={'gap-10'}
              dataPhone={currentUser?.coparents.map((x) => x.phone)}
              labels={currentUser?.coparents.map((x) => x.name)}
              onCheck={handleShareWithSelection}
            />
          </div>

          {/* LOCATION */}
          <label>Preferred Transfer Location (for primary/biological co-parent)</label>
          <Autocomplete
            placeholder=""
            apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
            options={{
              types: ['geocode', 'establishment'],
              componentRestrictions: { country: 'usa' },
            }}
            className={`${theme} mb-15`}
            onPlaceSelected={(place) => {
              updatePreferredLocation(
                place.formatted_address,
                `https://www.google.com/maps?daddr=7${encodeURIComponent(place.formatted_address)}`
              ).then((r) => r)
            }}
          />
          {/* HOLIDAY SELECTION */}
          <label>Select the holidays YOU have the child(ren) this year</label>
          <CheckboxGroup
            elClass={'holiday-checkboxes gap-10'}
            boxWidth={50}
            onCheck={handleHolidaySelection}
            skipNameFormatting={true}
            labels={holidayLabels.map((x) => x.name).sort()}
            dataDate={dataDates}
          />

          <button className="button default green center" onClick={() => setHolidaysInDatabase()}>
            Update Holidays
          </button>
        </div>
      </div>
    </div>
  )
}
