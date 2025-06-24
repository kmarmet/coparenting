import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import moment from 'moment'
import React, {useContext, useState} from 'react'
import {FaMinus, FaPlus} from 'react-icons/fa6'
import DatetimeFormats from '../../../constants/datetimeFormats'
import InputTypes from '../../../constants/inputTypes'
import ScheduleTypes from '../../../constants/scheduleTypes'
import globalState from '../../../context'
import useCurrentUser from '../../../hooks/useCurrentUser'
import AlertManager from '../../../managers/alertManager'
import DatasetManager from '../../../managers/datasetManager'
import Manager from '../../../managers/manager'
import StringManager from '../../../managers/stringManager'
import VisitationManager from '../../../managers/visitationManager'
import CalendarEvent from '../../../models/new/calendarEvent'
import AccordionTitle from '../../shared/accordionTitle'
import Form from '../../shared/form'
import InputField from '../../shared/inputField' // Path: src\components\screens\visitation\fiftyFifty.jsx
import MyConfetti from '../../shared/myConfetti'
import ShareWithDropdown from '../../shared/shareWithDropdown'
import Spacer from '../../shared/spacer'

export default function FiftyFifty({hide, showCard}) {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const [expandFiftyFiftyInfoText, setExpandFiftyFiftyInfoText] = useState(false)
  const [firstFFPeriodStart, setFirstFFPeriodStart] = useState('')
  const [firstFFPeriodEnd, setFirstFFPeriodEnd] = useState('')
  const [secondFFPeriodStart, setSecondFFPeriodStart] = useState('')
  const [secondFFPeriodEnd, setSecondFFPeriodEnd] = useState('')
  const [thirdFFPeriodStart, setThirdFFPeriodStart] = useState('')
  const [thirdFFPeriodEnd, setThirdFFPeriodEnd] = useState('')
  const [shareWith, setShareWith] = useState([])
  const {currentUser} = useCurrentUser()

  const ResetForm = () => {
    Manager.ResetForm('Add-fifty-fifty-schedule')
    setShareWith([])
    setState({...state, refreshKey: Manager.GetUid()})
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
      dateObject.title = `${StringManager.GetFirstNameOnly(currentUser?.name)}'s Scheduled Visitation`
      dateObject.startDate = moment(date).format(DatetimeFormats.dateForDb)
      // Not Required
      dateObject.ownerKey = currentUser?.key
      dateObject.createdBy = currentUser?.name
      dateObject.fromVisitationSchedule = true
      dateObject.id = Manager.GetUid()
      dateObject.visitationSchedule = ScheduleTypes.fiftyFifty
      dateObject.shareWith = DatasetManager.getUniqueArray(shareWith).flat()
      if (events.length === 0) {
        events = [dateObject]
      } else {
        events = [...events, dateObject]
      }
    })
    MyConfetti.fire()
    // Upload to DB
    await VisitationManager.addVisitationSchedule(currentUser, events).then((r) => r)
    ResetForm()
  }

  const HandleShareWithSelection = (e) => {
    const updated = DomManager.HandleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
  }

  return (
    <Form
      onSubmit={addToCalendar}
      submitText={'Add Schedule'}
      className="form"
      wrapperClass="add-fifty-fifty-schedule"
      title={'50/50 Visitation Schedule'}
      showCard={showCard}
      onClose={() => ResetForm()}>
      <div className="text">
        <Spacer height={5} />
        <Accordion id={'fifty-fifty-info'} expanded={expandFiftyFiftyInfoText}>
          <AccordionSummary>
            <div className="flex space-between" id="accordion-title" onClick={() => setExpandFiftyFiftyInfoText(!expandFiftyFiftyInfoText)}>
              <AccordionTitle text={`What is a 50/50 Visitation Schedule?`} />
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
        <InputField
          wrapperClasses="date-range-input"
          placeholder={'First Period'}
          required={true}
          inputType={InputTypes.dateRange}
          onDateOrTimeSelection={(dateArray) => {
            if (Manager.IsValid(dateArray)) {
              setFirstFFPeriodStart(dateArray[0].format(DatetimeFormats.dateForDb))
              setFirstFFPeriodEnd(moment(dateArray[1].format(DatetimeFormats.dateForDb)))
            }
          }}
        />

        <InputField
          wrapperClasses="date-range-input"
          placeholder={'Second Period'}
          required={true}
          inputType={InputTypes.dateRange}
          onDateOrTimeSelection={(dateArray) => {
            if (Manager.IsValid(dateArray)) {
              setSecondFFPeriodStart(dateArray[0].format(DatetimeFormats.dateForDb))
              setSecondFFPeriodEnd(moment(dateArray[1].format(DatetimeFormats.dateForDb)))
            }
          }}
        />

        {/* THIRD PERIOD */}
        <InputField
          wrapperClasses="date-range-input"
          placeholder={'Third Period'}
          required={true}
          inputType={InputTypes.dateRange}
          onDateOrTimeSelection={(dateArray) => {
            if (Manager.IsValid(dateArray)) {
              setThirdFFPeriodStart(dateArray[0].format(DatetimeFormats.dateForDb))
              setThirdFFPeriodEnd(moment(dateArray[1].format(DatetimeFormats.dateForDb)))
            }
          }}
        />

        {/* SHARE WITH */}
        <ShareWithDropdown
          required={false}
          shareWith={currentUser?.coParents?.map((x) => x.phone)}
          onCheck={HandleShareWithSelection}
          placeholder={'Select Contacts to Share With'}
          containerClass={'share-with-coparents'}
          dataKey={currentUser?.coParents?.map((x) => x.name)}
        />
      </div>
    </Form>
  )
}