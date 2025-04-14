import React, {useContext, useState} from 'react'
// Path: src\components\screens\visitation\fiftyFifty.jsx
import Label from '../../../components/shared/label'
import Modal from '../../../components/shared/modal'
import AccordionSummary from '@mui/material/AccordionSummary'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import globalState from '../../../context'
import {FaMinus, FaPlus} from 'react-icons/fa6'
import Manager from '../../../managers/manager'
import InputWrapper from '../../../components/shared/inputWrapper'
import DatetimeFormats from '../../../constants/datetimeFormats'
import AlertManager from '../../../managers/alertManager'
import VisitationManager from '../../../managers/visitationManager'
import CalendarEvent from '../../../models/calendarEvent'
import StringManager from '../../../managers/stringManager'
import ScheduleTypes from '../../../constants/scheduleTypes'
import MyConfetti from '../../../components/shared/myConfetti'
import moment from 'moment'
import ShareWithCheckboxes from '../../../components/shared/shareWithCheckboxes'
import Spacer from '../../shared/spacer'
import InputTypes from '../../../constants/inputTypes'

export default function FiftyFifty({hide, showCard}) {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme} = state
  const [expandFiftyFiftyInfoText, setExpandFiftyFiftyInfoText] = useState(false)
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
    setState({...state, refreshKey: Manager.getUid()})
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
    scheduleDates.forEach((date) => {
      const dateObject = new CalendarEvent()
      // Required
      dateObject.title = `${StringManager.getFirstNameOnly(currentUser?.name)}'s Scheduled Visitation`
      dateObject.startDate = moment(date).format(DatetimeFormats.dateForDb)
      // Not Required
      dateObject.ownerKey = currentUser?.key
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
    // Upload to DB
    await VisitationManager.addVisitationSchedule(currentUser, events).then((r) => r)
    resetForm()
  }

  const handleShareWithSelection = async (e) => {
    const updated = await Manager.handleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
  }

  return (
    <Modal
      onSubmit={addToCalendar}
      submitText={'Add Schedule'}
      className="form"
      wrapperClass="add-fifty-fifty-schedule"
      title={'50/50 Visitation Schedule'}
      showCard={showCard}
      onClose={resetForm}>
      <div className="text">
        <Spacer height={5} />
        <Accordion id={'fifty-fifty-info'} expanded={expandFiftyFiftyInfoText}>
          <AccordionSummary>
            <div className="flex space-between" id="accordion-title" onClick={() => setExpandFiftyFiftyInfoText(!expandFiftyFiftyInfoText)}>
              <Label text={`What is a 50/50 Visitation Schedule?`} />
              {!expandFiftyFiftyInfoText && <FaPlus className={'visitation-card'} />}
              {expandFiftyFiftyInfoText && <FaMinus className={'visitation-card'} />}
            </div>
          </AccordionSummary>
          <Spacer height={5} />
          <AccordionDetails>
            <p>An arrangement where both you and your co-parent have equal time with your children.</p>
            <p>
              For the start of the next visitation period (and next period ONLY) you have your children, enter the date ranges for both the first half
              of the 50/50 and the second half of the 50/50.
            </p>
            <Spacer height={5} />
            <p>
              Use the <u>third period</u> date selector if it is necessary for your schedule.
            </p>
            <Spacer height={5} />
            <p>
              Example <br /> If you have your children (in August) Wednesday-Friday and then Monday-Wednesday during the following week:
              <Spacer height={5} />
              <span>You would choose: 8/14-8/16 for the first period and 8/19-8/21 for the second period.</span>
            </p>
          </AccordionDetails>
        </Accordion>
        <Spacer height={5} />

        {/* FIRST PERIOD */}
        <InputWrapper
          wrapperClasses="date-range-input"
          labelText={'First Period'}
          required={true}
          inputType={InputTypes.dateRange}
          onDateOrTimeSelection={(dateArray) => {
            if (Manager.isValid(dateArray)) {
              setFirstFFPeriodStart(dateArray[0].format(DatetimeFormats.dateForDb))
              setFirstFFPeriodEnd(moment(dateArray[1].format(DatetimeFormats.dateForDb)))
            }
          }}
        />

        <InputWrapper
          wrapperClasses="date-range-input"
          labelText={'Second Period'}
          required={true}
          inputType={InputTypes.dateRange}
          onDateOrTimeSelection={(dateArray) => {
            if (Manager.isValid(dateArray)) {
              setSecondFFPeriodStart(dateArray[0].format(DatetimeFormats.dateForDb))
              setSecondFFPeriodEnd(moment(dateArray[1].format(DatetimeFormats.dateForDb)))
            }
          }}
        />

        {/* THIRD PERIOD */}
        <InputWrapper
          wrapperClasses="date-range-input"
          labelText={'Third Period'}
          required={true}
          inputType={InputTypes.dateRange}
          onDateOrTimeSelection={(dateArray) => {
            if (Manager.isValid(dateArray)) {
              setThirdFFPeriodStart(dateArray[0].format(DatetimeFormats.dateForDb))
              setThirdFFPeriodEnd(moment(dateArray[1].format(DatetimeFormats.dateForDb)))
            }
          }}
        />

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
    </Modal>
  )
}