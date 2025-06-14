// Path: src\components\screens\visitation\customWeekends.jsx
import moment from 'moment'
import React, {useContext, useState} from 'react'
import DatetimeFormats from '../../../constants/datetimeFormats'
import ScheduleTypes from '../../../constants/scheduleTypes'
import globalState from '../../../context'
import useCurrentUser from '../../../hooks/useCurrentUser'
import AlertManager from '../../../managers/alertManager'
import DatasetManager from '../../../managers/datasetManager'
import DomManager from '../../../managers/domManager'
import Manager from '../../../managers/manager'
import StringManager from '../../../managers/stringManager'
import VisitationManager from '../../../managers/visitationManager'
import CalendarEvent from '../../../models/new/calendarEvent'
import CheckboxGroup from '../../shared/checkboxGroup'
import Form from '../../shared/form'
import MyConfetti from '../../shared/myConfetti'
import ShareWithDropdown from '../../shared/shareWithDropdown'
import Spacer from '../../shared/spacer'

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
    setState({...state, refreshKey: Manager.GetUid(), isLoading: false})
    hide()
  }

  const HandleFifthWeekendSelection = (e) => {
    DomManager.HandleCheckboxSelection(
      e,
      (e) => {
        setFifthWeekendSelection(e)
      },
      () => {},
      false
    )
  }

  const HandleSpecificWeekendSelection = (e) => {
    DomManager.HandleCheckboxSelection(
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

  const AddSpecificWeekendsToCalendar = async () => {
    if (!Manager.IsValid(defaultSelectedWeekends) || !Manager.IsValid(fifthWeekendSelection)) {
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
      dateObject.title = `${StringManager.GetFirstNameOnly(currentUser?.name)}'s Scheduled Visitation`
      dateObject.startDate = moment(date).format(DatetimeFormats.dateForDb)
      // Not Required
      dateObject.ownerKey = currentUser?.key
      dateObject.createdBy = currentUser?.name
      dateObject.fromVisitationSchedule = true
      dateObject.id = Manager.GetUid()
      dateObject.visitationSchedule = ScheduleTypes.customWeekends
      dateObject.shareWith = DatasetManager.getUniqueArray(shareWith, 'phone').flat()

      if (events.length === 0) {
        events = [dateObject]
      } else {
        events = [...events, dateObject]
      }
    })

    MyConfetti.fire()
    await ResetForm()
    events = DatasetManager.getUniqueArray(events, 'startDate')

    // Upload to DB
    VisitationManager.addVisitationSchedule(currentUser, events).then((r) => r)
  }

  const HandleShareWithSelection = (e) => {
    const updated = DomManager.HandleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
  }

  return (
    <Form
      submitText={'Add Schedule'}
      className={'long-title form'}
      onSubmit={AddSpecificWeekendsToCalendar}
      hasSubmitButton={Manager.IsValid(defaultSelectedWeekends)}
      wrapperClass="custom-weekends-schedule"
      title={'Custom Weekends Schedule'}
      showCard={showCard}
      onClose={ResetForm}>
      <hr className="mt-5" />
      <CheckboxGroup
        parentLabel={'Weekend YOU will have the child(ren)'}
        onCheck={HandleSpecificWeekendSelection}
        checkboxArray={DomManager.BuildCheckboxGroup({
          currentUser,
          customLabelArray: ['1st Weekend', '2nd Weekend', '3rd Weekend', '4th Weekend'],
        })}
      />
      <Spacer height={5} />
      <CheckboxGroup
        parentLabel={'Month with 5 weekends - extra weekend'}
        onCheck={HandleFifthWeekendSelection}
        checkboxArray={DomManager.BuildCheckboxGroup({
          currentUser,
          customLabelArray: ['1st Weekend', '2nd Weekend', '3rd Weekend', '4th Weekend', '5th Weekend'],
        })}
      />
      <Spacer height={5} />
      <ShareWithDropdown required={false} onCheck={HandleShareWithSelection} placeholder={'Share with'} containerClass={'share-with-coparents'} />
      <hr className="mt-5 mb-10" />
    </Form>
  )
}