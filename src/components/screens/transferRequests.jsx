import React, { useContext, useEffect, useState } from 'react'
import DB from '@db'
import Manager from '@manager'
import globalState from '../../context.js'
import 'rsuite/dist/rsuite.min.css'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import NewTransferChangeRequest from '../forms/newTransferRequest.jsx'
import NotificationManager from '@managers/notificationManager.js'
import PushAlertApi from '@api/pushAlert'
import DB_UserScoped from '@userScoped'
import DateManager from 'managers/dateManager.js'
import ReviseChildTransferChangeRequest from '../forms/reviseTransferRequest'
import NavBar from '../navBar'
import { IoAdd } from 'react-icons/io5'
import SecurityManager from '../../managers/securityManager'
import { BiNavigation } from 'react-icons/bi'
import { PiCarProfileDuotone, PiUserDuotone } from 'react-icons/pi'
import {
  contains,
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
import AlertManager from '../../managers/alertManager'
import { MdOutlineNotes } from 'react-icons/md'
import BottomCard from '../shared/bottomCard'

const Decisions = {
  approved: 'APPROVED',
  rejected: 'REJECTED',
  delete: 'DELETE',
}

export default function TransferRequests() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, navbarButton } = state
  const [existingRequests, setExistingRequests] = useState([])
  const [rejectionReason, setRejectionReason] = useState('')
  const [recipients, setRecipients] = useState([])
  const [showNewRequestCard, setShowNewRequestCard] = useState(false)
  const [showRevisionCard, setShowRevisionCard] = useState(false)
  const [requestToRevise, setRequestToRevise] = useState(null)
  const [activeRequest, setActiveRequest] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  const getSecuredRequests = async () => {
    let allRequests = await SecurityManager.getTransferChangeRequests(currentUser)
    let allUsers = Manager.convertToArray(await DB.getTable(DB.tables.users))
    const found = allUsers.filter((y) => allRequests.filter((x) => x.recipientPhone === y.phone).length > 0)
    setRecipients(found)
    setExistingRequests(allRequests)
  }

  const deleteRequest = async (action = 'deleted') => {
    if (action === 'deleted') {
      AlertManager.confirmAlert('Are you sure you would like to delete this request?', "I'm Sure", true, async () => {
        await DB.delete(DB.tables.transferChangeRequests, activeRequest?.id)
        AlertManager.successAlert(`Swap Request has been deleted.`)
        setShowDetails(false)
      })
    } else {
      await DB.delete(DB.tables.transferChangeRequests, activeRequest?.id)
      AlertManager.successAlert(`Swap Request has been rejected and a notification has been sent to the request recipient.`)
      setShowDetails(false)
    }
  }

  const selectDecision = async (decision) => {
    const ownerSubId = await NotificationManager.getUserSubId(activeRequest.ownerPhone)
    const recipient = await DB_UserScoped.getCoparentByPhone(activeRequest.recipientPhone, currentUser)
    const recipientName = recipient.name
    // Rejected
    if (decision === Decisions.rejected) {
      await DB.updateRecord(DB.tables.transferChangeRequests, activeRequest, 'reason', rejectionReason, 'id')
      const notifMessage = PushAlertApi.templates.transferRequestRejection(activeRequest, recipientName)
      PushAlertApi.sendMessage('Transfer Change Request Decision', notifMessage, ownerSubId)
      await deleteRequest('rejected')
      setShowDetails(false)
    }

    // Approved
    if (decision === Decisions.approved) {
      const notifMessage = PushAlertApi.templates.transferRequestApproval(activeRequest, recipientName)
      PushAlertApi.sendMessage('Transfer Change Request Decision', notifMessage, ownerSubId)
      await DB.delete(DB.tables.transferChangeRequests, activeRequest.id)
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
    onValue(child(dbRef, DB.tables.transferChangeRequests), async (snapshot) => {
      await getSecuredRequests().then((r) => r)
      setTimeout(() => {
        addEventRowAnimation()
      }, 600)
    })
  }

  useEffect(() => {
    onTableChange().then((r) => r)
    Manager.showPageContainer()
  })

  return (
    <>
      <NewTransferChangeRequest showCard={showNewRequestCard} hideCard={() => setShowNewRequestCard(false)} />
      <ReviseChildTransferChangeRequest revisionRequest={requestToRevise} showCard={showRevisionCard} hideCard={() => setShowRevisionCard(false)} />

      {/* DETAILS CARD */}
      <BottomCard
        submitText={'Approve'}
        title={'Request Details'}
        onSubmit={() => selectDecision(Decisions.approved)}
        className="transfer-change"
        onClose={() => setShowDetails(false)}
        showCard={showDetails}>
        <div id="details" className={`content ${activeRequest?.reason.length > 20 ? 'long-text' : ''}`}>
          <div id="row" className="flex-start mb-20">
            <div id="primary-icon-wrapper">
              <PiUserDuotone id="primary-row-icon" />
            </div>
            {/* SENT TO */}
            {activeRequest?.recipientPhone === currentUser.phone && <p id="title">From {formatNameFirstNameOnly(activeRequest?.createdBy)}</p>}
            {activeRequest?.recipientPhone !== currentUser.phone && (
              <p id="title">
                Request Sent to {formatNameFirstNameOnly(currentUser?.coparents?.filter((x) => x?.phone === activeRequest?.recipientPhone)[0]?.name)}
              </p>
            )}
          </div>
          {/* TIME */}
          {activeRequest?.time && activeRequest?.time.length > 0 && (
            <p className="time label info-row">
              <span className="material-icons-outlined mr-5">schedule</span>
              {activeRequest?.time}
            </p>
          )}

          {/* LOCATION */}
          {activeRequest?.location && activeRequest?.location.length > 0 && (
            <div className="flex mb-20 flex-start" id="row">
              <div id="primary-icon-wrapper">
                <BiNavigation id={'primary-row-icon'} />
              </div>
              <div className="two-column">
                <p id="title" className="mr-auto">
                  Location
                </p>
                <a
                  target="_blank"
                  href={
                    Manager.isIos() ? `http://maps.apple.com/?daddr=${encodeURIComponent(activeRequest?.location)}` : activeRequest?.directionsLink
                  }>
                  {activeRequest?.location}
                </a>
              </div>
            </div>
          )}

          {/* REASON */}
          {activeRequest?.reason && activeRequest?.reason.length > 0 && (
            <div className="flex mb-20" id="row">
              <div id="primary-icon-wrapper">
                <MdOutlineNotes id={'primary-row-icon'} />
              </div>
              <div className="two-column">
                <p id="title" className="mr-auto">
                  Reason
                </p>
                <p className="reason-text">{activeRequest?.reason}</p>
              </div>
            </div>
          )}
          {/* BUTTONS */}
          <div className="action-buttons">
            <button
              className="red"
              data-request-id={activeRequest?.id}
              onClick={async (e) => {
                AlertManager.inputAlert(
                  'Rejection Reason',
                  'Please enter a rejection reason',
                  async () => {
                    await selectDecision(Decisions.rejected)
                  },
                  true,
                  true,
                  'textarea'
                )
              }}>
              Reject
            </button>
          </div>
        </div>
      </BottomCard>

      <div id="transfer-requests-container" className={`${theme} page-container form`}>
        <p className="screen-title">Transfer Change Requests</p>
        <p className="text-screen-intro">A request to change the time and/or location of the child exchange for a specific day.</p>
        {existingRequests.length === 0 && (
          <div id="instructions-wrapper">
            <p className="instructions center">There are currently no requests</p>
          </div>
        )}

        {existingRequests.length > 0 && <p id="page-title">All Requests</p>}

        {/* LOOP REQUESTS */}
        {!showNewRequestCard && (
          <div id="all-transfer-requests-container" className="mt-15">
            {Manager.isValid(existingRequests, true) &&
              existingRequests.map((request, index) => {
                return (
                  <div
                    key={index}
                    className="flex"
                    id="row"
                    onClick={() => {
                      setActiveRequest(request)
                      setTimeout(() => {
                        setShowDetails(true)
                      }, 300)
                    }}>
                    <div id="primary-icon-wrapper">
                      <PiCarProfileDuotone id={'primary-row-icon'} />
                    </div>
                    <div data-request-id={request.id} className="request " id="content">
                      {/* DATE */}
                      <p id="title" className="flex date row-title">
                        {DateManager.formatDate(request.date)}
                        <span className={`${request.status} status`} id="request-status">
                          {uppercaseFirstLetterOfAllWords(request.status)}
                        </span>
                      </p>
                      {request?.recipientPhone === currentUser.phone && <p id="subtitle">From {formatNameFirstNameOnly(request?.createdBy)}</p>}
                      {request?.recipientPhone !== currentUser.phone && (
                        <p id="subtitle">
                          Request Sent to{' '}
                          {formatNameFirstNameOnly(currentUser?.coparents?.filter((x) => x?.phone === request?.recipientPhone)[0]?.name)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {!showNewRequestCard && !showRevisionCard && !showDetails && (
        <NavBar navbarClass={'transfer-requests'}>
          <IoAdd id={'add-new-button'} onClick={() => setShowNewRequestCard(true)} />
        </NavBar>
      )}
    </>
  )
}