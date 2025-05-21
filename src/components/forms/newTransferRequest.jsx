// Path: src\components\forms\newTransferRequest.jsx
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import DatetimeFormats from '/src/constants/datetimeFormats'
import DB from '/src/database/DB'
import DB_UserScoped from '/src/database/db_userScoped'
import AlertManager from '/src/managers/alertManager'
import DateManager from '/src/managers/dateManager'
import Manager from '/src/managers/manager'
import StringManager from '/src/managers/stringManager'
import UpdateManager from '/src/managers/updateManager.js'
import ActivityCategory from '/src/models/activityCategory'
import TransferChangeRequest from '/src/models/transferChangeRequest.js'
import moment from 'moment'
import React, {useContext, useState} from 'react'
import creationForms from '../../constants/creationForms'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context'
import useCoparents from '../../hooks/useCoparents'
import useCurrentUser from '../../hooks/useCurrentUser'
import DomManager from '../../managers/domManager'
import AddressInput from '../shared/addressInput'
import InputWrapper from '../shared/inputWrapper'
import Label from '../shared/label'
import Modal from '../shared/modal'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import Spacer from '../shared/spacer'
import ToggleButton from '../shared/toggleButton'

export default function NewTransferChangeRequest() {
  const {state, setState} = useContext(globalState)
  const {theme, authUser, creationFormToShow} = state
  const [requestReason, setRequestReason] = useState('')
  const [shareWith, setShareWith] = useState([])
  const [requestTime, setRequestTime] = useState('')
  const [requestLocation, setRequestLocation] = useState('')
  const [requestDate, setRequestDate] = useState('')
  const [requestRecipientKey, setRequestRecipientKey] = useState('')
  const [preferredLocation, setPreferredLocation] = useState('')
  const [requestedResponseDate, setResponseDueDate] = useState('')
  const {currentUser, currentUserIsLoading} = useCurrentUser()
  const {coparents, coparentsAreLoading} = useCoparents()

  const ResetForm = async (showSuccessAlert = false) => {
    Manager.ResetForm('transfer-request-wrapper')
    setRequestReason('')
    setShareWith([])
    setRequestTime('')
    setRequestLocation('')
    setRequestDate('')
    setRequestRecipientKey('')
    setPreferredLocation('')
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
    if (!Manager.IsValid(requestLocation) && !Manager.IsValid(requestTime)) {
      AlertManager.throwError('Please choose a new location or time')
      return false
    }
    if (!Manager.IsValid(requestDate)) {
      AlertManager.throwError('Please choose the day of the requested transfer change')
      return false
    }
    if (validAccounts > 0) {
      if (!Manager.IsValid(shareWith)) {
        AlertManager.throwError('Please choose who you would like to share this request with')
        return false
      }
    }
    //#endregion VALIDATION

    const requestTimeIsValid = DateManager.DateIsValid(moment(requestTime, DatetimeFormats.timeForDb).format(DatetimeFormats.timeForDb))
    let newRequest = new TransferChangeRequest()
    newRequest.requestReason = requestReason
    newRequest.ownerKey = currentUser?.key
    newRequest.shareWith = DatasetManager.getUniqueArray(shareWith).flat()
    newRequest.time = requestTimeIsValid ? requestTime : ''
    newRequest.location = requestLocation
    newRequest.startDate = moment(requestDate).format(DatetimeFormats.dateForDb)
    newRequest.directionsLink = Manager.GetDirectionsLink(requestLocation)
    newRequest.recipientKey = requestRecipientKey
    newRequest.status = 'pending'
    newRequest.preferredTransferLocation = requestLocation
    newRequest.requestedResponseDate = requestedResponseDate

    if (preferredLocation.length > 0) {
      const coparent = currentUser?.coparents.filter((x) => x.key === requestRecipientKey)[0]
      const key = await DB.getNestedSnapshotKey(`users/${currentUser?.key}/coparents`, coparent, 'id')
      await DB_UserScoped.updateUserRecord(currentUser?.key, `coparents/${key}/preferredTransferLocation`, requestLocation)
    }

    // // Add record
    await DB.Add(`${DB.tables.transferChangeRequests}/${currentUser.key}`, newRequest)

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
    const updated = DomManager.HandleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
  }

  const HandleRequestRecipient = (e) => {
    const coparentKey = e.getAttribute('data-key')
    if (e.classList.contains('active')) {
      setRequestRecipientKey(coparentKey)
    } else {
      setRequestRecipientKey('')
    }
  }

  if (coparentsAreLoading || currentUserIsLoading) {
    return <img src={require('../../img/loading.gif')} alt="" />
  }

  return (
    <Modal
      onSubmit={Submit}
      submitText={'Send Request'}
      wrapperClass="new-transfer-request"
      title={'Request Transfer Change '}
      showCard={creationFormToShow === creationForms.transferRequest}
      onClose={ResetForm}>
      <div className="transfer-request-wrapper">
        <Spacer height={5} />
        <div id="transfer-change-container" className={`${theme} form`}>
          <Spacer height={5} />
          <div className="form transfer-change">
            {/* DAY */}
            <InputWrapper
              inputType={InputTypes.date}
              uidClass="transfer-request-date"
              labelText={'Day'}
              required={true}
              onDateOrTimeSelection={(e) => setRequestDate(moment(e).format(DatetimeFormats.dateForDb))}
            />

            {/* TIME */}
            <InputWrapper
              inputType={InputTypes.time}
              labelText={'New Time'}
              uidClass="transfer-request-time"
              onDateOrTimeSelection={(e) => setRequestTime(moment(e).format(DatetimeFormats.timeForDb))}
            />

            {/* RESPONSE DUE DATE */}
            <InputWrapper
              inputType={InputTypes.date}
              uidClass="transfer-request-response-date"
              labelText={'Requested Response Date'}
              required={true}
              onDateOrTimeSelection={(e) => setResponseDueDate(moment(e).format(DatetimeFormats.dateForDb))}
            />

            {/*  NEW LOCATION*/}
            <AddressInput labelText={'New Location'} onChange={(address) => setRequestLocation(address)} />
            <div className="flex">
              <Label text={'Set as Preferred Transfer Location'} />
              <ToggleButton onCheck={() => setPreferredLocation(requestLocation)} onUncheck={() => setPreferredLocation('')} />
            </div>

            <Spacer height={5} />

            {/* REASON */}
            <InputWrapper inputType={InputTypes.textarea} labelText={'Reason'} onChange={(e) => setRequestReason(e.target.value)} />

            <Spacer height={5} />

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

            <ShareWithCheckboxes
              shareWith={coparents?.map((x) => x.phone)}
              onCheck={HandleShareWithSelection}
              labelText={'Share with'}
              containerClass={'share-with-coparents'}
              checkboxArray={DomManager.BuildCheckboxGroup({
                currentUser,
                predefinedType: 'share-with',
              })}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}