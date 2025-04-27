// Path: src\components\screens\visitation\everyOtherWeekend.jsx
import Modal from '../../../components/shared/modal'
import globalState from '../../../context'
import React, {useContext, useState} from 'react'
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
import Label from '../../shared/label'
import Spacer from '../../shared/spacer'
import InputTypes from '../../../constants/inputTypes'
import useCurrentUser from '../../../hooks/useCurrentUser'

export default function EveryOtherWeekend({hide, showCard}) {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const [shareWith, setShareWith] = useState([])
  const [firstEveryOtherWeekend, setFirstEveryOtherWeekend] = useState('')
  const {currentUser} = useCurrentUser()

  const ResetForm = () => {
    Manager.ResetForm('add-every-other-weekend-schedule')
    setShareWith([])
    setState({...state, refreshKey: Manager.getUid(), isLoading: false})
    hide()
  }

  const AddToCalendar = async () => {
    if (firstEveryOtherWeekend.length === 0) {
      AlertManager.throwError('Please choose the Friday of the next weekend YOU have the child(ren)')
      return false
    }
    // Set end date to the end of the year
    let weekends = VisitationManager.getEveryOtherWeekend(moment(firstEveryOtherWeekend).format(DatetimeFormats.dateForDb))
    console.log(weekends)
    let events = []
    weekends.flat().forEach((date) => {
      const dateObject = new CalendarEvent()
      // Required
      dateObject.title = `${StringManager.getFirstNameOnly(currentUser?.name)}'s Scheduled Visitation`
      dateObject.startDate = moment(date).format(DatetimeFormats.dateForDb)
      // Not Required
      dateObject.ownerKey = currentUser?.key
      dateObject.fromVisitationSchedule = true
      dateObject.visitationSchedule = ScheduleTypes.everyOtherWeekend
      dateObject.shareWith = Manager.getUniqueArray(shareWith).flat()

      events.push(dateObject)
    })
    console.log(events)
    MyConfetti.fire()
    await ResetForm()
    // Upload to DB
    // VisitationManager.addVisitationSchedule(currentUser, events).then((r) => r)
  }

  const HandleShareWithSelection = (e) => {
    const updated = Manager.handleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
  }

  return (
    <Modal
      submitText={'Add Schedule'}
      subtitle="Add an every other weekend visitation schedule."
      className="form"
      wrapperClass="add-every-other-weekend-schedule"
      onSubmit={AddToCalendar}
      title={'Every other Weekend Visitation Schedule'}
      showCard={showCard}
      onClose={ResetForm}>
      <Label text={'Please specify the upcoming Friday you would like to use as the starting point for the visitation schedule'} />
      <Spacer height={5} />
      <InputWrapper
        labelText={'Date'}
        required={true}
        inputType={InputTypes.date}
        uidClass="visitation-every-other-weekend"
        onDateOrTimeSelection={(e) => setFirstEveryOtherWeekend(e)}
      />
      {/* SHARE WITH */}
      <ShareWithCheckboxes
        required={false}
        shareWith={currentUser?.coparents?.map((x) => x.phone)}
        onCheck={HandleShareWithSelection}
        labelText={'Share with'}
        containerClass={'share-with-coparents'}
      />
    </Modal>
  )
}