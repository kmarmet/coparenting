// Path: src\components\screens\transferRequests.jsx
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context.js'
import DB from '/src/database/DB'
import Manager from '/src/managers/manager'
import {MdPersonPinCircle} from 'react-icons/md'
import {child, getDatabase, onValue, ref} from 'firebase/database'
import NotificationManager from '/src/managers/notificationManager.js'
import DB_UserScoped from '../../database/db_userScoped.js'
import {IoAdd} from 'react-icons/io5'
import SecurityManager from '/src/managers/securityManager'
import {PiCarProfileDuotone, PiCheckBold} from 'react-icons/pi'
import {Fade} from 'react-awesome-reveal'
import moment from 'moment'
import AlertManager from '/src/managers/alertManager'
import Modal from '/src/components/shared/modal'
import DomManager from '/src/managers/domManager'
import NoDataFallbackText from '/src/components/shared/noDataFallbackText'
import ActivityCategory from '/src/models/activityCategory'
import DatetimeFormats from '/src/constants/datetimeFormats'
import InputWrapper from '/src/components/shared/inputWrapper'
import ObjectManager from '/src/managers/objectManager'
import ModelNames from '/src/models/modelNames'
import StringManager from '/src/managers/stringManager'
import Spacer from '../shared/spacer.jsx'
import Map from '/src/components/shared/map.jsx'
import {setKey} from 'react-geocode'
import Label from '../shared/label.jsx'
import ViewSelector from '../shared/viewSelector'
import NavBar from '../navBar'
import ToggleButton from '../shared/toggleButton'
import DetailBlock from '../shared/detailBlock'
import InputTypes from '../../constants/inputTypes'

const Decisions = {
  approved: 'APPROVED',
  declined: 'DECLINED',
  delete: 'DELETE',
}

export default function TransferRequests() {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, refreshKey, authUser} = state
  const [existingRequests, setExistingRequests] = useState([])
  const [declineReason, setDeclineReason] = useState('')
  const [showNewRequestCard, setShowNewRequestCard] = useState(false)
  const [activeRequest, setActiveRequest] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [view, setView] = useState('details')
  const [requestTime, setRequestTime] = useState('')
  const [requestLocation, setRequestLocation] = useState('')
  const [requestDate, setRequestDate] = useState('')
  const [responseDueDate, setResponseDueDate] = useState('')
  const [sendWithAddress, setSendWithAddress] = useState(false)
  const [requestReason, setRequestReason] = useState('')

  const resetForm = async (successMessage = '') => {
    Manager.resetForm('edit-event-form')
    setRequestTime('')
    setRequestLocation('')
    setRequestDate('')
    setResponseDueDate('')
    setShowDetails(false)
    setView('details')
    setState({...state, refreshKey: Manager.getUid(), successAlertMessage: successMessage})
  }

  const update = async () => {
    // Fill -> overwrite
    let updatedRequest = {...activeRequest}
    updatedRequest.time = requestTime
    updatedRequest.location = requestLocation
    updatedRequest.directionsLink = Manager.getDirectionsLink(requestLocation)
    updatedRequest.date = requestDate
    updatedRequest.declineReason = declineReason
    updatedRequest.responseDueDate = responseDueDate
    updatedRequest.requestReason = requestReason

    if (Manager.isValid(responseDueDate)) {
      updatedRequest.responseDueDate = moment(responseDueDate).format(DatetimeFormats.dateForDb)
    }
    const cleanedRequest = ObjectManager.cleanObject(updatedRequest, ModelNames.transferChangeRequest)
    await DB.updateEntireRecord(`${DB.tables.transferChangeRequests}/${currentUser?.key}`, cleanedRequest, activeRequest.id)
    await getSecuredRequests()
    setActiveRequest(updatedRequest)
    setShowDetails(false)
    await resetForm('Transfer Request Updated')
  }

  const getSecuredRequests = async () => {
    let allRequests = await SecurityManager.getTransferChangeRequests(currentUser)
    setExistingRequests(allRequests)
  }

  const deleteRequest = async (action = 'deleted') => {
    if (action === 'deleted') {
      AlertManager.confirmAlert('Are you sure you would like to delete this request?', "I'm Sure", true, async () => {
        await DB.deleteById(`${DB.tables.transferChangeRequests}/${currentUser.key}`, activeRequest?.id)
        setState({...state, successAlertMessage: 'Transfer Change Request Deleted', refreshKey: Manager.getUid()})
        setShowDetails(false)
      })
    }
  }

  const selectDecision = async (decision) => {
    const recipient = await DB_UserScoped.getCoparentByKey(activeRequest.recipientKey, currentUser)
    const recipientName = recipient.name
    // Rejected
    if (decision === Decisions.declined) {
      activeRequest.status = 'declined'
      activeRequest.declineReason = declineReason
      await DB.updateEntireRecord(`${DB.tables.transferChangeRequests}/${activeRequest?.ownerKey}`, activeRequest, activeRequest.id)
      const message = NotificationManager.templates.transferRequestRejection(activeRequest, recipientName)
      await NotificationManager.sendNotification(
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
      await NotificationManager.sendNotification(
        'Transfer Request Decision',
        message,
        activeRequest?.ownerKey,
        currentUser,
        ActivityCategory.transferRequest
      )
    }

    setState({...state, refreshKey: Manager.getUid(), successAlertMessage: `Decision Sent to ${recipientName}`})
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, DB.tables.transferChangeRequests), async () => {
      await getSecuredRequests().then((r) => r)
    })
  }

  const checkIn = async () => {
    setShowDetails(false)
    let notificationMessage = `${StringManager.getFirstWord(StringManager.uppercaseFirstLetterOfAllWords(currentUser.name))} at ${
      activeRequest?.location
    }`
    if (!sendWithAddress) {
      notificationMessage = `${StringManager.getFirstWord(StringManager.uppercaseFirstLetterOfAllWords(currentUser.name))} has Arrived`
    }
    const recipientKey = activeRequest?.ownerKey === currentUser.key ? activeRequest.recipientKey : currentUser.key
    await NotificationManager.sendNotification(
      'Transfer Destination Arrival',
      notificationMessage,
      recipientKey,
      currentUser,
      ActivityCategory.expenses
    )
    setState({...state, successAlertMessage: 'Arrival Notification Sent'})
  }

  const getFromOrToName = (key) => {
    if (key === currentUser.key) {
      return 'Me'
    } else {
      return currentUser?.coparents.find((c) => c.key === key)?.name
    }
  }

  const getCurrentUserAddress = async () => {
    // const address = await LocationManager.getAddress()
  }

  useEffect(() => {
    onTableChange().then((r) => r)
    getCurrentUserAddress().then((r) => r)
    // eslint-disable-next-line no-undef
    setKey(process.env.REACT_APP_GOOGLE_MAPS_API_KEY)
  }, [])

  useEffect(() => {
    if (showDetails) {
      DomManager.setDefaultView()
    }
  }, [showDetails])

  return (
    <>
      {/* DETAILS CARD */}
      <Modal
        submitText={'Approve'}
        onDelete={() => deleteRequest('deleted')}
        title={'Request Details'}
        hasDelete={activeRequest?.ownerKey === currentUser?.key && view === 'edit'}
        hasSubmitButton={activeRequest?.ownerKey !== currentUser?.key}
        onSubmit={() => selectDecision(Decisions.approved)}
        wrapperClass="transfer-change"
        submitIcon={<PiCheckBold />}
        viewSelector={<ViewSelector labels={['details', 'edit']} updateState={(e) => setView(e)} />}
        className="transfer-change"
        onClose={resetForm}
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
                  valueToValidate={activeRequest?.responseDueDate}
                  title={'Requested Response Date'}
                  text={moment(activeRequest?.responseDueDate).format(DatetimeFormats.readableMonthAndDayWithDayDigitOnly)}
                />

                {/*  Time Remaining */}
                <DetailBlock
                  classes={moment(moment(activeRequest?.responseDueDate).startOf('day')).fromNow().toString().includes('ago') ? 'red' : 'green'}
                  title={'Response Time Remaining'}
                  text={`${moment(moment(activeRequest?.responseDueDate).startOf('day')).fromNow().toString()}`}
                  valueToValidate={moment(moment(activeRequest?.responseDueDate).startOf('day')).fromNow().toString()}
                />

                {/* FROM/TO */}
                <DetailBlock title={'From'} valueToValidate={'From'} text={getFromOrToName(activeRequest?.ownerKey)} />
                <DetailBlock title={'To'} valueToValidate={'To'} text={getFromOrToName(activeRequest?.recipientKey)} />

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
                  <div className="card-icon-button" onClick={checkIn}>
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
              <InputWrapper
                inputType={InputTypes.address}
                labelText={'Address'}
                defaultValue={activeRequest?.location}
                onChange={(address) => setRequestLocation(address)}
              />

              {/* RESPONSE DUE DATE */}
              <InputWrapper
                defaultValue={activeRequest?.responseDueDate}
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
                <button className="button default grey center" data-request-id={activeRequest?.id} onClick={update}>
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
                          setDeclineReason(e.value)
                          selectDecision(Decisions.declined).then(resetForm)
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
        {existingRequests.length === 0 && <NoDataFallbackText text={'There are currently no requests'} />}

        <div className="flex" id="screen-title-wrapper">
          <p className="screen-title">Transfer Change Requests</p>
          {!DomManager.isMobile() && <IoAdd id={'add-new-button'} onClick={() => setShowNewRequestCard(true)} />}
        </div>
        <p className="text-screen-intro">A proposal to modify the time and/or location for the child exchange on a designated day.</p>
        <Spacer height={10} />
        {/* LOOP REQUESTS */}
        {!showNewRequestCard && (
          <div id="all-transfer-requests-container">
            <Fade direction={'right'} duration={800} triggerOnce={true} className={'expense-tracker-fade-wrapper'} cascade={true} damping={0.2}>
              <></>
              {Manager.isValid(existingRequests) &&
                existingRequests.map((request, index) => {
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
                        {request?.recipientKey === currentUser.key && (
                          <p id="subtitle">from {currentUser?.coparents.find((x) => x.key === request.ownerKey)?.name}</p>
                        )}
                        {request?.recipientKey !== currentUser.key && (
                          <p id="subtitle">
                            to&nbsp;
                            {StringManager.getFirstNameOnly(currentUser?.coparents?.filter((x) => x?.key === request?.recipientKey)[0]?.name)}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
            </Fade>
          </div>
        )}
        <NavBar />
      </div>
    </>
  )
}