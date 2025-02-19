// Path: src\components\screens\visitation\everyOtherWeekend.jsx
import BottomCard from '../../../components/shared/bottomCard'
import globalState from '../../../context'
import { useContext, useState } from 'react'
import Manager from '../../../managers/manager'
import InputWrapper from '../../../components/shared/inputWrapper'
import DateFormats from '../../../constants/dateFormats'
import AlertManager from '../../../managers/alertManager'
import VisitationManager from '../../../managers/visitationManager'
import CalendarEvent from '../../../models/calendarEvent'
import StringManager from '../../../managers/stringManager'
import ScheduleTypes from '../../../constants/scheduleTypes'
import MyConfetti from '../../../components/shared/myConfetti'
import moment from 'moment'
import ShareWithCheckboxes from '../../../components/shared/shareWithCheckboxes'
import { MobileDatePicker } from '@mui/x-date-pickers-pro'

export default function EveryOtherWeekend({ hide, showCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [shareWith, setShareWith] = useState([])
  const [firstEveryOtherWeekend, setFirstEveryOtherWeekend] = useState('')

  const resetForm = () => {
    Manager.resetForm('add-every-other-weekend-schedule')
    setShareWith([])
    setRefreshKey(Manager.getUid())
    hide()
  }

  const addToCalendar = async () => {
    if (firstEveryOtherWeekend.length === 0) {
      AlertManager.throwError('Please choose the Friday of the next weekend YOU have the child(ren)')
      return false
    }
    // Set end date to the end of the year
    let weekends = VisitationManager.getEveryOtherWeekend(moment(firstEveryOtherWeekend).format(DateFormats.dateForDb))
    let events = []
    weekends.flat().forEach((date) => {
      const dateObject = new CalendarEvent()
      // Required
      dateObject.title = `${StringManager.getFirstNameOnly(currentUser?.name)}'s Scheduled Visitation`
      dateObject.startDate = moment(date).format(DateFormats.dateForDb)
      // Not Required
      dateObject.ownerKey = currentUser?.key
      dateObject.fromVisitationSchedule = true
      dateObject.visitationSchedule = ScheduleTypes.everyOtherWeekend
      dateObject.shareWith = Manager.getUniqueArray(shareWith).flat()

      events.push(dateObject)
    })
    MyConfetti.fire()
    await resetForm()
    // Upload to DB
    VisitationManager.addVisitationSchedule(currentUser, events).then((r) => r)
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
      submitText={'Add Schedule'}
      subtitle="Add an every other weekend visitation schedule."
      className="form"
      wrapperClass="add-every-other-weekend-schedule"
      onSubmit={addToCalendar}
      title={'Every other Weekend Visitation Schedule'}
      showCard={showCard}
      onClose={resetForm}>
      <InputWrapper wrapperClasses="mt-15" labelText={'Friday of the next weekend you have your child(ren)'} required={true} inputType={'date'}>
        <MobileDatePicker onOpen={addThemeToDatePickers} onAccept={(e) => setFirstEveryOtherWeekend(e)} className={`${theme} w-100`} />
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
    </BottomCard>
  )
}