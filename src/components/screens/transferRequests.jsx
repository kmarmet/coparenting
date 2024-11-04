import React, { useContext, useEffect, useState } from 'react'
import DB from '@db'
import Manager from '@manager'
import globalState from '../../context.js'
import 'rsuite/dist/rsuite.min.css'
import ScreenNames from '@screenNames'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import SmsManager from '@managers/smsManager.js'
import NewTransferChangeRequest from '../forms/newTransferRequest.jsx'
import NotificationManager from '@managers/notificationManager.js'
import PushAlertApi from '@api/pushAlert'
import DB_UserScoped from '@userScoped'
import DateManager from 'managers/dateManager.js'
import SecurityManager from '../../managers/securityManager'
import ReviseChildTransferChangeRequest from '../forms/reviseTransferRequest'
import NavBar from '../navBar'
import { IoAdd } from 'react-icons/io5'
import BottomCard from '../shared/bottomCard'

export default function TransferRequests() {
  const { state, setState } = useContext(globalState)
  const [existingRequests, setExistingRequests] = useState([])
  const { viewTransferRequestForm, currentUser, theme, navbarButton } = state
  const [rejectionReason, setRejectionReason] = useState('')
  const [recipients, setRecipients] = useState([])
  const [showNewRequestCard, setShowNewRequestCard] = useState(false)
  const [showRevisionCard, setShowRevisionCard] = useState(false)
  const getSecuredRequests = async () => {
    let allRequests = await SecurityManager.getTransferChangeRequests(currentUser)
    let allUsers = Manager.convertToArray(await DB.getTable(DB.tables.users))
    const found = allUsers.filter((y) => allRequests.filter((x) => x.recipientPhone === y.phone).length > 0)
    setRecipients(found)

    setExistingRequests(allRequests)
    setState({
      ...state,
      currentScreen: ScreenNames.transferRequests,
      menuIsOpen: false,
    })
  }

  const reject = async (request) => {
    await DB.delete(DB.tables.transferChangeRequests, request.id).finally(async () => {
      await DB_UserScoped.getCoparentByPhone(request.recipientName, currentUser).then(async (cop) => {
        const subId = await NotificationManager.getUserSubId(cop.phone)
        PushAlertApi.sendMessage(
          'Swap Request Decision',
          SmsManager.getTransferRequestDecisionTemplate(`${request.fromDate}`.replace(',', ' to '), 'rejected', rejectionReason, currentUser.name),
          subId
        )
      })
    })
  }

  const approve = async (request) => {
    await DB.delete(DB.tables.transferChangeRequests, request.id).finally(async () => {
      await DB_UserScoped.getCoparentByPhone(request.recipientName, currentUser).then(async (cop) => {
        const subId = await NotificationManager.getUserSubId(cop.phone)

        PushAlertApi.sendMessage(
          'Swap Request Decision',
          SmsManager.send(
            cop.phone,
            SmsManager.getTransferRequestDecisionTemplate(`${request.fromDate}`.replace(',', ' to '), 'approved', null, currentUser.name),
            subId
          )
        )
      })
    })
  }

  useEffect(() => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, DB.tables.transferChangeRequests), async (snapshot) => {
      getSecuredRequests().then((r) => r)
    })

    Manager.showPageContainer('show')
  }, [])

  return (
    <>
      <BottomCard title={'New Request'} showCard={showNewRequestCard} onClose={() => setShowNewRequestCard(false)}>
        <NewTransferChangeRequest hideCard={() => setShowNewRequestCard(false)} />
      </BottomCard>
      <BottomCard title={'Revise Request'} showCard={showRevisionCard} onClose={() => setShowRevisionCard(false)}>
        <ReviseChildTransferChangeRequest hideCard={() => setShowRevisionCard(false)} />
      </BottomCard>
      <div id="transfer-requests-container" className={`${theme} page-container form`}>
        <p className="screen-title">Transfer Change Requests</p>
        {!viewTransferRequestForm && (
          <>
            <p className="text-screen-intro">A request to change the time and/or location of the child exchange for a specific day.</p>
            {existingRequests.length > 0 && <p className="instructions mb-15">Click request to view details/take action</p>}
            {existingRequests.length === 0 && <p className="instructions center">There are currently no requests</p>}
          </>
        )}

        {!viewTransferRequestForm && (
          <div id="all-transfer-requests-container">
            {existingRequests &&
              existingRequests.length > 0 &&
              existingRequests.map((request, index) => {
                return (
                  <div key={index} data-request-id={request.id} className="request open mb-15">
                    <div className="request-date-container">
                      <span className="material-icons-outlined" id="calendar-icon">
                        calendar_month
                      </span>
                      <p id="request-date">{DateManager.formatDate(request.date)}</p>
                    </div>
                    <div className={`content ${request.reason.length > 20 ? 'long-text' : ''}`}>
                      <div className="flex top-details">
                        {/* TIME */}
                        {request?.time && request?.time.length > 0 && (
                          <p className="time label row">
                            <span className="material-icons-outlined mr-5">schedule</span>
                            {request.time}
                          </p>
                        )}

                        {/* LOCATION */}
                        {request.location && request.location.length > 0 && (
                          <div className="flex row">
                            <p>
                              <b className="label">Suggested Location&nbsp;</b>
                            </p>
                            <a
                              target="_blank"
                              href={
                                Manager.isIos() ? `http://maps.apple.com/?daddr=${encodeURIComponent(request.location)}` : request.directionsLink
                              }>
                              <span className="material-icons-round">directions</span>
                              {request.location}
                            </a>
                          </div>
                        )}

                        {/* SENT TO */}
                        <div className="flex row">
                          <p className="label">
                            <b>Request Sent to:&nbsp;</b>
                          </p>
                          <p className="ml-10 mr-10">
                            {Manager.isValid(recipients, true) &&
                              recipients.filter((x) => x.phone === request.recipientPhone)[0].name.formatNameFirstNameOnly()}
                          </p>
                        </div>
                        {/* REASON */}
                        {request?.reason && request?.reason.length > 0 && (
                          <div className="flex row">
                            <p className={`reason `}>
                              <b>Reason:&nbsp;</b>
                            </p>
                            <p className="reason-text">{request?.reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* REJECTION REASON WRAPPER */}
                    <div id="rejection-reason-wrapper">
                      <label className="mt-10">Rejection Reason</label>
                      <textarea id="rejection-reason-textarea" onChange={(e) => setRejectionReason(e.target.value)}></textarea>
                    </div>
                    <div id="button-group" className="flex">
                      <button onClick={(e) => approve(request)} className="w-100 button default approve green-text no-border">
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          setShowRevisionCard(true)
                          setState({ ...state, transferRequestToRevise: request })
                        }}
                        className="revise w-100  button default  no-border">
                        Revise
                      </button>
                      <button
                        data-request-id={request.id}
                        onClick={(e) => reject(request)}
                        className="w-100 reject button default red-text no-border">
                        Reject
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {!showNewRequestCard && !showRevisionCard && (
        <NavBar navbarClass={'transfer-requests'}>
          <IoAdd id={'add-new-button'} onClick={() => setShowNewRequestCard(true)} />
        </NavBar>
      )}
    </>
  )
}
