import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {FaMinus, FaPlus} from 'react-icons/fa6'
import DatetimeFormats from '../../../constants/datetimeFormats'
import InputTypes from '../../../constants/inputTypes'
import ScheduleTypes from '../../../constants/scheduleTypes'
import globalState from '../../../context'
import useChildren from '../../../hooks/useChildren'
import useCoParents from '../../../hooks/useCoParents'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useUsers from '../../../hooks/useUsers'
import AlertManager from '../../../managers/alertManager'
import DropdownManager from '../../../managers/dropdownManager'
import Manager from '../../../managers/manager'
import ObjectManager from '../../../managers/objectManager'
import StringManager from '../../../managers/stringManager'
import VisitationManager from '../../../managers/visitationManager'
import CalendarEvent from '../../../models/new/calendarEvent'
import Form from '../../shared/form'
import InputField from '../../shared/inputField'
import Label from '../../shared/label' // Path: src\components\screens\visitation\fiftyFifty.jsx
import MyConfetti from '../../shared/myConfetti'
import SelectDropdown from '../../shared/selectDropdown'
import Spacer from '../../shared/spacer'

export default function FiftyFifty({hide, showCard}) {
    const {state, setState} = useContext(globalState)
    const {theme} = state

    // STATE
    const [expandFiftyFiftyInfoText, setExpandFiftyFiftyInfoText] = useState(false)
    const [firstFFPeriodStart, setFirstFFPeriodStart] = useState('')
    const [firstFFPeriodEnd, setFirstFFPeriodEnd] = useState('')
    const [secondFFPeriodStart, setSecondFFPeriodStart] = useState('')
    const [secondFFPeriodEnd, setSecondFFPeriodEnd] = useState('')
    const [thirdFFPeriodStart, setThirdFFPeriodStart] = useState('')
    const [thirdFFPeriodEnd, setThirdFFPeriodEnd] = useState('')

    // HOOKS
    const {currentUser} = useCurrentUser()
    const {children, childrenAreLoading} = useChildren()
    const {coParents, coParentsAreLoading} = useCoParents()
    const {users, usersAreLoading} = useUsers()

    // DROPDOWN STATE
    const [selectedShareWithOptions, setSelectedShareWithOptions] = useState([])
    const [defaultShareWithOptions, setDefaultShareWithOptions] = useState([])

    const ResetForm = () => {
        Manager.ResetForm('Add-fifty-fifty-schedule')
        setState({...state, refreshKey: Manager.GetUid()})
        hide()
    }

    // 50/50
    const AddToCalendar = async () => {
        const requiredFields = [firstFFPeriodStart, firstFFPeriodEnd, secondFFPeriodStart, secondFFPeriodEnd]

        if (requiredFields.some((field) => field.length === 0)) {
            AlertManager.throwError('All schedule ranges are required')
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

        const scheduleDates = VisitationManager.GetFiftyFifty(dates)

        if (!Manager.IsValid(scheduleDates)) return false

        const events = scheduleDates.map((date) => {
            const dateObject = new CalendarEvent()
            dateObject.shareWith = DropdownManager.MappedForDatabase.ShareWithFromArray(selectedShareWithOptions)
            dateObject.title = `${StringManager.GetFirstNameOnly(currentUser?.name)}'s Scheduled Visitation`
            dateObject.startDate = moment(date).format(DatetimeFormats.dateForDb)
            dateObject.fromVisitationSchedule = true
            dateObject.id = Manager.GetUid()
            dateObject.visitationSchedule = ScheduleTypes.fiftyFifty
            dateObject.owner = {
                key: currentUser?.key,
                name: currentUser?.name,
            }
            return ObjectManager.CleanObject(dateObject)
        })

        MyConfetti.fire()
        // Upload to DB
        await VisitationManager.AddVisitationSchedule(currentUser, events)
        ResetForm()
    }

    const SetDefaultDropdownOptions = () => {
        setSelectedShareWithOptions(DropdownManager.GetSelected.ShareWithFromKeys([], users))
        setDefaultShareWithOptions(DropdownManager.GetDefault.ShareWith(children, coParents))
    }

    useEffect(() => {
        if (showCard) {
            SetDefaultDropdownOptions()
        }
    }, [showCard])

    return (
        <Form
            onSubmit={AddToCalendar}
            submitText={'Add Schedule'}
            className="form"
            wrapperClass="add-fifty-fifty-schedule"
            title={'50/50 Visitation Schedule'}
            showCard={showCard}
            onClose={() => ResetForm()}>
            <div className="text">
                <Accordion id={'fifty-fifty-info'} className="form-accordion" expanded={expandFiftyFiftyInfoText}>
                    <AccordionSummary>
                        <div
                            className="flex space-between"
                            id="accordion-title"
                            onClick={() => setExpandFiftyFiftyInfoText(!expandFiftyFiftyInfoText)}>
                            <Label text={`What is a 50/50 Visitation Schedule?`} classes={'always-show'} />
                            {!expandFiftyFiftyInfoText && <FaPlus className={'visitation-card'} />}
                            {expandFiftyFiftyInfoText && <FaMinus className={'visitation-card'} />}
                        </div>
                    </AccordionSummary>
                    <AccordionDetails className={'description'}>
                        <p>An arrangement where both you and your co-parent have equal time with your children.</p>
                        <p>
                            For the start of the next visitation period (and next period ONLY) you have your children, enter the date ranges for both
                            the first half of the 50/50 and the second half of the 50/50.
                        </p>
                        <Spacer height={5} />
                        <p>
                            Use the <u>third period</u> date selector if it is necessary for your schedule.
                        </p>
                        <Spacer height={5} />
                        <p>
                            <b>Example</b> <br /> If you have your children (in August) Wednesday-Friday and then Monday-Wednesday during the
                            following week:
                            <span>You would choose: 8/14-8/16 for the first period and 8/19-8/21 for the second period.</span>
                        </p>
                        <Spacer height={5} />
                        <a href={'https://www.custodyxchange.com/topics/schedules/50-50/7-examples.php'} target="_blank">
                            Learn More
                        </a>
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
                <Spacer height={3} />

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

                <Spacer height={3} />

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

                <Spacer height={3} />

                {/* SHARE WITH */}
                <SelectDropdown
                    options={defaultShareWithOptions}
                    selectMultiple={true}
                    placeholder={'Select Contacts to Share With'}
                    onSelect={setSelectedShareWithOptions}
                />
            </div>
        </Form>
    )
}