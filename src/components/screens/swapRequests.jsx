// Path: src\components\screens\swapRequests?.jsx
import moment from 'moment'
import React, {useContext, useEffect, useRef, useState} from 'react'
import ActivityCategory from '../../constants/activityCategory'
import ButtonThemes from '../../constants/buttonThemes'
import DatetimeFormats from '../../constants/datetimeFormats'
import InputTypes from '../../constants/inputTypes'
import SwapDurations from '../../constants/swapDurations.js'
import globalState from '../../context.js'
import DB from '../../database/DB'
import useChildren from '../../hooks/useChildren'
import useCurrentUser from '../../hooks/useCurrentUser'
import useSwapRequests from '../../hooks/useSwapRequests'
import AlertManager from '../../managers/alertManager'
import DomManager from '../../managers/domManager'
import DropdownManager from '../../managers/dropdownManager'
import Manager from '../../managers/manager'
import ObjectManager from '../../managers/objectManager'
import StringManager from '../../managers/stringManager'
import UpdateManager from '../../managers/updateManager'
import NavBar from '../navBar'
import Button from '../shared/button'
import DetailBlock from '../shared/detailBlock'
import Form from '../shared/form'
import InputField from '../shared/inputField'
import MultilineDetailBlock from '../shared/multilineDetailBlock'
import NoDataFallbackText from '../shared/noDataFallbackText'
import ScreenHeader from '../shared/screenHeader'
import SelectDropdown from '../shared/selectDropdown'
import Spacer from '../shared/spacer'
import ViewDropdown from '../shared/viewDropdown'

const Decisions = {
  approved: 'APPROVED',
  declined: 'DECLINED',
  delete: 'DELETE',
}

export default function SwapRequests() {
  const {state, setState} = useContext(globalState)
  const {theme, authUser} = state

  // State
  const [activeRequest, setActiveRequest] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [view, setView] = useState({label: 'Details', value: 'Details'})
  const [requestTimeRemaining, setRequestTimeRemaining] = useState('')

  // Dropdown State
  const [selectedChildrenOptions, setSelectedChildrenOptions] = useState(activeRequest?.children)

  // Hooks
  const {currentUser} = useCurrentUser()
  const {swapRequests} = useSwapRequests()
  const {children, childrenDropdownOptions} = useChildren()

  const formRef = useRef(null)

  const ResetForm = async (showAlert = false) => {
    Manager.ResetForm('swap-request-wrapper')
    setTimeout(() => {
      setState({...state, refreshKey: Manager.GetUid()})
    }, 500)
    setState({...state, successAlertMessage: showAlert ? 'Swap Request Updated' : null})
  }

  const Update = async () => {
    let updatedRequest = ObjectManager.merge(activeRequest, formRef.current, 'deep')

    // Map Dropdown to Database
    updatedRequest.children = DropdownManager.MappedForDatabase.ChildrenFromArray(selectedChildrenOptions)

    // Fill -> overwrite

    const cleanedRequest = ObjectManager.CleanObject(updatedRequest)
    const requestId = DB.GetTableIndexById(swapRequests, activeRequest?.id)
    await DB.ReplaceEntireRecord(`${DB.tables.swapRequests}/${currentUser?.key}/${requestId}`, cleanedRequest)
    setActiveRequest(updatedRequest)
    setShowDetails(false)
    await ResetForm(true)
  }

  const SelectDecision = async (decision) => {
    const recipientName = activeRequest?.recipient?.name
    // Rejected
    if (decision === Decisions.declined) {
      activeRequest.status = 'declined'
      activeRequest.declineReason = formRef.current.declineReason
      await DB.updateEntireRecord(`${DB.tables.swapRequests}/${activeRequest.owner?.key}`, activeRequest, activeRequest.id)

      const message = UpdateManager.templates.swapRequestRejection(activeRequest, recipientName)
      UpdateManager.SendUpdate('Swap Request Decision', message, activeRequest?.owner?.key, currentUser, ActivityCategory.swapRequest)
      setShowDetails(false)
    }
    // Approved
    if (decision === Decisions.approved) {
      const message = UpdateManager.templates.swapRequestApproval(activeRequest, recipientName)
      activeRequest.status = 'approved'
      await DB.updateEntireRecord(`${DB.tables.swapRequests}/${activeRequest.owner?.key}`, activeRequest, activeRequest.id)

      UpdateManager.SendUpdate('Swap Request Decision', message, activeRequest?.owner?.key, currentUser, ActivityCategory.swapRequest)
      setShowDetails(false)
    }

    setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: `Decision Sent to ${StringManager.GetFirstNameOnly(recipientName)}`})
  }

  const SetCurrentRequest = async (request) => {
    setShowDetails(true)
    setActiveRequest(request)
  }

  const DeleteRequest = async (action = 'deleted') => {
    if (action === 'deleted') {
      AlertManager.confirmAlert('Are you sure you would like to Delete this request?', 'I\'m Sure', true, async () => {
        await DB.deleteById(`${DB.tables.swapRequests}/${activeRequest?.owner?.key}`, activeRequest?.id)
        setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: 'Swap Request Deleted'})
        setShowDetails(false)
      })
    }
    else {
      if (activeRequest?.owner?.key === currentUser?.key) {
        const recordIndex = DB.GetTableIndexById(swapRequests, activeRequest?.id)
        await DB.Delete(`${DB.tables.swapRequests}/${activeRequest?.owner?.key}/${recordIndex}`)
        setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: 'Swap Request Deleted'})
      }
      setShowDetails(false)
    }

    setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: 'Swap Request Deleted'})
  }

  const SetDropdownOptions = () => {
    setSelectedChildrenOptions(DropdownManager.GetSelected.Children(activeRequest?.children))
    setView({label: 'Details', value: 'Details'})
  }

  useEffect(() => {
    if (activeRequest) {
      SetDropdownOptions()
    }
  }, [activeRequest])

  useEffect(() => {
    setView('details')
  }, [])

  useEffect(() => {
    if (Manager.IsValid(currentUser)) {
      setTimeout(() => {
        DomManager.ToggleAnimation('add', 'row', DomManager.AnimateClasses.names.fadeInUp, 85)
        DomManager.ToggleAnimation('add', 'block', DomManager.AnimateClasses.names.fadeInUp, 85)
      }, 300)
    }
  }, [currentUser, view])

  useEffect(() => {
    if (showDetails) {
      let timeRemaining = moment(moment(activeRequest?.requestedResponseDate).startOf('day')).fromNow().toString()
      const monthAndYear = moment(activeRequest?.requestedResponseDate).format('MM/YYYY')
      const currentMonthAndYear = moment().format('MM/YYYY')
      if (monthAndYear === currentMonthAndYear) {
        setRequestTimeRemaining('None - Due Today')
      }
      else {
        setRequestTimeRemaining(timeRemaining)

      }
    }
  }, [showDetails])

  return (
    <>
      {/* DETAILS CARD */}
      <Form
        onDelete={DeleteRequest}
        hasDelete={activeRequest?.owner?.key === currentUser?.key && view?.label === 'Edit'}
        hasSubmitButton={activeRequest?.owner?.key !== currentUser?.key}
        submitText={'Approve'}
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
        extraButtons={[
          <>
            {view?.label === 'Edit' &&
              <Button text={'Update Request'} theme={ButtonThemes.green} classes={'card-button pl-20 pr-20'} data-request-id={activeRequest?.id} onClick={Update} />
            }
            {activeRequest?.owner?.key !== currentUser?.key && (
              <Button
                text={'Decline Request'}
                classes={'card-button'}
                theme={ButtonThemes.translucent}
                data-request-id={activeRequest?.id}
                onClick={async () => {
                  AlertManager.inputAlert(
                    'Reason for Declining',
                    'Please enter a reason for declining this request',
                    (e) => {
                      if (e.value.length === 0) {
                        AlertManager.throwError('Reason for declining is required')
                        return false
                      }
                      else {
                        SelectDecision(Decisions.declined).then(ResetForm)
                        formRef.current?.declineReason(e.value)
                      }
                    },
                    true,
                    true,
                    'textarea',
                  )
                }}
              />
            )}
          </>,
        ]}
        viewDropdown={
          <ViewDropdown
            dropdownPlaceholder="Details"
            selectedView={view}
            onSelect={(view) => {
              setView(view)
            }}
          />
        }
        showCard={showDetails}>
        {/* DETAILS */}
        {view?.label === 'Details' && (
          <div className={`content details`}>
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
                classes={requestTimeRemaining.toString().includes('ago') || requestTimeRemaining.toString().includes('Today') ? 'red' : 'green'}
                title={'Response Time Remaining'}
                text={`${requestTimeRemaining}`}
                valueToValidate={requestTimeRemaining}
              />

              {/*  Created by */}
              <DetailBlock
                text={activeRequest?.owner?.name === currentUser?.name ? 'Me' : activeRequest?.owner?.name}
                title={'Created By'}
                valueToValidate={activeRequest?.owner?.name}
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
              <MultilineDetailBlock title={'Children'} array={activeRequest?.children} />

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
        {view?.label === 'Edit' && (
          <>
            {/* SINGLE DATE */}
            {view?.value === SwapDurations.single && (
              <InputField
                defaultValue={moment(activeRequest?.startDate)}
                inputType={InputTypes.date}
                placeholder={'Date'}
                uidClass="swap-request-date"
                wrapperClasses={`${Manager.IsValid(activeRequest?.startDate) ? 'show-label' : ''}`}
                onDateOrTimeSelection={(day) => formRef.current.startDate(moment(day).format(DatetimeFormats.dateForDb))}
              />
            )}

            {/* RESPONSE DUE DATE */}
            <InputField
              uidClass="response-due-date"
              wrapperClasses={`${Manager.IsValid(activeRequest?.requestedResponseDate) ? 'show-label' : ''}`}
              inputType={InputTypes.date}
              placeholder={'Requested Response Date'}
              defaultValue={moment(activeRequest?.requestedResponseDate)}
              onDateOrTimeSelection={(day) => formRef.current.requestedResponseDate(moment(day).format(DatetimeFormats.dateForDb))}
            />

            {/* INCLUDING WHICH CHILDREN */}
            <SelectDropdown
              options={DropdownManager.GetDefault.Children(children)}
              value={selectedChildrenOptions}
              placeholder={'Select Children to Include'}
              onSelect={setSelectedChildrenOptions}
              selectMultiple={true}
            />

            <Spacer height={5} />

            {/* REASON */}
            <InputField
              uidClass="swap-request-reason"
              wrapperClasses={`${Manager.IsValid(activeRequest?.reason) ? 'show-label' : ''}`}
              inputType={InputTypes.textarea}
              placeholder={'Reason'}
              defaultValue={activeRequest?.reason}
              onDateOrTimeSelection={(day) => formRef.current.reason(day)}
            />

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

                    {/* CONTENT */}
                    <div id="content" className={`${request?.reason?.length > 20 ? 'long-text' : ''}`}>
                      {/* MULTIPLE */}
                      {request?.duration === SwapDurations.multiple && (
                        <div className="flex">
                          <p id="title">
                            {moment(request?.startDate).format(DatetimeFormats.readableMonthAndDay)} to{' '}
                            {moment(request?.endDate).format(DatetimeFormats.readableMonthAndDay)}
                          </p>
                          <span className={`${request?.status} status`} id="request-status">
                            {StringManager.UppercaseFirstLetterOfAllWords(request?.status)}
                          </span>
                        </div>
                      )}
                      {/* SINGLE */}
                      {request?.duration === SwapDurations.single && (
                        <>
                          <p id="title" className="row-title">
                            {moment(request?.startDate).format(DatetimeFormats.readableMonthAndDay)}
                            <span className={`${request?.status} status`} id="request-status">
                              {StringManager.UppercaseFirstLetterOfAllWords(request?.status)}
                            </span>
                          </p>

                          {request?.owner?.name === currentUser?.name && <span className={'sent-to'}>Sent to {request?.recipient?.name}</span>}
                          {request?.owner?.name !== currentUser?.name && <span className={'sent-from'}>from {request?.owner?.name}</span>}
                        </>
                      )}
                      {/* HOURS */}
                      {request?.duration === SwapDurations.intra && (
                        <>
                          <p id="title" className="row-title">
                            {moment(request?.startDate).format(DatetimeFormats.readableMonthAndDay)}
                          </p>
                          <span className={`${request?.status} status`} id="request-status">
                              {StringManager.UppercaseFirstLetterOfAllWords(request?.status)}
                            </span>
                        </>
                      )}
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