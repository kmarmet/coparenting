// Path: src\components\screens\swapRequests?.jsx
import CheckboxGroup from '../shared/checkboxGroup'
import Form from '../shared/form'
import InputWrapper from '../shared/inputWrapper'
import NoDataFallbackText from '../shared/noDataFallbackText'
import ActivityCategory from '../../constants/activityCategory'
import ModelNames from '../../constants/modelNames'
import SwapDurations from '../../constants/swapDurations.js'
import DB from '../../database/DB'
import AlertManager from '../../managers/alertManager'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import ObjectManager from '../../managers/objectManager'
import StringManager from '../../managers/stringManager'
import UpdateManager from '../../managers/updateManager'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {PiCheckBold, PiSwapDuotone} from 'react-icons/pi'
import DatetimeFormats from '../../constants/datetimeFormats'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context.js'
import useCoparents from '../../hooks/useCoparents'
import useCurrentUser from '../../hooks/useCurrentUser'
import useSwapRequests from '../../hooks/useSwapRequests'
import NavBar from '../navBar'
import DetailBlock from '../shared/detailBlock'
import ScreenHeader from '../shared/screenHeader'
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
  const [requestedResponseDate, setResponseDueDate] = useState('')
  const [requestTimeRemaining, setRequestTimeRemaining] = useState(0)
  const {currentUser} = useCurrentUser()
  const {swapRequests} = useSwapRequests()
  const {coparents} = useCoparents()

  const ResetForm = async (showAlert = false) => {
    Manager.ResetForm('swap-request-wrapper')
    setRequestChildren([])
    setSwapDuration('single')
    setIncludeChildren(false)
    setStartDate('')
    setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: showAlert ? 'Swap Request Updated' : null})
  }

  const Update = async () => {
    // Fill -> overwrite
    let updatedRequest = {...activeRequest}
    updatedRequest.startDate = startDate
    updatedRequest.requestedResponseDate = requestedResponseDate
    updatedRequest.children = requestChildren
    updatedRequest.reason = requestReason

    if (Manager.IsValid(requestedResponseDate)) {
      updatedRequest.requestedResponseDate = moment(requestedResponseDate).format(DatetimeFormats.dateForDb)
    }
    const cleanedRequest = ObjectManager.GetModelValidatedObject(updatedRequest, ModelNames.swapRequest)
    await DB.updateEntireRecord(`${DB.tables.swapRequests}/${currentUser?.key}`, cleanedRequest, cleanedRequest.id)
    setActiveRequest(updatedRequest)
    setShowDetails(false)
    await ResetForm(true)
  }

  const SelectDecision = async (decision) => {
    const recipientName = activeRequest?.recipient?.name
    // Rejected
    if (decision === Decisions.declined) {
      activeRequest.status = 'declined'
      activeRequest.declineReason = declineReason
      await DB.updateEntireRecord(`${DB.tables.swapRequests}/${activeRequest.ownerKey}`, activeRequest, activeRequest.id)

      const message = UpdateManager.templates.swapRequestRejection(activeRequest, recipientName)
      UpdateManager.SendUpdate('Swap Request Decision', message, activeRequest?.ownerKey, currentUser, ActivityCategory.swapRequest)
      setShowDetails(false)
    }
    // Approved
    if (decision === Decisions.approved) {
      const message = UpdateManager.templates.swapRequestApproval(activeRequest, recipientName)
      activeRequest.status = 'approved'
      await DB.updateEntireRecord(`${DB.tables.swapRequests}/${activeRequest.ownerKey}`, activeRequest, activeRequest.id)

      UpdateManager.SendUpdate('Swap Request Decision', message, activeRequest?.ownerKey, currentUser, ActivityCategory.swapRequest)
      setShowDetails(false)
    }

    setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: `Decision Sent to ${StringManager.GetFirstNameOnly(recipientName)}`})
  }

  const SetCurrentRequest = async (request) => {
    setShowDetails(true)
    setActiveRequest(request)
  }

  const SetDefaults = () => {
    setRequestReason(activeRequest?.reason)
    setRequestChildren(activeRequest?.children)
    setSwapDuration(activeRequest?.duration)
    setStartDate(activeRequest?.startDate)
  }

  const HandleChildSelection = (e) => {
    let childrenArr = []
    DomManager.HandleCheckboxSelection(
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
      AlertManager.confirmAlert('Are you sure you would like to Delete this request?', "I'm Sure", true, async () => {
        await DB.deleteById(`${DB.tables.swapRequests}/${activeRequest?.ownerKey}`, activeRequest?.id)
        setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: 'Swap Request Deleted'})
        setShowDetails(false)
      })
    } else {
      if (activeRequest?.ownerKey === currentUser?.key) {
        const recordIndex = DB.GetTableIndexById(swapRequests, activeRequest?.id)
        await DB.Delete(`${DB.tables.swapRequests}/${activeRequest?.ownerKey}/${recordIndex}`)
        setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: 'Swap Request Deleted'})
      }
      setShowDetails(false)
    }

    setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: 'Swap Request Deleted'})
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
    if (Manager.IsValid(currentUser)) {
      setTimeout(() => {
        DomManager.ToggleAnimation('add', 'row', DomManager.AnimateClasses.names.fadeInRight, 85)
        DomManager.ToggleAnimation('add', 'block', DomManager.AnimateClasses.names.fadeInUp, 85)
      }, 300)
    }
  }, [currentUser, view])

  useEffect(() => {
    if (showDetails) {
      DomManager.setDefaultView()
      setRequestTimeRemaining(moment(moment(activeRequest?.requestedResponseDate).startOf('day')).fromNow().toString())
    }
  }, [showDetails])

  return (
    <>
      {/* DETAILS CARD */}
      <Form
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
        viewSelector={<ViewSelector labels={['details', 'edit']} visibleLabels={['details']} updateState={(e) => setView(e.toLowerCase())} />}
        showCard={showDetails}>
        {/* DETAILS */}
        {view === 'details' && (
          <div className="details" className={`content`}>
            <Spacer height={5} />
            <div className="blocks">
              {/* Swap Date(s) */}
              <DetailBlock
                text={moment(activeRequest?.startDate).format(DatetimeFormats.readableMonthAndDayWithDayDigitOnly)}
                title={Manager.IsValid(activeRequest?.endDate) ? 'Swap Dates' : 'Swap Date'}
                valueToValidate={activeRequest?.startDate}
              />

              {/* Respond by */}
              <DetailBlock
                text={moment(activeRequest?.requestedResponseDate).format(DatetimeFormats.readableMonthAndDayWithDayDigitOnly)}
                title={'Requested Response Date'}
                valueToValidate={activeRequest?.requestedResponseDate}
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
                text={activeRequest?.recipient?.name === currentUser?.name ? 'Me' : activeRequest?.recipient?.name}
                title={'Sent To'}
                valueToValidate={activeRequest?.recipient?.name}
              />

              {/* Start time */}
              <DetailBlock text={activeRequest?.fromHour} title={'Start Time'} valueToValidate={activeRequest?.fromHour} />

              {/* End time */}
              <DetailBlock text={activeRequest?.toHour} title={'End Time'} valueToValidate={activeRequest?.toHour} />

              {/*  Children */}
              {Manager.IsValid(activeRequest?.children) && (
                <div className="block">
                  {Manager.IsValid(activeRequest?.children) &&
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
                text={activeRequest?.reason}
                isFullWidth={true}
                classes="long-text"
                title={'Reason'}
                valueToValidate={activeRequest?.reason}
              />
            </div>
          </div>
        )}

        {/* EDIT */}
        {view === 'edit' && (
          <>
            {/* SINGLE DATE */}
            {swapDuration === SwapDurations.single && (
              <InputWrapper
                defaultValue={moment(activeRequest?.startDate)}
                inputType={InputTypes.date}
                placeholder={'Date'}
                uidClass="swap-request-date"
                wrapperClasses={`${Manager.IsValid(activeRequest?.startDate) ? 'show-label' : ''}`}
                onDateOrTimeSelection={(day) => setStartDate(moment(day).format(DatetimeFormats.dateForDb))}
              />
            )}

            {/* RESPONSE DUE DATE */}
            <InputWrapper
              uidClass="response-due-date"
              wrapperClasses={`${Manager.IsValid(activeRequest?.requestedResponseDate) ? 'show-label' : ''}`}
              inputType={InputTypes.date}
              placeholder={'Requested Response Date'}
              defaultValue={moment(activeRequest?.requestedResponseDate)}
              onDateOrTimeSelection={(day) => setResponseDueDate(moment(day).format(DatetimeFormats.dateForDb))}
            />

            {/* INCLUDE CHILDREN */}
            {Manager.IsValid(currentUser?.children) && (
              <div className="share-with-container">
                <div className="flex">
                  <p>Include Child(ren)</p>
                  <ToggleButton
                    isDefaultChecked={Manager.IsValid(activeRequest?.children) || includeChildren}
                    onCheck={() => setIncludeChildren(!includeChildren)}
                    onUncheck={() => setIncludeChildren(!includeChildren)}
                  />
                </div>
                {(activeRequest?.children?.length > 0 || includeChildren) && (
                  <CheckboxGroup
                    checkboxArray={DomManager.BuildCheckboxGroup({
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
          </>
        )}
      </Form>

      {/* PAGE CONTAINER */}
      <div id="swap-requests" className={`${theme} page-container`}>
        <ScreenHeader
          title={'Swap Requests'}
          screenDescription="A request for your child(ren) to remain with you during the designated visitation time of your co-parent"
        />
        {swapRequests?.length === 0 && <NoDataFallbackText text={'There are currently no requests'} />}
        <Spacer height={15} />
        <div className="screen-content">
          {/* LOOP REQUESTS */}
          <div id="swap-requests-container">
            {Manager.IsValid(swapRequests) &&
              swapRequests?.map((request, index) => {
                return (
                  <div onClick={() => SetCurrentRequest(request)} key={index} className="row">
                    {/* REQUEST DATE */}
                    <div id="primary-icon-wrapper" className="mr-10">
                      <PiSwapDuotone id={'primary-row-icon'} />
                    </div>

                    {/* CONTENT */}
                    <div id="content" className={`${request?.reason?.length > 20 ? 'long-text' : ''}`}>
                      {/* MULTIPLE */}
                      {request?.duration === SwapDurations.multiple && (
                        <div className="flex">
                          <p id="title">
                            {moment(request?.startDate).format(DatetimeFormats.readableMonthAndDay)} to{' '}
                            {moment(request?.endDate).format(DatetimeFormats.readableMonthAndDay)}
                            {request?.ownerName === currentUser?.name && <span>Sent to {request?.recipient?.name}</span>}
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
                              {request?.ownerName === currentUser?.name && <span>Sent to {request?.recipient?.name}</span>}
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
          </div>
        </div>
      </div>
      <NavBar />
    </>
  )
}