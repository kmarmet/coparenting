import React, { useContext, useEffect, useState } from 'react'
import DB from 'database/DB'
import Manager from 'managers/manager'
import globalState from '../../context.js'
import 'rsuite/dist/rsuite.min.css'
import moment from 'moment'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import SwapDurations from 'constants/swapDurations.js'
import NotificationManager from 'managers/notificationManager'
import DB_UserScoped from 'database/db_userScoped'
import SecurityManager from '../../managers/securityManager'
import NewSwapRequest from '../forms/newSwapRequest'
import { IoAdd } from 'react-icons/io5'
import NavBar from '../navBar'
import AlertManager from '../../managers/alertManager'
import BottomCard from '../shared/bottomCard'
import { PiCheckBold, PiSwapDuotone } from 'react-icons/pi'
import { Fade } from 'react-awesome-reveal'
import { MobileDatePicker } from '@mui/x-date-pickers-pro'
import Toggle from 'react-toggle'
import DateManager from '../../managers/dateManager'
import NoDataFallbackText from '../shared/noDataFallbackText'
import DomManager from '../../managers/domManager'
import InputWrapper from '../shared/inputWrapper'
import DateFormats from '../../constants/dateFormats'
import CheckboxGroup from '../shared/checkboxGroup'
import ObjectManager from '../../managers/objectManager'
import ModelNames from '../../models/modelNames'
import ActivityCategory from '../../models/activityCategory'
import StringManager from '../../managers/stringManager'

const Decisions = {
  approved: 'APPROVED',
  rejected: 'REJECTED',
  delete: 'DELETE',
}

export default function SwapRequests() {
  const { state, setState } = useContext(globalState)
  const [existingRequests, setExistingRequests] = useState([])
  const { currentUser, theme } = state
  const [rejectionReason, setRejectionReason] = useState('')
  const [showCard, setShowCard] = useState(false)
  const [activeRequest, setActiveRequest] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [view, setView] = useState('details')
  const [reason, setReason] = useState('')
  const [requestChildren, setRequestChildren] = useState([])
  const [swapDuration, setSwapDuration] = useState('single')
  const [includeChildren, setIncludeChildren] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [createdBy, setCreatedBy] = useState('')
  const [responseDueDate, setResponseDueDate] = useState('')
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [status, setStatus] = useState('pending')

  const resetForm = async () => {
    Manager.resetForm('swap-request-wrapper')
    setRequestChildren([])
    setSwapDuration('single')
    setIncludeChildren(false)
    setStartDate('')
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(currentUser.phone)
    setState({ ...state, currentUser: updatedCurrentUser })
    setRefreshKey(Manager.getUid())
  }

  const update = async () => {
    // Fill -> overwrite
    let updatedRequest = { ...activeRequest }
    updatedRequest.startDate = startDate
    updatedRequest.responseDueDate = responseDueDate
    updatedRequest.children = requestChildren
    updatedRequest.reason = reason

    if (Manager.isValid(responseDueDate)) {
      updatedRequest.responseDueDate = moment(responseDueDate).format(DateFormats.dateForDb)
    }
    const cleanedRequest = ObjectManager.cleanObject(updatedRequest, ModelNames.swapRequest)
    await DB.updateEntireRecord(`${DB.tables.swapRequests}/${currentUser.phone}`, cleanedRequest, cleanedRequest.id)
    await getSecuredRequests()
    setActiveRequest(updatedRequest)
    setShowDetails(false)
    await resetForm()
  }

  const getSecuredRequests = async () => {
    let allRequests = await SecurityManager.getSwapRequests(currentUser).then((r) => r)
    console.log(allRequests)
    setExistingRequests(allRequests)
  }

  const selectDecision = async (decision) => {
    const recipient = await DB_UserScoped.getCoparentByPhone(activeRequest.recipientPhone, currentUser)
    const recipientName = recipient.name
    // Rejected
    if (decision === Decisions.rejected) {
      await DB.updateEntireRecord(`${DB.tables.swapRequests}/${currentUser.phone}`, activeRequest, activeRequest.id)

      const notifMessage = NotificationManager.templates.swapRequestRejection(activeRequest, recipientName)
      NotificationManager.sendNotification(
        'Swap Request Decision',
        notifMessage,
        activeRequest?.ownerPhone,
        currentUser,
        ActivityCategory.swapRequest
      )
      setStatus('rejected')
      setShowDetails(false)
    }

    // Approved
    if (decision === Decisions.approved) {
      const notifMessage = NotificationManager.templates.swapRequestApproval(activeRequest, recipientName)
      await DB.updateEntireRecord(`${DB.tables.swapRequests}/${currentUser.phone}`, activeRequest, activeRequest.id)

      NotificationManager.sendNotification(
        'Swap Request Decision',
        notifMessage,
        activeRequest?.ownerPhone,
        currentUser,
        ActivityCategory.swapRequest
      )
      setStatus('approved')
      setShowDetails(false)
    }
  }

  const setCurrentRequest = async (request) => {
    const coparent = await DB_UserScoped.getCoparentByPhone(request.ownerPhone, currentUser)
    setCreatedBy(StringManager.formatNameFirstNameOnly(coparent.name))
    setShowDetails(true)
    setActiveRequest(request)
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, DB.tables.swapRequests), async (snapshot) => {
      await getSecuredRequests().then((r) => r)
    })
  }

  const addThemeToDatePickers = () => {
    setTimeout(() => {
      const datetimeParent = document.querySelector('.MuiDialog-root.MuiModal-root')
      datetimeParent.classList.add(currentUser?.settings?.theme)
    }, 100)
  }

  const setDefaults = () => {
    setReason(activeRequest?.reason)
    setRequestChildren(activeRequest?.children)
    setSwapDuration(activeRequest?.duration)
    setStartDate(activeRequest?.startDate)
    setStatus(activeRequest?.status)
  }

  const handleChildSelection = (e) => {
    const clickedEl = e.currentTarget
    const selectedValue = clickedEl.getAttribute('data-label')
    if (clickedEl.classList.contains('active')) {
      clickedEl.classList.remove('active')
      if (requestChildren.length > 0) {
        setRequestChildren(requestChildren.filter((x) => x !== selectedValue))
      }
    } else {
      clickedEl.classList.add('active')

      if (Manager.isValid(requestChildren)) {
        setRequestChildren([...requestChildren, selectedValue])
      } else {
        setRequestChildren([selectedValue])
      }
    }
  }

  const deleteRequest = async (action = 'deleted') => {
    if (action === 'deleted') {
      AlertManager.confirmAlert('Are you sure you would like to delete this request?', "I'm Sure", true, async () => {
        await DB.deleteById(`${DB.tables.swapRequests}/${currentUser.phone}`, activeRequest?.id)
        AlertManager.successAlert(`Swap Request has been deleted`)
        setShowDetails(false)
      })
    } else {
      if (activeRequest?.ownerPhone === currentUser?.phone) {
        await DB.delete(`${DB.tables.swapRequests}/${currentUser.phone}`, activeRequest?.id)
        AlertManager.successAlert(`Swap Request has been deleted.`)
      }
      setShowDetails(false)
    }
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
      <NewSwapRequest showCard={showCard} hideCard={() => setShowCard(false)} />
      {/* DETAILS CARD */}
      <BottomCard
        onDelete={deleteRequest}
        hasDelete={activeRequest?.ownerPhone === currentUser?.phone && view === 'edit'}
        hasSubmitButton={activeRequest?.ownerPhone !== currentUser?.phone}
        submitText={'Approve'}
        submitIcon={<PiCheckBold />}
        title={'Request Details'}
        onSubmit={() => selectDecision(Decisions.approved)}
        className="swap-requests"
        wrapperClass="swap-requests"
        onClose={() => {
          setShowDetails(false)
          setView('details')
          setActiveRequest(null)
        }}
        showCard={showDetails}>
        <div id="details" className={`content ${activeRequest?.reason?.length > 20 ? 'long-text' : ''}`}>
          <div className="views-wrapper">
            <p onClick={() => setView('details')} className={view === 'details' ? 'view active' : 'view'}>
              Details
            </p>
            <p onClick={() => setView('edit')} className={view === 'edit' ? 'view active' : 'view'}>
              Edit
            </p>
          </div>
          {/* DETAILS */}
          {view === 'details' && (
            <Fade direction={'up'} duration={600} triggerOnce={true}>
              {/* SWAP DATE */}
              {Manager.isValid(activeRequest?.startDate) && (
                <div className="flex flex-start" id="row">
                  <p id="title">
                    <b>Swap Date: </b>
                    {DateManager.formatDate(activeRequest?.startDate)}
                  </p>
                </div>
              )}

              {/* CREATED BY */}
              <div id="row" className="flex-start">
                <div className="flex mb-0">
                  <p id="title" className="fromHour">
                    <b>Created by: </b>
                    {createdBy}
                  </p>
                </div>
              </div>

              {/* STATUS */}
              <div className="flex flex-start" id="row">
                <p id="title">
                  <b>Status: </b>
                  {StringManager.uppercaseFirstLetterOfAllWords(activeRequest?.status)}
                </p>
              </div>

              {/* RESPOND BY */}
              {Manager.isValid(activeRequest?.responseDueDate) && (
                <div className="flex flex-start" id="row">
                  {!Manager.isValid(activeRequest?.endDate) && (
                    <p id="title">
                      <b>Respond by: </b>
                      {DateManager.formatDate(activeRequest?.responseDueDate)},&nbsp;
                      {moment(moment(activeRequest?.responseDueDate).startOf('day')).fromNow().toString()}
                    </p>
                  )}
                  {Manager.isValid(activeRequest?.endDate) && (
                    <p id="title">
                      <b>Respond by:</b>
                      {DateManager.formatDate(activeRequest?.responseDueDate)}&nbsp;to&nbsp;{DateManager.formatDate(activeRequest?.endDate)}
                      {moment(moment(activeRequest?.responseDueDate).startOf('day')).fromNow().toString()}
                    </p>
                  )}
                </div>
              )}

              {/* TIME */}
              {activeRequest?.fromHour && activeRequest?.fromHour?.length > 0 && (
                <div id="row" className="flex-start">
                  <div className="flex mb-0">
                    <p id="title" className="fromHour">
                      <b>Start time: </b>
                      {activeRequest?.fromHour}
                    </p>
                    <span id="title">&nbsp;to&nbsp;</span>
                    <p id="title" className="toHour">
                      <b>End time: </b>
                      {activeRequest?.toHour}
                    </p>
                  </div>
                </div>
              )}

              {/* SENT TO */}
              <div id="row" className="flex-start">
                {activeRequest?.ownerPhone === currentUser?.phone && (
                  <p id="title">
                    <b>Sent to: </b>
                    {StringManager.formatNameFirstNameOnly(
                      currentUser?.coparents?.filter((x) => x?.phone === activeRequest?.recipientPhone)[0]?.name
                    )}
                  </p>
                )}
              </div>

              {/* REASON */}
              {Manager.isValid(activeRequest?.reason) && (
                <div className="flex flex-start wrap no-gap" id="row">
                  <p id="title" className="w-100">
                    <b>Reason </b>
                  </p>
                  <span>{activeRequest?.reason}</span>
                </div>
              )}
              {/* CHILDREN */}
              {Manager.isValid(activeRequest?.children) && (
                <div className="flex flex-start wrap no-gap" id="row">
                  <p id="title" className="w-100">
                    <b>Children</b>
                  </p>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: `${activeRequest?.children?.join('|').replaceAll('|', '<span class="divider">|</span>')}`,
                    }}></span>
                </div>
              )}
            </Fade>
          )}

          {view === 'edit' && (
            <Fade direction={'up'} duration={600} triggerOnce={true}>
              {/* SINGLE DATE */}
              {swapDuration === SwapDurations.single && (
                <InputWrapper inputType={'date'} labelText={'Date'}>
                  <MobileDatePicker
                    defaultValue={moment(activeRequest?.startDate)}
                    onOpen={addThemeToDatePickers}
                    className={`${theme} w-100`}
                    onChange={(day) => setStartDate(moment(day).format(DateFormats.dateForDb))}
                  />
                </InputWrapper>
              )}

              {/* RESPONSE DUE DATE */}
              <InputWrapper inputType={'date'} labelText={'Respond by'}>
                <MobileDatePicker
                  onOpen={addThemeToDatePickers}
                  className={`${theme}  w-100`}
                  defaultValue={moment(activeRequest?.responseDueDate)}
                  onChange={(day) => setResponseDueDate(moment(day).format(DateFormats.dateForDb))}
                />
              </InputWrapper>

              {/* INCLUDE CHILDREN */}
              {Manager.isValid(currentUser?.children) && (
                <div className="share-with-container ">
                  <div className="flex">
                    <p>Include Child(ren)</p>
                    <Toggle
                      icons={{
                        checked: <span className="material-icons-round">face</span>,
                        unchecked: null,
                      }}
                      defaultChecked={activeRequest?.children?.length > 0}
                      className={'ml-auto reminder-toggle'}
                      onChange={(e) => setIncludeChildren(!includeChildren)}
                    />
                  </div>
                  {includeChildren ||
                    (activeRequest?.children?.length > 0 && (
                      <CheckboxGroup
                        defaultLabels={activeRequest?.children?.map((x) => x)}
                        checkboxLabels={currentUser?.children?.map((x) => x['general']?.name)}
                        onCheck={handleChildSelection}
                      />
                    ))}
                </div>
              )}

              {/* BUTTONS */}
              <div className="card-buttons">
                <>
                  <button className="button default submit center mt-15 mb-10" data-request-id={activeRequest?.id} onClick={update}>
                    Update Request
                  </button>
                  {activeRequest?.ownerPhone !== currentUser?.phone && (
                    <button
                      className="button default red center mt-5"
                      data-request-id={activeRequest?.id}
                      onClick={async (e) => {
                        AlertManager.inputAlert(
                          'Rejection Reason',
                          'Please enter a rejection reason.',
                          (e) => {
                            setRejectionReason(e.value)
                            selectDecision(Decisions.rejected)
                          },
                          true,
                          true,
                          'textarea'
                        )
                      }}>
                      Reject Request
                    </button>
                  )}
                </>
              </div>
            </Fade>
          )}
        </div>
      </BottomCard>

      {/* PAGE CONTAINER */}
      <div id="swap-requests" className={`${theme} page-container form`}>
        {existingRequests.length === 0 && <NoDataFallbackText text={'There are currently no requests'} />}
        <Fade direction={'up'} duration={1000} triggerOnce={true} className={'swap-requests-fade-wrapper'}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title">Swap Requests </p>
            {!DomManager.isMobile() && <IoAdd id={'add-new-button'} className={'swap-requests'} onClick={() => setShowCard(true)} />}
          </div>
          <p className="text-screen-intro">A request for your child(ren) to stay with you during your co-parent's scheduled visitation time.</p>

          {/* LOOP REQUESTS */}
          <div id="swap-requests-container">
            {Manager.isValid(existingRequests) &&
              existingRequests.map((request, index) => {
                return (
                  <div onClick={() => setCurrentRequest(request)} key={index} id="row" className="request w-100 mb-10 flex-start">
                    {/* REQUEST DATE */}
                    <div id="primary-icon-wrapper" className="mr-10">
                      <PiSwapDuotone id={'primary-row-icon'} />
                    </div>

                    <div id="content" className={`${request?.reason?.length > 20 ? 'long-text' : ''}`}>
                      {/* MULTIPLE */}
                      {request.duration === SwapDurations.multiple && (
                        <div className="flex">
                          <p id="title" className="row-title">
                            {moment(request.startDate).format('dddd, MMM Do')} to {moment(request.endDate).format('dddd, MMM Do')}
                          </p>
                          <span className={`${request.status} status`} id="request-status">
                            {StringManager.uppercaseFirstLetterOfAllWords(request.status)}
                          </span>
                        </div>
                      )}
                      {/* SINGLE */}
                      <div className="flex">
                        {request.duration === SwapDurations.single && moment(request.startDate).format('dddd, MMM Do') && (
                          <>
                            <p id="title" className="row-title">
                              {moment(request.startDate).format('dddd, MMM Do')}
                            </p>
                            <span className={`${request.status} status`} id="request-status">
                              {StringManager.uppercaseFirstLetterOfAllWords(request.status)}
                            </span>
                          </>
                        )}
                        {/* HOURS */}
                        {request.duration === SwapDurations.intra && (
                          <>
                            <p id="title" className="row-title">
                              {moment(request.startDate).format('dddd, MMM Do')}
                            </p>
                            <span className={`${request.status} status`} id="request-status">
                              {StringManager.uppercaseFirstLetterOfAllWords(request.status)}
                            </span>
                          </>
                        )}
                      </div>
                      {request.duration === SwapDurations.intra && (
                        <p id="subtitle">
                          {request.fromHour.replace(' ', '')} to {request.toHour.replace(' ', '')}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </Fade>
      </div>
      {!showCard && !showDetails && (
        <NavBar navbarClass={'swap-requests'}>
          <IoAdd id={'add-new-button'} onClick={() => setShowCard(true)} />
        </NavBar>
      )}
    </>
  )
}