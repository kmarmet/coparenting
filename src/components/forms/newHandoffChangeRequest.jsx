// Path: src\components\forms\newHandoffChangeRequest.jsx
import moment from 'moment'
import React, {useContext, useEffect, useRef, useState} from 'react'
import creationForms from '../../constants/creationForms'
import DatetimeFormats from '../../constants/datetimeFormats'
import InputTypes from '../../constants/inputTypes'
import ActivityCategory from '../../constants/updateCategory'
import globalState from '../../context'
import DB from '../../database/DB'
import DB_UserScoped from '../../database/db_userScoped'
import useChildren from '../../hooks/useChildren'
import useCoParents from '../../hooks/useCoParents'
import useCurrentUser from '../../hooks/useCurrentUser'
import useHandoffRequests from '../../hooks/useHandoffRequests'
import useUsers from '../../hooks/useUsers'
import AlertManager from '../../managers/alertManager'
import DropdownManager from '../../managers/dropdownManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'
import UpdateManager from '../../managers/updateManager.js'
import HandoffChangeRequest from '../../models/new/handoffChangeRequest.js'
import AddressInput from '../shared/addressInput'
import Form from '../shared/form'
import FormDivider from '../shared/formDivider'
import InputField from '../shared/inputField'
import Label from '../shared/label'
import SelectDropdown from '../shared/selectDropdown'
import Spacer from '../shared/spacer'
import ToggleButton from '../shared/toggleButton'

export default function NewHandoffChangeRequest() {
    const {state, setState} = useContext(globalState)
    const {theme, creationFormToShow} = state

    // State
    const [requestRecipientKey, setRequestRecipientKey] = useState('')

    // Hooks
    const {currentUser, currentUserIsLoading} = useCurrentUser()
    const {coParents, coParentsAreLoading} = useCoParents()
    const {handoffRequests, handoffRequestsIsLoading} = useHandoffRequests()
    const {children, childrenAreLoading} = useChildren()
    const {users, usersAreLoading} = useUsers()

    // Dropdown State
    const [selectedShareWithOptions, setSelectedShareWithOptions] = useState([])
    const [defaultShareWithOptions, setDefaultShareWithOptions] = useState([])

    // Form ref
    const formRef = useRef({...new HandoffChangeRequest()})

    const ResetForm = (showSuccessAlert = false) => {
        Manager.ResetForm('handoff-request-wrapper')
        setRequestRecipientKey('')
        setState({
            ...state,
            creationFormToShow: '',
            refreshKey: Manager.GetUid(),
            isLoading: false,
            successAlertMessage: showSuccessAlert ? 'Handoff Change Request Sent' : null,
        })
    }

    const Submit = async () => {
        const validAccounts = currentUser?.sharedDataUsers

        //#region VALIDATION
        if (validAccounts === 0) {
            AlertManager.throwError(
                'No co-parent to \n assign requests to',
                'You have not added any co-parents. Or, it is also possible they have closed their profile.'
            )
            return false
        }
        if (!Manager.IsValid(formRef.current.recipient)) {
            AlertManager.throwError('Please choose who to Send the request to')
            return false
        }
        if (!Manager.IsValid(formRef.current.address) && !Manager.IsValid(formRef.current.time)) {
            AlertManager.throwError('Please choose a new location or time')
            return false
        }
        if (!Manager.IsValid(formRef.current.startDate)) {
            AlertManager.throwError('Please choose the day of the requested handoff change')
            return false
        }
        if (validAccounts > 0) {
            if (!Manager.IsValid(formRef.current.shareWith)) {
                AlertManager.throwError('Please choose who you would like to share this request with')
                return false
            }
        }

        //#endregion VALIDATION

        formRef.current.directionsLink = Manager.GetDirectionsLink(formRef.current.address)
        formRef.current.owner = {
            key: currentUser?.key,
            name: currentUser?.name,
        }

        // Update address
        if (Manager.IsValid(formRef.current.address, true)) {
            const coParent = coParents.filter((x) => x?.userKey === formRef?.current?.recipient?.key)[0]
            const key = DB.GetTableIndexById(coParents, coParent?.id)
            await DB_UserScoped.updateUserRecord(currentUser?.key, `coparents/${key}/preferredTransferAddress`, formRef.current.address)
        }

        // // Add record
        await DB.Add(`${DB.tables.handoffChangeRequests}/${currentUser?.key}`, handoffRequests, formRef.current)

        // Notify
        await UpdateManager.SendUpdate(
            `Handoff Change Request`,
            `${StringManager.GetFirstNameOnly(currentUser?.name)} has created a Handoff Change request`,
            requestRecipientKey,
            currentUser,
            ActivityCategory.handoffChangeRequest
        )

        ResetForm(true)
    }

    const SetDefaultDropdownOptions = () => {
        setSelectedShareWithOptions(DropdownManager.GetSelected.ShareWithFromKeys([], users))
        setDefaultShareWithOptions(DropdownManager.GetDefault.ShareWith([], coParents, true))
    }

    useEffect(() => {
        if (Manager.IsValid(coParents) && Manager.IsValid(users)) {
            SetDefaultDropdownOptions()
        }
    }, [coParents, users])

    return (
        <Form
            onSubmit={Submit}
            submitText={'Send'}
            wrapperClass="new-handoff-request"
            title={'Request Handoff Change '}
            showCard={creationFormToShow === creationForms.handoffChangeRequest}
            onClose={() => ResetForm()}>
            <div className="handoff-request-wrapper">
                <div className={`${theme} pickup-dropoff-container" `}>
                    <div className="pickup-dropoff">
                        <FormDivider text={'Required'} />
                        {/* DAY */}
                        <InputField
                            inputType={InputTypes.date}
                            uidClass="handoff-request-date"
                            placeholder={'Day'}
                            required={true}
                            onDateOrTimeSelection={(e) => (formRef.current.startDate = moment(e).format(DatetimeFormats.dateForDb))}
                        />

                        <FormDivider text={'Required - Time OR Location'} />

                        {/* TIME */}
                        <InputField
                            inputType={InputTypes.time}
                            placeholder={'New Time'}
                            uidClass="handoff-request-time"
                            onDateOrTimeSelection={(e) => (formRef.current.time = moment(e).format(DatetimeFormats.timeForDb))}
                        />

                        <Spacer height={3} />

                        {/*  NEW LOCATION*/}
                        <AddressInput
                            placeholder={'Address'}
                            onChange={(address) => {
                                formRef.current.address = address
                            }}
                        />

                        <Spacer height={3} />
                        {/* SEND REQUEST TO */}
                        <SelectDropdown
                            options={DropdownManager.GetDefault.CoParents(coParents)}
                            placeholder={'Select Request Recipient'}
                            onSelect={(e) => {
                                formRef.current.recipient = {
                                    name: e.label,
                                    key: e.value,
                                }
                            }}
                        />

                        <Spacer height={3} />

                        <FormDivider text={'Optional'} />

                        {/* SHARE WITH */}
                        <SelectDropdown
                            options={defaultShareWithOptions}
                            selectMultiple={true}
                            placeholder={'Select Contacts to Share With'}
                            onSelect={setSelectedShareWithOptions}
                        />

                        <Spacer height={3} />

                        {/* RESPONSE DUE DATE */}
                        <InputField
                            inputType={InputTypes.date}
                            uidClass="handoff-request-response-date"
                            placeholder={'Requested Response Date'}
                            required={true}
                            onDateOrTimeSelection={(e) => (formRef.current.requestedResponseDate = moment(e).format(DatetimeFormats.dateForDb))}
                        />

                        <Spacer height={3} />

                        {/* REASON */}
                        <InputField
                            inputType={InputTypes.textarea}
                            placeholder={'Reason'}
                            onChange={(e) => (formRef.current.reason = e.target.value)}
                        />

                        <Spacer height={8} />

                        {/*  SET AS PREFERRED LOCATION */}
                        <div className="flex">
                            <Label text={'Set as Preferred Location'} classes="toggle" />
                            <ToggleButton
                                onCheck={() => (formRef.current.preferredTransferAddress = formRef.current.address)}
                                onUncheck={() => (formRef.current.preferredTransferAddress = '')}
                            />
                        </div>

                        <Spacer height={8} />
                    </div>
                </div>
            </div>
        </Form>
    )
}