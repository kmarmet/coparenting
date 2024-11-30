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
      setShowDetails(false)
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

  const toggleDetails = (element) => {
    const wrapper = element.target
    const details = wrapper.querySelector('#details')
    const svgDown = wrapper.querySelector('svg.down')
    const svgUp = wrapper.querySelector('svg.up')
    if (details) {
      if (details.classList.contains('open')) {
        details.classList.remove('open')
        svgDown.classList.add('active')
        svgUp.classList.remove('active')
      } else {
        details.classList.add('open')
        svgDown.classList.remove('active')
        svgUp.classList.add('active')
      }
    }
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
        onSubmit={() => approve(activeRequest)}
        className="transfer-change"
        onClose={() => setShowDetails(false)}
        showCard={showDetails}>
        <div id="details" className={`content ${activeRequest?.reason.length > 20 ? 'long-text' : ''}`}>
          <div id="row" className="flex-start mb-20">
            <div id="primary-icon-wrapper">
              <PiUserDuotone id="primary-row-icon" />
            </div>
            {/* SENT TO */}
            <p id="title">
              Request Sent to {formatNameFirstNameOnly(currentUser?.coparents?.filter((x) => x?.phone === activeRequest?.recipientPhone)[0]?.name)}
            </p>
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
            <div className="flex mb-20" id="row">
              <div id="primary-icon-wrapper">
                <BiNavigation id={'primary-row-icon'} />
              </div>
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
          )}

          {/* REASON */}
          {activeRequest?.reason && activeRequest?.reason.length > 0 && (
            <div className="flex mb-20" id="row">
              <div id="primary-icon-wrapper">
                <MdOutlineNotes id={'primary-row-icon'} />
              </div>
              <p id="title" className="mr-auto">
                Reason
              </p>
              <p className="reason-text">{activeRequest?.reason}</p>
            </div>
          )}
          {/* BUTTONS */}
          <div className="action-buttons">
            <button
              onClick={(e) => {
                setRequestToRevise(activeRequest)
                setShowRevisionCard(true)
              }}
              className="blue">
              Revise
            </button>
            <button
              className="red"
              data-request-id={activeRequest?.id}
              onClick={async (e) => {
                AlertManager.inputAlert(
                  'Rejection Reason',
                  'Please enter a rejection reason',
                  async () => {
                    await reject(activeRequest)
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
                    <div key={index} data-request-id={request.id} className="request " id="content">
                      {/* DATE */}
                      <p id="title" className="flex date row-title">
                        {DateManager.formatDate(request.date)}
                        <span className={`${request.status} status`} id="request-status">
                          {uppercaseFirstLetterOfAllWords(request.status)}
                        </span>
                      </p>
                      <p id="subtitle">Sent to {currentUser?.coparents?.filter((x) => x.phone === request.recipientPhone)[0]?.name}</p>
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