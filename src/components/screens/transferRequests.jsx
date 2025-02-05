import React, { useCallback, useContext, useEffect, useState } from 'react'
import globalState from '../../context.js'
import DB from '/src/database/DB'
import Manager from '/src/managers/manager'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import NewTransferChangeRequest from '../forms/newTransferRequest.jsx'
import NotificationManager from '/src/managers/notificationManager.js'
import DB_UserScoped from '/src/database/db_userScoped'
import DateManager from '/src/managers/dateManager.js'
import NavBar from '../navBar'
import { IoAdd } from 'react-icons/io5'
import SecurityManager from '/src/managers/securityManager'
import { PiCarProfileDuotone, PiCheckBold } from 'react-icons/pi'
import { Fade } from 'react-awesome-reveal'
import { BiSolidNavigation } from 'react-icons/bi'
import { MobileDatePicker, MobileTimePicker } from '@mui/x-date-pickers-pro'
import moment from 'moment'
import Autocomplete from 'react-google-autocomplete'
import AlertManager from '/src/managers/alertManager'
import BottomCard from '/src/components/shared/bottomCard'
import DomManager from '/src/managers/domManager'
import NoDataFallbackText from '/src/components/shared/noDataFallbackText'
import ActivityCategory from '/src/models/activityCategory'
import DateFormats from '/src/constants/dateFormats'
import InputWrapper from '/src/components/shared/inputWrapper'
import ObjectManager from '/src/managers/objectManager'
import ModelNames from '/src/models/modelNames'
import StringManager from '/src/managers/stringManager'
import Spacer from '../shared/spacer.jsx'
import Map from '/src/components/shared/map.jsx'
import { setKey, fromLatLng, fromAddress } from 'react-geocode'
import LocationManager from '../../managers/locationManager.js'
import { IoLocationOutline } from 'react-icons/io5'
import Checkbox from '../shared/checkbox.jsx'
import Label from '../shared/label.jsx'

const Decisions = {
  approved: 'APPROVED',
  rejected: 'REJECTED',
  delete: 'DELETE',
}

export default function TransferRequests() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, refreshKey } = state
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
  const [address, setAddress] = useState(null)
  const [sendWithAddress, setSendWithAddress] = useState(false)
  const resetForm = async () => {
    Manager.resetForm('edit-event-form')
    setRequestTime('')
    setRequestLocation('')
    setRequestDate('')
    setResponseDueDate('')
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
    await DB.updateEntireRecord(`${DB.tables.transferChangeRequests}/${currentUser.phone}`, cleanedRequest, activeRequest.id)
    await getSecuredRequests()
    setActiveRequest(updatedRequest)
    setShowDetails(false)
    await resetForm()
  }

  const getSecuredRequests = async () => {
    let allRequests = await SecurityManager.getTransferChangeRequests(currentUser)
    setExistingRequests(allRequests)
  }

  const deleteRequest = async (action = 'deleted') => {
    if (action === 'deleted') {
      AlertManager.confirmAlert('Are you sure you would like to delete this request?', "I'm Sure", true, async () => {
        await DB.deleteById(`${DB.tables.transferChangeRequests}/${currentUser.phone}`, activeRequest?.id)
        AlertManager.successAlert(`Transfer Change Request has been deleted.`)
        setShowDetails(false)
      })
    }
  }

  const selectDecision = async (decision) => {
    const recipient = await DB_UserScoped.getCoparentByPhone(activeRequest.recipientPhone, currentUser)
    const recipientName = recipient.name
    // Rejected
    if (decision === Decisions.rejected) {
      await DB.updateEntireRecord(`${DB.tables.transferChangeRequests}/${currentUser.phone}`, activeRequest, activeRequest.id)
      const notifMessage = NotificationManager.templates.transferRequestRejection(activeRequest, recipientName)
      await NotificationManager.sendNotification(
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
      await DB.updateEntireRecord(`${DB.tables.transferChangeRequests}/${currentUser.phone}`, activeRequest, activeRequest.id)
      const notifMessage = NotificationManager.templates.transferRequestApproval(activeRequest, recipientName)
      setShowDetails(false)
      await NotificationManager.sendNotification(
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

  const checkIn = async () => {
    await NotificationManager.sendNotification(
      'Transfer Check In',
      `Check in at ${activeRequest?.location}`,
      '3307494534',
      currentUser,
      ActivityCategory.expenses
    )
    console.log(sendWithAddress)
  }

  const getCurrentUserAddress = async () => {
    const address = await LocationManager.getAddress()
    setAddress(address)
  }

  useEffect(() => {
    if (activeRequest) {
      setDefaults()
    }
  }, [activeRequest])

  useEffect(() => {
    onTableChange().then((r) => r)
    getCurrentUserAddress().then((r) => r)
    setKey(process.env.REACT_GOOGLE_MAPS_API_KEY) // Your API key here.
  }, [])

  return (
    <>
      <NewTransferChangeRequest showCard={showNewRequestCard} hideCard={() => setShowNewRequestCard(false)} />

      {/* DETAILS CARD */}
      <BottomCard
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
          <Spacer height={8} />
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
                <div className="flex">
                  <b>Transfer Date</b>
                  <p>{activeRequest.endDate}</p>
                  <span>{DateManager.formatDate(activeRequest?.date)}</span>
                </div>
              )}

              {/* RESPOND BY */}
              {Manager.isValid(activeRequest?.responseDueDate) && (
                <div className="flex">
                  <b>Respond by </b>
                  <span>
                    {DateManager.formatDate(activeRequest?.responseDueDate)},&nbsp;
                    {moment(moment(activeRequest?.responseDueDate).startOf('day')).fromNow().toString()}
                  </span>
                  {Manager.isValid(activeRequest?.endDate) && (
                    <p id="title">
                      <b>Respond by:</b>
                      <span>
                        {DateManager.formatDate(activeRequest?.responseDueDate)}&nbsp;to&nbsp;{DateManager.formatDate(activeRequest?.endDate)}
                        {moment(moment(activeRequest?.responseDueDate).startOf('day')).fromNow().toString()}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* TIME */}
              {Manager.isValid(activeRequest?.time) && (
                <div className="flex">
                  <b>Time </b>
                  <span>{activeRequest?.time}</span>
                </div>
              )}

              {/* STATUS */}
              <div className="flex">
                <b>Status </b>
                <span>{StringManager.uppercaseFirstLetterOfAllWords(activeRequest?.status)}</span>
              </div>

              {/* LOCATION */}
              {Manager.isValid(activeRequest?.location) && (
                <>
                  <div className="flex">
                    <b>Location</b>
                    <span>{activeRequest?.location}</span>
                  </div>
                  <Spacer height={5} />

                  <p className="center fs-14 op-7">notify your co-parent that you have arrived at the transfer location</p>
                  <Spacer height={5} />
                  {/* ARRIVED */}
                  <button className="button default center" onClick={checkIn}>
                    We're Here <IoLocationOutline />
                  </button>
                  <Spacer height={5} />
                  <Checkbox wrapperClass="center" text={'Include Current Address'} onClick={() => setSendWithAddress(!sendWithAddress)} />

                  <a className="nav-detail" href={activeRequest?.directionsLink} target="_blank" rel="noreferrer">
                    <BiSolidNavigation /> Navigation
                  </a>
                  <Label text={'Transfer Location'} classes="center-text" />
                  <Spacer height={3} />
                  {/* MAP */}
                  <Map locationString={activeRequest?.location} />
                </>
              )}

              {/* REASON */}
              {Manager.isValid(activeRequest?.reason) && (
                <div className="flex" id="row">
                  <p id="title" className="mr-auto wrap no-gap w-100">
                    <b>Reason</b>
                    <br />
                    <span>{activeRequest?.reason}</span>
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
                  defaultValue={requestLocation}
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
                  className={`${theme} w-100`}
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
          <Spacer height={10} />
          {/* LOOP REQUESTS */}
          {!showNewRequestCard && (
            <div id="all-transfer-requests-container" className="mt-15">
              {Manager.isValid(existingRequests) &&
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
                            {StringManager.uppercaseFirstLetterOfAllWords(request.status)}
                          </span>
                        </p>
                        {request?.recipientPhone === currentUser.phone && (
                          <p id="subtitle">From {StringManager.formatNameFirstNameOnly(request?.createdBy)}</p>
                        )}
                        {request?.recipientPhone !== currentUser.phone && (
                          <p id="subtitle">
                            Request Sent to&nbsp;
                            {StringManager.formatNameFirstNameOnly(
                              currentUser?.coparents?.filter((x) => x?.phone === request?.recipientPhone)[0]?.name
                            )}
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