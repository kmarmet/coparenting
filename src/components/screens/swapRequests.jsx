// Path: src\components\screens\swapRequests.jsx
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context.js'
import DB from '/src/database/DB'
import Manager from '/src/managers/manager'
import moment from 'moment'
import {child, getDatabase, onValue, ref} from 'firebase/database'
import SwapDurations from '/src/constants/swapDurations.js'
import NotificationManager from '/src/managers/notificationManager'
import SecurityManager from '/src/managers/securityManager'
import NavBar from '../navBar'
import {IoAdd} from 'react-icons/io5'
import AlertManager from '/src/managers/alertManager'
import Modal from '/src/components/shared/modal'
import {PiCheckBold, PiSwapDuotone} from 'react-icons/pi'
import {Fade} from 'react-awesome-reveal'
import NoDataFallbackText from '/src/components/shared/noDataFallbackText'
import DomManager from '/src/managers/domManager'
import InputWrapper from '/src/components/shared/inputWrapper'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import ObjectManager from '/src/managers/objectManager'
import ModelNames from '/src/models/modelNames'
import ActivityCategory from '/src/models/activityCategory'
import StringManager from '/src/managers/stringManager'
import ViewSelector from '../shared/viewSelector'
import DB_UserScoped from '../../database/db_userScoped.js'
import Spacer from '../shared/spacer'
import ToggleButton from '../shared/toggleButton'
import InputTypes from '../../constants/inputTypes'
import DetailBlock from '../shared/detailBlock'
import DatetimeFormats from '../../constants/datetimeFormats'

const Decisions = {
  approved: 'APPROVED',
  declined: 'DECLINED',
  delete: 'DELETE',
}

export default function SwapRequests() {
  const {state, setState} = useContext(globalState)
  const [existingRequests, setExistingRequests] = useState([])
  const {currentUser, theme, authUser} = state
  const [showCard, setShowCard] = useState(false)
  const [activeRequest, setActiveRequest] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [view, setView] = useState('details')
  const [requestReason, setRequestReason] = useState('')
  const [requestChildren, setRequestChildren] = useState([])
  const [swapDuration, setSwapDuration] = useState('single')
  const [includeChildren, setIncludeChildren] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [declineReason, setDeclineReason] = useState('')
  const [responseDueDate, setResponseDueDate] = useState('')

  const resetForm = async (showAlert = false) => {
    Manager.resetForm('swap-request-wrapper')
    setRequestChildren([])
    setSwapDuration('single')
    setIncludeChildren(false)
    setStartDate('')
    setState({...state, refreshKey: Manager.getUid(), successAlertMessage: showAlert ? 'Swap Request Updated' : null})
  }

  const update = async () => {
    // Fill -> overwrite
    let updatedRequest = {...activeRequest}
    updatedRequest.startDate = startDate
    updatedRequest.responseDueDate = responseDueDate
    updatedRequest.children = requestChildren
    updatedRequest.requestReason = requestReason

    if (Manager.isValid(responseDueDate)) {
      updatedRequest.responseDueDate = moment(responseDueDate).format(DatetimeFormats.dateForDb)
    }
    const cleanedRequest = ObjectManager.cleanObject(updatedRequest, ModelNames.swapRequest)
    await DB.updateEntireRecord(`${DB.tables.swapRequests}/${currentUser?.key}`, cleanedRequest, cleanedRequest.id)
    await getSecuredRequests()
    setActiveRequest(updatedRequest)
    setShowDetails(false)
    await resetForm(true)
  }

  const getSecuredRequests = async () => {
    let allRequests = await SecurityManager.getSwapRequests(currentUser)
    setExistingRequests(allRequests)
  }

  const selectDecision = async (decision) => {
    const recipient = await DB_UserScoped.getCoparentByKey(activeRequest.recipientKey, currentUser)
    const recipientName = recipient.name
    // Rejected
    if (decision === Decisions.declined) {
      activeRequest.status = 'declined'
      activeRequest.declineReason = declineReason
      await DB.updateEntireRecord(`${DB.tables.swapRequests}/${activeRequest.ownerKey}`, activeRequest, activeRequest.id)

      const message = NotificationManager.templates.swapRequestRejection(activeRequest, recipientName)
      NotificationManager.sendNotification('Swap Request Decision', message, activeRequest?.ownerKey, currentUser, ActivityCategory.swapRequest)
      setShowDetails(false)
    }
    // Approved
    if (decision === Decisions.approved) {
      const message = NotificationManager.templates.swapRequestApproval(activeRequest, recipientName)
      activeRequest.status = 'approved'
      await DB.updateEntireRecord(`${DB.tables.swapRequests}/${activeRequest.ownerKey}`, activeRequest, activeRequest.id)

      NotificationManager.sendNotification('Swap Request Decision', message, activeRequest?.ownerKey, currentUser, ActivityCategory.swapRequest)
      setShowDetails(false)
    }

    setState({...state, refreshKey: Manager.getUid(), successAlertMessage: `Decision Sent to ${recipientName}`})
  }

  const setCurrentRequest = async (request) => {
    setShowDetails(true)
    setActiveRequest(request)
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, `${DB.tables.swapRequests}/${currentUser?.key}`), async () => {
      await getSecuredRequests()
    })
  }

  const setDefaults = () => {
    setRequestReason(activeRequest?.requestReason)
    setRequestChildren(activeRequest?.children)
    setSwapDuration(activeRequest?.duration)
    setStartDate(activeRequest?.startDate)
  }

  const handleChildSelection = (e) => {
    let childrenArr = []
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        childrenArr = [...requestChildren, e]
      },
      (e) => {
        childrenArr = childrenArr.filter((x) => x !== e)
      },
      true
    )
    setRequestChildren(childrenArr)
  }

  const deleteRequest = async (action = 'deleted') => {
    if (action === 'deleted') {
      AlertManager.confirmAlert('Are you sure you would like to delete this request?', "I'm Sure", true, async () => {
        await DB.deleteById(`${DB.tables.swapRequests}/${activeRequest?.ownerKey}`, activeRequest?.id)
        setState({...state, refreshKey: Manager.getUid(), successAlertMessage: 'Swap Request Deleted'})
        setShowDetails(false)
      })
    } else {
      if (activeRequest?.ownerKey === currentUser?.key) {
        await DB.delete(`${DB.tables.swapRequests}/${activeRequest?.ownerKey}`, activeRequest?.id)
        setState({...state, refreshKey: Manager.getUid(), successAlertMessage: 'Swap Request Deleted'})
      }
      setShowDetails(false)
    }

    setState({...state, refreshKey: Manager.getUid(), successAlertMessage: 'Swap Request Deleted'})
  }

  useEffect(() => {
    if (activeRequest) {
      setDefaults()
    }
  }, [activeRequest])

  useEffect(() => {
    onTableChange().then((r) => r)
    setView('details')
  }, [])

  return (
    <>
      {/* DETAILS CARD */}
      <Modal
        onDelete={deleteRequest}
        hasDelete={activeRequest?.ownerKey === currentUser?.key && view === 'edit'}
        hasSubmitButton={activeRequest?.ownerKey !== currentUser?.key}
        submitText={'Approve'}
        submitIcon={<PiCheckBold />}
        title={'Request Details'}
        onSubmit={() => selectDecision(Decisions.approved)}
        className="swap-requests"
        wrapperClass="swap-requests"
        onClose={async () => {
          setShowDetails(false)
          setView('details')
          setActiveRequest(null)
          await resetForm()
        }}
        viewSelector={<ViewSelector labels={['Details', 'Edit']} visibleLabels={['Details']} updateState={(e) => setView(e.toLowerCase())} />}
        showCard={showDetails}>
        {/* DETAILS */}
        {view === 'details' && (
          <Fade direction={'up'} duration={800} triggerOnce={true}>
            <div id="details" className={`content`}>
              <hr className="top" />
              <Spacer height={5} />
              <div className="blocks">
                {/* Swap Date(s) */}
                <DetailBlock
                  text={moment(activeRequest?.startDate).format(DatetimeFormats.readableMonthAndDayWithDayDigitOnly)}
                  title={Manager.isValid(activeRequest?.endDate) ? 'Swap Dates' : 'Swap Date'}
                  valueToValidate={activeRequest?.startDate}
                />

                {/* Respond by */}
                <DetailBlock
                  text={moment(activeRequest?.responseDueDate).format(DatetimeFormats.readableMonthAndDayWithDayDigitOnly)}
                  title={'Respond by'}
                  valueToValidate={activeRequest?.responseDueDate}
                />

                {/*  Created by */}
                <DetailBlock text={activeRequest?.ownerName} title={'Created By'} valueToValidate={activeRequest?.ownerName} />

                {/* Sent to */}
                <DetailBlock text={activeRequest?.recipientName} title={'Sent To'} valueToValidate={activeRequest?.recipientName} />

                {/* Start time */}
                <DetailBlock text={activeRequest?.fromHour} title={'Start Time'} valueToValidate={activeRequest?.fromHour} />

                {/* End time */}
                <DetailBlock text={activeRequest?.toHour} title={'End Time'} valueToValidate={activeRequest?.toHour} />

                {/*  Children */}
                {Manager.isValid(activeRequest?.children) && (
                  <div className="block">
                    {Manager.isValid(activeRequest?.children) &&
                      activeRequest?.children.map((child, index) => {
                        return (
                          <p className="block-text" key={index}>
                            {child}
                          </p>
                        )
                      })}
                    <p className="block-title">Children</p>
                  </div>
                )}

                {/*  Reason */}
                <DetailBlock text={activeRequest?.requestReason} isFullWidth={true} title={'Reason'} valueToValidate={activeRequest?.requestReason} />
              </div>
              <hr className="bottom" />
            </div>
          </Fade>
        )}

        {/* EDIT */}
        {view === 'edit' && (
          <Fade direction={'up'} duration={600} triggerOnce={true}>
            {/* SINGLE DATE */}
            {swapDuration === SwapDurations.single && (
              <InputWrapper
                defaultValue={moment(activeRequest?.startDate)}
                inputType={InputTypes.date}
                labelText={'Date'}
                uidClass="swap-request-date"
                wrapperClasses={`${Manager.isValid(activeRequest?.startDate) ? 'show-label' : ''}`}
                onDateOrTimeSelection={(day) => setStartDate(moment(day).format(DatetimeFormats.dateForDb))}
              />
            )}

            {/* RESPONSE DUE DATE */}
            <InputWrapper
              uidClass="response-due-date"
              wrapperClasses={`${Manager.isValid(activeRequest?.responseDueDate) ? 'show-label' : ''}`}
              inputType={InputTypes.date}
              labelText={'Requested Response Date'}
              defaultValue={moment(activeRequest?.responseDueDate)}
              onDateOrTimeSelection={(day) => setResponseDueDate(moment(day).format(DatetimeFormats.dateForDb))}
            />

            {/* INCLUDE CHILDREN */}
            {Manager.isValid(currentUser?.children) && (
              <div className="share-with-container">
                <div className="flex">
                  <p>Include Child(ren)</p>
                  <ToggleButton
                    isDefaultChecked={Manager.isValid(activeRequest?.children) || includeChildren}
                    onCheck={() => setIncludeChildren(!includeChildren)}
                    onUncheck={() => setIncludeChildren(!includeChildren)}
                  />
                </div>
                {(activeRequest?.children?.length > 0 || includeChildren) && (
                  <CheckboxGroup
                    checkboxArray={Manager.buildCheckboxGroup({
                      currentUser,
                      defaultLabels: activeRequest?.children,
                      labelType: 'children',
                    })}
                    onCheck={handleChildSelection}
                  />
                )}
              </div>
            )}
            <Spacer height={5} />
            {/* BUTTONS */}
            <div className="card-buttons">
              <button className="button default grey center" data-request-id={activeRequest?.id} onClick={update}>
                Update Request
              </button>
              {activeRequest?.ownerKey !== currentUser?.key && (
                <button
                  className="button default red center"
                  data-request-id={activeRequest?.id}
                  onClick={async () => {
                    AlertManager.inputAlert(
                      'Reason for Declining',
                      'Please enter a reason for declining this request',
                      (e) => {
                        setDeclineReason(e.value)
                        selectDecision(Decisions.declined)
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
          </Fade>
        )}
      </Modal>

      {/* PAGE CONTAINER */}
      <div id="swap-requests" className={`${theme} page-container form`}>
        {existingRequests.length === 0 && <NoDataFallbackText text={'There are currently no requests'} />}
        <Fade direction={'up'} duration={1000} triggerOnce={true} className={'swap-requests-fade-wrapper'}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title">Swap Requests </p>
            {!DomManager.isMobile() && <IoAdd id={'add-new-button'} className={'swap-requests'} onClick={() => setShowCard(true)} />}
          </div>
          <p className="text-screen-intro">
            A request for your child(ren) to remain with you during the designated visitation time of your co-parent.
          </p>

          {/* LOOP REQUESTS */}
          <div id="swap-requests-container">
            <Fade direction={'right'} duration={800} cascade={true} damping={0.2} triggerOnce={true}>
              {Manager.isValid(existingRequests) &&
                existingRequests.map((request, index) => {
                  return (
                    <div onClick={() => setCurrentRequest(request)} key={index} className="row">
                      {/* REQUEST DATE */}
                      <div id="primary-icon-wrapper" className="mr-10">
                        <PiSwapDuotone id={'primary-row-icon'} />
                      </div>

                      {/* CONTENT */}
                      <div id="content" className={`${request?.requestReason?.length > 20 ? 'long-text' : ''}`}>
                        {/* MULTIPLE */}
                        {request?.duration === SwapDurations.multiple && (
                          <div className="flex">
                            <p id="title">
                              {moment(request?.startDate).format(DatetimeFormats.readableMonthAndDay)} to{' '}
                              {moment(request?.endDate).format(DatetimeFormats.readableMonthAndDay)}
                              {request?.ownerName === currentUser?.name && <span>Sent to {request?.recipientName}</span>}
                              {request?.ownerName !== currentUser?.name && <span>from {request?.ownerName}</span>}
                            </p>
                            <span className={`${request?.status} status`} id="request-status">
                              {StringManager.uppercaseFirstLetterOfAllWords(request?.status)}
                            </span>
                          </div>
                        )}
                        {/* SINGLE */}
                        <div className="flex">
                          {request?.duration === SwapDurations.single && (
                            <>
                              <p id="title" className="row-title">
                                {moment(request?.startDate).format(DatetimeFormats.readableMonthAndDay)}
                                {request?.ownerName === currentUser?.name && <span>Sent to {request?.recipientName}</span>}
                                {request?.ownerName !== currentUser?.name && <span>from {request?.ownerName}</span>}
                              </p>
                              <span className={`${request?.status} status`} id="request-status">
                                {StringManager.uppercaseFirstLetterOfAllWords(request?.status)}
                              </span>
                            </>
                          )}
                          {/* HOURS */}
                          {request?.duration === SwapDurations.intra && (
                            <>
                              <p id="title" className="row-title">
                                {moment(request?.startDate).format(DatetimeFormats.readableMonthAndDay)}
                              </p>
                              <span className={`${request?.status} status`} id="request-status">
                                {StringManager.uppercaseFirstLetterOfAllWords(request?.status)}
                              </span>
                            </>
                          )}
                        </div>
                        {request?.duration === SwapDurations.intra && (
                          <p id="subtitle">
                            {request?.fromHour.replace(' ', '')} to {request?.toHour.replace(' ', '')}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
            </Fade>
          </div>
        </Fade>
      </div>
      <NavBar />
    </>
  )
}