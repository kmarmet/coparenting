// Path: src\components\screens\swapRequests?.jsx
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import InputWrapper from '/src/components/shared/inputWrapper'
import Modal from '/src/components/shared/modal'
import NoDataFallbackText from '/src/components/shared/noDataFallbackText'
import SwapDurations from '/src/constants/swapDurations.js'
import DB from '/src/database/DB'
import AlertManager from '/src/managers/alertManager'
import DomManager from '/src/managers/domManager'
import Manager from '/src/managers/manager'
import NotificationManager from '/src/managers/notificationManager'
import ObjectManager from '/src/managers/objectManager'
import StringManager from '/src/managers/stringManager'
import ActivityCategory from '/src/models/activityCategory'
import ModelNames from '/src/models/modelNames'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {Fade} from 'react-awesome-reveal'
import {IoAdd} from 'react-icons/io5'
import {PiCheckBold, PiSwapDuotone} from 'react-icons/pi'
import DatetimeFormats from '../../constants/datetimeFormats'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context.js'
import DB_UserScoped from '../../database/db_userScoped.js'
import useCurrentUser from '../../hooks/useCurrentUser'
import useSwapRequests from '../../hooks/useSwapRequests'
import NavBar from '../navBar'
import DetailBlock from '../shared/detailBlock'
import Spacer from '../shared/spacer'
import ToggleButton from '../shared/toggleButton'
import ViewSelector from '../shared/viewSelector'

const Decisions = {
  approved: 'APPROVED',
  declined: 'DECLINED',
  delete: 'DELETE',
}

export default function SwapRequests() {
  const {state, setState} = useContext(globalState)
  const {theme, authUser} = state
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
  const [requestTimeRemaining, setRequestTimeRemaining] = useState(0)
  const {currentUser} = useCurrentUser()
  const {swapRequests} = useSwapRequests()

  const ResetForm = async (showAlert = false) => {
    Manager.ResetForm('swap-request-wrapper')
    setRequestChildren([])
    setSwapDuration('single')
    setIncludeChildren(false)
    setStartDate('')
    setState({...state, refreshKey: Manager.getUid(), successAlertMessage: showAlert ? 'Swap Request Updated' : null})
  }

  const Update = async () => {
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
    setActiveRequest(updatedRequest)
    setShowDetails(false)
    await ResetForm(true)
  }

  const SelectDecision = async (decision) => {
    const recipient = await DB_UserScoped.getCoparentByKey(activeRequest.recipientKey, currentUser)
    const recipientName = recipient.name
    // Rejected
    if (decision === Decisions.declined) {
      activeRequest.status = 'declined'
      activeRequest.declineReason = declineReason
      await DB.updateEntireRecord(`${DB.tables.swapRequests}/${activeRequest.ownerKey}`, activeRequest, activeRequest.id)

      const message = NotificationManager.templates.swapRequestRejection(activeRequest, recipientName)
      NotificationManager.SendNotification('Swap Request Decision', message, activeRequest?.ownerKey, currentUser, ActivityCategory.swapRequest)
      setShowDetails(false)
    }
    // Approved
    if (decision === Decisions.approved) {
      const message = NotificationManager.templates.swapRequestApproval(activeRequest, recipientName)
      activeRequest.status = 'approved'
      await DB.updateEntireRecord(`${DB.tables.swapRequests}/${activeRequest.ownerKey}`, activeRequest, activeRequest.id)

      NotificationManager.SendNotification('Swap Request Decision', message, activeRequest?.ownerKey, currentUser, ActivityCategory.swapRequest)
      setShowDetails(false)
    }

    setState({...state, refreshKey: Manager.getUid(), successAlertMessage: `Decision Sent to ${recipientName}`})
  }

  const SetCurrentRequest = async (request) => {
    setShowDetails(true)
    setActiveRequest(request)
  }

  const SetDefaults = () => {
    setRequestReason(activeRequest?.requestReason)
    setRequestChildren(activeRequest?.children)
    setSwapDuration(activeRequest?.duration)
    setStartDate(activeRequest?.startDate)
  }

  const HandleChildSelection = (e) => {
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

  const DeleteRequest = async (action = 'deleted') => {
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
      SetDefaults()
    }
  }, [activeRequest])

  useEffect(() => {
    setView('details')
  }, [])

  useEffect(() => {
    if (Manager.isValid(currentUser)) {
      setTimeout(() => {
        DomManager.ToggleAnimation('add', 'row', DomManager.AnimateClasses.names.fadeInRight, 90)
      }, 300)
    }
  }, [currentUser])

  useEffect(() => {
    if (showDetails) {
      DomManager.setDefaultView()
      setRequestTimeRemaining(moment(moment(activeRequest?.responseDueDate).startOf('day')).fromNow().toString())
    }
  }, [showDetails])

  return (
    <>
      {/* DETAILS CARD */}
      <Modal
        onDelete={DeleteRequest}
        hasDelete={activeRequest?.ownerKey === currentUser?.key && view === 'edit'}
        hasSubmitButton={activeRequest?.ownerKey !== currentUser?.key}
        submitText={'Approve'}
        submitIcon={<PiCheckBold />}
        title={'Request Details'}
        onSubmit={() => SelectDecision(Decisions.approved)}
        className="swap-requests"
        wrapperClass="swap-requests"
        onClose={async () => {
          setShowDetails(false)
          setView('details')
          setActiveRequest(null)
          await ResetForm()
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
                  title={'Requested Response Date'}
                  valueToValidate={activeRequest?.responseDueDate}
                />

                {/*  Time Remaining */}
                <DetailBlock
                  classes={requestTimeRemaining.toString().includes('ago') ? 'red' : 'green'}
                  title={'Response Time Remaining'}
                  text={`${requestTimeRemaining}`}
                  valueToValidate={requestTimeRemaining}
                />

                {/*  Created by */}
                <DetailBlock
                  text={activeRequest?.ownerName === currentUser?.name ? 'Me' : activeRequest?.ownerName}
                  title={'Created By'}
                  valueToValidate={activeRequest?.ownerName}
                />
                {/* Sent to */}
                <DetailBlock
                  text={activeRequest?.recipientName === currentUser?.name ? 'Me' : activeRequest?.recipientName}
                  title={'Sent To'}
                  valueToValidate={activeRequest?.recipientName}
                />

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
                <DetailBlock
                  text={activeRequest?.requestReason}
                  isFullWidth={true}
                  classes="long-text"
                  title={'Reason'}
                  valueToValidate={activeRequest?.requestReason}
                />
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
                    onCheck={HandleChildSelection}
                  />
                )}
              </div>
            )}
            <Spacer height={5} />
            {/* BUTTONS */}
            <div className="card-buttons">
              <button className="button default grey center" data-request-id={activeRequest?.id} onClick={Update}>
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
          </Fade>
        )}
      </Modal>

      {/* PAGE CONTAINER */}
      <div id="swap-requests" className={`${theme} page-container form`}>
        {swapRequests?.length === 0 && <NoDataFallbackText text={'There are currently no requests'} />}
        <Fade direction={'up'} duration={1000} triggerOnce={true} className={'swap-requests-fade-wrapper'}>
          <div className="screen-intro-wrapper">
            <p className="screen-title">Swap Requests </p>
            {!DomManager.isMobile() && <IoAdd id={'Add-new-button'} className={'swap-requests'} onClick={() => setShowCard(true)} />}
            <p className="text-screen-intro">
              A request for your child(ren) to remain with you during the designated visitation time of your co-parent.
            </p>
          </div>

          {/* LOOP REQUESTS */}
          <div id="swap-requests-container">
            <Fade direction={'right'} duration={800} cascade={true} damping={0.2} triggerOnce={true}>
              {Manager.isValid(swapRequests) &&
                swapRequests?.map((request, index) => {
                  return (
                    <div onClick={() => SetCurrentRequest(request)} key={index} className="row">
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