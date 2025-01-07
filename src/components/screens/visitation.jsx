import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import scheduleTypes from '@constants/scheduleTypes'
import globalState from '../../context'
import DB from '@db'
import { Fade } from 'react-awesome-reveal'
import CalendarEvent from '@models/calendarEvent'
import Manager from '@manager'
import Manger from '@manager'
import CheckboxGroup from '@shared/checkboxGroup'
import VisitationManager from '@managers/visitationManager'
import MyConfetti from '@shared/myConfetti'
import Note from '@shared/note'
import DB_UserScoped from '@userScoped'
import VisitationMapper from 'mappers/visitationMapper'
import { MobileDatePicker, MobileDateRangePicker, SingleInputDateRangeField } from '@mui/x-date-pickers-pro'
import DateFormats from '../../constants/dateFormats'
import CalendarMapper from '../../mappers/calMapper'
import { ImEye } from 'react-icons/im'
import BottomCard from '../shared/bottomCard'
import ScheduleTypes from '../../constants/scheduleTypes'
import Label from '../shared/label' // Icons
import SecurityManager from '../../managers/securityManager'
import NavBar from '../navBar'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import InputWrapper from '../shared/inputWrapper'
import DatasetManager from '../../managers/datasetManager'
import AlertManager from '../../managers/alertManager'
import ObjectManager from '../../managers/objectManager'
import ModelNames from '../../models/modelNames'
import AccordionSummary from '@mui/material/AccordionSummary'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa6'
import StringManager from '../../managers/stringManager'

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
  const [expandFiftyFiftyInfoText, setExpandFiftyFiftyInfoText] = useState(false)
  // Every other weekend
  const [firstEveryOtherWeekend, setFirstEveryOtherWeekend] = useState('')

  // State
  const [showEveryOtherWeekendCard, setShowEveryOtherWeekendCard] = useState(false)
  const [showFiftyFiftyCard, setShowFiftyFiftyCard] = useState(false)
  const [shareWith, setShareWith] = useState([])
  const [showCustomWeekendsCard, setShowCustomWeekendsCard] = useState(false)
  const [scheduleType, setScheduleType] = useState('')
  const [existingScheduleEvents, setExistingScheduleEvents] = useState([])
  const [showUpdateHolidaysButton, setShowUpdateHolidaysButton] = useState(true)
  const [showDeleteButton, setShowDeleteButton] = useState(false)
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  // Holiday
  const [selectedHolidayDates, setSelectedHolidayDates] = useState([])
  const [showFFExample, setShowFFExample] = useState(false)
  const [holidayLabels, setHolidayLabels] = useState([])
  const [userHolidayEvents, setUserHolidayEvents] = useState([])
  const [dataDates, setDataDates] = useState([])
  const updateDefaultTransferLocation = async (location, link) => {
    await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser?.phone}/defaultTransferNavLink`, link)
    await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser?.phone}/defaultTransferLocation`, location)
  }

  const deleteSchedule = async () => {
    setState({ ...state, isLoading: true })
    await VisitationManager.deleteSchedule(currentUser, existingScheduleEvents)
    setExistingScheduleEvents([])
    setShowDeleteButton(false)
    setState({ ...state, isLoading: false })
    AlertManager.successAlert('Visitation Schedule Removed')
  }

  const resetForm = async () => {
    Manager.resetForm('add-fifty-fifty-schedule')
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
    setRefreshKey(Manager.getUid())
    setShowFiftyFiftyCard(false)
    setShowCustomWeekendsCard(false)
    setShowEveryOtherWeekendCard(false)
    await getCurrentVisitationSchedule()
  }

  // Specific Weekends
  const addSpecificWeekendsToCalendar = async () => {
    if (!Manager.isValid(defaultSelectedWeekends) || !Manager.isValid(fifthWeekendSelection)) {
      AlertManager.throwError('Please choose default weekends and a five-month weekend')
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
      dateObject.title = `${StringManager.formatNameFirstNameOnly(currentUser?.name)}'s Scheduled Visitation`
      dateObject.startDate = moment(date).format(DateFormats.dateForDb)
      // Not Required
      dateObject.ownerPhone = currentUser?.phone
      dateObject.createdBy = currentUser?.name
      dateObject.fromVisitationSchedule = true
      dateObject.id = Manager.getUid()
      dateObject.visitationSchedule = ScheduleTypes.customWeekends
      dateObject.shareWith = Manager.getUniqueArray(shareWith, 'phone').flat()

      if (events.length === 0) {
        events = [dateObject]
      } else {
        events = [...events, dateObject]
      }
    })

    MyConfetti.fire()
    await resetForm()
    events = Manager.getUniqueArray(events, 'startDate')

    // Upload to DB
    VisitationManager.addVisitationSchedule(currentUser, events).then((r) => r)
  }

  // Every Other Weekend
  const addEveryOtherWeekendToCalendar = async () => {
    if (firstEveryOtherWeekend.length === 0) {
      AlertManager.throwError('Please choose the Friday of the next weekend YOU have the child(ren)')
      return false
    }
    // Set end date to the end of the year
    let weekends = VisitationManager.getEveryOtherWeekend(moment(firstEveryOtherWeekend).format(DateFormats.dateForDb))
    let events = []
    weekends.flat().forEach((date) => {
      const dateObject = new CalendarEvent()
      // Required
      dateObject.title = `${StringManager.formatNameFirstNameOnly(currentUser?.name)}'s Scheduled Visitation`
      dateObject.startDate = moment(date).format(DateFormats.dateForDb)
      // Not Required
      dateObject.ownerPhone = currentUser?.phone
      dateObject.fromVisitationSchedule = true
      dateObject.visitationSchedule = ScheduleTypes.everyOtherWeekend
      dateObject.shareWith = Manager.getUniqueArray(shareWith).flat()

      events.push(dateObject)
    })
    MyConfetti.fire()
    await resetForm()
    // Upload to DB
    VisitationManager.addVisitationSchedule(currentUser, events).then((r) => r)
    setShowEveryOtherWeekendCard(false)
  }

  // Every Weekend
  const addEveryWeekendToCalendar = async () => {
    // Set end date to the end of the year
    let weekends = VisitationManager.getEveryWeekend()
    let events = []
    weekends.flat().forEach((date) => {
      const dateObject = new CalendarEvent()
      // Required
      dateObject.title = `${StringManager.formatNameFirstNameOnly(currentUser?.name)}'s Scheduled Visitation`
      dateObject.startDate = moment(date).format(DateFormats.dateForDb)
      // Not Required
      dateObject.ownerPhone = currentUser?.phone
      dateObject.createdBy = currentUser?.name
      dateObject.fromVisitationSchedule = true
      dateObject.visitationSchedule = ScheduleTypes.everyWeekend
      dateObject.shareWith = Manager.getUniqueArray(shareWith).flat()

      events.push(dateObject)
    })

    // Upload to DB
    VisitationManager.addVisitationSchedule(currentUser, events).then((r) => r)
    MyConfetti.fire()
  }

  // 50/50
  const addFiftyFiftyToCal = async () => {
    if (firstFFPeriodEnd.length === 0 || firstFFPeriodStart.length === 0 || secondFFPeriodEnd.length === 0 || secondFFPeriodStart.length === 0) {
      AlertManager.throwError('Both schedule ranges are required')
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
      dateObject.title = `${StringManager.formatNameFirstNameOnly(currentUser?.name)}'s Scheduled Visitation`
      dateObject.startDate = moment(date).format(DateFormats.dateForDb)
      // Not Required
      dateObject.ownerPhone = currentUser?.phone
      dateObject.createdBy = currentUser?.name
      dateObject.fromVisitationSchedule = true
      dateObject.id = Manager.getUid()
      dateObject.visitationSchedule = ScheduleTypes.fiftyFifty
      dateObject.shareWith = Manager.getUniqueArray(shareWith).flat()
      if (events.length === 0) {
        events = [dateObject]
      } else {
        events = [...events, dateObject]
      }
    })
    MyConfetti.fire()
    await resetForm()
    setShowDeleteButton(true)
    // Upload to DB
    await VisitationManager.addVisitationSchedule(currentUser, events).then((r) => r)
  }

  // SET HOLIDAYS IN DATABASE
  const setHolidaysInDatabase = async () => {
    // Holidays
    if (Manager.isValid(selectedHolidayDates)) {
      setShowUpdateHolidaysButton(false)
      let events = []
      selectedHolidayDates.forEach((holidayDateString) => {
        const dateObject = new CalendarEvent()
        const holidayName = CalendarMapper.holidayDateToName(moment(holidayDateString).format('MM/DD'))
        // Required
        dateObject.title = `${StringManager.formatNameFirstNameOnly(currentUser?.name)}'s Holiday Visitation`
        dateObject.startDate = moment(holidayDateString).format(DateFormats.dateForDb)
        dateObject.holidayName = holidayName
        // Not Required
        dateObject.ownerPhone = currentUser?.phone
        dateObject.createdBy = currentUser?.name
        dateObject.fromVisitationSchedule = true
        dateObject.isHoliday = true
        dateObject.id = Manager.getUid()
        dateObject.shareWith = DatasetManager.getUniqueArray(shareWith, true)
        const cleanedObject = ObjectManager.cleanObject(dateObject, ModelNames.calendarEvent)
        events.push(cleanedObject)
      })
      // Upload to DB
      await VisitationManager.setVisitationHolidays(currentUser, events)
    } else {
      await VisitationManager.deleteAllHolidaysForUser(currentUser)
    }
    AlertManager.successAlert('Visitation Holidays Updated!')
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
    const updated = await Manager.handleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
  }

  const handleHolidaySelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        const dataDate = CalendarMapper.holidayNameToDate(e)
        const holidayMonth = moment(dataDate).month() + 1
        const currentMonth = moment().month() + 1
        const holidayYear = holidayMonth < currentMonth ? moment().year() + 1 : moment().year()
        const dateAsString = moment(`${dataDate}/${holidayYear}`, DateFormats.dateForDb).format(DateFormats.dateForDb)
        setSelectedHolidayDates([...selectedHolidayDates, dateAsString])
      },
      (e) => {
        const dataDate = CalendarMapper.holidayNameToDate(e)
        const holidayMonth = moment(dataDate).month() + 1
        const currentMonth = moment().month() + 1
        const holidayYear = holidayMonth < currentMonth ? moment().year() + 1 : moment().year()
        const dateAsString = moment(`${dataDate}/${holidayYear}`, DateFormats.dateForDb).format(DateFormats.dateForDb)
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
        setShowCustomWeekendsCard(showCustomWeekendsCard)
      },
      (e) => {
        setScheduleType('')
        setShowCustomWeekendsCard(!showCustomWeekendsCard)
      }
    )
  }

  const getVisitationHolidays = async (currentUser) => {
    const _holidays = await VisitationManager.getVisitationHolidays()
    const userEvents = await SecurityManager.getCalendarEvents(currentUser)
    let userHolidays = []
    if (Manager.isValid(userEvents)) {
      userHolidays = userEvents.filter((x) => x.ownerPhone === currentUser?.phone && x.fromVisitationSchedule === true && x.isHoliday === true)
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
            holidayCheckboxesWrapper.querySelector(`[data-label="${holidayLabel}"]`).classList.add('active')
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
      setSelectedHolidayDates(DatasetManager.getUniqueArray(userHolidaysDates, true))
      setHolidayLabels(holidays)
      setUserHolidayEvents(DatasetManager.getUniqueArray(userHolidays, true))
      setTimeout(() => {
        setDefaultHolidays(DatasetManager.getUniqueArray(userHolidaysList, true))
      }, 300)
    })
  }

  const getCurrentVisitationSchedule = async () => {
    let scheduleEvents = await VisitationManager.getSchedule(currentUser)
    scheduleEvents = scheduleEvents.filter((x) => x.isHoliday === false)

    if (scheduleEvents.length > 0) {
      setExistingScheduleEvents(scheduleEvents)
      setShowDeleteButton(true)
    } else {
      setExistingScheduleEvents([])
    }
  }

  const addThemeToDatePickers = () => {
    setTimeout(() => {
      const datetimeParent = document.querySelector('.MuiDialog-root.MuiModal-root')
      datetimeParent.classList.add(currentUser?.settings?.theme)
    }, 100)
  }

  const removeScheduleTypeActiveClass = () => {
    const checkboxWrapper = document.querySelector('.schedule-type-checkboxes')
    if (Manager.isValid(checkboxWrapper)) {
      const checkboxes = checkboxWrapper.querySelectorAll('#checkbox-container')
      if (Manager.isValid(checkboxes)) {
        for (let checkbox of checkboxes) {
          checkbox.classList.remove('active')
        }
      }
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
      AlertManager.confirmAlert('Are you sure you would like to add an Every Weekend visitation schedule?', "I'm Sure", true, async () => {
        await addEveryWeekendToCalendar()
      })
    }

    if (scheduleType === '') {
      removeScheduleTypeActiveClass()
    }
  }, [scheduleType])

  useEffect(() => {
    getCurrentVisitationSchedule().then((r) => r)
    setAllStates().then((r) => r)
  }, [])

  return (
    <>
      {/* SCHEDULE CARDS */}
      <>
        {/* 50/50 SCHEDULE */}
        <BottomCard
          onSubmit={addFiftyFiftyToCal}
          submitText={'Add Schedule'}
          className="form"
          wrapperClass="add-fifty-fifty-schedule"
          title={'50/50 Visitation Schedule'}
          showCard={showFiftyFiftyCard}
          refreshKey={refreshKey}
          onClose={() => {
            setScheduleType('')
            resetForm().then((r) => r)
          }}>
          <div className="text mt-15 mb-15">
            <Accordion id={'checkboxes'} expanded={expandFiftyFiftyInfoText}>
              <AccordionSummary>
                <div className="flex w-100 space-between" onClick={() => setExpandFiftyFiftyInfoText(!expandFiftyFiftyInfoText)}>
                  <Label text={`What is a 50/50 Visitation Schedule`} />
                  {!expandFiftyFiftyInfoText && <FaChevronDown className={'visitation-card'} />}
                  {expandFiftyFiftyInfoText && <FaChevronUp className={'visitation-card'} />}
                </div>
              </AccordionSummary>
              <AccordionDetails>
                <p>An arrangement where both you and your co-parent have equal time with your children.</p>
                <p>
                  For the start of the next visitation period (and next period ONLY) you have your children, enter the date ranges for both the first
                  half of the 50/50 and the second half of the 50/50.
                </p>
                <p>
                  <i>
                    Use the <u>third period</u> date selector if it is necessary for your schedule.
                  </i>
                </p>
                <p>
                  <b>Example</b> <br /> If you have your children (in August) Wednesday-Friday and then Monday-Wednesday during the following week:
                  <br />
                  <span>You would choose: 8/14-8/16 for the first period and 8/19-8/21 for the second period.</span>
                </p>
              </AccordionDetails>
            </Accordion>
          </div>

          {/* 50/50 DATE PICKERS */}
          {/* FIRST PERIOD */}
          <InputWrapper wrapperClasses="date-range-input" labelText={'First Period'} required={true} inputType={'date'}>
            <MobileDateRangePicker
              className={'w-100'}
              onOpen={() => {
                Manager.hideKeyboard('date-range-input')
                addThemeToDatePickers()
              }}
              onAccept={(dateArray) => {
                if (Manager.isValid(dateArray)) {
                  setFirstFFPeriodStart(dateArray[0].format(DateFormats.dateForDb))
                  setFirstFFPeriodEnd(moment(dateArray[1].format(DateFormats.dateForDb)))
                }
              }}
              slots={{ field: SingleInputDateRangeField }}
              name="allowedRange"
            />
          </InputWrapper>

          {/* SECOND PERIOD */}
          <InputWrapper wrapperClasses="date-range-input" labelText={'Second Period'} required={true} inputType={'date'}>
            <MobileDateRangePicker
              className={'w-100'}
              onOpen={() => {
                Manager.hideKeyboard('date-range-input')
                addThemeToDatePickers()
              }}
              onAccept={(dateArray) => {
                if (Manager.isValid(dateArray)) {
                  setSecondFFPeriodStart(dateArray[0].format(DateFormats.dateForDb))
                  setSecondFFPeriodEnd(moment(dateArray[1].format(DateFormats.dateForDb)))
                }
              }}
              slots={{ field: SingleInputDateRangeField }}
              name="allowedRange"
            />
          </InputWrapper>

          {/* THIRD PERIOD */}
          <InputWrapper wrapperClasses="date-range-input" labelText={'Third Period'} required={false} inputType={'date'}>
            <MobileDateRangePicker
              className={'w-100'}
              onOpen={() => {
                Manager.hideKeyboard('date-range-input')
                addThemeToDatePickers()
              }}
              onAccept={(dateArray) => {
                if (Manager.isValid(dateArray)) {
                  setThirdFFPeriodStart(dateArray[0].format(DateFormats.dateForDb))
                  setThirdFFPeriodEnd(moment(dateArray[1].format(DateFormats.dateForDb)))
                }
              }}
              slots={{ field: SingleInputDateRangeField }}
              name="allowedRange"
            />
          </InputWrapper>
        </BottomCard>

        {/* EVERY OTHER WEEKEND */}
        <BottomCard
          submitText={'Add Schedule'}
          subtitle="Add every other weekend visitation schedule."
          className="form"
          wrapperClass="add-every-other-weekend-schedule"
          onSubmit={addEveryOtherWeekendToCalendar}
          title={'Every other Weekend'}
          showCard={showEveryOtherWeekendCard}
          onClose={() => {
            setScheduleType('')
            resetForm().then((r) => r)
          }}>
          <InputWrapper wrapperClasses="mt-15" labelText={'Friday of the next weekend you have your child(ren)'} required={true} inputType={'date'}>
            <MobileDatePicker onOpen={addThemeToDatePickers} onAccept={(e) => setFirstEveryOtherWeekend(e)} className={`${theme} w-100`} />
          </InputWrapper>
        </BottomCard>

        {/* SPECIFIC WEEKENDS SCHEDULE */}
        <BottomCard
          submitText={'Add Schedule'}
          className="form"
          onSubmit={addSpecificWeekendsToCalendar}
          hasSubmitButton={Manager.isValid(defaultSelectedWeekends)}
          wrapperClass="add-weekends-schedule"
          title={'Custom Weekends Schedule'}
          showCard={showCustomWeekendsCard}
          onClose={() => {
            resetForm().then((r) => r)
            setScheduleType('')
          }}>
          <>
            <CheckboxGroup
              parentLabel={'Weekend YOU will have the child(ren)'}
              onCheck={handleSpecificWeekendSelection}
              checkboxLabels={['1st Weekend', '2nd Weekend', '3rd Weekend', '4th Weekend']}
            />
            <CheckboxGroup
              parentLabel={'Month with 5 weekends - extra weekend'}
              onCheck={handleFifthWeekendSelection}
              checkboxLabels={['1st Weekend', '2nd Weekend', '3rd Weekend', '4th Weekend', '5th Weekend']}
            />
          </>
        </BottomCard>
      </>

      {/* PAGE CONTAINER */}
      <div id="visitation-container" className={`${theme} page-container form`}>
        <Fade direction={'up'} duration={1000} triggerOnce={true}>
          {/* SCREEN TITLE */}
          <p className="screen-title">Visitation</p>

          {/* ALREADY HAS EXISTING SCHEDULE */}
          {existingScheduleEvents.length > 0 && (
            <>
              <p>
                You currently have a 50/50 visitation schedule added to your calendar. If you would like to modify the current schedule or switch to
                another schedule, please delete the current schedule first.
              </p>
              {showDeleteButton && (
                <div className="buttons flex mt-15">
                  <button
                    className="button red default center mb-20"
                    onClick={() => {
                      AlertManager.confirmAlert(
                        'Are you sure you would like to permanently delete your current visitation schedule?',
                        "I'm Sure",
                        true,
                        async () => {
                          await deleteSchedule()
                        },
                        setScheduleType('')
                      )
                    }}>
                    Delete Current Schedule
                  </button>
                </div>
              )}
            </>
          )}

          {/* NO EXISTING SCHEDULE */}
          {existingScheduleEvents.length === 0 && (
            <div className="sections">
              {/* VISITATION SCHEDULE */}
              <div className="note-container mt-10 mb-15">
                <Note
                  message={'When you choose a visitation schedule, it will be visible in the calendar for you and who you allow access to view it.'}
                />
              </div>

              {/* SCHEDULE SELECTION */}
              <div className="section visitation-schedule mt-10 mb-10">
                <CheckboxGroup
                  elClass="mt-10 schedule-type-checkboxes gap-10"
                  parentLabel={'Choose Visitation Schedule'}
                  onCheck={handleScheduleTypeSelection}
                  skipNameFormatting={true}
                  checkboxLabels={['50/50', 'Custom Weekends', 'Every Weekend', 'Every other Weekend']}
                />
              </div>

              {/* SHARE WITH */}
              <ShareWithCheckboxes
                required={false}
                shareWith={currentUser?.coparents?.map((x) => x.phone)}
                onCheck={handleShareWithSelection}
                icon={<ImEye />}
                labelText={'Share with'}
                containerClass={'share-with-coparents'}
                dataPhone={currentUser?.coparents?.map((x) => x.name)}
              />

              {/* LOCATION */}
              <InputWrapper wrapperClasses="mt-15 mb-15" inputType={'location'} labelText={'Preferred Transfer Location (with biological co-parent)'}>
                <Autocomplete
                  defaultValue={currentUser?.defaultTransferLocation}
                  placeholder={''}
                  apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
                  options={{
                    types: ['geocode', 'establishment'],
                    componentRestrictions: { country: 'usa' },
                  }}
                  className={`${theme}`}
                  onPlaceSelected={(place) => {
                    updateDefaultTransferLocation(
                      place.formatted_address,
                      `https://www.google.com/maps?daddr=7${encodeURIComponent(place.formatted_address)}`
                    ).then((r) => AlertManager.successAlert('Preferred Transfer Location Set'))
                  }}
                />
              </InputWrapper>
            </div>
          )}
          {/* HOLIDAY SELECTION */}
          <CheckboxGroup
            parentLabel={'Select the holidays YOU have the child(ren) this year'}
            elClass={'holiday-checkboxes gap-10'}
            onCheck={handleHolidaySelection}
            skipNameFormatting={true}
            checkboxLabels={holidayLabels.map((x) => x.name).sort()}
            dataDate={dataDates}
          />

          {showUpdateHolidaysButton && (
            <button className="button default green center mt-30" onClick={() => setHolidaysInDatabase()}>
              Update Holidays
            </button>
          )}
        </Fade>
      </div>
      {!showEveryOtherWeekendCard && !showCustomWeekendsCard && !showFiftyFiftyCard && <NavBar navbarClass={'visitation no-add-new-button'}></NavBar>}
    </>
  )
}