import React, { useContext, useEffect, useState } from 'react'
import DB from '@db'
import Manager from '@manager'
import globalState from '../../context.js'
import 'rsuite/dist/rsuite.min.css'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import NewTransferChangeRequest from '../forms/newTransferRequest.jsx'
import NotificationManager from '@managers/notificationManager.js'
import DB_UserScoped from '@userScoped'
import DateManager from 'managers/dateManager.js'
import NavBar from '../navBar'
import { IoAdd } from 'react-icons/io5'
import SecurityManager from '../../managers/securityManager'
import { PiCarProfileDuotone, PiCheckBold } from 'react-icons/pi'
import { Fade } from 'react-awesome-reveal'
import { BiSolidNavigation } from 'react-icons/bi'
import { MobileDatePicker, MobileTimePicker } from '@mui/x-date-pickers-pro'
import moment from 'moment'
import Autocomplete from 'react-google-autocomplete'

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
import BottomCard from '../shared/bottomCard'
import DomManager from '../../managers/domManager'
import NoDataFallbackText from '../shared/noDataFallbackText'
import ActivityCategory from '../../models/activityCategory'
import DateFormats from '../../constants/dateFormats'
import InputWrapper from '../shared/inputWrapper'
import ObjectManager from '../../managers/objectManager'
import ModelNames from '../../models/modelNames'

const Decisions = {
  approved: 'APPROVED',
  rejected: 'REJECTED',
  delete: 'DELETE',
}

export default function TransferRequests() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [existingRequests, setExistingRequests] = useState([])
  const [rejectionReason, setRejectionReason] = useState('')
  const [showNewRequestCard, setShowNewRequestCard] = useState(false)
  const [activeRequest, setActiveRequest] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [view, setView] = useState('details')
  const [requestTime, setRequestTime] = useState('')
  const [requestLocation, setRequestLocation] = useState('')
  const [requestDate, setRequestDate] = useState('')
  const [responseDueDate, setResponseDueDate] = useState('')
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())

  const resetForm = async () => {
    Manager.resetForm('edit-event-form')
    setRequestTime('')
    setRequestLocation('')
    setRequestDate('')
    setResponseDueDate('')
    setRefreshKey(Manager.getUid())
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(currentUser.phone)
    setState({ ...state, currentUser: updatedCurrentUser })
  }

  const update = async () => {
    // Fill -> overwrite
    let updatedRequest = { ...activeRequest }
    updatedRequest.time = requestTime
    updatedRequest.location = requestLocation
    updatedRequest.directionsLink = Manager.getDirectionsLink(requestLocation)
    updatedRequest.date = requestDate
    updatedRequest.reason = rejectionReason
    updatedRequest.responseDueDate = responseDueDate

    if (Manager.isValid(responseDueDate)) {
      updatedRequest.responseDueDate = moment(responseDueDate).format(DateFormats.dateForDb)
    }
    const cleanedRequest = ObjectManager.cleanObject(updatedRequest, ModelNames.transferChangeRequest)
    await DB.delete(DB.tables.transferChangeRequests, activeRequest.id)
    await DB.add(`${DB.tables.transferChangeRequests}`, cleanedRequest).then(async () => {
      await getSecuredRequests()
      setActiveRequest(updatedRequest)
      setShowDetails(false)
      await resetForm()
    })
  }

  const getSecuredRequests = async () => {
    let allRequests = await SecurityManager.getTransferChangeRequests(currentUser)
    setExistingRequests(allRequests)
  }

  const deleteRequest = async (action = 'deleted') => {
    if (action === 'deleted') {
      AlertManager.confirmAlert('Are you sure you would like to delete this request?', "I'm Sure", true, async () => {
        await DB.delete(DB.tables.transferChangeRequests, activeRequest?.id)
        AlertManager.successAlert(`Transfer Change Request has been deleted.`)
        setShowDetails(false)
      })
    } else {
      await DB.delete(DB.tables.transferChangeRequests, activeRequest?.id)
      AlertManager.successAlert(`Transfer Change Request has been rejected and a notification has been sent to the request recipient.`)
      setShowDetails(false)
    }
  }

  const selectDecision = async (decision) => {
    const ownerSubId = await NotificationManager.getUserSubId(activeRequest.ownerPhone, 'phone')
    const recipient = await DB_UserScoped.getCoparentByPhone(activeRequest.recipientPhone, currentUser)
    const recipientName = recipient.name
    // Rejected
    if (decision === Decisions.rejected) {
      await DB.updateRecord(DB.tables.transferChangeRequests, activeRequest, 'status', 'rejected', 'id')
      await DB.updateRecord(DB.tables.transferChangeRequests, activeRequest, 'reason', rejectionReason, 'id')
      const notifMessage = NotificationManager.templates.transferRequestRejection(activeRequest, recipientName)
      NotificationManager.sendNotification(
        'Transfer Request Decision',
        notifMessage,
        activeRequest?.ownerPhone,
        currentUser,
        ActivityCategory.transferRequest
      )
      setShowDetails(false)
    }

    // Approved
    if (decision === Decisions.approved) {
      await DB.updateRecord(DB.tables.transferChangeRequests, activeRequest, 'status', 'approved', 'id')
      const notifMessage = NotificationManager.templates.transferRequestApproval(activeRequest, recipientName)
      NotificationManager.sendNotification('Transfer Change Request Decision', notifMessage, ownerSubId)
      setShowDetails(false)
      NotificationManager.sendNotification(
        'Transfer Request Decision',
        notifMessage,
        activeRequest?.ownerPhone,
        currentUser,
        ActivityCategory.transferRequest
      )
    }
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, DB.tables.transferChangeRequests), async (snapshot) => {
      await getSecuredRequests().then((r) => r)
    })
  }

  const setDefaults = () => {
    setRequestTime(activeRequest?.time)
    setRequestLocation(activeRequest?.location)
    setRequestDate(activeRequest?.date)
  }
  const addThemeToDatePickers = () => {
    setTimeout(() => {
      const datetimeParent = document.querySelector('.MuiDialog-root.MuiModal-root')
      datetimeParent.classList.add(currentUser?.settings?.theme)
    }, 100)
  }

  useEffect(() => {
    if (activeRequest) {
      setDefaults()
    }
  }, [activeRequest])

  useEffect(() => {
    onTableChange().then((r) => r)
  }, [])

  return (
    <>
      <NewTransferChangeRequest showCard={showNewRequestCard} hideCard={() => setShowNewRequestCard(false)} />

      {/* DETAILS CARD */}
      <BottomCard
        refreshKey={refreshKey}
        submitText={'Approve'}
        onDelete={() => deleteRequest('deleted')}
        title={'Request Details'}
        hasDelete={activeRequest?.ownerPhone === currentUser?.phone && view === 'edit'}
        hasSubmitButton={activeRequest?.ownerPhone !== currentUser?.phone}
        onSubmit={() => selectDecision(Decisions.approved)}
        wrapperClass="transfer-change"
        submitIcon={<PiCheckBold />}
        className="transfer-change"
        onClose={() => setShowDetails(false)}
        showCard={showDetails}>
        <div id="details" className={`content ${activeRequest?.reason.length > 20 ? 'long-text' : ''}`}>
          <div className="views-wrapper">
            <p onClick={() => setView('details')} className={view === 'details' ? 'view active' : 'view'}>
              Details
            </p>
            <p onClick={() => setView('edit')} className={view === 'edit' ? 'view active' : 'view'}>
              Edit
            </p>
          </div>
          {view === 'details' && (
            <>
              {/* TRANSFER DATE */}
              {Manager.isValid(activeRequest?.date) && (
                <div className="flex flex-start" id="row">
                  <p id="title">
                    <b>Transfer Date: </b>
                    {DateManager.formatDate(activeRequest?.date)}
                  </p>
                </div>
              )}

              {/* RESPOND BY */}
              {Manager.isValid(activeRequest?.responseDueDate) && (
                <div className="flex" id="row">
                  {!Manager.isValid(activeRequest?.endDate) && (
                    <p id="title" className="mr-auto">
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
              {Manager.isValid(activeRequest?.time) && (
                <div className="flex" id="row">
                  <p id="title" className="mr-auto">
                    <b>Time: </b>
                    {activeRequest?.time}
                  </p>
                </div>
              )}

              {/* STATUS */}
              <div className="flex flex-start" id="row">
                <p id="title">
                  <b>Status: </b>
                  {uppercaseFirstLetterOfAllWords(activeRequest?.status)}
                </p>
              </div>

              {/* LOCATION */}
              {Manager.isValid(activeRequest?.location) && (
                <div className="flex flex-start" id="row">
                  <p id="title" className="mr-auto">
                    <b>Location</b>
                    <br />
                    {activeRequest?.location}
                  </p>
                </div>
              )}

              {Manager.isValid(activeRequest?.location) && (
                <a className="nav-detail" href={activeRequest?.directionsLink} target="_blank" rel="noreferrer">
                  <BiSolidNavigation /> Nav
                </a>
              )}

              {/* REASON */}
              {Manager.isValid(activeRequest?.reason) && (
                <div className="flex" id="row">
                  <p id="title" className="mr-auto">
                    <b>Reason</b>
                    <br />
                    {activeRequest?.reason}
                  </p>
                </div>
              )}
            </>
          )}

          {view === 'edit' && (
            <>
              {/* DATE */}
              <InputWrapper inputType={'date'} labelText={'Date'}>
                <MobileDatePicker
                  onOpen={addThemeToDatePickers}
                  className={`${theme}  mt-0 w-100`}
                  defaultValue={moment(activeRequest?.date)}
                  onChange={(e) => setRequestDate(moment(e).format(DateFormats.dateForDb))}
                />
              </InputWrapper>

              {/* TIME */}
              <InputWrapper inputType={'date'} labelText={'Time'}>
                <MobileTimePicker
                  onOpen={addThemeToDatePickers}
                  defaultValue={moment(activeRequest?.time, DateFormats.timeForDb)}
                  className={`${theme}  mt-0 w-100`}
                  onChange={(e) => setRequestTime(moment(e).format(DateFormats.timeForDb))}
                />
              </InputWrapper>

              {/*  NEW LOCATION*/}
              <InputWrapper inputType={'location'} labelText={'Location'}>
                <Autocomplete
                  placeholder={currentUser?.defaultTransferLocation}
                  apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
                  options={{
                    types: ['geocode', 'establishment'],
                    componentRestrictions: { country: 'usa' },
                  }}
                  className=""
                  onPlaceSelected={(place) => {
                    setRequestLocation(place.formatted_address)
                  }}
                />
              </InputWrapper>
              {/* RESPONSE DUE DATE */}
              <InputWrapper inputType={'date'} labelText={'Respond by'}>
                <MobileDatePicker
                  onOpen={addThemeToDatePickers}
                  className={`${theme}  w-100`}
                  defaultValue={moment(activeRequest?.responseDueDate)}
                  onChange={(day) => setResponseDueDate(moment(day).format(DateFormats.dateForDb))}
                />
              </InputWrapper>

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
            </>
          )}
        </div>
      </BottomCard>

      <div id="transfer-requests-container" className={`${theme} page-container form`}>
        {existingRequests.length === 0 && <NoDataFallbackText text={'There are currently no requests'} />}

        <Fade direction={'up'} duration={1000} className={'transfer-requests-fade-wrapper'} triggerOnce={true}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title">Transfer Change Requests</p>
            {!DomManager.isMobile() && <IoAdd id={'add-new-button'} onClick={() => setShowNewRequestCard(true)} />}
          </div>
          <p className="text-screen-intro">A request to change the time and/or location of the child exchange for a specific day.</p>

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
        </Fade>
      </div>

      {!showNewRequestCard && !showDetails && (
        <NavBar navbarClass={'transfer-requests'}>
          <IoAdd id={'add-new-button'} onClick={() => setShowNewRequestCard(true)} />
        </NavBar>
      )}
    </>
  )
}