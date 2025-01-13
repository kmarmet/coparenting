import BottomCard from '../../../components/shared/bottomCard'
import globalState from '../../../context'
import { useContext, useState } from 'react'
import Manager from '../../../managers/manager'
import DateFormats from '../../../constants/dateFormats'
import AlertManager from '../../../managers/alertManager'
import VisitationManager from '../../../managers/visitationManager'
import CalendarEvent from '../../../models/calendarEvent'
import StringManager from '../../../managers/stringManager'
import ScheduleTypes from '../../../constants/scheduleTypes'
import MyConfetti from '../../../components/shared/myConfetti'
import moment from 'moment'
import ShareWithCheckboxes from '../../../components/shared/shareWithCheckboxes'
import CheckboxGroup from '../../../components/shared/checkboxGroup'

export default function CustomWeekends({ hide, showCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [shareWith, setShareWith] = useState([])
  const [fifthWeekendSelection, setFifthWeekendSelection] = useState('')
  const [defaultSelectedWeekends, setDefaultSelectedWeekends] = useState([])

  const resetForm = () => {
    Manager.resetForm('custom-weekends-schedule')
    setShareWith([])
    setRefreshKey(Manager.getUid())
    hide()
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

  const handleShareWithSelection = async (e) => {
    const updated = await Manager.handleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
  }

  return (
    <BottomCard
      submitText={'Add Schedule'}
      className="form"
      onSubmit={addSpecificWeekendsToCalendar}
      hasSubmitButton={Manager.isValid(defaultSelectedWeekends)}
      wrapperClass="custom-weekends-schedule"
      title={'Custom Weekends Schedule'}
      showCard={showCard}
      onClose={resetForm}>
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
      <ShareWithCheckboxes
        required={false}
        shareWith={currentUser?.coparents?.map((x) => x.phone)}
        onCheck={handleShareWithSelection}
        labelText={'Share with'}
        containerClass={'share-with-coparents'}
        dataPhone={currentUser?.coparents?.map((x) => x.name)}
      />
    </BottomCard>
  )
}