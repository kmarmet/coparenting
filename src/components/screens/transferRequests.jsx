import React, { useState, useEffect, useContext } from 'react'
import DB from '@db'
import Modal from '@shared/modal.jsx'
import Manager from '@manager'
import globalState from '../../context.js'
import 'rsuite/dist/rsuite.min.css'
import moment from 'moment'
import ScreenNames from '@screenNames'
import { getDatabase, ref, set, get, child, onValue } from 'firebase/database'
import SmsManager from '@managers/smsManager.js'
import NewChildTransferChangeRequest from '../forms/newChildTransferChange.jsx'
import AddNewButton from '@shared/addNewButton.jsx'
import NotificationManager from '@managers/notificationManager.js'
import PushAlertApi from '@api/pushAlert'
import DB_UserScoped from '@userScoped'
import DateManager from 'managers/dateManager.js'

export default function TransferRequests() {
  const { state, setState } = useContext(globalState)
  const [existingRequests, setExistingRequests] = useState([])
  const { viewTransferRequestForm, currentUser } = state
  const [rejectionReason, setRejectionReason] = useState('')
  const [recipients, setRecipients] = useState([])

  const updateRequestsFromDb = async (requestsFromDb) => {
    let allRequests = await DB.getFilteredRecords(requestsFromDb, currentUser).then((x) => x)
    let allUsers = await DB.getTable(DB.tables.users)
    allUsers = DB.convertKeyObjectToArray(allUsers)
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
    await DB.delete(DB.tables.transferChange, request.id).finally(async () => {
      await DB_UserScoped.getCoparent(request.recipientName, currentUser).then(async (cop) => {
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
    await DB.delete(DB.tables.transferChange, request.id).finally(async () => {
      await DB_UserScoped.getCoparent(request.recipientName, currentUser).then(async (cop) => {
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

    onValue(child(dbRef, DB.tables.transferChange), async (snapshot) => {
      const tableData = snapshot.val()
      updateRequestsFromDb(await DB.getFilteredRecords(tableData, currentUser).then((x) => x))
    })

    setTimeout(() => {
      setState({
        ...state,
        currentScreen: ScreenNames.transferRequests,
        menuIsOpen: false,
        showBackButton: false,
        showMenuButton: true,
      })
    }, 500)

    Manager.toggleForModalOrNewForm('show')
  }, [])

  return (
    <>
      <p className="screen-title ">Child Transfer Change</p>
      <AddNewButton canClose={true} onClick={() => setState({ ...state, currentScreen: ScreenNames.newTransferRequest })} />
      <div id="transfer-requests-container" className="page-container">
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
                      <span className="material-icons-outlined">calendar_month</span>
                      <p className="request-date">{DateManager.formatDate(request.date)}</p>
                    </div>
                    <div className={`content ${request.reason.length > 20 ? 'long-text' : ''}`}>
                      <div className="flex top-details">
                        {request.location && request.location.length > 0 && (
                          <p className="label">
                            <b>Suggested Time&nbsp;</b>
                          </p>
                        )}
                        {request.time && request.time.length > 0 && (
                          <p className="time label">
                            <span className="material-icons-outlined mr-5">schedule</span>
                            {request.time}
                          </p>
                        )}
                        {request.location && request.location.length > 0 && (
                          <p>
                            <b className="label">Suggested Location&nbsp;</b>
                          </p>
                        )}
                        {request.location && request.location.length > 0 && (
                          <a href={Manager.isIos() ? `http://maps.apple.com/?daddr=${encodeURIComponent(request.location)}` : request.directionsLink}>
                            <span className="material-icons-round">directions</span>
                            {request.location}
                          </a>
                        )}
                        <p className="label">
                          <b>Request Sent to&nbsp;</b>
                        </p>
                        <p>
                          {Manager.isValid(recipients, true) &&
                            recipients.filter((x) => x.phone === request.recipientPhone)[0].name.formatNameFirstNameOnly()}
                        </p>
                        {request.reason && request.reason.length > 0 && (
                          <p className={`reason label`}>
                            <b>Reason</b>
                          </p>
                        )}
                        <p className="reason-text">{request.reason}</p>
                      </div>
                    </div>
                    <textarea placeholder="Rejection reason" onChange={(e) => setRejectionReason(e.target.value)}></textarea>
                    <>
                      <div id="button-group" className="flex">
                        <button onClick={(e) => approve(request)} className="approve button default green-text no-border">
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            setState({ ...state, transferRequestToRevise: request, currentScreen: ScreenNames.reviseTransferRequest })
                          }}
                          className="approve button default  no-border">
                          Revise
                        </button>
                        <button data-request-id={request.id} onClick={(e) => reject(request)} className="reject button default red-text no-border">
                          Reject
                        </button>
                      </div>
                    </>
                  </div>
                )
              })}
          </div>
        )}

        <Modal
          elClass="swap-requests-modal"
          onClose={() => {
            document.querySelector('.swap-requests-modal').classList.remove('show')
          }}></Modal>
      </div>
    </>
  )
}
