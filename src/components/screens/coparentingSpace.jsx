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

export default function CoparentingSpace() {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state
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
  const [holidayLabels, setHolidayLabels] = useState([])
  const [holidaySelections, setHolidaySelections] = useState([])
  const [ffAccordionExpanded, setFfAccordionExpanded] = useState(false)
  const [scheduleAccordionExpanded, setScheduleAccordionExpanded] = useState(false)
  const [visitationAccordionExpanded, setVisitationAccordionExpanded] = useState(false)
  const [updateKey, setUpdateKey] = useState(0)

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
    // Manager.toggleForModalOrNewForm('show')
    setVisitationAccordionExpanded(false)
    const checkboxes = document.querySelectorAll('.box')
    checkboxes.forEach((box) => box.classList.remove('active'))
    setTimeout(() => {
      setState({ ...state, showMenuButton: true })
    }, 500)
  }

  // Weekends
  const addWeekendsToCalendar = () => {
    if (!Manager.isValid(defaultSelectedWeekends, true) || !Manager.isValid(fifthWeekendSelection)) {
      setState({ ...state, showAlert: true, alertMessage: 'Please choose default weekends and a five-month weekend' })
      return false
    }

    if (!Manager.isValid(shareWith, true)) {
      setState({ ...state, showAlert: true, alertMessage: 'Please set who can see the schedule' })
      return false
    }
    // Set end date to the end of the year
    const endDate = moment([moment().year()]).endOf('year').format('MM-DD-YYYY')
    let weekends = VisitationManager.getWeekends(scheduleTypes.variableWeekends, endDate, defaultSelectedWeekends, fifthWeekendSelection)

    // Standard Dates
    let events = []
    weekends.flat().forEach((date) => {
      const dateObject = new CalendarEvent()
      // Required
      dateObject.title = `${currentUser.name.formatNameFirstNameOnly()}'s Scheduled Visitation`
      dateObject.fromDate = moment(date).format('MM/DD/yyyy')
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

    // Holidays
    holidaySelections.forEach((holiday) => {
      const dateObject = new CalendarEvent()
      // Required
      dateObject.title = `${currentUser.name.formatNameFirstNameOnly()}'s Holiday Visitation`
      dateObject.fromDate = moment(holiday.date).format('MM/DD/yyyy')
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
    DB.addVisitationSchedule(events)
    MyConfetti.fire()
  }

  // 50/50
  const addFiftyFiftyToCal = () => {
    if (firstFFPeriodEnd.length === 0 || firstFFPeriodStart.length === 0 || secondFFPeriodEnd.length === 0 || secondFFPeriodStart.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Both schedule ranges are required' })
      return false
    }

    if (shareWith.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please choose who can see this visitation schedule' })
      return false
    }

    const dates = {
      firstFFPeriodStart,
      firstFFPeriodEnd,
      secondFFPeriodStart,
      secondFFPeriodEnd,
      thirdFFPeriodStart,
      thirdFFPeriodEnd,
    }
    const scheduleDates = VisitationManager.getFiftyFifty(dates)
    let events = []
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

    // Holidays
    holidaySelections.forEach((holiday) => {
      const dateObject = new CalendarEvent()
      // Required
      dateObject.title = `${currentUser.name.formatNameFirstNameOnly()}'s Holiday Visitation`
      dateObject.fromDate = moment(holiday.date).format('MM/DD/yyyy')
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
    DB.addVisitationSchedule(events)
    MyConfetti.fire()
  }

  const handleWeekendSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {},
      (e) => {
        if (defaultSelectedWeekends.length > 0) {
          setDefaultSelectedWeekends((defaultSelectedWeekends) => [...defaultSelectedWeekends, e])
        } else {
          setDefaultSelectedWeekends([e])
        }
      },
      true
    )
  }

  const handleFifthWeekendSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        console.log(e)
      },
      (e) => {
        setFifthWeekendSelection(e)
      },
      false
    )
  }

  const handleShareWithSelection = async (e) => {
    await Manager.handleShareWithSelection(e, currentUser, shareWith).then((updated) => {
      setShareWith(updated)
    })
  }

  const handleHolidaySelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        let filtered = holidaySelections.filter((x) => x !== e)
        setHolidaySelections(filtered)
      },
      (e) => {
        let formattedName = holidayLabels.filter((x) => x.name === e)[0]
        setHolidaySelections([...holidaySelections, formattedName])
      },
      true
    )
  }

  const handleScheduleTypeSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setScheduleType(VisitationMapper.formattedScheduleTypes(e))
        setScheduleAccordionExpanded(false)
        setState({ ...state, showMenuButton: false })
      },
      (e) => {}
    )
  }

  const getVisitationHolidays = async () => {
    const hols = []
    await DateManager.getVisitationHolidays().then((holiday) => {
      hols.push(holiday)
    })
    return hols
  }

  useEffect(() => {
    getVisitationHolidays().then((holidays) => {
      setHolidayLabels(holidays[0])
    })
    Manager.toggleForModalOrNewForm('show')
    setTimeout(() => {
      setState({ ...state, showMenuButton: true, showBackButton: false })
    }, 500)
  }, [])

  return (
    <div>
      {/* CONFIRM ALERT */}
      <Confirm
        message={'Are you sure you would like to delete your visitation schedule?'}
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
      <p className="screen-title">Coparenting Space</p>
      <div id="coparenting-setup-container" className={`${currentUser?.settings?.theme} page-container form`}>
        {/* SECTIONS */}
        <div className="sections">
          {/* VISITATION SCHEDULE */}
          <Accordion>
            <label className="accordion-header" onClick={() => setVisitationAccordionExpanded(!visitationAccordionExpanded)}>
              Visitation
              {visitationAccordionExpanded ? (
                <span className="material-icons ml-auto">expand_less</span>
              ) : (
                <span className="material-icons ml-auto">expand_more</span>
              )}
            </label>
            <Accordion.Panel expanded={visitationAccordionExpanded}>
              <div className="note-container">
                <Note
                  elClass={'mt-10'}
                  message={'When you choose a visitation schedule, it will be visible in the calendar for you and chosen coparents to view'}
                />
              </div>

              {/* SCHEDULE SELECTION ACCORDION */}
              <div className="section visitation-schedule mt-10 mb-10">
                {/* SCHEDULE SELECTION */}
                <Accordion>
                  <label className="accordion-header" onClick={() => setScheduleAccordionExpanded(!scheduleAccordionExpanded)}>
                    Choose Visitation Schedule
                    {scheduleAccordionExpanded ? (
                      <span className="material-icons ml-auto">expand_less</span>
                    ) : (
                      <span className="material-icons ml-auto">expand_more</span>
                    )}
                  </label>
                  <Accordion.Panel expanded={scheduleAccordionExpanded}>
                    <CheckboxGroup
                      boxWidth={50}
                      elClass="mt-10"
                      onCheck={handleScheduleTypeSelection}
                      skipNameFormatting={true}
                      labels={['50/50', 'Specific Weekends', 'Every Weekend', 'Every other Weekend']}
                    />
                  </Accordion.Panel>
                </Accordion>
              </div>

              {/* 50/50 SCHEDULE */}
              {scheduleType === scheduleTypes.fiftyFifty && (
                <>
                  <div className="text pl-10 pr-10">
                    <p className="mb-10 white-text">An arrangement where both you and your coparent have equal time with your children.</p>
                    <p className="mb-10 white-text">
                      For the start of the next visitation period (and next period ONLY) you have your children, enter the date ranges for both the
                      first half of the 50/50 and the second half of the 50/50.
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

                  {/* HOLIDAY SELECTION */}
                  <Accordion>
                    <label className="accordion-header" onClick={() => setFfAccordionExpanded(!ffAccordionExpanded)}>
                      Select Holidays <b className="pr-5 pl-5">You</b> Have the Child(ren){' '}
                      {ffAccordionExpanded ? (
                        <span className="material-icons ml-auto">expand_less</span>
                      ) : (
                        <span className="material-icons ml-auto">expand_more</span>
                      )}
                    </label>
                    <Accordion.Panel expanded={ffAccordionExpanded}>
                      <CheckboxGroup
                        boxWidth={50}
                        elClass="mt-10"
                        onCheck={handleHolidaySelection}
                        skipNameFormatting={true}
                        labels={holidayLabels.map((x) => x.name).sort()}
                      />
                    </Accordion.Panel>
                  </Accordion>
                  <div className="share-with-container mt-15">
                    <label>
                      <span className="material-icons-round warning mr-10">visibility</span> Who is allowed to see it?
                      <span className="asterisk">*</span>
                    </label>
                    <CheckboxGroup
                      dataPhone={currentUser.coparents.map((x) => x.phone)}
                      labels={currentUser.coparents.map((x) => x.name)}
                      onCheck={handleShareWithSelection}
                    />
                  </div>
                  {/* BUTTONS */}
                  <div className="button-group mt-15 bottom visible">
                    <button className=" button default bottom visible" onClick={resetScreen}>
                      <span className="material-icons-round pr-5">undo</span>
                    </button>
                    <button
                      className="red button bottom visible"
                      onClick={() => {
                        setDeleteMessage('Deleting Existing Visitation Schedule')
                      }}>
                      <span className="material-icons">delete</span>
                    </button>
                    <button className="button bottom green visible" onClick={addFiftyFiftyToCal}>
                      <span className="material-icons-round">event_available</span>
                    </button>
                  </div>
                </>
              )}

              {/* WEEKENDS SCHEDULE */}
              {scheduleType === scheduleTypes.variableWeekends && (
                <>
                  <div className="form mb-20">
                    <label>Which weekends will YOU have the child(ren)?</label>
                    <CheckboxGroup
                      boxWidth={50}
                      elClass={'mb-15'}
                      onCheck={handleWeekendSelection}
                      labels={['1st Weekend', '2nd Weekend', '3rd Weekend', '4th Weekend']}
                    />
                    <label>If it is a month with 5 weekends, which additional weekend will YOU have the child(ren)?</label>
                    <CheckboxGroup
                      boxWidth={50}
                      onCheck={handleFifthWeekendSelection}
                      labels={['1st Weekend', '2nd Weekend', '3rd Weekend', '4th Weekend', '5th Weekend']}
                    />
                  </div>
                  {/* HOLIDAY SELECTION */}
                  <label>Select the holidays YOU have the child(ren) this year</label>
                  <CheckboxGroup boxWidth={50} onCheck={handleHolidaySelection} skipNameFormatting={true} labels={holidayLabels.map((x) => x.name)} />

                  <div className="share-with-container">
                    <label>
                      <span className="material-icons-round warning mr-10">visibility</span> Who is allowed to see it?
                      <span className="asterisk">*</span>
                    </label>
                    <CheckboxGroup
                      dataPhone={currentUser.coparents.map((x) => x.phone)}
                      labels={currentUser.coparents.map((x) => x.name)}
                      onCheck={handleShareWithSelection}
                    />
                  </div>
                  <div className="button-group bottom visible">
                    <button className="bottom button default visible" onClick={resetScreen}>
                      <span className="material-icons-round pr-5">undo</span>
                    </button>
                    <button className="button bottom submit green visible " onClick={addWeekendsToCalendar}>
                      <span className="material-icons-round">event_available</span>
                    </button>
                    <button
                      className=" button bottom cancel red visible"
                      onClick={() => {
                        setDeleteMessage('deleting schedule')
                      }}>
                      <span className="material-icons-round">delete</span>
                    </button>
                  </div>
                  <label>Preferred Transfer Location (for primary/biological coparent)</label>
                  <Autocomplete
                    placeholder="Enter location..."
                    apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
                    options={{
                      types: ['geocode', 'establishment'],
                      componentRestrictions: { country: 'usa' },
                    }}
                    className="mb-15"
                    onPlaceSelected={(place) => {
                      updatePreferredLocation(
                        place.formatted_address,
                        `https://www.google.com/maps?daddr=7${encodeURIComponent(place.formatted_address)}`
                      )
                    }}
                  />
                </>
              )}
            </Accordion.Panel>
          </Accordion>
        </div>
      </div>
    </div>
  )
}
