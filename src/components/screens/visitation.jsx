// Path: src\components\screens\visitation.jsx
import CustomWeekends from '/src/components/screens/visitation/customWeekends'
import EveryOtherWeekend from '/src/components/screens/visitation/everyOtherWeekend'
import FiftyFifty from '/src/components/screens/visitation/fiftyFifty'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import MyConfetti from '/src/components/shared/myConfetti'
import Note from '/src/components/shared/note'
import DatetimeFormats from '/src/constants/datetimeFormats'
import ModelNames from '/src/constants/modelNames'
import ScheduleTypes from '/src/constants/scheduleTypes'
import DB from '/src/database/DB'
import DB_UserScoped from '/src/database/db_userScoped'
import AlertManager from '/src/managers/alertManager'
import DatasetManager from '/src/managers/datasetManager'
import DateManager from '/src/managers/dateManager.js'
import Manager from '/src/managers/manager'
import ObjectManager from '/src/managers/objectManager'
import StringManager from '/src/managers/stringManager'
import VisitationManager from '/src/managers/visitationManager'
import CalendarMapper from '/src/mappers/calMapper'
import VisitationMapper from '/src/mappers/visitationMapper'
import CalendarEvent from '/src/models/new/calendarEvent'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import ScreenNames from '../../constants/screenNames'
import globalState from '../../context'
import useCalendarEvents from '../../hooks/useCalendarEvents'
import useCurrentUser from '../../hooks/useCurrentUser'
import DomManager from '../../managers/domManager'
import NavBar from '../navBar'
import AccordionTitle from '../shared/accordionTitle'
import AddressInput from '../shared/addressInput'
import ScreenHeader from '../shared/screenHeader'
import Spacer from '../shared/spacer'

export default function Visitation() {
  const {state, setState} = useContext(globalState)
  const {theme} = state

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
  const {currentUser} = useCurrentUser()
  const {calendarEvents} = useCalendarEvents()

  // Holiday
  const [userHolidays, setUserHolidays] = useState([])
  const [selectedHolidayDates, setSelectedHolidayDates] = useState([])
  const [holidaysFromApi, setHolidaysFromApi] = useState([])

  const UpdateDefaultTransferLocation = async (location, link) => {
    await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser?.key}/visitation/transferNavLink`, link)
    await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser?.key}/visitation/transferAddress`, location)
  }

  const DeleteSchedule = async () => {
    await VisitationManager.deleteSchedule(currentUser, existingScheduleEvents)
    setExistingScheduleEvents([])
    setShowDeleteButton(false)
    setState({...state, successAlertMessage: 'Visitation Schedule Removed', isLoading: false})
  }

  // Every Weekend
  const AddEveryWeekendToCalendar = async () => {
    // Set end date to the end of the year
    let weekends = VisitationManager.getEveryWeekend()
    let events = []
    weekends.flat().forEach((date) => {
      const dateObject = new CalendarEvent()
      // Required
      dateObject.title = `${StringManager.GetFirstNameOnly(currentUser?.name)}'s Scheduled Visitation`
      dateObject.startDate = moment(date).format(DatetimeFormats.dateForDb)
      // Not Required
      dateObject.ownerKey = currentUser?.key
      dateObject.createdBy = currentUser?.name
      dateObject.fromVisitationSchedule = true
      dateObject.visitationSchedule = ScheduleTypes.everyWeekend
      dateObject.shareWith = DatasetManager.getUniqueArray(shareWith).flat()

      events.push(dateObject)
    })

    // Upload to DB
    VisitationManager.addVisitationSchedule(currentUser, events).then((r) => r)
    MyConfetti.fire()
  }

  // SET HOLIDAYS IN DATABASE
  const SetHolidaysInDatabase = async () => {
    // Holidays
    if (Manager.IsValid(selectedHolidayDates)) {
      // setShowUpdateHolidaysButton(false)
      let events = []
      selectedHolidayDates.forEach((holidayDateString) => {
        const dateObject = new CalendarEvent()
        const holidayName = CalendarMapper.holidayDateToName(moment(holidayDateString).format('MM/DD'))
        // Required
        dateObject.title = `${StringManager.GetFirstNameOnly(currentUser?.name)}'s Holiday Visitation`
        dateObject.startDate = moment(holidayDateString).format(DatetimeFormats.dateForDb)
        dateObject.holidayName = holidayName
        // Not Required
        dateObject.ownerKey = currentUser?.key
        dateObject.createdBy = currentUser?.name
        dateObject.fromVisitationSchedule = true
        dateObject.isHoliday = true
        dateObject.shareWith = DatasetManager.getUniqueArray(shareWith, true)
        const cleanedObject = ObjectManager.GetModelValidatedObject(dateObject, ModelNames.calendarEvent)
        events.push(cleanedObject)
      })
      // Upload to DB
      await VisitationManager.setVisitationHolidays(currentUser, events)
    } else {
      await VisitationManager.deleteAllHolidaysForUser(currentUser)
    }
    setState({...state, successAlertMessage: 'Visitation Holidays Updated!'})
  }

  const HandleHolidaySelection = async (e) => {
    DomManager.HandleCheckboxSelection(
      e,
      (e) => {
        const dataDate = CalendarMapper.holidayNameToDate(e)
        const holidayMonth = moment(dataDate).month() + 1
        const currentMonth = moment().month() + 1
        const holidayYear = holidayMonth < currentMonth ? moment().year() + 1 : moment().year()
        const dateAsString = moment(`${dataDate}/${holidayYear}`).format(DatetimeFormats.dateForDb)
        console.log(dateAsString)
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

  const HandleScheduleTypeSelection = (e) => {
    DomManager.HandleCheckboxSelection(
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

  const GetVisitationHolidays = async (currentUser) => {
    const _holidays = await VisitationManager.getVisitationHolidays()
    let userHolidays = []
    if (Manager.IsValid(calendarEvents)) {
      userHolidays = calendarEvents.filter((x) => x.ownerKey === currentUser?.key && x.fromVisitationSchedule === true && x.isHoliday === true)
    }
    return {
      holidays: _holidays.flat(),
      userHolidays: userHolidays,
    }
  }

  const SetDefaultHolidayCheckboxes = () => {
    const holidayCheckboxesWrapper = document.querySelector('.holiday-checkboxes-wrapper')
    if (Manager.IsValid(holidayCheckboxesWrapper)) {
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

  const SetAllStates = async () => {
    const apiHolidays = await DateManager.getHolidays()

    // Minus Truman Day
    setHolidaysFromApi(apiHolidays.filter((x) => x.date !== `${moment().year()}-05-08`))
    await GetVisitationHolidays(currentUser).then((holidaysObject) => {
      const {holidays, userHolidays} = holidaysObject
      const userHolidaysList = DatasetManager.GetValidArray(CalendarMapper.eventsToHolidays(userHolidays))
      const userHolidaysDates = userHolidaysList.map((x) => x.date)
      setSelectedHolidayDates(DatasetManager.getUniqueArray(userHolidaysDates, true))
      setUserHolidays(userHolidaysList.map((x) => x.name))
      setTimeout(() => {
        SetDefaultHolidayCheckboxes(holidays)
      }, 300)
    })
  }

  const GetCurrentVisitationSchedule = async () => {
    let scheduleEvents = await VisitationManager.getSchedule(currentUser)
    scheduleEvents = scheduleEvents.filter((x) => x.isHoliday === false)
    if (scheduleEvents.length > 0) {
      setExistingScheduleEvents(scheduleEvents)
      setShowDeleteButton(true)
    } else {
      setExistingScheduleEvents([])
    }
  }

  const RemoveScheduleTypeActiveClass = () => {
    const checkboxWrapper = document.querySelector('.schedule-type-checkboxes')
    if (Manager.IsValid(checkboxWrapper)) {
      const checkboxes = checkboxWrapper.querySelectorAll('#checkbox-container')
      if (Manager.IsValid(checkboxes)) {
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
      AlertManager.confirmAlert('Are you sure you would like to Add an Every Weekend visitation schedule?', "I'm Sure", true, async () => {
        await AddEveryWeekendToCalendar()
      })
    }

    if (scheduleType === '') {
      RemoveScheduleTypeActiveClass()
    }
  }, [scheduleType])

  useEffect(() => {
    if (Manager.IsValid(currentUser) && Manager.IsValid(calendarEvents)) {
      GetCurrentVisitationSchedule().then((r) => r)
      SetAllStates().then((r) => r)
    }
  }, [currentUser, calendarEvents])

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
      <div id="visitation-container" className={`${theme} page-container`}>
        <ScreenHeader
          title={'Visitation'}
          screenName={ScreenNames.visitation}
          screenDescription="Oversee all aspects of visitation, including scheduling, holiday visits, and additional matters."
        />
        <Spacer height={10} />
        <div className="screen-content">
          {/* ALREADY HAS EXISTING SCHEDULE */}
          {existingScheduleEvents.length > 0 && (
            <>
              <p>
                You currently have a 50/50 visitation schedule added to your calendar. If you would like to modify the current schedule or switch to
                another schedule, please delete the current schedule first.
              </p>

              {showDeleteButton && (
                <>
                  <Spacer height={10} />
                  <button
                    className="button red default center"
                    onClick={() => {
                      AlertManager.confirmAlert(
                        'Are you sure you would like to permanently Delete your current visitation schedule?',
                        "I'm Sure",
                        true,
                        async () => {
                          await DeleteSchedule()
                        },
                        setScheduleType('')
                      )
                    }}>
                    Delete Current Schedule
                  </button>
                </>
              )}
            </>
          )}

          {/* NO EXISTING SCHEDULE */}
          {existingScheduleEvents.length === 0 && (
            <div className="sections">
              {/* VISITATION SCHEDULE */}
              <div className="note-container">
                <Note
                  message={
                    'When you establish a visitation schedule, it will be displayed on the calendar for you and anyone you permit to access it.'
                  }
                />
              </div>

              <Spacer height={10} />
              <div
                style={DomManager.AnimateDelayStyle(1, 0.2)}
                className={`visitation-section ${DomManager.Animate.FadeInUp('d', '.visitation-section')}`}>
                {/*  VISITATION SECTION */}
                <Accordion className={'white-bg'} id={'visitation-section'} expanded={showVisitationSection}>
                  <AccordionSummary id={'visitation-section-accordion-title'}>
                    <AccordionTitle
                      titleText={'Schedule & Transfer Location'}
                      onClick={() => setShowVisitationSection(!showVisitationSection)}
                      toggleState={showVisitationSection}
                    />
                  </AccordionSummary>
                  <AccordionDetails>
                    <p className="fs-15">Choose a visitation schedule and agreed upon transfer location</p>
                    <Spacer height={5} />
                    {/* SCHEDULE SELECTION */}
                    <div className="section visitation-schedule">
                      <CheckboxGroup
                        onCheck={HandleScheduleTypeSelection}
                        skipNameFormatting={true}
                        checkboxArray={DomManager.BuildCheckboxGroup({
                          currentUser,
                          labelType: 'visitation',
                        })}
                      />

                    </div>

                    {/* DEFAULT TRANSFER LOCATION */}
                    <AddressInput
                      defaultValue={currentUser?.visitation?.transferAddress}
                      wrapperClasses="address-input"
                      labelText="Preferred Transfer Location"
                      onChange={(address) => {
                        UpdateDefaultTransferLocation(address, Manager.GetDirectionsLink(address)).then(() =>
                          setTimeout(() => {
                            setState({...state, successAlertMessage: 'Preferred Transfer Location Set'})
                          }, 300)
                        )
                      }}
                    />
                    <Spacer height={5} />
                  </AccordionDetails>
                </Accordion>
              </div>
            </div>
          )}

          <div
            style={DomManager.AnimateDelayStyle(1, 0.35)}
            className={`visitation-section ${DomManager.Animate.FadeInUp('d', '.visitation-section')}`}>
            {/*  HOLIDAYS */}
            <Accordion className={'white-bg'} id={'visitation-holidays-section'} expanded={showHolidaysSection}>
              <AccordionSummary id={'visitation-holidays-section-accordion-title'}>
                <AccordionTitle
                  titleText={'Holidays'}
                  onClick={() => setShowHolidaysSection(!showHolidaysSection)}
                  toggleState={showHolidaysSection}
                />
              </AccordionSummary>
              <p className="fs-15">Select the holidays YOU have your child(ren) this year</p>
              <Spacer height={5} />
              <AccordionDetails>
                {/* HOLIDAY SELECTION */}
                <CheckboxGroup
                  containerClass="holidays"
                  elClass={'holiday-checkboxes-wrapper'}
                  onCheck={HandleHolidaySelection}
                  skipNameFormatting={true}
                  checkboxArray={DomManager.BuildCheckboxGroup({
                    currentUser,
                    customLabelArray: holidaysFromApi.map((x) => x.name),
                    defaultLabels: userHolidays,
                  })}
                />

                {showUpdateHolidaysButton && (
                  <button className="button default green center" onClick={() => SetHolidaysInDatabase()}>
                    Update Holidays
                  </button>
                )}

                <Spacer height={5} />
              </AccordionDetails>
            </Accordion>
          </div>
        </div>
      </div>
      {!showEveryOtherWeekendCard && !showCustomWeekendsCard && !showFiftyFiftyCard && <NavBar navbarClass={'visitation no-Add-new-button'}></NavBar>}
    </>
  )
}