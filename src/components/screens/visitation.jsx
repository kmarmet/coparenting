import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import { DateRangePicker } from 'rsuite'
import Autocomplete from 'react-google-autocomplete'
import scheduleTypes from '@constants/scheduleTypes'
import globalState from '../../context'
import DB from '@db'
import CalendarEvent from '@models/calendarEvent'
import Manager from '@manager'
import Manger from '@manager'
import CheckboxGroup from '@shared/checkboxGroup'
import VisitationManager from '@managers/visitationManager'
import MyConfetti from '@shared/myConfetti'
import Note from '@shared/note'
import DB_UserScoped from '@userScoped'
import VisitationMapper from 'mappers/visitationMapper'
import { MobileDatePicker } from '@mui/x-date-pickers-pro'
import DateFormats from '../../constants/dateFormats'
import CalendarMapper from '../../mappers/calMapper'
import { ImEye } from 'react-icons/im'
import { confirmAlert, formatNameFirstNameOnly, successAlert, throwError, uniqueArray } from '../../globalFunctions'
import BottomCard from '../shared/bottomCard'
import ScheduleTypes from '../../constants/scheduleTypes'
import Label from '../shared/label' // Icons
import SecurityManager from '../../managers/securityManager'
import NavBar from '../navBar'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import InputWrapper from '../shared/inputWrapper'

export default function Visitation() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

  // Custom Weekends
  const [defaultSelectedWeekends, setDefaultSelectedWeekends] = useState([])
  const [fifthWeekendSelection, setFifthWeekendSelection] = useState('')

  // 50/50
  const [firstFFPeriodStart, setFirstFFPeriodStart] = useState('')
  const [firstFFPeriodEnd, setFirstFFPeriodEnd] = useState('')
  const [secondFFPeriodStart, setSecondFFPeriodStart] = useState('')
  const [secondFFPeriodEnd, setSecondFFPeriodEnd] = useState('')
  const [thirdFFPeriodStart, setThirdFFPeriodStart] = useState('')
  const [thirdFFPeriodEnd, setThirdFFPeriodEnd] = useState('')

  // Every other weekend
  const [firstEveryOtherWeekend, setFirstEveryOtherWeekend] = useState('')

  // State
  const [showEveryOtherWeekendCard, setShowEveryOtherWeekendCard] = useState(false)
  const [showFiftyFiftyCard, setShowFiftyFiftyCard] = useState(false)
  const [shareWith, setShareWith] = useState([])
  const [showCustomWeekendsCard, setShowCustomWeekendsCard] = useState(false)
  const [scheduleType, setScheduleType] = useState('')
  const [existingScheduleEvents, setExistingScheduleEvents] = useState([])

  // Holiday
  const [selectedHolidayDates, setSelectedHolidayDates] = useState([])
  const [showFFExample, setShowFFExample] = useState(false)
  const [holidayLabels, setHolidayLabels] = useState([])
  const [userHolidayEvents, setUserHolidayEvents] = useState([])
  const [dataDates, setDataDates] = useState([])

  const updateDefaultTransferLocation = async (location, link) => {
    await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser.phone}/defaultTransferNavLink`, link)
    await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser.phone}/defaultTransferLocation`, location)
  }

  const deleteSchedule = async () => await VisitationManager.deleteSchedule(existingScheduleEvents)

  const resetScreen = () => {
    setScheduleType('')
    setDefaultSelectedWeekends([])
    setFifthWeekendSelection('')
    setShareWith([])
    setFirstFFPeriodStart('')
    setFirstFFPeriodEnd('')
    setSecondFFPeriodStart('')
    setSecondFFPeriodEnd('')
    setThirdFFPeriodStart('')
    setThirdFFPeriodEnd('')
    setShowFFExample(false)
    const checkboxes = document.querySelectorAll('.box')
    checkboxes.forEach((box) => box.classList.remove('active'))
  }

  // Specific Weekends
  const addSpecificWeekendsToCalendar = async () => {
    if (!Manager.isValid(defaultSelectedWeekends, true) || !Manager.isValid(fifthWeekendSelection)) {
      throwError('Please choose default weekends and a five-month weekend')
      return false
    }

    if (!Manager.isValid(shareWith, true)) {
      throwError('Please set who can see the schedule')
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
      dateObject.title = `${formatNameFirstNameOnly(currentUser.name)}'s Scheduled Visitation`
      dateObject.startDate = moment(date).format(DateFormats.dateForDb)
      // Not Required
      dateObject.ownerPhone = currentUser.phone
      dateObject.createdBy = currentUser.name
      dateObject.fromVisitationSchedule = true
      dateObject.id = Manager.getUid()
      dateObject.visitationSchedule = ScheduleTypes.customWeekends
      dateObject.shareWith = Manager.getUniqueArray(shareWith).flat()

      if (events.length === 0) {
        events = [dateObject]
      } else {
        events = [...events, dateObject]
      }
    })

    // Upload to DB
    VisitationManager.addVisitationSchedule(events).then((r) => r)
    MyConfetti.fire()
  }

  // Every Other Weekend
  const addEveryOtherWeekendToCalendar = async () => {
    if (firstEveryOtherWeekend.length === 0) {
      throwError('Please choose the Friday of the next weekend YOU have the child(ren)')
      return false
    }
    if (!Manager.isValid(shareWith, true)) {
      throwError('Please set who can see the schedule')
      return false
    }
    // Set end date to the end of the year
    let weekends = VisitationManager.getEveryOtherWeekend(moment(firstEveryOtherWeekend).format(DateFormats.dateForDb))
    let events = []
    weekends.flat().forEach((date) => {
      const dateObject = new CalendarEvent()
      // Required
      dateObject.title = `${formatNameFirstNameOnly(currentUser.name)}'s Scheduled Visitation`
      dateObject.startDate = moment(date).format(DateFormats.dateForDb)
      // Not Required
      dateObject.ownerPhone = currentUser.phone
      dateObject.createdBy = currentUser.name
      dateObject.fromVisitationSchedule = true
      dateObject.id = Manager.getUid()
      dateObject.visitationSchedule = ScheduleTypes.everyOtherWeekend
      dateObject.shareWith = Manager.getUniqueArray(shareWith).flat()

      events.push(dateObject)
    })

    // Upload to DB
    VisitationManager.addVisitationSchedule(events).then((r) => r)
    MyConfetti.fire()
  }

  // Every Weekend
  const addEveryWeekendToCalendar = async () => {
    if (!Manager.isValid(shareWith, true)) {
      throwError('Please set who can see the schedule')
      return false
    }
    // Set end date to the end of the year
    let weekends = VisitationManager.getEveryWeekend()
    let events = []
    weekends.flat().forEach((date) => {
      const dateObject = new CalendarEvent()
      // Required
      dateObject.title = `${formatNameFirstNameOnly(currentUser.name)}'s Scheduled Visitation`
      dateObject.startDate = moment(date).format(DateFormats.dateForDb)
      // Not Required
      dateObject.ownerPhone = currentUser.phone
      dateObject.createdBy = currentUser.name
      dateObject.fromVisitationSchedule = true
      dateObject.id = Manager.getUid()
      dateObject.visitationSchedule = ScheduleTypes.everyWeekend
      dateObject.shareWith = Manager.getUniqueArray(shareWith).flat()

      events.push(dateObject)
    })

    // Upload to DB
    VisitationManager.addVisitationSchedule(events).then((r) => r)
    MyConfetti.fire()
  }

  // 50/50
  const addFiftyFiftyToCal = async () => {
    if (firstFFPeriodEnd.length === 0 || firstFFPeriodStart.length === 0 || secondFFPeriodEnd.length === 0 || secondFFPeriodStart.length === 0) {
      throwError('Both schedule ranges are required')
      return false
    }

    if (shareWith.length === 0) {
      throwError('Please choose who can see this visitation schedule')
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
      dateObject.title = `${formatNameFirstNameOnly(currentUser.name)}'s Scheduled Visitation`
      dateObject.startDate = moment(date).format('MM/DD/yyyy')
      // Not Required
      dateObject.ownerPhone = currentUser.phone
      dateObject.createdBy = currentUser.name
      dateObject.fromVisitationSchedule = true
      dateObject.shareWith = shareWith
      dateObject.id = Manager.getUid()
      dateObject.visitationSchedule = ScheduleTypes.fiftyFifty
      dateObject.shareWith = Manager.getUniqueArray(shareWith).flat()
      if (events.length === 0) {
        events = [dateObject]
      } else {
        events = [...events, dateObject]
      }
    })

    // Upload to DB
    await VisitationManager.addVisitationSchedule(events).then((r) => r)
    MyConfetti.fire()
  }

  // SET HOLIDAYS IN DATABASE
  const setHolidaysInDatabase = async () => {
    // Delete all user events before adding new
    // Holidays
    // console.log(selectedHolidayDates)
    if (Manager.isValid(selectedHolidayDates, true)) {
      let events = []
      selectedHolidayDates.forEach((holidayDateString) => {
        const dateObject = new CalendarEvent()
        const holidayName = CalendarMapper.holidayDateToName(moment(holidayDateString).format('MM/DD'))
        // Required
        dateObject.title = `${formatNameFirstNameOnly(currentUser.name)}'s Holiday Visitation`
        dateObject.startDate = moment(holidayDateString).format('MM/DD/yyyy')
        dateObject.holidayName = holidayName
        // Not Required
        dateObject.ownerPhone = currentUser.phone
        dateObject.createdBy = currentUser.name
        dateObject.fromVisitationSchedule = true
        dateObject.isHoliday = true
        dateObject.id = Manager.getUid()
        dateObject.shareWith = Manager.getUniqueArray(shareWith).flat()
        events.push(dateObject)
      })
      // Upload to DB
      await VisitationManager.setVisitationHolidays(currentUser, events)
      successAlert('Visitation Holidays Updated!')
    } else {
      // await VisitationManager.deleteAllHolidaysForUser(currentUser)
    }
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
    await Manager.handleShareWithSelection(e, currentUser, shareWith)
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
      async (e) => {
        setScheduleType(VisitationMapper.formattedScheduleTypes(e))
      },
      (e) => {}
    )
  }

  const getVisitationHolidays = async (currentUser) => {
    const _holidays = await VisitationManager.getVisitationHolidays()
    const userEvents = await SecurityManager.getCalendarEvents(currentUser)
    let userHolidays = []
    if (Manager.isValid(userEvents, true)) {
      userHolidays = userEvents.filter((x) => x.ownerPhone === currentUser.phone && x.fromVisitationSchedule === true && x.isHoliday === true)
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
    await getVisitationHolidays(currentUser).then((holidaysObject) => {
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

  const getCurrentVisitationSchedule = async () => {
    let scheduleEvents = await VisitationManager.getSchedule(currentUser)
    scheduleEvents = scheduleEvents.filter((x) => x.isHoliday === false)

    if (scheduleEvents.length > 0) {
      setExistingScheduleEvents(scheduleEvents)
    }
  }

  // On Schedule Type Change
  useEffect(() => {
    if (scheduleType === ScheduleTypes.fiftyFifty) {
      setShowFiftyFiftyCard(true)
      setShowEveryOtherWeekendCard(false)
      setShowCustomWeekendsCard(false)
    }

    if (scheduleType === ScheduleTypes.everyOtherWeekend) {
      setShowEveryOtherWeekendCard(true)
      setShowFiftyFiftyCard(false)
      setShowCustomWeekendsCard(false)
    }

    if (scheduleType === ScheduleTypes.customWeekends) {
      setShowCustomWeekendsCard(true)
      setShowEveryOtherWeekendCard(false)
      setShowFiftyFiftyCard(false)
    }

    if (scheduleType === ScheduleTypes.everyWeekend) {
      setShowEveryOtherWeekendCard(false)
      setShowFiftyFiftyCard(false)
      setShowCustomWeekendsCard(false)
      confirmAlert('Are you sure you would like to add an Every Weekend visitation schedule?', "I'm Sure", true, async () => {
        await addEveryWeekendToCalendar()
      })
    }
  }, [scheduleType])

  useEffect(() => {
    getCurrentVisitationSchedule().then((r) => r)
    Manager.showPageContainer('show')
    setAllStates().then((r) => r)
  }, [])

  return (
    <div>
      {/* SCHEDULE CARDS */}
      <>
        {/* 50/50 SCHEDULE */}
        <BottomCard
          className="form"
          title={'Add 50/50 Visitation Schedule'}
          showCard={showFiftyFiftyCard}
          onClose={() => setShowFiftyFiftyCard(false)}>
          <div className="text">
            <label>What is a 50/50 Visitation Schedule?</label>
            <p className="mb-10">An arrangement where both you and your co-parent have equal time with your children.</p>
            <p className="mb-10">
              For the start of the next visitation period (and next period ONLY) you have your children, enter the date ranges for both the first half
              of the 50/50 and the second half of the 50/50.
            </p>
            <p>
              <i>
                Use the <u>third period</u> date selector if it is necessary for your schedule.
              </i>
            </p>
          </div>

          <div className="note-container mt-15 mb-20">
            <Note
              elClass={showFFExample ? 'mb-10 ff-note active' : 'mb-10 ff-note'}
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

          {/* BUTTONS */}
          {firstFFPeriodStart.toString().length > 0 && secondFFPeriodStart.toString().length > 0 && (
            <div className="buttons">
              <button className="card-button" onClick={addFiftyFiftyToCal}>
                Done <span className="material-icons-round pl-5">check</span>
              </button>
            </div>
          )}
        </BottomCard>

        {/* EVERY OTHER WEEKEND */}
        <BottomCard
          className="form"
          title={'Add Every other Weekend Visitation Schedule'}
          showCard={showEveryOtherWeekendCard}
          onClose={() => setShowEveryOtherWeekendCard(false)}>
          <>
            <label className="flex">
              Friday of the next weekend you have your child(ren) <span className="asterisk">*</span>
            </label>
            <MobileDatePicker onAccept={(e) => setFirstEveryOtherWeekend(e)} className={`${theme} w-100 mt-0`} />
          </>
          {firstEveryOtherWeekend._isValid === true && (
            <div className="buttons">
              <button className="card-button" onClick={addEveryOtherWeekendToCalendar}>
                Done <span className="material-icons-round pl-5">check</span>
              </button>
            </div>
          )}
        </BottomCard>

        {/* SPECIFIC WEEKENDS SCHEDULE */}
        <BottomCard
          className="form"
          title={'Add Custom Weekends Visitation Schedule'}
          showCard={showCustomWeekendsCard}
          onClose={() => setShowCustomWeekendsCard(false)}>
          <>
            <div className="form mb-20">
              <label>Which weekends will YOU have the child(ren)?</label>
              <CheckboxGroup
                boxWidth={50}
                elClass={'mb-15'}
                onCheck={handleSpecificWeekendSelection}
                checkboxLabels={['1st Weekend', '2nd Weekend', '3rd Weekend', '4th Weekend']}
              />
              <label>If it is a month with 5 weekends, which additional weekend will YOU have the child(ren)?</label>
              <CheckboxGroup
                boxWidth={50}
                onCheck={handleFifthWeekendSelection}
                checkboxLabels={['1st Weekend', '2nd Weekend', '3rd Weekend', '4th Weekend', '5th Weekend']}
              />
            </div>
          </>
          {defaultSelectedWeekends.length > 0 && (
            <div className="buttons">
              <button className="card-button" onClick={addSpecificWeekendsToCalendar}>
                Done <span className="material-icons-round pl-5">check</span>
              </button>
            </div>
          )}
        </BottomCard>
      </>

      {/* PAGE CONTAINER */}
      <div id="visitation-container" className={`${theme} page-container form`}>
        {/* SCREEN TITLE */}
        <p className="screen-title">Visitation</p>

        {/* ALREADY HAS EXISTING SCHEDULE */}
        {existingScheduleEvents.length > 0 && (
          <>
            <p>
              You currently have a 50/50 visitation schedule added to your calendar. If you would like to modify the current schedule or switch to
              another schedule, please delete the current schedule first.
            </p>
            <div className="buttons flex mt-15">
              <button
                className="button red default center"
                onClick={() => {
                  confirmAlert('Are you sure you would like to permanently delete your current visitation schedule?', "I'm Sure", true, async () => {
                    await deleteSchedule()
                    successAlert('Event Deleted')
                  })
                }}>
                Delete Current Schedule
              </button>
            </div>
          </>
        )}

        {/* NO EXISTING SCHEDULE */}
        {existingScheduleEvents.length === 0 && (
          <div className="sections">
            {/* VISITATION SCHEDULE */}
            <div className="note-container mt-10 mb-15">
              <Note message={'When you choose a visitation schedule, it will be visible in the calendar for you and chosen coparents to view.'} />
            </div>

            {/* SCHEDULE SELECTION */}
            {shareWith.length > 0 && (
              <div className="section visitation-schedule mt-10 mb-10">
                {/* SCHEDULE SELECTION */}
                <label>Choose Visitation Schedule</label>
                <CheckboxGroup
                  elClass="mt-10 gap-10"
                  onCheck={handleScheduleTypeSelection}
                  skipNameFormatting={true}
                  checkboxLabels={['50/50', 'Custom Weekends', 'Every Weekend', 'Every other Weekend']}
                />
              </div>
            )}

            {/* SHARE WITH */}
            <ShareWithCheckboxes
              required={true}
              shareWith={currentUser?.coparents.map((x) => x.phone)}
              onCheck={handleShareWithSelection}
              defaultPhones={currentUser?.coparents.map((x) => x.phone)}
              icon={<ImEye />}
              labelText={'Who is allowed to see it?'}
              containerClass={'share-with-coparents'}
              checkboxLabels={currentUser?.coparents.map((x) => x.name)}
            />

            {/* LOCATION */}
            <InputWrapper inputType={'location'} labelText={'Preferred Transfer Location (for biological co-parent)'}>
              <Autocomplete
                placeholder={currentUser?.defaultTransferLocation || 'Preferred Transfer Location'}
                apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
                options={{
                  types: ['geocode', 'establishment'],
                  componentRestrictions: { country: 'usa' },
                }}
                className={`${theme} mb-15`}
                onPlaceSelected={(place) => {
                  updateDefaultTransferLocation(
                    place.formatted_address,
                    `https://www.google.com/maps?daddr=7${encodeURIComponent(place.formatted_address)}`
                  ).then((r) => successAlert('Preferred Transfer Location Set'))
                }}
              />
            </InputWrapper>
          </div>
        )}
        {/* HOLIDAY SELECTION */}
        <Label text={'Select the holidays YOU have the child(ren) this year'}>
          <CheckboxGroup
            elClass={'holiday-checkboxes gap-10'}
            boxWidth={50}
            onCheck={handleHolidaySelection}
            skipNameFormatting={true}
            checkboxLabels={holidayLabels.map((x) => x.name).sort()}
            dataDate={dataDates}
          />
        </Label>

        <button className="button default green center" onClick={() => setHolidaysInDatabase()}>
          Update Holidays
        </button>
      </div>
      <NavBar navbarClass={'visitation no-add-new-button'}></NavBar>
    </div>
  )
}