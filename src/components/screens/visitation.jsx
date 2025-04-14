// Path: src\components\screens\visitation.jsx
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context'
import ScheduleTypes from '/src/constants/scheduleTypes'
import DB from '/src/database/DB'
import {Fade} from 'react-awesome-reveal'
import CalendarEvent from '/src/models/calendarEvent'
import Manager from '/src/managers/manager'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import VisitationManager from '/src/managers/visitationManager'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import MyConfetti from '/src/components/shared/myConfetti'
import Note from '/src/components/shared/note'
import DB_UserScoped from '/src/database/db_userScoped'
import VisitationMapper from '/src/mappers/visitationMapper'
import DatetimeFormats from '/src/constants/datetimeFormats'
import CalendarMapper from '/src/mappers/calMapper'
import SecurityManager from '/src/managers/securityManager'
import NavBar from '../navBar'
import InputWrapper from '/src/components/shared/inputWrapper'
import DatasetManager from '/src/managers/datasetManager'
import AlertManager from '/src/managers/alertManager'
import ObjectManager from '/src/managers/objectManager'
import ModelNames from '/src/models/modelNames'
import StringManager from '/src/managers/stringManager'
import FiftyFifty from '/src/components/screens/visitation/fiftyFifty'
import EveryOtherWeekend from '/src/components/screens/visitation/everyOtherWeekend'
import CustomWeekends from '/src/components/screens/visitation/customWeekends'
import DateManager from '/src/managers/dateManager.js'
import Spacer from '../shared/spacer'
import AccordionTitle from '../shared/accordionTitle'
import InputTypes from '../../constants/inputTypes'

export default function Visitation() {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme} = state

  // State
  const [showEveryOtherWeekendCard, setShowEveryOtherWeekendCard] = useState(false)
  const [showFiftyFiftyCard, setShowFiftyFiftyCard] = useState(false)
  const [shareWith, setShareWith] = useState([])
  const [showCustomWeekendsCard, setShowCustomWeekendsCard] = useState(false)
  const [scheduleType, setScheduleType] = useState('')
  const [existingScheduleEvents, setExistingScheduleEvents] = useState([])
  const [showUpdateHolidaysButton, setShowUpdateHolidaysButton] = useState(true)
  const [showDeleteButton, setShowDeleteButton] = useState(false)
  const [showVisitationSection, setShowVisitationSection] = useState(false)
  const [showHolidaysSection, setShowHolidaysSection] = useState(false)

  // Holiday
  const [userHolidays, setUserHolidays] = useState([])
  const [selectedHolidayDates, setSelectedHolidayDates] = useState([])
  const [holidaysFromApi, setHolidaysFromApi] = useState([])

  const updateDefaultTransferLocation = async (location, link) => {
    console.log(`${DB.tables.users}/${currentUser?.key}/visitation/transferNavLink`)
    console.log(location, link)
    await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser?.key}/visitation/transferNavLink`, link)
    await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser?.key}/visitation/transferAddress`, location)
  }

  const deleteSchedule = async () => {
    setState({...state, isLoading: true})
    await VisitationManager.deleteSchedule(currentUser, existingScheduleEvents)
    setExistingScheduleEvents([])
    setShowDeleteButton(false)
    setState({...state, isLoading: false})
    AlertManager.successAlert('Visitation Schedule Removed')
  }

  // Every Weekend
  const addEveryWeekendToCalendar = async () => {
    // Set end date to the end of the year
    let weekends = VisitationManager.getEveryWeekend()
    let events = []
    weekends.flat().forEach((date) => {
      const dateObject = new CalendarEvent()
      // Required
      dateObject.title = `${StringManager.getFirstNameOnly(currentUser?.name)}'s Scheduled Visitation`
      dateObject.startDate = moment(date).format(DatetimeFormats.dateForDb)
      // Not Required
      dateObject.ownerKey = currentUser?.key
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
        dateObject.title = `${StringManager.getFirstNameOnly(currentUser?.name)}'s Holiday Visitation`
        dateObject.startDate = moment(holidayDateString).format(DatetimeFormats.dateForDb)
        dateObject.holidayName = holidayName
        // Not Required
        dateObject.ownerKey = currentUser?.key
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

  const handleHolidaySelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        const dataDate = CalendarMapper.holidayNameToDate(e)
        const holidayMonth = moment(dataDate).month() + 1
        const currentMonth = moment().month() + 1
        const holidayYear = holidayMonth < currentMonth ? moment().year() + 1 : moment().year()
        const dateAsString = moment(`${dataDate}/${holidayYear}`, DatetimeFormats.dateForDb).format(DatetimeFormats.dateForDb)
        setSelectedHolidayDates([...selectedHolidayDates, dateAsString])
      },
      (e) => {
        const dataDate = CalendarMapper.holidayNameToDate(e)
        const holidayMonth = moment(dataDate).month() + 1
        const currentMonth = moment().month() + 1
        const holidayYear = holidayMonth < currentMonth ? moment().year() + 1 : moment().year()
        const dateAsString = moment(`${dataDate}/${holidayYear}`, DatetimeFormats.dateForDb).format(DatetimeFormats.dateForDb)
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
      () => {
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
      userHolidays = userEvents.filter((x) => x.ownerKey === currentUser?.key && x.fromVisitationSchedule === true && x.isHoliday === true)
    }
    return {
      holidays: _holidays.flat(),
      userHolidays: userHolidays,
    }
  }

  const setDefaultHolidayCheckboxes = () => {
    const holidayCheckboxesWrapper = document.querySelector('.holiday-checkboxes-wrapper')
    if (Manager.isValid(holidayCheckboxesWrapper)) {
      const checkboxes = holidayCheckboxesWrapper.querySelectorAll('[data-date]')
      checkboxes.forEach((checkboxWrapper) => {
        const holidayLabel = checkboxWrapper.getAttribute('data-label')
        if (holidayLabel.length > 0) {
          if (userHolidays.includes(holidayLabel)) {
            // Set checkboxes active
            holidayCheckboxesWrapper.querySelector(`[data-label="${holidayLabel}"]`).classList.add('active')
          }
        }
      })
    }
  }

  const setAllStates = async () => {
    const apiHolidays = await DateManager.getHolidays()
    setHolidaysFromApi(apiHolidays)
    await getVisitationHolidays(currentUser).then((holidaysObject) => {
      const {holidays, userHolidays} = holidaysObject
      const userHolidaysList = Manager.convertToArray(CalendarMapper.eventsToHolidays(userHolidays))
      const userHolidaysDates = userHolidaysList.map((x) => x.date)
      setSelectedHolidayDates(DatasetManager.getUniqueArray(userHolidaysDates, true))
      setUserHolidays(userHolidaysList.map((x) => x.name))
      setTimeout(() => {
        setDefaultHolidayCheckboxes(holidays)
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
        <FiftyFifty
          showCard={showFiftyFiftyCard}
          hide={() => {
            setShowFiftyFiftyCard(false)
            setScheduleType('')
          }}
        />
        <EveryOtherWeekend
          showCard={showEveryOtherWeekendCard}
          hide={() => {
            setShowEveryOtherWeekendCard(false)
            setScheduleType('')
          }}
        />
        <CustomWeekends
          showCard={showCustomWeekendsCard}
          hide={() => {
            setShowCustomWeekendsCard(false)
            setScheduleType('')
          }}
        />
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
            {showDeleteButton && (
              <div className="buttons flex">
                <button
                  className="button red default center"
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
            <div className="note-container">
              <Note
                message={'When you establish a visitation schedule, it will be displayed on the calendar for you and anyone you permit to access it.'}
              />
            </div>

            <Spacer height={10} />
            <Fade direction={'up'} duration={1000} triggerOnce={true}>
              {/*  VISITATION SECTION */}
              <Accordion id={'visitation-section'} expanded={showVisitationSection}>
                <AccordionSummary id={'visitation-section-accordion-title'}>
                  <AccordionTitle
                    titleText={'Schedule & Location'}
                    onClick={() => setShowVisitationSection(!showVisitationSection)}
                    toggleState={showVisitationSection}
                  />
                </AccordionSummary>
                <p className="fs-15">Choose a visitation schedule and agreed upon transfer location</p>
                <AccordionDetails>
                  {/* SCHEDULE SELECTION */}
                  <div className="section visitation-schedule">
                    <CheckboxGroup
                      elClass="schedule-type-checkboxes"
                      onCheck={handleScheduleTypeSelection}
                      skipNameFormatting={true}
                      checkboxArray={Manager.buildCheckboxGroup({
                        currentUser,
                        labelType: 'visitation',
                      })}
                    />
                  </div>

                  {/* LOCATION */}
                  <InputWrapper
                    inputType={InputTypes.address}
                    wrapperClasses="show-label"
                    labelText={'Agreed Upon Transfer Location'}
                    onChange={(address) => {
                      console.log(address)
                      updateDefaultTransferLocation(address, Manager.getDirectionsLink(address)).then(() =>
                        setTimeout(() => {
                          setState({...state, successAlertMessage: 'Preferred Transfer Location Set'})
                        }, 300)
                      )
                    }}
                  />
                </AccordionDetails>
              </Accordion>
            </Fade>
          </div>
        )}

        <Spacer height={5} />
        <Fade direction={'up'} duration={1000} triggerOnce={true}>
          {/*  HOLIDAYS */}
          <Accordion id={'visitation-holidays-section'} expanded={showHolidaysSection}>
            <AccordionSummary id={'visitation-holidays-section-accordion-title'}>
              <AccordionTitle titleText={'Holidays'} onClick={() => setShowHolidaysSection(!showHolidaysSection)} toggleState={showHolidaysSection} />
            </AccordionSummary>
            <p className="fs-15">Select the holidays YOU have your child(ren) this year</p>
            <Spacer height={5} />
            <AccordionDetails>
              {/* HOLIDAY SELECTION */}
              <CheckboxGroup
                containerClass="holidays"
                elClass={'holiday-checkboxes-wrapper'}
                onCheck={handleHolidaySelection}
                skipNameFormatting={true}
                checkboxArray={Manager.buildCheckboxGroup({
                  currentUser,
                  customLabelArray: holidaysFromApi.map((x) => x.name),
                  defaultLabels: userHolidays,
                })}
              />

              {showUpdateHolidaysButton && (
                <button className="button default green center" onClick={() => setHolidaysInDatabase()}>
                  Update Holidays
                </button>
              )}

              <Spacer height={5} />
            </AccordionDetails>
          </Accordion>
        </Fade>
      </div>
      {!showEveryOtherWeekendCard && !showCustomWeekendsCard && !showFiftyFiftyCard && <NavBar navbarClass={'visitation no-add-new-button'}></NavBar>}
    </>
  )
}