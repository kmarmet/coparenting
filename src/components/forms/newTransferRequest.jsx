// Path: src\components\forms\newTransferRequest.jsx
import React, {useContext, useState} from 'react'
import globalState from '../../context'
import Manager from '/src/managers/manager'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import TransferChangeRequest from '/src/models/transferChangeRequest.js'
import moment from 'moment'
import DB from '/src/database/DB'
import NotificationManager from '/src/managers/notificationManager.js'
import DB_UserScoped from '/src/database/db_userScoped'
import DatetimeFormats from '/src/constants/datetimeFormats'
import DateManager from '/src/managers/dateManager'
import Modal from '../shared/modal'
import InputWrapper from '../shared/inputWrapper'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import AlertManager from '/src/managers/alertManager'
import StringManager from '/src/managers/stringManager'
import ActivityCategory from '/src/models/activityCategory'
import Spacer from '../shared/spacer'
import creationForms from '../../constants/creationForms'
import ToggleButton from '../shared/toggleButton'
import Label from '../shared/label'
import InputTypes from '../../constants/inputTypes'

export default function NewTransferChangeRequest() {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, authUser, creationFormToShow} = state
  const [requestReason, setRequestReason] = useState('')
  const [shareWith, setShareWith] = useState([])
  const [requestTime, setRequestTime] = useState('')
  const [requestLocation, setRequestLocation] = useState('')
  const [requestDate, setRequestDate] = useState('')
  const [requestRecipientKey, setRequestRecipientKey] = useState('')
  const [preferredLocation, setPreferredLocation] = useState('')
  const [responseDueDate, setResponseDueDate] = useState('')

  const resetForm = async (showSuccessAlert = false) => {
    Manager.resetForm('transfer-request-wrapper')
    setRequestReason('')
    setShareWith([])
    setRequestTime('')
    setRequestLocation('')
    setRequestDate('')
    setRequestRecipientKey('')
    setPreferredLocation('')
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(authUser?.email)
    setState({
      ...state,
      currentUser: updatedCurrentUser,
      creationFormToShow: '',
      refreshKey: Manager.getUid(),
      isLoading: false,
      successAlertMessage: showSuccessAlert ? 'Transfer Change Request Sent' : null,
    })
  }

  const submit = async () => {
    const validAccounts = await DB_UserScoped.getValidAccountsForUser(currentUser)

    //#region VALIDATION
    if (validAccounts === 0) {
      AlertManager.throwError(
        'No co-parent to \n assign requests to',
        'You have not added any co-parents. Or, it is also possible they have closed their profile.'
      )
      return false
    }
    if (!Manager.isValid(requestRecipientKey)) {
      AlertManager.throwError('Please choose who to send the request to')
      return false
    }
    if (!Manager.isValid(requestLocation) && !Manager.isValid(requestTime)) {
      AlertManager.throwError('Please choose a new location or time')
      return false
    }
    if (!Manager.isValid(requestDate)) {
      AlertManager.throwError('Please choose the day of the requested transfer change')
      return false
    }
    if (validAccounts > 0) {
      if (!Manager.isValid(shareWith)) {
        AlertManager.throwError('Please choose who you would like to share this request with')
        return false
      }
    }
    //#endregion VALIDATION

    const requestTimeIsValid = DateManager.dateIsValid(moment(requestTime, DatetimeFormats.timeForDb).format(DatetimeFormats.timeForDb))
    let newRequest = new TransferChangeRequest()
    newRequest.requestReason = requestReason
    newRequest.ownerKey = currentUser?.key
    newRequest.shareWith = Manager.getUniqueArray(shareWith).flat()
    newRequest.time = requestTimeIsValid ? requestTime : ''
    newRequest.location = requestLocation
    newRequest.startDate = moment(requestDate).format(DatetimeFormats.dateForDb)
    newRequest.directionsLink = Manager.getDirectionsLink(requestLocation)
    newRequest.recipientKey = requestRecipientKey
    newRequest.status = 'pending'
    newRequest.preferredTransferLocation = requestLocation
    newRequest.responseDueDate = responseDueDate

    if (preferredLocation.length > 0) {
      const coparent = currentUser?.coparents.filter((x) => x.key === requestRecipientKey)[0]
      const key = await DB.getNestedSnapshotKey(`users/${currentUser?.key}/coparents`, coparent, 'id')
      await DB_UserScoped.updateUserRecord(currentUser?.key, `coparents/${key}/preferredTransferLocation`, requestLocation)
    }

    // // Add record
    await DB.add(`${DB.tables.transferChangeRequests}/${currentUser.key}`, newRequest)

    // Notify
    await NotificationManager.sendNotification(
      `Transfer Change Request`,
      `${StringManager.getFirstNameOnly(currentUser?.name)} has created a Transfer Change request`,
      requestRecipientKey,
      currentUser,
      ActivityCategory.transferRequest
    )

    await resetForm(true)
  }

  const handleShareWithSelection = async (e) => {
    const updated = await Manager.handleShareWithSelection(e, currentUser, shareWith)
    setShareWith(updated)
  }

  const handleRequestRecipient = (e) => {
    const coparentKey = e.getAttribute('data-key')
    if (e.classList.contains('active')) {
      setRequestRecipientKey(coparentKey)
    } else {
      setRequestRecipientKey('')
    }
  }

  return (
    <Modal
      onSubmit={submit}
      submitText={'Send Request'}
      wrapperClass="new-transfer-request"
      title={'Request Transfer Change '}
      showCard={creationFormToShow === creationForms.transferRequest}
      onClose={resetForm}>
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
            <InputWrapper inputType={InputTypes.address} labelText={'New Location'} onChange={(address) => setRequestLocation(address)} />
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
              checkboxArray={Manager.buildCheckboxGroup({
                currentUser,
                predefinedType: 'coparents',
              })}
              onCheck={handleRequestRecipient}
              required={true}
            />

            <ShareWithCheckboxes
              shareWith={currentUser?.coparents?.map((x) => x.phone)}
              onCheck={handleShareWithSelection}
              labelText={'Share with'}
              containerClass={'share-with-coparents'}
              checkboxArray={Manager.buildCheckboxGroup({
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