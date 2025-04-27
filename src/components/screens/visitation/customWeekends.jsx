// Path: src\components\screens\visitation\customWeekends.jsx
import Modal from '../../../components/shared/modal'
import globalState from '../../../context'
import React, {useContext, useState} from 'react'
import Manager from '../../../managers/manager'
import AlertManager from '../../../managers/alertManager'
import VisitationManager from '../../../managers/visitationManager'
import CalendarEvent from '../../../models/calendarEvent'
import StringManager from '../../../managers/stringManager'
import ScheduleTypes from '../../../constants/scheduleTypes'
import MyConfetti from '../../../components/shared/myConfetti'
import moment from 'moment'
import ShareWithCheckboxes from '../../../components/shared/shareWithCheckboxes'
import CheckboxGroup from '../../../components/shared/checkboxGroup'
import Spacer from '../../shared/spacer'
import useCurrentUser from '../../../hooks/useCurrentUser'
import DatetimeFormats from '../../../constants/datetimeFormats'

export default function CustomWeekends({hide, showCard}) {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const [shareWith, setShareWith] = useState([])
  const [fifthWeekendSelection, setFifthWeekendSelection] = useState('')
  const [defaultSelectedWeekends, setDefaultSelectedWeekends] = useState([])
  const {currentUser} = useCurrentUser()

  const ResetForm = () => {
    Manager.ResetForm('custom-weekends-schedule')
    setShareWith([])
    setState({...state, refreshKey: Manager.getUid(), isLoading: false})
    hide()
  }

  const handleFifthWeekendSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setFifthWeekendSelection(e)
      },
      () => {},
      false
    )
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
      () => {},
      true
    )
  }

  const addSpecificWeekendsToCalendar = async () => {
    if (!Manager.isValid(defaultSelectedWeekends) || !Manager.isValid(fifthWeekendSelection)) {
      AlertManager.throwError('Please choose default weekends and a five-month weekend')
      return false
    }

    // Set end date to the end of the year
    const endDate = moment([moment().year()]).endOf('year').format('MM-DD-YYYY')
    let weekends = VisitationManager.getSpecificWeekends(ScheduleTypes.variableWeekends, endDate, defaultSelectedWeekends, fifthWeekendSelection)

    // Standard Dates
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
    await ResetForm()
    events = Manager.getUniqueArray(events, 'startDate')

    // Upload to DB
    VisitationManager.addVisitationSchedule(currentUser, events).then((r) => r)
  }

  const HandleShareWithSelection = (e) => {
    const updated = Manager.handleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
  }

  return (
    <Modal
      submitText={'Add Schedule'}
      className={'long-title form'}
      onSubmit={addSpecificWeekendsToCalendar}
      hasSubmitButton={Manager.isValid(defaultSelectedWeekends)}
      wrapperClass="custom-weekends-schedule"
      title={'Custom Weekends Schedule'}
      showCard={showCard}
      onClose={ResetForm}>
      <hr className="mt-5" />
      <CheckboxGroup
        parentLabel={'Weekend YOU will have the child(ren)'}
        onCheck={handleSpecificWeekendSelection}
        checkboxArray={Manager.buildCheckboxGroup({
          currentUser,
          customLabelArray: ['1st Weekend', '2nd Weekend', '3rd Weekend', '4th Weekend'],
        })}
      />
      <Spacer height={5} />
      <CheckboxGroup
        parentLabel={'Month with 5 weekends - extra weekend'}
        onCheck={handleFifthWeekendSelection}
        checkboxArray={Manager.buildCheckboxGroup({
          currentUser,
          customLabelArray: ['1st Weekend', '2nd Weekend', '3rd Weekend', '4th Weekend', '5th Weekend'],
        })}
      />
      <Spacer height={5} />
      <ShareWithCheckboxes required={false} onCheck={HandleShareWithSelection} labelText={'Share with'} containerClass={'share-with-coparents'} />
      <hr className="mt-5 mb-10" />
    </Modal>
  )
}