// Path: src\components\screens\transferRequests?.jsx
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {setKey} from 'react-geocode'
import {PiCarProfileDuotone} from 'react-icons/pi'
import NoDataFallbackText from '../.../..//shared/noDataFallbackText'
import Form from '../.../../shared/form'
import Map from '../.../../shared/map.jsx'
import ActivityCategory from '../../constants/activityCategory'
import ButtonThemes from '../../constants/buttonThemes'
import DatetimeFormats from '../../constants/datetimeFormats'
import InputTypes from '../../constants/inputTypes'
import ModelNames from '../../constants/modelNames'
import globalState from '../../context.js'
import DB from '../../database/DB'
import useCoParents from '../../hooks/useCoParents'
import useCurrentUser from '../../hooks/useCurrentUser'
import useTransferRequests from '../../hooks/useTransferRequests'
import AlertManager from '../../managers/alertManager'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import ObjectManager from '../../managers/objectManager'
import StringManager from '../../managers/stringManager'
import UpdateManager from '../../managers/updateManager.js'
import NavBar from '../navBar'
import AddressInput from '../shared/addressInput'
import CardButton from '../shared/cardButton'
import DetailBlock from '../shared/detailBlock'
import Label from '../shared/label.jsx'
import ScreenHeader from '../shared/screenHeader'
import Spacer from '../shared/spacer.jsx'
import ToggleButton from '../shared/toggleButton'
import ViewDropdown from '../shared/viewDropdown'

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
  const {coParents} = useCoParents()

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
    updatedRequest.address = requestLocation
    updatedRequest.directionsLink = Manager.GetDirectionsLink(requestLocation)
    updatedRequest.date = requestDate
    updatedRequest.declineReason = declineReason
    updatedRequest.requestedResponseDate = requestedResponseDate
    updatedRequest.requestReason = requestReason

    if (Manager.IsValid(requestedResponseDate)) {
      updatedRequest.requestedResponseDate = moment(requestedResponseDate).format(DatetimeFormats.dateForDb)
    }
    const cleanedRequest = ObjectManager.GetModelValidatedObject(updatedRequest, ModelNames.transferChangeRequest)
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
    const recipient = coParents?.find((x) => x.userKey === activeRequest?.recipient?.key)
    const recipientName = recipient?.name
    // Rejected
    if (decision === Decisions.declined) {
      activeRequest.status = 'declined'
      activeRequest.declineReason = declineReason
      await DB.updateEntireRecord(`${DB.tables.transferChangeRequests}/${activeRequest?.ownerKey}`, activeRequest, activeRequest.id)
      const message = UpdateManager.templates.transferRequestRejection(activeRequest, recipientName)
      await UpdateManager.SendUpdate('Transfer Request Decision', message, activeRequest?.ownerKey, currentUser, ActivityCategory.transferRequest)
      setShowDetails(false)
    }

    // Approved
    if (decision === Decisions.approved) {
      activeRequest.status = 'approved'
      await DB.updateEntireRecord(`${DB.tables.transferChangeRequests}/${activeRequest?.ownerKey}`, activeRequest, activeRequest.id)
      const message = UpdateManager.templates.transferRequestApproval(activeRequest, recipientName)
      setShowDetails(false)
      await UpdateManager.SendUpdate('Transfer Request Decision', message, activeRequest?.ownerKey, currentUser, ActivityCategory.transferRequest)
    }

    setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: `Decision Sent to ${recipientName}`})
  }

  const CheckIn = async () => {
    setShowDetails(false)
    let notificationMessage = `${StringManager.getFirstWord(StringManager.UppercaseFirstLetterOfAllWords(currentUser?.name))} at ${
      activeRequest?.address
    }`
    if (!sendWithAddress) {
      notificationMessage = `${StringManager.getFirstWord(StringManager.UppercaseFirstLetterOfAllWords(currentUser?.name))} has arrived at the transfer destination`
    }
    const recipient = coParents?.find((x) => x.key === activeRequest?.recipient?.key)

    await UpdateManager.SendUpdate('Transfer Destination Arrival', notificationMessage, recipient?.key, currentUser, ActivityCategory.expenses)
    setState({...state, successAlertMessage: 'Arrival Notification Sent'})
  }

  const GetFromOrToName = (key) => {
    if (key === currentUser?.key) {
      return 'Me'
    } else {
      returncoParents?.find((c) => c.userKey === key)?.name
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
        DomManager.ToggleAnimation('add', 'row', DomManager.AnimateClasses.names.fadeInUp, 85)
        DomManager.ToggleAnimation('add', 'block', DomManager.AnimateClasses.names.fadeInUp, 85)
      }, 300)
    }
  }, [currentUser, view])

  return (
    <>
      {/* DETAILS CARD */}
      <Form
        submitText={'Approve'}
        onDelete={() => DeleteRequest('deleted')}
        title={'Request Details'}
        hasDelete={activeRequest?.ownerKey === currentUser?.key && view === 'edit'}
        hasSubmitButton={activeRequest?.ownerKey !== currentUser?.key}
        onSubmit={() => SelectDecision(Decisions.approved)}
        wrapperClass="transfer-change form at-top"
        viewSelector={<ViewDropdown dropdownPlaceholder="Details" views={['Details', 'Edit']} updateState={(e) => setView(e)} />}
        thirdButtonText="Decline"
        className="transfer-change"
        extraButtons={[
          <CardButton buttonType={ButtonThemes.green} key={Manager.GetUid()} onClick={Update} text={'Update'} />,
          <CardButton
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
            }}
            text="Decline"
            buttonType={ButtonThemes.red}
            key={Manager.GetUid()}
          />,
        ]}
        hasThirdButton={true}
        onClose={ResetForm}
        showCard={showDetails}>
        <div className={` details content ${activeRequest?.requestReason?.length > 20 ? 'long-text' : ''}`}>
          {view.toLowerCase() === 'details' && (
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
                <DetailBlock title={'To'} valueToValidate={'To'} text={GetFromOrToName(activeRequest?.recipient?.key)} />

                {/* REASON */}
                <DetailBlock
                  text={activeRequest?.requestReason}
                  valueToValidate={activeRequest?.requestReason}
                  isFullWidth={true}
                  title={'Reason for Request'}
                />

                {/*  Location */}
                <DetailBlock
                  isNavLink={true}
                  title={'Go'}
                  text={activeRequest?.address}
                  valueToValidate={activeRequest?.address}
                  linkUrl={activeRequest?.address}
                />

                {/*  CHECK IN */}
                <DetailBlock title={'Check In'} valueToValidate={'Check In'} isCustom={true}>
                  <div className="card-icon-button" onClick={CheckIn}>
                    {/*<MdPersonPinCircle />*/}
                    <span className="location-pin-animation"></span>
                  </div>
                  <Spacer height={2} />
                </DetailBlock>
                <Spacer height={2} />
              </div>

              {/*  SEND WITH ADDRESS */}
              <div className="flex send-with-address-toggle">
                <Label text={'Include Address in Notification'} classes="toggle " />
                <ToggleButton onCheck={() => setSendWithAddress(!sendWithAddress)} toggleState={sendWithAddress} />
              </div>

              {/* MAP */}
              <Map locationString={activeRequest?.address} />
            </>
          )}

          {view.toLowerCase() === 'edit' && (
            <>
              {/* DATE */}
              <InputField
                defaultValue={moment(activeRequest?.startDate)}
                inputType={InputTypes.date}
                labelText={'Date'}
                uidClass="transfer-request-date"
                onDateOrTimeSelection={(e) => setRequestDate(moment(e).format(DatetimeFormats.dateForDb))}
              />

              {/* TIME */}
              <InputField
                defaultValue={activeRequest?.time}
                inputType={InputTypes.time}
                uidClass="transfer-request-time"
                labelText={'Transfer Time'}
                onDateOrTimeSelection={(e) => setRequestTime(moment(e).format(DatetimeFormats.timeForDb))}
              />

              {/*  NEW LOCATION*/}
              <AddressInput placeholder={'Address'} defaultValue={activeRequest?.address} onChange={(address) => setRequestLocation(address)} />

              {/* RESPONSE DUE DATE */}
              <InputField
                defaultValue={activeRequest?.requestedResponseDate}
                onDateOrTimeSelection={(e) => setResponseDueDate(moment(e).format(DatetimeFormats.dateForDb))}
                inputType={InputTypes.date}
                uidClass="transfer-request-response-date"
                labelText={'Requested Response Date'}
              />

              {/* REASON */}
              {activeRequest?.ownerKey !== currentUser?.key && (
                <InputField
                  defaultValue={activeRequest?.requestReason}
                  onChange={(e) => setRequestReason(e)}
                  inputType={InputTypes.textarea}
                  placeholder={'Reason for Request'}
                />
              )}
            </>
          )}
        </div>
      </Form>

      <div id="transfer-requests-container" className={`${theme} page-container`}>
        {transferRequests?.length === 0 && <NoDataFallbackText text={'There are currently no requests'} />}

        <ScreenHeader
          title={'Transfer Change Requests'}
          screenDescription="A proposal to modify the time and/or location for the child exchange on a designated day"
        />
        <Spacer height={10} />
        <div className="screen-content">
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
                            {StringManager.UppercaseFirstLetterOfAllWords(request.status)}
                          </span>
                        </p>
                        {request?.recipient?.key === currentUser?.key && (
                          <p id="subtitle">from {coparents.find((x) => x.key === request.ownerKey)?.name}</p>
                        )}
                        {request?.recipient?.key !== currentUser?.key && (
                          <p id="subtitle">
                            to&nbsp;
                            {StringManager.GetFirstNameOnly(coParents?.find((x) => x?.userKey === request?.recipient?.key)?.name)}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
        <NavBar />
      </div>
    </>
  )
}