// Path: src\components\forms\newSwapRequest.jsx
import moment from 'moment'
import React, {useContext, useEffect, useRef, useState} from 'react'
import Form from '../../components/shared/form'
import ActivityCategory from '../../constants/activityCategory'
import creationForms from '../../constants/creationForms'
import DatetimeFormats from '../../constants/datetimeFormats'
import InputTypes from '../../constants/inputTypes'
import SwapDurations from '../../constants/swapDurations'
import globalState from '../../context'
import DB from '../../database/DB'
import useChildren from '../../hooks/useChildren'
import useCoParents from '../../hooks/useCoParents'
import useCurrentUser from '../../hooks/useCurrentUser'
import useUsers from '../../hooks/useUsers'
import AlertManager from '../../managers/alertManager'
import DomManager from '../../managers/domManager'
import DropdownManager from '../../managers/dropdownManager'
import Manager from '../../managers/manager'
import ObjectManager from '../../managers/objectManager'
import StringManager from '../../managers/stringManager'
import UpdateManager from '../../managers/updateManager'
import SwapRequest from '../../models/new/swapRequest'
import FormDivider from '../shared/formDivider'
import InputField from '../shared/inputField'
import SelectDropdown from '../shared/selectDropdown'
import Spacer from '../shared/spacer'
import ViewDropdown from '../shared/viewDropdown'

export default function NewSwapRequest() {
    const {state, setState} = useContext(globalState)
    const {theme, creationFormToShow, refreshKey} = state

    // State
    const [view, setView] = useState({label: 'Single Day', value: 'single'})
    const [recipientKey, setRecipientKey] = useState('')
    const [recipientName, setRecipientName] = useState()

    // DROPDOWN STATE
    const [selectedReminderOptions, setSelectedReminderOptions] = useState([])
    const [selectedChildrenOptions, setSelectedChildrenOptions] = useState([])
    const [selectedShareWithOptions, setSelectedShareWithOptions] = useState([])
    const [defaultShareWithOptions, setDefaultShareWithOptions] = useState([])
    const [selectedRecipient, setSelectedRecipient] = useState('')

    // Hooks
    const {currentUser} = useCurrentUser()
    const {children, childrenDropdownOptions} = useChildren()
    const {users} = useUsers()
    const {coParents} = useCoParents()

    const formRef = useRef({...new SwapRequest()})

    const ResetForm = (showSuccessAlert = false) => {
        Manager.ResetForm('swap-request-wrapper')

        // setTimeout(() => {
        //   setState({...state, refreshKey: Manager.GetUid()})
        // }, 800)
        setState({
            ...state,
            isLoading: false,
            creationFormToShow: '',
            successAlertMessage: showSuccessAlert ? 'Swap Request Sent' : null,
        })
    }

    const Submit = async () => {
        // Map Dropdown to Database
        formRef.current.children = DropdownManager.MappedForDatabase.ChildrenFromArray(selectedChildrenOptions)
        formRef.current.reminderTimes = DropdownManager.MappedForDatabase.RemindersFromArray(selectedReminderOptions)
        formRef.current.shareWith = DropdownManager.MappedForDatabase.ShareWithFromArray(selectedShareWithOptions)
        const errorString = Manager.GetInvalidInputsErrorString([
            {
                value: formRef.current.reason,
                name: 'Request Reason',
            },
            {
                value: formRef.current.startDate,
                name: 'Date',
            },
            {
                value: formRef.current.requestedResponseDate,
                name: 'Requested Response Date',
            },
            {
                value: recipientName,
                name: 'Request Recipient',
            },
        ])
        if (Manager.IsValid(errorString, true)) {
            AlertManager.throwError(errorString)
            return false
        }
        const validAccounts = currentUser?.sharedDataUsers

        //#region VALIDATION
        if (validAccounts.length === 0) {
            AlertManager.throwError(
                'No co-parent to \n assign requests to',
                'It appears that you have not created any co-parents, or it is possible that they may have deactivated their profile.'
            )
            return false
        }

        if (validAccounts.length > 0) {
            if (!Manager.IsValid(formRef.current.shareWith)) {
                AlertManager.throwError('Please choose who you would like to share this request with')
                return false
            }
        }
        //#endregion VALIDATION

        formRef.current.duration = view?.value
        formRef.current.recipient = {
            key: recipientKey,
            name: recipientName,
        }
        formRef.current.owner = {
            key: currentUser?.key,
            name: currentUser?.name,
        }

        const cleanObject = ObjectManager.CleanObject(formRef.current)

        // Send Notification
        await DB.Add(`${DB.tables.swapRequests}/${currentUser?.key}`, [], cleanObject).finally(() => {
            UpdateManager.SendToShareWith(
                formRef.current.shareWith,
                currentUser,
                'New Swap Request',
                `${StringManager.GetFirstNameOnly(currentUser?.name)} has created a new Swap Request`,
                ActivityCategory.swapRequest
            )
        })

        ResetForm(true)
    }

    const HandleRecipientSelection = (e) => {
        const coparentKey = e.getAttribute('data-key')
        DomManager.HandleCheckboxSelection(
            e,
            (e) => {
                setRecipientKey(coparentKey)
                setRecipientName(e)
            },
            () => {
                setRecipientName('')
                setRecipientKey('')
            },
            false
        )
    }

    const SetDefaultDropdownOptions = () => {
        setSelectedChildrenOptions(DropdownManager.GetSelected.Children([], children))
        setSelectedReminderOptions(DropdownManager.GetSelected.Reminders([]))
        setSelectedShareWithOptions(DropdownManager.GetSelected.ShareWithFromKeys([], users))
        setDefaultShareWithOptions(DropdownManager.GetDefault.ShareWith([], coParents))
        setView({label: 'Single Day', value: 'single'})
    }

    useEffect(() => {
        if (Manager.IsValid(children) && Manager.IsValid(users)) {
            SetDefaultDropdownOptions()
        }
    }, [children, users])

    return (
        <Form
            key={refreshKey}
            submitText={'Send'}
            onSubmit={Submit}
            wrapperClass="new-swap-request"
            title={'Request Visitation Swap'}
            subtitle="Request for your child(ren) to remain with you during the designated visitation time of your co-parent."
            viewDropdown={
                <ViewDropdown
                    hasSpacer={true}
                    views={[
                        {label: 'Single Day', value: 'single'},
                        {label: 'Multiple Days', value: 'multiple'},
                        {label: 'Hours', value: 'intraday'},
                    ]}
                    dropdownPlaceholder="Single Day"
                    selectedView={view}
                    onSelect={(view) => setView(view)}
                />
            }
            showCard={creationFormToShow === creationForms.swapRequest}
            onClose={() => ResetForm()}>
            <Spacer height={3} />
            <div id="new-swap-request-container" className={`${theme}`}>
                {/* FORM */}
                <div id="request-form" className="single">
                    <FormDivider text={'Required'} />
                    {/* SINGLE DATE */}
                    {view?.value === SwapDurations.single && (
                        <InputField
                            uidClass="swap-single-date"
                            inputType={InputTypes.date}
                            placeholder={'Date'}
                            required={true}
                            onDateOrTimeSelection={(day) => (formRef.current.startDate = moment(day).format(DatetimeFormats.dateForDb))}
                        />
                    )}

                    {/* MULTIPLE DAYS */}
                    {view?.value === SwapDurations.multiple && (
                        <InputField
                            onDateOrTimeSelection={(dateArray) => {
                                if (Manager.IsValid(dateArray)) {
                                    formRef.current.startDate = moment(dateArray[0]).format(DatetimeFormats.dateForDb)
                                    formRef.current.endDate = moment(dateArray[1]).format(DatetimeFormats.dateForDb)
                                }
                            }}
                            useNativeDate={true}
                            placeholder={'Date Range'}
                            required={true}
                            inputType={InputTypes.dateRange}
                        />
                    )}

                    {/* INTRA DAY - HOURS */}
                    {view?.value === SwapDurations.intra && (
                        <>
                            <InputField
                                uidClass="swap-hours-date"
                                inputType={InputTypes.date}
                                placeholder={'Day'}
                                required={true}
                                onDateOrTimeSelection={(day) => (formRef.current.startDate = moment(day).format(DatetimeFormats.dateForDb))}
                            />
                            <Spacer height={3} />
                            {/* TIMES */}
                            <div className="flex gap">
                                <InputField
                                    inputType={InputTypes.time}
                                    uidClass="swap-request-from-hour"
                                    placeholder={'Start Time'}
                                    onDateOrTimeSelection={(e) => (formRef.current.fromHour = moment(e).format('ha'))}
                                />

                                <InputField
                                    inputType={InputTypes.time}
                                    uidClass="swap-request-to-hour"
                                    placeholder={'End Time'}
                                    onDateOrTimeSelection={(e) => (formRef.current.toHour = moment(e).format('ha'))}
                                />
                            </div>
                        </>
                    )}
                    <Spacer height={3} />

                    {/* REQUEST RECIPIENT */}
                    <SelectDropdown options={defaultShareWithOptions} placeholder={'Request Recipient'} onSelect={setSelectedRecipient} />

                    <FormDivider text={'Optional'} />

                    {/* SHARE WITH */}
                    <SelectDropdown
                        options={defaultShareWithOptions}
                        selectMultiple={true}
                        placeholder={'Select Contacts to Share With'}
                        onSelect={setSelectedShareWithOptions}
                    />

                    <Spacer height={3} />

                    {/* INCLUDING WHICH CHILDREN */}
                    {Manager.IsValid(children) && (
                        <SelectDropdown
                            options={childrenDropdownOptions}
                            placeholder={'Select Children to Include'}
                            onSelect={setSelectedChildrenOptions}
                            selectMultiple={true}
                        />
                    )}

                    <Spacer height={3} />

                    {/* RESPONSE DUE DATE */}
                    <InputField
                        uidClass="swap-response-date"
                        inputType={InputTypes.date}
                        placeholder={'Requested Response Date'}
                        required={true}
                        onDateOrTimeSelection={(day) => (formRef.current.requestedResponseDate = moment(day).format(DatetimeFormats.dateForDb))}
                    />

                    <Spacer height={3} />

                    {/* NOTES */}
                    <InputField inputType={'textarea'} placeholder={'Reason'} onChange={(e) => (formRef.current.reason = e.target.value)} />
                </div>
            </div>
        </Form>
    )
}