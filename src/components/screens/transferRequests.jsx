import React, { useContext, useEffect, useState } from 'react'
import DB from '@db'
import Manager from '@manager'
import globalState from '../../context.js'
import 'rsuite/dist/rsuite.min.css'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import SmsManager from '@managers/smsManager.js'
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

export default function TransferRequests() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, navbarButton } = state
  const [existingRequests, setExistingRequests] = useState([])
  const [rejectionReason, setRejectionReason] = useState('')
  const [recipients, setRecipients] = useState([])
  const [showNewRequestCard, setShowNewRequestCard] = useState(false)
  const [showRevisionCard, setShowRevisionCard] = useState(false)
  const [requestToRevise, setRequestToRevise] = useState(null)

  const getSecuredRequests = async () => {
    let allRequests = await SecurityManager.getTransferChangeRequests(currentUser)
    let allUsers = Manager.convertToArray(await DB.getTable(DB.tables.users))
    const found = allUsers.filter((y) => allRequests.filter((x) => x.recipientPhone === y.phone).length > 0)
    setRecipients(found)
    setExistingRequests(allRequests)
  }

  const reject = async (request) => {
    await DB.delete(DB.tables.transferChangeRequests, request.id).finally(async () => {
      await DB_UserScoped.getCoparentByPhone(request.recipientName, currentUser).then(async (cop) => {
        const subId = await NotificationManager.getUserSubId(cop.phone)
        PushAlertApi.sendMessage(
          'Swap Request Decision',
          SmsManager.getTransferRequestDecisionTemplate(`${request.startDate}`.replace(',', ' to '), 'rejected', rejectionReason, currentUser?.name),
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
            SmsManager.getTransferRequestDecisionTemplate(`${request.startDate}`.replace(',', ' to '), 'approved', null, currentUser?.name),
            subId
          )
        )
      })
    })
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

      <div id="transfer-requests-container" className={`${theme} page-container form`}>
        <p className="screen-title">Transfer Change Requests</p>
        <p className="text-screen-intro">A request to change the time and/or location of the child exchange for a specific day.</p>
        {existingRequests.length === 0 && (
          <div id="instructions-wrapper">
            <p className="instructions center">There are currently no requests</p>
          </div>
        )}

        {!showNewRequestCard && (
          <div id="all-transfer-requests-container" className="mt-15">
            {Manager.isValid(existingRequests, true) &&
              existingRequests.map((request, index) => {
                return (
                  <div key={index} data-request-id={request.id} className="request open mb-15">
                    <p id="request-date">{DateManager.formatDate(request.date)}</p>
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
                              <BiNavigation className={'fs-24'} />
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

                    {/* BUTTONS */}
                    <div id="request-buttons">
                      <button onClick={(e) => approve(request)} className="green">
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          setRequestToRevise(request)
                          setShowRevisionCard(true)
                        }}
                        className="blue">
                        Revise
                      </button>
                      <button
                        className="red"
                        data-request-id={request.id}
                        onClick={async (e) => {
                          AlertManager.inputAlert(
                            'Rejection Reason',
                            'Please enter a rejection reason',
                            async () => {
                              await reject(request)
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