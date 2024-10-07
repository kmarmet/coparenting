import React, { useState, useEffect, useContext } from 'react'
import DB from '@db'
import Modal from '@shared/modal.jsx'
import Manager from '@manager'
import globalState from '../../context.js'
import 'rsuite/dist/rsuite.min.css'
import moment from 'moment'
import ScreenNames from '@screenNames'
import { getDatabase, ref, set, get, child, onValue } from 'firebase/database'
import SwapDurations from '@constants/swapDurations.js'
import SmsManager from '@managers/smsManager.js'
import AddNewButton from '@shared/addNewButton.jsx'
import PushAlertApi from '@api/pushAlert'
import NotificationManager from '@managers/notificationManager.js'
import DB_UserScoped from '@userScoped'
import DateManager from 'managers/dateManager.js'

const Decisions = {
  approved: 'APPROVED',
  rejected: 'REJECTED',
  delete: 'DELETE',
}

export default function SwapRequests() {
  const { state, setState } = useContext(globalState)
  const [existingRequests, setExistingRequests] = useState([])
  const { viewSwapRequestForm, currentUser } = state
  const [rejectionReason, setRejectionReason] = useState('')

  const updateRequestsFromDb = async (requestsFromDb) => {
    let allRequests = await DB.getFilteredRecords(requestsFromDb, currentUser).then((x) => x)

    setExistingRequests(allRequests)
    setState({
      ...state,
      currentScreen: ScreenNames.swapRequests,
      menuIsOpen: false,
    })
  }

  const selectDecision = async (request, decision) => {
    const subId = await NotificationManager.getUserSubId(request.recipientPhone)

    // Delete
    if (decision === Decisions.delete) {
      await DB.delete(DB.tables.swapRequests, request.id)
    }

    // Rejected
    if (decision === Decisions.rejected) {
      await DB.updateRecord(DB.tables.swapRequests, request, 'rejectionReason', rejectionReason, 'id')
      const notifMessage = PushAlertApi.templates.swapRequestDecision(request, decision)
      PushAlertApi.sendMessage('Swap Request Decision', notifMessage, subId)

      // Clear rejection reason textarea
      document.getElementById('rejection-reason-input').value = ''
    }

    // Approved
    if (decision === Decisions.approved) {
      const notifMessage = PushAlertApi.templates.swapRequestDecision(request, decision)
      PushAlertApi.sendMessage('Swap Request Decision', notifMessage, subId)
      await DB.delete(DB.tables.swapRequests, request.id)
    }
  }

  const sendReminder = async (request) => {
    setState({ ...state, showAlert: true, alertType: 'success', alertMessage: 'Reminder Sent!' })

    await DB_UserScoped.getCoparent(request.recipientPhone, currentUser).then(async (coparent) => {
      const subId = await PushAlertApi.getSubId(coparent.phone)
      PushAlertApi.sendMessage(`Pending Swap Decision`, ` ${moment(request.fromDate).format('dddd, MMMM Do')}`, subId)
    })
  }

  useEffect(() => {
    const dbRef = ref(getDatabase())

    onValue(child(dbRef, DB.tables.swapRequests), async (snapshot) => {
      const tableData = snapshot.val()
      updateRequestsFromDb(await DB.getFilteredRecords(tableData, currentUser).then((x) => x))
    })
    setTimeout(() => {
      setState({
        ...state,
        currentScreen: ScreenNames.swapRequests,
        menuIsOpen: false,
        showBackButton: false,
        showMenuButton: true,
      })
    }, 500)
    Manager.toggleForModalOrNewForm('show')
  }, [])

  return (
    <>
      <p className="screen-title ">Swap Requests</p>
      <AddNewButton onClick={() => setState({ ...state, currentScreen: ScreenNames.newSwapRequest, showMenuButton: false })} />
      <div id="swap-requests" className={`${currentUser?.settings?.theme} page-container`}>
        <>
          <p className="text-screen-intro mb-15">
            A Swap Request is a request for your child(ren) to stay with you during your coparent's scheduled time to have them.
          </p>
          {existingRequests.length === 0 && <p className="instructions center">There are currently no requests</p>}
        </>

        <div id="swap-requests-container">
          {existingRequests &&
            existingRequests.length > 0 &&
            existingRequests.map((request, index) => {
              return (
                <div key={index} className="request w-100 mb-15">
                  <div className="request-date-container">
                    <span className="material-icons-round" id="calendar-icon">
                      calendar_month
                    </span>
                    {/* REQUEST DATE */}
                    <p id="request-date">
                      {request.duration === SwapDurations.single && DateManager.formatDate(request.fromDate)}
                      {request.duration === SwapDurations.intra && (
                        <>
                          <span>{DateManager.formatDate(request.fromDate)}</span>
                          <span>
                            {request.fromHour.replace(' ', '')} - {request.toHour.replace(' ', '')}
                          </span>
                        </>
                      )}
                      {request.duration === SwapDurations.multiple &&
                        `${DateManager.formatDate(request.fromDate)} - ${DateManager.formatDate(request.toDate)}`}
                    </p>
                  </div>
                  <div className={`content ${request?.reason.length > 20 ? 'long-text' : ''}`}>
                    <div className="flex top-details">
                      {/* SENT TO */}
                      <div className="flex row">
                        <p>
                          <b>Request Sent to:&nbsp;</b>
                        </p>
                        <p>{currentUser.coparents.filter((x) => (x.phone = request.recipientPhone))[0].name}</p>
                      </div>

                      {/* REASON */}
                      {request?.reason && request?.reason.length > 0 && (
                        <div className="flex row">
                          <p className={`reason`}>
                            <b>Reason:&nbsp;</b>
                          </p>
                          <p className={request?.reason.length > 50 ? 'wrap reason-text' : 'reason-text'}>{request?.reason}</p>
                        </div>
                      )}

                      {/* REASON BUTTON */}
                      {request.phone === currentUser.phone && (
                        <button id="reminder-button" className="button default reminder w-50" onClick={() => sendReminder(request)}>
                          Send Reminder <span className="material-icons-round">notification_important</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {request?.recipientPhone === currentUser.phone && (
                    <>
                      <textarea
                        id="rejection-reason-input"
                        placeholder="Rejection reason (if needed)"
                        onChange={(e) => setRejectionReason(e.target.value)}></textarea>
                      <div id="button-group" className="flex">
                        <div className="flex approve green">
                          <button
                            onClick={(e) => selectDecision(request, Decisions.approved)}
                            className="approve button default no-border green-text">
                            Approve
                          </button>
                        </div>
                        <div className="flex reject">
                          <button
                            data-request-id={request.id}
                            onClick={(e) => selectDecision(request, Decisions.rejected)}
                            className="reject no-border button default  red-text">
                            Reject
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  {request.recipientPhone !== currentUser.phone && (
                    <button
                      data-request-id={request.id}
                      onClick={(e) => selectDecision(request, Decisions.delete)}
                      className="button default delete red no-border no-border-radius w-100">
                      Delete
                    </button>
                  )}
                </div>
              )
            })}
        </div>
      </div>
    </>
  )
}
