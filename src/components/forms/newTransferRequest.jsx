// Path: src\components\forms\newTransferRequest.jsx
import React, { useContext, useState } from 'react'
import globalState from '../../context'
import Manager from '/src/managers/manager'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import TransferChangeRequest from '/src/models/transferChangeRequest.js'
import moment from 'moment'
import DB from '/src/database/DB'
import NotificationManager from '/src/managers/notificationManager.js'
import DB_UserScoped from '/src/database/db_userScoped'
import { MobileDatePicker, MobileTimePicker } from '@mui/x-date-pickers-pro'
import DateFormats from '/src/constants/dateFormats'
import DateManager from '/src/managers/dateManager'
import Modal from '../shared/modal'
import InputWrapper from '../shared/inputWrapper'
import ShareWithCheckboxes from '../shared/shareWithCheckboxes'
import AlertManager from '/src/managers/alertManager'
import StringManager from '/src/managers/stringManager'
import ActivityCategory from '/src/models/activityCategory'
import DomManager from '../../managers/domManager.coffee'
import AddressInput from '../shared/addressInput'
import Spacer from '../shared/spacer'

export default function NewTransferChangeRequest({ hideCard, showCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, authUser } = state
  const [requestReason, setRequestReason] = useState('')
  const [shareWith, setShareWith] = useState([])
  const [requestTime, setRequestTime] = useState('')
  const [requestLocation, setRequestLocation] = useState('')
  const [requestDate, setRequestDate] = useState('')
  const [requestRecipientKey, setRequestRecipientKey] = useState('')
  const [preferredLocation, setPreferredLocation] = useState('')
  const [responseDueDate, setResponseDueDate] = useState('')

  const resetForm = async () => {
    Manager.resetForm('transfer-request-wrapper')
    hideCard()
    setRequestReason('')
    setShareWith([])
    setRequestTime('')
    setRequestLocation('')
    setRequestDate('')
    setRequestRecipientKey('')
    setPreferredLocation('')
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(authUser?.email)
    setState({ ...state, currentUser: updatedCurrentUser })
  }

  const submit = async () => {
    const validAccounts = await DB_UserScoped.getValidAccountsForUser(currentUser)

    //#region VALIDATION
    if (validAccounts === 0) {
      AlertManager.throwError(
        'No co-parent to \n assign requests to',
        'You have not added any co-parents. Or, it is also possible they have closed their account.'
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

    const requestTimeIsValid = DateManager.dateIsValid(moment(requestTime, DateFormats.timeForDb).format(DateFormats.timeForDb))
    let newRequest = new TransferChangeRequest()
    newRequest.reason = requestReason
    newRequest.ownerKey = currentUser?.key
    newRequest.shareWith = Manager.getUniqueArray(shareWith).flat()
    newRequest.time = requestTimeIsValid ? requestTime : ''
    newRequest.location = requestLocation
    newRequest.startDate = moment(requestDate).format(DateFormats.dateForDb)
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
    AlertManager.successAlert('Transfer Change Request Sent')

    // Notify
    await NotificationManager.sendNotification(
      `Transfer Change Request`,
      `${StringManager.getFirstNameOnly(currentUser?.name)} has created a Transfer Change request`,
      requestRecipientKey,
      currentUser,
      ActivityCategory.transferRequest
    )

    await resetForm()
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

  const handlePreferredLocation = (e) => {
    Manager.handleCheckboxSelection(
      e,
      () => {
        setPreferredLocation(requestLocation)
      },
      () => {
        setPreferredLocation('')
      },
      false
    )
  }

  const addThemeToDatePickers = () => {
    setTimeout(() => {
      const datetimeParent = document.querySelector('.MuiDialog-root.MuiModal-root')
      datetimeParent.classList.add(currentUser?.settings?.theme)
    }, 100)
  }

  return (
    <Modal
      onSubmit={submit}
      submitText={'Send Request'}
      wrapperClass="new-transfer-request"
      title={'New Request'}
      showCard={showCard}
      onClose={resetForm}>
      <div className="transfer-request-wrapper">
        <div id="transfer-change-container" className={`${theme} form`}>
          <Spacer height={5} />
          <div className="form transfer-change">
            <div className="flex gap">
              {/* DAY */}
              {!DomManager.isMobile() && (
                <InputWrapper inputType={'date'} labelText={'Day'} required={true}>
                  <MobileDatePicker
                    onOpen={addThemeToDatePickers}
                    className={`${theme}  mt-0 w-100`}
                    onChange={(e) => setRequestDate(moment(e).format(DateFormats.dateForDb))}
                  />
                </InputWrapper>
              )}
              {DomManager.isMobile() && (
                <InputWrapper inputType={'date'} labelText={'Day'} required={true}>
                  <input type="date" onChange={(e) => setRequestDate(moment(e.target.value).format(DateFormats.dateForDb))} />
                </InputWrapper>
              )}

              {/* TIME */}
              <InputWrapper inputType={'date'} labelText={'New Time'}>
                <MobileTimePicker
                  slotProps={{
                    actionBar: {
                      actions: ['clear', 'accept'],
                    },
                  }}
                  onOpen={addThemeToDatePickers}
                  className={`${theme}  mt-0 w-100`}
                  onChange={(e) => setRequestTime(moment(e).format(DateFormats.timeForDb))}
                />
              </InputWrapper>
            </div>

            {/* RESPONSE DUE DATE */}
            {!DomManager.isMobile() && (
              <InputWrapper inputType={'date'} labelText={'Respond by'}>
                <MobileDatePicker
                  onOpen={addThemeToDatePickers}
                  className={`${theme}  w-100`}
                  onChange={(day) => setResponseDueDate(moment(day).format(DateFormats.dateForDb))}
                />
              </InputWrapper>
            )}

            {DomManager.isMobile() && (
              <InputWrapper inputType={'date'} labelText={'Respond by'} required={true}>
                <input type="date" onChange={(day) => setResponseDueDate(moment(day).format(DateFormats.dateForDb))} />
              </InputWrapper>
            )}

            {/*  NEW LOCATION*/}
            <InputWrapper inputType={'location'} labelText={'New Location'}>
              <AddressInput
                onSelection={(address) => {
                  setRequestLocation(address)
                }}
              />
            </InputWrapper>

            <CheckboxGroup
              skipNameFormatting={true}
              checkboxArray={Manager.buildCheckboxGroup({
                currentUser,
                customLabelArray: ['Set as Preferred Transfer Location'],
              })}
              onCheck={handlePreferredLocation}
            />

            <Spacer height={5} />

            {/* REASON */}
            <InputWrapper inputType={'textarea'} labelText={'Reason'} onChange={(e) => setRequestReason(e.target.value)} />

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

            <Spacer height={5} />

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