import React, { useContext, useEffect, useState } from 'react'
import DB from '@db'
import Manager from '@manager'
import globalState from '../../context.js'
import 'rsuite/dist/rsuite.min.css'
import moment from 'moment'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import SwapDurations from '@constants/swapDurations.js'
import PushAlertApi from '@api/pushAlert'
import NotificationManager from '@managers/notificationManager.js'
import DB_UserScoped from '@userScoped'
import SecurityManager from '../../managers/securityManager'
import NewSwapRequest from '../forms/newSwapRequest'
import { IoAdd } from 'react-icons/io5'
import { FaChildren } from 'react-icons/fa6'
import { AiTwotoneNotification } from 'react-icons/ai'
import NavBar from '../navBar'
import AlertManager from '../../managers/alertManager'
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io'
import Label from '../shared/label'

const Decisions = {
  approved: 'APPROVED',
  rejected: 'REJECTED',
  delete: 'DELETE',
}

export default function SwapRequests() {
  const { state, setState } = useContext(globalState)
  const [existingRequests, setExistingRequests, navbarButton] = useState([])
  const { currentUser, theme } = state
  const [rejectionReason, setRejectionReason] = useState('')
  const [showCard, setShowCard] = useState(false)
  const [showReviseCard, setShowReviseCard] = useState(false)

  const getSecuredRequests = async () => {
    let allRequests = await SecurityManager.getSwapRequests(currentUser).then((r) => r)
    setExistingRequests(allRequests)
  }

  const selectDecision = async (request, decision) => {
    const subId = await NotificationManager.getUserSubId(request.recipientPhone)
    // Delete
    if (decision === Decisions.delete) {
      await DB.delete(DB.tables.swapRequests, request.id)
    }
    //
    // Rejected
    if (decision === Decisions.rejected) {
      await DB.updateRecord(DB.tables.swapRequests, request, 'rejectionReason', rejectionReason, 'id')
      const notifMessage = PushAlertApi.templates.swapRequestDecision(request, decision)
      PushAlertApi.sendMessage('Swap Request Decision', notifMessage, subId)
    }

    // Approved
    if (decision === Decisions.approved) {
      const notifMessage = PushAlertApi.templates.swapRequestDecision(request, decision)
      PushAlertApi.sendMessage('Swap Request Decision', notifMessage, subId)
      await DB.delete(DB.tables.swapRequests, request.id)
    }
  }

  const sendReminder = async (request) => {
    AlertManager.successAlert('Reminder Sent')
    await DB_UserScoped.getCoparentByPhone(request.recipientPhone, currentUser).then(async (coparent) => {
      const subId = await PushAlertApi.getSubId(coparent.phone)
      PushAlertApi.sendMessage(`Pending Swap Decision`, ` ${moment(request.startDate).format('dddd, MMMM Do')}`, subId)
    })
  }

  const addEventRowAnimation = () => {
    document.querySelectorAll('.request').forEach((request, i) => {
      setTimeout(() => {
        request.classList.add('active')
      }, 200 * i)
    })
  }

  const toggleDetails = (element) => {
    const textWrapper = element.target
    const details = textWrapper.querySelector('#details')
    const svgDown = textWrapper.querySelector('svg.down')
    const svgUp = textWrapper.querySelector('svg.up')
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

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, DB.tables.swapRequests), async (snapshot) => {
      await getSecuredRequests().then((r) => r)
      setTimeout(() => {
        addEventRowAnimation()
      }, 600)
    })
  }

  useEffect(() => {
    onTableChange().then((r) => r)
    Manager.showPageContainer('show')
  }, [])

  return (
    <>
      <NewSwapRequest showCard={showCard} hideCard={() => setShowCard(false)} />
      <div id="swap-requests" className={`${theme} page-container form`}>
        <p className="screen-title">Swap Requests</p>
        <>
          <p className="text-screen-intro mb-15">A request for your child(ren) to stay with you during your co-parent's scheduled visitation time.</p>
          {existingRequests.length === 0 && <p className="instructions center">There are currently no requests</p>}
        </>
        <div id="swap-requests-container">
          {Manager.isValid(existingRequests) &&
            existingRequests.map((request, index) => {
              return (
                <div key={index} className="request w-100 mb-10" onClick={toggleDetails}>
                  {/* REQUEST DATE */}
                  <p id="request-date">
                    {request.duration === SwapDurations.single && moment(request.startDate).format('dddd, MMM Do')}
                    {request.duration === SwapDurations.intra && (
                      <>
                        <span>{moment(request.startDate).format('dddd, MMM Do')}</span>
                        <span>
                          {request.fromHour.replace(' ', '')} - {request.toHour.replace(' ', '')}
                        </span>
                      </>
                    )}
                    {request.duration === SwapDurations.multiple &&
                      `${moment(request.startDate).format('dddd, MMM Do')} - ${moment(request.endDate).format('dddd, MMM Do')}`}
                    <IoIosArrowDown className={'details-toggle-arrow down active fs-24'} />
                    <IoIosArrowUp className={'details-toggle-arrow up fs-24'} />
                  </p>

                  <div id="details">
                    <div className={`content ${request?.reason?.length > 20 ? 'long-text' : ''}`}>
                      <div className="flex top-details">
                        {/* SENT TO */}
                        {request?.recipientPhone !== currentUser?.phone && (
                          <div className="flex row">
                            <p>
                              <b>Request Sent to:&nbsp;</b>
                            </p>
                            <p>{currentUser?.coparents.filter((x) => x.phone === request.recipientPhone)[0]?.name}</p>
                          </div>
                        )}

                        {/* REASON */}
                        {request?.reason && request?.reason.length > 0 && (
                          <div className="flex row">
                            <Label text={'Reason: '} />
                            <p className={request?.reason.length > 50 ? 'wrap reason-text' : 'reason-text'}>{request?.reason}</p>
                          </div>
                        )}

                        {/* CHILDREN */}
                        <div id="children">
                          {/* CHILDREN */}
                          {request?.children && request?.children.length > 0 && (
                            <div className="children flex">
                              <FaChildren />
                              <p
                                className="fs-14 "
                                dangerouslySetInnerHTML={{
                                  __html: `${request?.children.join('|').replaceAll('|', '<span class="divider">|</span>')}`,
                                }}></p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* REQUEST BUTTONS */}
                    <div className="flex" id="request-buttons">
                      {/* REQUEST RECIPIENT IS VIEWING */}
                      {request?.recipientPhone === currentUser?.phone && (
                        <>
                          <button className="green" onClick={(e) => selectDecision(request, Decisions.approved)}>
                            Approve
                          </button>
                          <button
                            className="red"
                            id="delete-button"
                            data-request-id={request.id}
                            onClick={async (e) => {
                              AlertManager.inputAlert(
                                'Rejection Reason',
                                'Please enter a rejection reason',
                                async () => {
                                  await selectDecision(request, Decisions.rejected)
                                },
                                true,
                                true,
                                'textarea'
                              )
                            }}>
                            Reject
                          </button>
                        </>
                      )}
                      {/* REQUEST OWNER IS VIEWING */}
                      {request?.recipientPhone !== currentUser?.phone && (
                        <>
                          {/* SEND REMINDER BUTTON */}
                          {request.ownerPhone === currentUser?.phone && (
                            <button className="green" id="reminder-button" onClick={() => sendReminder(request)}>
                              Send Reminder <AiTwotoneNotification />
                            </button>
                          )}
                          {/* DELETE BUTTON */}
                          <button
                            className="red"
                            id="delete-button"
                            data-request-id={request.id}
                            onClick={(e) => selectDecision(request, Decisions.delete)}>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
      {!showCard && (
        <NavBar navbarClass={'swap-requests'}>
          <IoAdd id={'add-new-button'} onClick={() => setShowCard(true)} />
        </NavBar>
      )}
    </>
  )
}