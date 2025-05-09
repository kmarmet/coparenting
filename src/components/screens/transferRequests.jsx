// Path: src\components\screens\transferRequests?.jsx
import InputWrapper from '/src/components/shared/inputWrapper'
import Map from '/src/components/shared/map.jsx'
import Modal from '/src/components/shared/modal'
import NoDataFallbackText from '/src/components/shared/noDataFallbackText'
import DatetimeFormats from '/src/constants/datetimeFormats'
import DB from '/src/database/DB'
import AlertManager from '/src/managers/alertManager'
import DomManager from '/src/managers/domManager'
import Manager from '/src/managers/manager'
import NotificationManager from '/src/managers/notificationManager.js'
import ObjectManager from '/src/managers/objectManager'
import StringManager from '/src/managers/stringManager'
import ActivityCategory from '/src/models/activityCategory'
import ModelNames from '/src/models/modelNames'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {setKey} from 'react-geocode'
import {IoAdd} from 'react-icons/io5'
import {MdPersonPinCircle} from 'react-icons/md'
import {PiCarProfileDuotone, PiCheckBold} from 'react-icons/pi'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context.js'
import useCoparents from '../../hooks/useCoparents'
import useCurrentUser from '../../hooks/useCurrentUser'
import useTransferRequests from '../../hooks/useTransferRequests'
import NavBar from '../navBar'
import AddressInput from '../shared/addressInput'
import DetailBlock from '../shared/detailBlock'
import Label from '../shared/label.jsx'
import Spacer from '../shared/spacer.jsx'
import ToggleButton from '../shared/toggleButton'
import ViewSelector from '../shared/viewSelector'

const Decisions = {
  approved: 'APPROVED',
  declined: 'DECLINED',
  delete: 'DELETE',
}

export default function TransferRequests() {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  // const [existingRequests, setExistingRequests] = useState([])
  const [declineReason, setDeclineReason] = useState('')
  const [showNewRequestCard, setShowNewRequestCard] = useState(false)
  const [activeRequest, setActiveRequest] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [view, setView] = useState('details')
  const [requestTime, setRequestTime] = useState('')
  const [requestLocation, setRequestLocation] = useState('')
  const [requestDate, setRequestDate] = useState('')
  const [requestedResponseDate, setResponseDueDate] = useState('')
  const [sendWithAddress, setSendWithAddress] = useState(false)
  const [requestReason, setRequestReason] = useState('')
  const [requestTimeRemaining, setRequestTimeRemaining] = useState(false)
  const {transferRequests} = useTransferRequests()
  const {currentUser} = useCurrentUser()
  const {coparents} = useCoparents()

  const ResetForm = async (successMessage = '') => {
    Manager.ResetForm('edit-event-form')
    setRequestTime('')
    setRequestLocation('')
    setRequestDate('')
    setResponseDueDate('')
    setShowDetails(false)
    setView('details')
    setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: successMessage})
  }

  const Update = async () => {
    // Fill -> overwrite
    let updatedRequest = {...activeRequest}
    updatedRequest.time = requestTime
    updatedRequest.location = requestLocation
    updatedRequest.directionsLink = Manager.GetDirectionsLink(requestLocation)
    updatedRequest.date = requestDate
    updatedRequest.declineReason = declineReason
    updatedRequest.requestedResponseDate = requestedResponseDate
    updatedRequest.requestReason = requestReason

    if (Manager.IsValid(requestedResponseDate)) {
      updatedRequest.requestedResponseDate = moment(requestedResponseDate).format(DatetimeFormats.dateForDb)
    }
    const cleanedRequest = ObjectManager.cleanObject(updatedRequest, ModelNames.transferChangeRequest)
    await DB.updateEntireRecord(`${DB.tables.transferChangeRequests}/${currentUser?.key}`, cleanedRequest, activeRequest.id)
    setActiveRequest(updatedRequest)
    setShowDetails(false)
    await ResetForm('Transfer Request Updated')
  }

  const DeleteRequest = async (action = 'deleted') => {
    if (action === 'deleted') {
      AlertManager.confirmAlert('Are you sure you would like to Delete this request?', "I'm Sure", true, async () => {
        await DB.deleteById(`${DB.tables.transferChangeRequests}/${currentUser?.key}`, activeRequest?.id)
        setState({...state, successAlertMessage: 'Transfer Change Request Deleted', refreshKey: Manager.GetUid()})
        setShowDetails(false)
      })
    }
  }

  const SelectDecision = async (decision) => {
    const recipient = coparents?.find((x) => x.userKey === activeRequest?.recipientKey)
    const recipientName = recipient?.name
    // Rejected
    if (decision === Decisions.declined) {
      activeRequest.status = 'declined'
      activeRequest.declineReason = declineReason
      await DB.updateEntireRecord(`${DB.tables.transferChangeRequests}/${activeRequest?.ownerKey}`, activeRequest, activeRequest.id)
      const message = NotificationManager.templates.transferRequestRejection(activeRequest, recipientName)
      await NotificationManager.SendNotification(
        'Transfer Request Decision',
        message,
        activeRequest?.ownerKey,
        currentUser,
        ActivityCategory.transferRequest
      )
      setShowDetails(false)
    }

    // Approved
    if (decision === Decisions.approved) {
      activeRequest.status = 'approved'
      await DB.updateEntireRecord(`${DB.tables.transferChangeRequests}/${activeRequest?.ownerKey}`, activeRequest, activeRequest.id)
      const message = NotificationManager.templates.transferRequestApproval(activeRequest, recipientName)
      setShowDetails(false)
      await NotificationManager.SendNotification(
        'Transfer Request Decision',
        message,
        activeRequest?.ownerKey,
        currentUser,
        ActivityCategory.transferRequest
      )
    }

    setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: `Decision Sent to ${recipientName}`})
  }

  const CheckIn = async () => {
    setShowDetails(false)
    let notificationMessage = `${StringManager.getFirstWord(StringManager.uppercaseFirstLetterOfAllWords(currentUser?.name))} at ${
      activeRequest?.location
    }`
    if (!sendWithAddress) {
      notificationMessage = `${StringManager.getFirstWord(StringManager.uppercaseFirstLetterOfAllWords(currentUser?.name))} has arrived at the transfer destination`
    }
    const recipientKey = activeRequest?.ownerKey === currentUser?.key ? activeRequest.recipientKey : currentUser?.key
    await NotificationManager.SendNotification(
      'Transfer Destination Arrival',
      notificationMessage,
      recipientKey,
      currentUser,
      ActivityCategory.expenses
    )
    setState({...state, successAlertMessage: 'Arrival Notification Sent'})
  }

  const GetFromOrToName = (key) => {
    if (key === currentUser?.key) {
      return 'Me'
    } else {
      return currentUser?.coparents.find((c) => c.userKey === key)?.name
    }
  }

  const GetCurrentUserAddress = async () => {
    // const address = await LocationManager.getAddress()
  }

  useEffect(() => {
    GetCurrentUserAddress().then((r) => r)
    // eslint-disable-next-line no-undef
    setKey(process.env.REACT_APP_GOOGLE_MAPS_API_KEY)
  }, [])

  useEffect(() => {
    if (showDetails) {
      DomManager.setDefaultView()
      setRequestTimeRemaining(moment(moment(activeRequest?.requestedResponseDate).startOf('day')).fromNow().toString())
    }
  }, [showDetails])

  useEffect(() => {
    if (Manager.IsValid(currentUser)) {
      setTimeout(() => {
        DomManager.ToggleAnimation('add', 'row', DomManager.AnimateClasses.names.fadeInRight, 85)
        DomManager.ToggleAnimation('add', 'block', DomManager.AnimateClasses.names.fadeInUp, 85)
      }, 300)
    }
  }, [currentUser, view])

  return (
    <>
      {/* DETAILS CARD */}
      <Modal
        submitText={'Approve'}
        onDelete={() => DeleteRequest('deleted')}
        title={'Request Details'}
        hasDelete={activeRequest?.ownerKey === currentUser?.key && view === 'edit'}
        hasSubmitButton={activeRequest?.ownerKey !== currentUser?.key}
        onSubmit={() => SelectDecision(Decisions.approved)}
        wrapperClass="transfer-change"
        submitIcon={<PiCheckBold />}
        viewSelector={<ViewSelector labels={['details', 'edit']} updateState={(e) => setView(e)} />}
        className="transfer-change"
        onClose={ResetForm}
        showCard={showDetails}>
        <div id="details" className={`content ${activeRequest?.requestReason?.length > 20 ? 'long-text' : ''}`}>
          <hr className="top" />
          <Spacer height={8} />

          {view === 'details' && (
            <>
              {/* BLOCKS */}
              <div className="blocks">
                {/* Start Date */}
                <DetailBlock
                  text={moment(activeRequest?.startDate).format(DatetimeFormats.readableMonthAndDayWithDayDigitOnly)}
                  valueToValidate={activeRequest?.startDate}
                  title={'Transfer Date'}
                />

                {/*  End Date */}
                <DetailBlock
                  text={moment(activeRequest?.endDate).format(DatetimeFormats.readableMonthAndDayWithDayDigitOnly)}
                  valueToValidate={activeRequest?.endDate}
                  title={'Return Date'}
                />

                {/*  Time */}
                <DetailBlock
                  text={moment(activeRequest?.time, DatetimeFormats.timeForDb).format(DatetimeFormats.timeForDb)}
                  valueToValidate={activeRequest?.time}
                  title={'Transfer Time'}
                />

                {/*  Response Due Date */}
                <DetailBlock
                  valueToValidate={activeRequest?.requestedResponseDate}
                  title={'Requested Response Date'}
                  text={moment(activeRequest?.requestedResponseDate).format(DatetimeFormats.readableMonthAndDayWithDayDigitOnly)}
                />

                {/*  Time Remaining */}
                <DetailBlock
                  classes={requestTimeRemaining.toString().includes('ago') ? 'red' : 'green'}
                  title={'Response Time Remaining'}
                  text={`${requestTimeRemaining}`}
                  valueToValidate={requestTimeRemaining}
                />

                {/* FROM/TO */}
                <DetailBlock title={'From'} valueToValidate={'From'} text={GetFromOrToName(activeRequest?.ownerKey)} />
                <DetailBlock title={'To'} valueToValidate={'To'} text={GetFromOrToName(activeRequest?.recipientKey)} />

                {/* REASON */}
                <DetailBlock
                  text={activeRequest?.requestReason}
                  valueToValidate={activeRequest?.requestReason}
                  isFullWidth={true}
                  title={'Reason for Request'}
                />

                <hr className="bottom" />

                {/* BUTTONS */}

                {/*  Location */}
                <DetailBlock
                  isNavLink={true}
                  title={'Go'}
                  text={activeRequest?.location}
                  valueToValidate={activeRequest?.location}
                  linkUrl={activeRequest?.location}
                />

                {/*  CHECK IN */}
                <DetailBlock title={'Check In'} valueToValidate={'Check In'} isCustom={true}>
                  <div className="card-icon-button" onClick={CheckIn}>
                    <MdPersonPinCircle />
                  </div>
                  <Spacer height={2} />
                </DetailBlock>
                <Spacer height={2} />
              </div>

              {/*  SEND WITH ADDRESS */}
              <div className="flex send-with-address-toggle">
                <Label text={'Include Address in Arrival Notification'} />
                <ToggleButton onCheck={() => setSendWithAddress(!sendWithAddress)} toggleState={sendWithAddress} />
              </div>

              {/* MAP */}
              <Map locationString={activeRequest?.location} />
            </>
          )}

          {view === 'edit' && (
            <>
              {/* DATE */}
              <InputWrapper
                defaultValue={moment(activeRequest?.startDate)}
                inputType={InputTypes.date}
                labelText={'Date'}
                uidClass="transfer-request-date"
                onDateOrTimeSelection={(e) => setRequestDate(moment(e).format(DatetimeFormats.dateForDb))}
              />

              {/* TIME */}
              <InputWrapper
                defaultValue={activeRequest?.time}
                inputType={InputTypes.time}
                uidClass="transfer-request-time"
                labelText={'Time'}
                onDateOrTimeSelection={(e) => setRequestTime(moment(e).format(DatetimeFormats.timeForDb))}
              />

              {/*  NEW LOCATION*/}
              <AddressInput labelText={'Address'} defaultValue={activeRequest?.location} onChange={(address) => setRequestLocation(address)} />

              {/* RESPONSE DUE DATE */}
              <InputWrapper
                defaultValue={activeRequest?.requestedResponseDate}
                onDateOrTimeSelection={(e) => setResponseDueDate(moment(e).format(DatetimeFormats.dateForDb))}
                inputType={InputTypes.date}
                uidClass="transfer-request-response-date"
                labelText={'Requested Response Date'}
              />

              {/* REASON */}
              {activeRequest?.ownerKey !== currentUser?.key && (
                <InputWrapper
                  defaultValue={activeRequest?.requestReason}
                  onChange={(e) => setRequestReason(e)}
                  inputType={InputTypes.textarea}
                  labelText={'Reason for Request'}
                />
              )}

              {/* BUTTONS */}
              <div className="card-buttons">
                <button className="button default grey center" data-request-id={activeRequest?.id} onClick={Update}>
                  Update Request
                </button>
                {activeRequest?.ownerKey !== currentUser?.key && (
                  <button
                    className="button default red center"
                    data-request-id={activeRequest?.id}
                    onClick={() => {
                      AlertManager.inputAlert(
                        'Reason for Declining Request',
                        'Please enter the reason for declining this request',
                        (e) => {
                          if (e.value.length === 0) {
                            AlertManager.throwError('Reason for declining is required')
                            return false
                          } else {
                            SelectDecision(Decisions.declined).then(ResetForm)
                            setDeclineReason(e.value)
                          }
                        },
                        true,
                        true,
                        'textarea'
                      )
                    }}>
                    Decline Request
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

      <div id="transfer-requests-container" className={`${theme} page-container form`}>
        {transferRequests?.length === 0 && <NoDataFallbackText text={'There are currently no requests'} />}

        <div className="flex" id="screen-title-wrapper">
          <p className="screen-title">Transfer Change Requests</p>
          {!DomManager.isMobile() && <IoAdd id={'Add-new-button'} onClick={() => setShowNewRequestCard(true)} />}
        </div>
        <p className="text-screen-intro">A proposal to modify the time and/or location for the child exchange on a designated day.</p>
        <Spacer height={10} />

        {/* LOOP REQUESTS */}
        {!showNewRequestCard && (
          <div id="all-transfer-requests-container">
            {Manager.IsValid(transferRequests) &&
              transferRequests?.map((request, index) => {
                return (
                  <div
                    key={index}
                    className="flex row"
                    onClick={() => {
                      setActiveRequest(request)
                      setShowDetails(true)
                    }}>
                    <div id="primary-icon-wrapper">
                      <PiCarProfileDuotone id={'primary-row-icon'} />
                    </div>
                    <div data-request-id={request.id} className="request " id="content">
                      {/* DATE */}
                      <p id="title" className="flex date row-title">
                        {moment(request.startDate).format(DatetimeFormats.readableMonthAndDay)}
                        <span className={`${request.status} status`} id="request-status">
                          {StringManager.uppercaseFirstLetterOfAllWords(request.status)}
                        </span>
                      </p>
                      {request?.recipientKey === currentUser?.key && (
                        <p id="subtitle">from {currentUser?.coparents.find((x) => x.key === request.ownerKey)?.name}</p>
                      )}
                      {request?.recipientKey !== currentUser?.key && (
                        <p id="subtitle">
                          to&nbsp;
                          {StringManager.getFirstNameOnly(currentUser?.coparents?.find((x) => x?.userKey === request?.recipientKey)?.name)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
        <NavBar />
      </div>
    </>
  )
}