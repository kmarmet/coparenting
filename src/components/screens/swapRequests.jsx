import React, { useContext, useEffect, useState } from 'react'
import DB from '@db'
import Manager from '@manager'
import globalState from '../../context.js'
import 'rsuite/dist/rsuite.min.css'
import moment from 'moment'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import SwapDurations from '@constants/swapDurations.js'
import NotificationManager from '@managers/notificationManager.js'
import DB_UserScoped from '@userScoped'
import SecurityManager from '../../managers/securityManager'
import NewSwapRequest from '../forms/newSwapRequest'
import { IoAdd } from 'react-icons/io5'
import NavBar from '../navBar'
import AlertManager from '../../managers/alertManager'
import BottomCard from '../shared/bottomCard'
import { PiCalendarDotsDuotone, PiSwapDuotone, PiUserDuotone } from 'react-icons/pi'
import { MdOutlineNotes } from 'react-icons/md'
import { FaChildren } from 'react-icons/fa6'
import { BiTimeFive } from 'react-icons/bi'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from 'globalFunctions'
import DateManager from '../../managers/dateManager'
import NoDataFallbackText from '../shared/noDataFallbackText'

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
  const [showReviseCard, setShowReviseCard] = useState(false)
  const [activeRequest, setActiveRequest] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const getSecuredRequests = async () => {
    let allRequests = await SecurityManager.getSwapRequests(currentUser).then((r) => r)
    setExistingRequests(allRequests)
  }

  const selectDecision = async (decision) => {
    const ownerSubId = await NotificationManager.getUserSubId(activeRequest.ownerPhone)
    const recipient = await DB_UserScoped.getCoparentByPhone(activeRequest.recipientPhone, currentUser)
    const recipientName = recipient.name
    // Rejected
    if (decision === Decisions.rejected) {
      await DB.updateRecord(DB.tables.swapRequests, activeRequest, 'reason', rejectionReason, 'id')
      const notifMessage = NotificationManager.templates.swapRequestRejection(activeRequest, recipientName)
      NotificationManager.sendNotification('Swap Request Decision', notifMessage, ownerSubId)
      await deleteRequest('rejected')
      setShowDetails(false)
    }

    // Approved
    if (decision === Decisions.approved) {
      const notifMessage = NotificationManager.templates.swapRequestApproval(activeRequest, recipientName)
      NotificationManager.sendNotification('Swap Request Decision', notifMessage, ownerSubId)
      await DB.delete(DB.tables.swapRequests, activeRequest.id)
      setShowDetails(false)
    }
  }

  const addEventRowAnimation = () => {
    document.querySelectorAll('.request').forEach((request, i) => {
      setTimeout(() => {
        request.classList.add('active')
      }, 200 * i)
    })
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, DB.tables.swapRequests), async (snapshot) => {
      await getSecuredRequests().then((r) => r)
      setTimeout(() => {
        addEventRowAnimation()
      }, 600)
    })
  }

  const deleteRequest = async (action = 'deleted') => {
    if (action === 'deleted') {
      AlertManager.confirmAlert('Are you sure you would like to delete this request?', "I'm Sure", true, async () => {
        await DB.delete(DB.tables.swapRequests, activeRequest?.id)
        AlertManager.successAlert(`Swap Request has been deleted`)
        setShowDetails(false)
      })
    } else {
      if (formatNameFirstNameOnly(activeRequest?.createdBy) === formatNameFirstNameOnly(currentUser?.name)) {
        await DB.delete(DB.tables.swapRequests, activeRequest?.id)
        AlertManager.successAlert(`Swap Request has been deleted.`)
      } else {
        await DB.delete(DB.tables.swapRequests, activeRequest?.id)
        AlertManager.successAlert(`Swap Request has been rejected and a notification has been sent to the request recipient.`)
      }
      setShowDetails(false)
    }
  }

  useEffect(() => {
    onTableChange().then((r) => r)
    Manager.showPageContainer()
  }, [])

  return (
    <>
      <NewSwapRequest showCard={showCard} hideCard={() => setShowCard(false)} />
      {/* DETAILS CARD */}
      <BottomCard
        onDelete={deleteRequest}
        hasDelete={formatNameFirstNameOnly(activeRequest?.createdBy) === formatNameFirstNameOnly(currentUser?.name) ? true : false}
        hasSubmitButton={formatNameFirstNameOnly(activeRequest?.createdBy) === formatNameFirstNameOnly(currentUser?.name) ? false : true}
        submitText={'Approve'}
        title={'Request Details'}
        onSubmit={() => selectDecision(Decisions.approved)}
        className="swap-requests"
        onClose={() => {
          setShowDetails(false)
          setActiveRequest(null)
        }}
        showCard={showDetails}>
        <div id="details" className={`content ${activeRequest?.reason?.length > 20 ? 'long-text' : ''}`}>
          {/* DUE DATE */}
          {activeRequest?.startDate && activeRequest?.startDate?.length > 0 && (
            <div className="flex flex-start mb-15" id="row">
              <div id="primary-icon-wrapper">
                <PiCalendarDotsDuotone id="primary-row-icon" />
              </div>
              {activeRequest?.endDate.length === 0 && <p id="title">{DateManager.formatDate(activeRequest?.startDate)}</p>}
              {activeRequest?.endDate?.length > 0 && (
                <p id="title">
                  {DateManager.formatDate(activeRequest?.startDate)}&nbsp;to&nbsp;{DateManager.formatDate(activeRequest?.endDate)}
                </p>
              )}
            </div>
          )}

          {/* TIME */}
          {activeRequest?.fromHour && activeRequest?.fromHour?.length > 0 && (
            <div id="row" className="flex-start mb-15">
              <div id="primary-icon-wrapper">
                <BiTimeFive id={'primary-row-icon'} />
              </div>
              <div className="flex mb-0">
                <p id="title" className="fromHour ">
                  {activeRequest?.fromHour}
                </p>
                <span id="title">&nbsp;to&nbsp;</span>
                <p id="title" className="toHour ">
                  {activeRequest?.toHour}
                </p>
              </div>
            </div>
          )}

          {/* SENT TO */}
          <div id="row" className="flex-start mb-15">
            <div id="primary-icon-wrapper">
              <PiUserDuotone id="primary-row-icon" />
            </div>
            {formatNameFirstNameOnly(activeRequest?.createdBy) !== formatNameFirstNameOnly(currentUser?.name) && (
              <p id="title">From {formatNameFirstNameOnly(activeRequest.createdBy)}</p>
            )}
            {formatNameFirstNameOnly(activeRequest?.createdBy) === formatNameFirstNameOnly(currentUser?.name) && (
              <p id="title">
                Request Sent to {formatNameFirstNameOnly(currentUser?.coparents?.filter((x) => x?.phone === activeRequest?.recipientPhone)[0]?.name)}
              </p>
            )}
          </div>

          {/* REASON */}
          {activeRequest?.reason && activeRequest?.reason.length > 0 && (
            <div className="flex mb-20 flex-start" id="row">
              <div id="primary-icon-wrapper">
                <MdOutlineNotes id={'primary-row-icon'} />
              </div>
              <div className="flex flex-start two-column mb-0">
                <p id="title" className="w-100">
                  Reason
                </p>
                <p className="reason-text">{activeRequest?.reason}</p>
              </div>
            </div>
          )}

          {/* CHILDREN */}
          <div id="children">
            {activeRequest?.children && activeRequest?.children.length > 0 && (
              <div className="mb-20 flex flex-start" id="row">
                <div id="primary-icon-wrapper">
                  <FaChildren id={'primary-row-icon'} />
                </div>
                <p
                  id="title"
                  dangerouslySetInnerHTML={{
                    __html: `${activeRequest?.children.join('|').replaceAll('|', '<span class="divider">|</span>')}`,
                  }}></p>
              </div>
            )}
          </div>
          {/* BUTTONS */}
          <div className="action-buttons">
            {formatNameFirstNameOnly(activeRequest?.createdBy) !== formatNameFirstNameOnly(currentUser?.name) && (
              <button
                className="red"
                data-request-id={activeRequest?.id}
                onClick={async (e) => {
                  AlertManager.inputAlert('Rejection Reason', 'Please enter a rejection reason.', () => {
                    selectDecision(Decisions.rejected)
                  })
                }}>
                Reject
              </button>
            )}
          </div>
        </div>
      </BottomCard>

      {/* PAGE CONTAINER */}
      <div id="swap-requests" className={`${theme} page-container form`}>
        <p className="screen-title">Swap Requests</p>
        <>
          <p className="text-screen-intro mb-15">A request for your child(ren) to stay with you during your co-parent's scheduled visitation time.</p>
          {existingRequests.length === 0 && <NoDataFallbackText text={'There are currently no requests'} />}
        </>

        {/* LOOP REQUESTS */}
        <div id="swap-requests-container">
          {Manager.isValid(existingRequests) &&
            existingRequests.map((request, index) => {
              return (
                <div
                  onClick={() => {
                    setShowDetails(true)
                    setActiveRequest(request)
                  }}
                  key={index}
                  id="row"
                  className="request w-100 mb-10 flex-start">
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
                          {uppercaseFirstLetterOfAllWords(request.status)}
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
                            {uppercaseFirstLetterOfAllWords(request.status)}
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
                            {uppercaseFirstLetterOfAllWords(request.status)}
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
      </div>
      {!showCard && !showDetails && (
        <NavBar navbarClass={'swap-requests'}>
          <IoAdd id={'add-new-button'} onClick={() => setShowCard(true)} />
        </NavBar>
      )}
    </>
  )
}