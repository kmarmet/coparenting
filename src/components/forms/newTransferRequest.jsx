// Path: src\components\forms\newTransferRequest.jsx
import moment from 'moment'
import React, {useContext, useRef, useState} from 'react'
import ActivityCategory from '../../constants/activityCategory'
import creationForms from '../../constants/creationForms'
import DatetimeFormats from '../../constants/datetimeFormats'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context'
import DB from '../../database/DB'
import DB_UserScoped from '../../database/db_userScoped'
import useCoParents from '../../hooks/useCoParents'
import useCurrentUser from '../../hooks/useCurrentUser'
import useTransferRequests from '../../hooks/useTransferRequests'
import AlertManager from '../../managers/alertManager'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'
import UpdateManager from '../../managers/updateManager.js'
import TransferChangeRequest from '../../models/new/transferChangeRequest.js'
import AddressInput from '../shared/addressInput'
import CheckboxGroup from '../shared/checkboxGroup'
import Form from '../shared/form'
import InputField from '../shared/inputField'
import Label from '../shared/label'
import ShareWithDropdown from '../shared/shareWithDropdown'
import Spacer from '../shared/spacer'
import ToggleButton from '../shared/toggleButton'

export default function NewTransferChangeRequest() {
  const {state, setState} = useContext(globalState)
  const {theme, creationFormToShow} = state
  const [requestRecipientKey, setRequestRecipientKey] = useState('')
  const {currentUser, currentUserIsLoading} = useCurrentUser()
  const {coParents, coParentsAreLoading} = useCoParents()
  const {transferRequests, transferRequestsIsLoading} = useTransferRequests()
  const updateRef = useRef(new TransferChangeRequest())

  const ResetForm = async (showSuccessAlert = false) => {
    Manager.ResetForm('transfer-request-wrapper')
    setRequestRecipientKey('')
    setState({
      ...state,
      creationFormToShow: '',
      refreshKey: Manager.GetUid(),
      isLoading: false,
      successAlertMessage: showSuccessAlert ? 'Transfer Change Request Sent' : null,
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
    if (!Manager.IsValid(requestRecipientKey)) {
      AlertManager.throwError('Please choose who to Send the request to')
      return false
    }
    if (!Manager.IsValid(updateRef.current.address) && !Manager.IsValid(updateRef.current.time)) {
      AlertManager.throwError('Please choose a new location or time')
      return false
    }
    if (!Manager.IsValid(updateRef.current.startDate)) {
      AlertManager.throwError('Please choose the day of the requested transfer change')
      return false
    }
    if (validAccounts > 0) {
      if (!Manager.IsValid(updateRef.current.shareWith)) {
        AlertManager.throwError('Please choose who you would like to share this request with')
        return false
      }
    }

    //#endregion VALIDATION
    const recipient = coParents.find((x) => x.key === requestRecipientKey)

    if (Manager.IsValid(recipient)) {
      updateRef.current.recipient.key = recipient?.key
      updateRef.current.recipient.name = recipient?.name
    }

    updateRef.current.ownerKey = currentUser?.key
    updateRef.current.directionsLink = Manager.GetDirectionsLink(updateRef.current.address)

    // Update address
    if (Manager.IsValid(updateRef.current.address, true)) {
      const coParent = currentUser?.coParents.filter((x) => x.key === requestRecipientKey)[0]
      const key = DB.GetTableIndexById(coParent, coParent?.id)
      await DB_UserScoped.updateUserRecord(currentUser?.key, `coparents/${key}/preferredTransferAddress`, updateRef.current.address)
    }

    // // Add record
    await DB.Add(`${DB.tables.transferChangeRequests}/${currentUser?.key}`, transferRequests, updateRef.current)

    // Notify
    await UpdateManager.SendUpdate(
      `Transfer Change Request`,
      `${StringManager.GetFirstNameOnly(currentUser?.name)} has created a Transfer Change request`,
      requestRecipientKey,
      currentUser,
      ActivityCategory.transferRequest
    )

    await ResetForm(true)
  }

  const HandleShareWithSelection = (e) => {
    updateRef.current.shareWith = DomManager.HandleShareWithSelection(e, currentUser, updateRef.current.shareWith, updateRef)
  }

  const HandleRequestRecipient = (e) => {
    const coparentKey = e.getAttribute('data-key')
    if (e.classList.contains('active')) {
      setRequestRecipientKey(coparentKey)
    } else {
      setRequestRecipientKey('')
    }
  }

  return (
    <Form
      onSubmit={Submit}
      submitText={'Send'}
      wrapperClass="new-transfer-request form at-top"
      title={'Request Transfer Change '}
      showCard={creationFormToShow === creationForms.transferRequest}
      onClose={ResetForm}>
      <div className="transfer-request-wrapper">
        <div id="transfer-change-container" className={`${theme}`}>
          <div className="transfer-change">
            {/* DAY */}
            <InputField
              inputType={InputTypes.date}
              uidClass="transfer-request-date"
              labelText={'Day'}
              required={true}
              onDateOrTimeSelection={(e) => (updateRef.current.startDate = moment(e).format(DatetimeFormats.dateForDb))}
            />

            {/* TIME */}
            <InputField
              inputType={InputTypes.time}
              labelText={'New Time'}
              uidClass="transfer-request-time"
              onDateOrTimeSelection={(e) => (updateRef.current.time = moment(e).format(DatetimeFormats.timeForDb))}
            />

            {/* RESPONSE DUE DATE */}
            <InputField
              inputType={InputTypes.date}
              uidClass="transfer-request-response-date"
              labelText={'Requested Response Date'}
              required={true}
              onDateOrTimeSelection={(e) => (updateRef.current.requestedResponseDate = moment(e).format(DatetimeFormats.dateForDb))}
            />

            {/*  NEW LOCATION*/}
            <AddressInput
              labelText={'Address'}
              onChange={(address) => {
                updateRef.current.address = address
              }}
            />

            {/* REASON */}
            <InputField inputType={InputTypes.textarea} placeholder={'Reason'} onChange={(e) => (updateRef.current.reason = e.target.value)} />

            <Spacer height={8} />
            {/*  SET AS PREFERRED LOCATION */}
            <div className="flex">
              <Label text={'Set as Preferred Location'} classes="toggle" />
              <ToggleButton
                onCheck={() => (updateRef.current.preferredTransferAddress = updateRef.current.address)}
                onUncheck={() => (updateRef.current.preferredTransferAddress = '')}
              />
            </div>

            <Spacer height={8} />

            {/* SEND REQUEST TO */}
            <CheckboxGroup
              elClass="sending-to"
              parentLabel={'Who is the request being sent to?'}
              checkboxArray={DomManager.BuildCheckboxGroup({
                currentUser,
                predefinedType: 'coparents',
              })}
              onCheck={HandleRequestRecipient}
              required={true}
            />

            <Spacer height={8} />

            <ShareWithDropdown onCheck={HandleShareWithSelection} required={true} />
          </div>
        </div>
      </div>
    </Form>
  )
}