// Path: src\components\screens\visitation\fiftyFifty.jsx
import Label from '../../../components/shared/label'
import BottomCard from '../../../components/shared/bottomCard'
import AccordionSummary from '@mui/material/AccordionSummary'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import globalState from '../../../context'
import { useContext, useState } from 'react'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa6'
import Manager from '../../../managers/manager'
import InputWrapper from '../../../components/shared/inputWrapper'
import DateFormats from '../../../constants/dateFormats'
import { MobileDateRangePicker, SingleInputDateRangeField } from '@mui/x-date-pickers-pro'
import AlertManager from '../../../managers/alertManager'
import VisitationManager from '../../../managers/visitationManager'
import CalendarEvent from '../../../models/calendarEvent'
import StringManager from '../../../managers/stringManager'
import ScheduleTypes from '../../../constants/scheduleTypes'
import MyConfetti from '../../../components/shared/myConfetti'
import moment from 'moment'
import ShareWithCheckboxes from '../../../components/shared/shareWithCheckboxes'

export default function FiftyFifty({ hide, showCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [expandFiftyFiftyInfoText, setExpandFiftyFiftyInfoText] = useState(false)
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [firstFFPeriodStart, setFirstFFPeriodStart] = useState('')
  const [firstFFPeriodEnd, setFirstFFPeriodEnd] = useState('')
  const [secondFFPeriodStart, setSecondFFPeriodStart] = useState('')
  const [secondFFPeriodEnd, setSecondFFPeriodEnd] = useState('')
  const [thirdFFPeriodStart, setThirdFFPeriodStart] = useState('')
  const [thirdFFPeriodEnd, setThirdFFPeriodEnd] = useState('')
  const [shareWith, setShareWith] = useState([])

  const resetForm = () => {
    Manager.resetForm('add-fifty-fifty-schedule')
    setShareWith([])
    setRefreshKey(Manager.getUid())
    hide()
  }

  // 50/50
  const addToCalendar = async () => {
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
      dateObject.title = `${StringManager.getFirstNameOnly(currentUser?.name)}'s Scheduled Visitation`
      dateObject.startDate = moment(date).format(DateFormats.dateForDb)
      // Not Required
      dateObject.ownerKey = currentUser?.phone
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
    resetForm()
    // Upload to DB
    await VisitationManager.addVisitationSchedule(currentUser, events).then((r) => r)
  }

  const addThemeToDatePickers = () => {
    setTimeout(() => {
      const datetimeParent = document.querySelector('.MuiDialog-root.MuiModal-root')
      datetimeParent.classList.add(currentUser?.settings?.theme)
    }, 100)
  }

  const handleShareWithSelection = async (e) => {
    const updated = await Manager.handleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
  }

  return (
    <BottomCard
      onSubmit={addToCalendar}
      submitText={'Add Schedule'}
      className="form"
      wrapperClass="add-fifty-fifty-schedule"
      title={'50/50 Visitation Schedule'}
      showCard={showCard}
      refreshKey={refreshKey}
      onClose={resetForm}>
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
              For the start of the next visitation period (and next period ONLY) you have your children, enter the date ranges for both the first half
              of the 50/50 and the second half of the 50/50.
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
        {/* FIRST PERIOD */}
        <InputWrapper wrapperClasses="date-range-input mt-15" labelText={'First Period'} required={true} inputType={'date'}>
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
        {/* SHARE WITH */}
        <ShareWithCheckboxes
          required={false}
          shareWith={currentUser?.coparents?.map((x) => x.phone)}
          onCheck={handleShareWithSelection}
          labelText={'Share with'}
          containerClass={'share-with-coparents'}
          dataKey={currentUser?.coparents?.map((x) => x.name)}
        />
      </div>
    </BottomCard>
  )
}