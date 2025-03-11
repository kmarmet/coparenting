// Path: src\components\screens\swapRequests.jsx
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context.js'
import DB from '/src/database/DB'
import Manager from '/src/managers/manager'
import moment from 'moment'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import SwapDurations from '/src/constants/swapDurations.js'
import NotificationManager from '/src/managers/notificationManager'
import SecurityManager from '/src/managers/securityManager'
import NewSwapRequest from '../forms/newSwapRequest'
import NavBar from '../navBar'
import { IoHourglassOutline } from 'react-icons/io5'
import AlertManager from '/src/managers/alertManager'
import BottomCard from '/src/components/shared/bottomCard'
import { PiCheckBold, PiSwapDuotone } from 'react-icons/pi'
import { MdOutlineFaceUnlock } from 'react-icons/md'
import { IoAdd } from 'react-icons/io5'
import { CgDetailsMore } from 'react-icons/cg'
import { Fade } from 'react-awesome-reveal'
import { MobileDatePicker } from '@mui/x-date-pickers-pro'
import Toggle from 'react-toggle'
import DateManager from '/src/managers/dateManager'
import NoDataFallbackText from '/src/components/shared/noDataFallbackText'
import DomManager from '/src/managers/domManager'
import InputWrapper from '/src/components/shared/inputWrapper'
import DateFormats from '/src/constants/dateFormats'
import CheckboxGroup from '/src/components/shared/checkboxGroup'
import ObjectManager from '/src/managers/objectManager'
import ModelNames from '/src/models/modelNames'
import ActivityCategory from '/src/models/activityCategory'
import StringManager from '/src/managers/stringManager'
import { PiUserCircleDuotone } from 'react-icons/pi'
import { FaChildren } from 'react-icons/fa6'
import { TbCalendarCheck } from 'react-icons/tb'
import ViewSelector from '../shared/viewSelector'
import StringAsHtmlElement from '../shared/stringAsHtmlElement'
import DB_UserScoped from '../../database/db_userScoped.js'
import Spacer from '../shared/spacer'

const Decisions = {
  approved: 'APPROVED',
  rejected: 'REJECTED',
  delete: 'DELETE',
}

export default function SwapRequests() {
  const { state, setState } = useContext(globalState)
  const [existingRequests, setExistingRequests] = useState([])
  const { currentUser, theme, authUser } = state
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

  const resetForm = async () => {
    Manager.resetForm('swap-request-wrapper')
    setRequestChildren([])
    setSwapDuration('single')
    setIncludeChildren(false)
    setStartDate('')
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(authUser?.email)
    setState({ ...state, currentUser: updatedCurrentUser, refreshKey: Manager.getUid() })
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
    await DB.updateEntireRecord(`${DB.tables.swapRequests}/${currentUser?.key}`, cleanedRequest, cleanedRequest.id)
    await getSecuredRequests()
    setActiveRequest(updatedRequest)
    setShowDetails(false)
    AlertManager.successAlert('Swap Request Updated')
    await resetForm()
  }

  const getSecuredRequests = async () => {
    let allRequests = await SecurityManager.getSwapRequests(currentUser)
    setExistingRequests(allRequests)
  }

  const selectDecision = async (decision) => {
    const recipient = await DB_UserScoped.getCoparentByKey(activeRequest.recipientKey, currentUser)
    const recipientName = recipient.name
    // Rejected
    if (decision === Decisions.rejected) {
      activeRequest.status = 'rejected'
      await DB.updateEntireRecord(`${DB.tables.swapRequests}/${activeRequest.ownerKey}`, activeRequest, activeRequest.id)

      const notifMessage = NotificationManager.templates.swapRequestRejection(activeRequest, recipientName)
      NotificationManager.sendNotification('Swap Request Decision', notifMessage, activeRequest?.ownerKey, currentUser, ActivityCategory.swapRequest)
      setShowDetails(false)
    }
    // Approved
    if (decision === Decisions.approved) {
      const notifMessage = NotificationManager.templates.swapRequestApproval(activeRequest, recipientName)
      activeRequest.status = 'approved'
      await DB.updateEntireRecord(`${DB.tables.swapRequests}/${activeRequest.ownerKey}`, activeRequest, activeRequest.id)

      NotificationManager.sendNotification('Swap Request Decision', notifMessage, activeRequest?.ownerKey, currentUser, ActivityCategory.swapRequest)
      setShowDetails(false)
    }
  }

  const setCurrentRequest = async (request) => {
    const coparent = await DB_UserScoped.getCoparentByKey(request?.ownerKey, currentUser)
    setCreatedBy(StringManager.getFirstNameOnly(coparent.name))
    setShowDetails(true)
    setActiveRequest(request)
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, `${DB.tables.swapRequests}/${currentUser?.key}`), async () => {
      await getSecuredRequests()
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
        await DB.deleteById(`${DB.tables.swapRequests}/${currentUser?.key}`, activeRequest?.id)
        AlertManager.successAlert(`Swap Request has been deleted`)
        setShowDetails(false)
      })
    } else {
      if (activeRequest?.ownerKey === currentUser?.key) {
        await DB.delete(`${DB.tables.swapRequests}/${currentUser?.key}`, activeRequest?.id)
        AlertManager.successAlert(`Swap Request has been deleted`)
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
        hasDelete={activeRequest?.ownerKey === currentUser?.key && view === 'edit'}
        hasSubmitButton={activeRequest?.ownerKey !== currentUser?.key}
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
        <ViewSelector labels={['Details', 'Edit']} visibleLabels={['Details']} updateState={(e) => setView(e.toLowerCase())} />
        {/* DETAILS */}
        {view === 'details' && (
          <Fade direction={'up'} duration={600} triggerOnce={true}>
            <div id="details" className={`content`}>
              {/* SWAP DATE */}
              {Manager.isValid(activeRequest?.startDate) && (
                <div className="flex">
                  <b>
                    <TbCalendarCheck />
                    Swap Date(s)
                  </b>
                  <span>
                    {moment(activeRequest?.startDate).format(DateFormats.readableMonthAndDay)}
                    <>{Manager.isValid(activeRequest?.endDate) && ` to ${moment(activeRequest?.endDate).format(DateFormats.readableMonthAndDay)}`}</>
                  </span>
                </div>
              )}

              {/* CREATED BY */}
              <div className="flex">
                <b>
                  <PiUserCircleDuotone />
                  Created by
                </b>
                <span>{createdBy}</span>
              </div>

              {/* RESPOND BY */}
              {Manager.isValid(activeRequest?.responseDueDate) && (
                <>
                  {!Manager.isValid(activeRequest?.endDate) && (
                    <div className="flex">
                      <b>
                        <IoHourglassOutline />
                        Respond by
                      </b>
                      <span>
                        {DateManager.formatDate(activeRequest?.responseDueDate)},&nbsp;
                        {moment(moment(activeRequest?.responseDueDate).startOf('day')).fromNow().toString()}
                      </span>
                    </div>
                  )}
                  {Manager.isValid(activeRequest?.endDate) && (
                    <div className="flex">
                      <b>
                        <IoHourglassOutline />
                        Respond by
                      </b>
                      <span>
                        {DateManager.formatDate(activeRequest?.responseDueDate)}&nbsp;to&nbsp;{DateManager.formatDate(activeRequest?.endDate)}&nbsp;,
                        {moment(moment(activeRequest?.responseDueDate).startOf('day')).fromNow().toString()}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* TIME */}
              {activeRequest?.fromHour && activeRequest?.fromHour?.length > 0 && (
                <div className="flex">
                  <b>Start time </b>
                  <span>{activeRequest?.fromHour}</span>
                  <span>&nbsp;to&nbsp;</span>
                  <b>End time </b>
                  <span>{activeRequest?.toHour}</span>
                </div>
              )}

              {/* SENT TO */}
              {activeRequest?.ownerKey === currentUser?.key && (
                <div className="flex">
                  <>
                    <b>
                      <PiUserCircleDuotone />
                      Sent to
                    </b>
                    <span>
                      {StringManager.getFirstNameOnly(currentUser?.coparents?.filter((x) => x?.key === activeRequest?.recipientKey)[0]?.name)}
                    </span>
                  </>
                </div>
              )}

              {/* CHILDREN */}
              {Manager.isValid(activeRequest?.children) && (
                <div className="flex children">
                  <b>
                    <FaChildren />
                    Children
                  </b>
                  <div id="children">
                    {Manager.isValid(activeRequest?.children) &&
                      activeRequest?.children.map((child, index) => {
                        return <span key={index}>{child}</span>
                      })}
                  </div>
                </div>
              )}
              {/* REASON */}
              {Manager.isValid(activeRequest?.reason) && (
                <div className={`flex ${StringManager.addLongTextClass(activeRequest?.reason)}`}>
                  <b>
                    <CgDetailsMore />
                    Reason
                  </b>
                  <StringAsHtmlElement text={activeRequest?.reason} />
                </div>
              )}
            </div>
          </Fade>
        )}

        {/* EDIT */}
        {view === 'edit' && (
          <Fade direction={'up'} duration={600} triggerOnce={true}>
            {/* SINGLE DATE */}
            {!DomManager.isMobile() && swapDuration === SwapDurations.single && (
              <InputWrapper inputType={'date'} labelText={'Date'}>
                <MobileDatePicker
                  defaultValue={moment(activeRequest?.startDate)}
                  onOpen={addThemeToDatePickers}
                  className={`${theme} w-100`}
                  onChange={(day) => setStartDate(moment(day).format(DateFormats.dateForDb))}
                />
              </InputWrapper>
            )}
            {swapDuration === SwapDurations.single && DomManager.isMobile() && (
              <InputWrapper
                inputType={'date'}
                labelText={'Date'}
                useNativeDate={true}
                defaultValue={moment(activeRequest?.startDate)}
                onChange={(day) => setStartDate(moment(day.target.value).format(DateFormats.dateForDb))}
              />
            )}

            {/* RESPONSE DUE DATE */}
            {!DomManager.isMobile() && (
              <InputWrapper inputType={'date'} labelText={'Respond by'}>
                <MobileDatePicker
                  onOpen={addThemeToDatePickers}
                  className={`${theme}  w-100`}
                  defaultValue={moment(activeRequest?.responseDueDate)}
                  onChange={(day) => setResponseDueDate(moment(day).format(DateFormats.dateForDb))}
                />
              </InputWrapper>
            )}
            {DomManager.isMobile() && (
              <InputWrapper
                inputType={'date'}
                labelText={'Respond by'}
                useNativeDate={true}
                defaultValue={moment(activeRequest?.responseDueDate)}
                onChange={(day) => setResponseDueDate(moment(day.target.value).format(DateFormats.dateForDb))}
              />
            )}

            <Spacer height={5} />
            {/* INCLUDE CHILDREN */}
            {Manager.isValid(currentUser?.children) && (
              <div className="share-with-container">
                <div className="flex">
                  <p>Include Child(ren)</p>
                  <Toggle
                    icons={{
                      checked: <MdOutlineFaceUnlock />,
                      unchecked: null,
                    }}
                    defaultChecked={activeRequest?.children?.length > 0}
                    className={'ml-auto reminder-toggle'}
                    onChange={() => setIncludeChildren(!includeChildren)}
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

            {/* BUTTONS */}
            <div className="card-buttons">
              <>
                <button className="button default submit center mt-15 mb-10" data-request-id={activeRequest?.id} onClick={update}>
                  Update Request
                </button>
                {activeRequest?.ownerKey !== currentUser?.key && (
                  <button
                    className="button default red center mt-5"
                    data-request-id={activeRequest?.id}
                    onClick={async () => {
                      AlertManager.inputAlert(
                        'Rejection Reason',
                        'Please enter a rejection reason.',
                        () => {
                          // setRejectionReason(e.value)
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
      </BottomCard>

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
            {Manager.isValid(existingRequests) &&
              existingRequests.map((request, index) => {
                return (
                  <div onClick={() => setCurrentRequest(request)} key={index} className="row">
                    {/* REQUEST DATE */}
                    <div id="primary-icon-wrapper" className="mr-10">
                      <PiSwapDuotone id={'primary-row-icon'} />
                    </div>

                    <div id="content" className={`${request?.reason?.length > 20 ? 'long-text' : ''}`}>
                      {/* MULTIPLE */}
                      {request?.duration === SwapDurations.multiple && (
                        <div className="flex">
                          <p id="title">
                            {moment(request?.startDate).format('dddd, MMM Do')} to {moment(request?.endDate).format('dddd, MMM Do')}
                          </p>
                          <span className={`${request?.status} status`} id="request-status">
                            {StringManager.uppercaseFirstLetterOfAllWords(request?.status)}
                          </span>
                        </div>
                      )}
                      {/* SINGLE */}
                      <div className="flex">
                        {request?.duration === SwapDurations.single && moment(request?.startDate).format('dddd, MMM Do') && (
                          <>
                            <p id="title" className="row-title">
                              {moment(request?.startDate).format('dddd, MMM Do')}
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
                              {moment(request?.startDate).format('dddd, MMM Do')}
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