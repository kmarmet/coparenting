// Path: src\components\screens\visitation\everyOtherWeekend.jsx
import moment from 'moment'
import React, {useContext, useState} from 'react'
import DatetimeFormats from '../../../constants/datetimeFormats'
import InputTypes from '../../../constants/inputTypes'
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
import Form from '../../shared/form'
import InputField from '../../shared/inputField'
import Label from '../../shared/label'
import MyConfetti from '../../shared/myConfetti'
import ShareWithDropdown from '../../shared/shareWithDropdown'
import Spacer from '../../shared/spacer'

export default function EveryOtherWeekend({hide, showCard}) {
    const {state, setState} = useContext(globalState)
    const {theme} = state
    const [shareWith, setShareWith] = useState([])
    const [firstEveryOtherWeekend, setFirstEveryOtherWeekend] = useState('')
    const {currentUser} = useCurrentUser()

    const ResetForm = () => {
        Manager.ResetForm('Add-every-other-weekend-schedule')
        setShareWith([])
        setState({...state, refreshKey: Manager.GetUid(), isLoading: false})
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
            dateObject.title = `${StringManager.GetFirstNameOnly(currentUser?.name)}'s Scheduled Visitation`
            dateObject.startDate = moment(date).format(DatetimeFormats.dateForDb)
            // Not Required
            dateObject.ownerKey = currentUser?.key
            dateObject.fromVisitationSchedule = true
            dateObject.visitationSchedule = ScheduleTypes.everyOtherWeekend
            dateObject.shareWith = DatasetManager.getUniqueArray(shareWith).flat()

            events.push(dateObject)
        })
        console.log(events)
        MyConfetti.fire()
        await ResetForm()
        // Upload to DB
        // VisitationManager.addVisitationSchedule(currentUser, events).then((r) => r)
    }

    const HandleShareWithSelection = (e) => {
        const updated = DomManager.HandleShareWithSelection(e, currentUser, shareWith)
        setShareWith(updated)
    }

    return (
        <Form
            submitText={'Add Schedule'}
            subtitle="Add an every other weekend visitation schedule."
            className="form"
            wrapperClass="add-every-other-weekend-schedule"
            onSubmit={AddToCalendar}
            title={'Every other Weekend Visitation Schedule'}
            showCard={showCard}
            onClose={() => ResetForm()}>
            <Label text={'Please specify the upcoming Friday you would like to use as the starting point for the visitation schedule'} />
            <Spacer height={5} />
            <InputField
                placeholder={'Date'}
                required={true}
                inputType={InputTypes.date}
                uidClass="visitation-every-other-weekend"
                onDateOrTimeSelection={(e) => setFirstEveryOtherWeekend(e)}
            />
            {/* SHARE WITH */}
            <ShareWithDropdown
                required={false}
                shareWith={currentUser?.coParents?.map((x) => x.phone)}
                onCheck={HandleShareWithSelection}
                placeholder={'Select Contacts to Share With'}
                containerClass={'share-with-coparents'}
            />
        </Form>
    )
}