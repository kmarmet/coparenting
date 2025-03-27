// Path: src\components\screens\transferRequests.jsx
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context.js'
import DB from '/src/database/DB'
import Manager from '/src/managers/manager'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import NotificationManager from '/src/managers/notificationManager.js'
import DB_UserScoped from '../../database/db_userScoped.js'
import DateManager from '/src/managers/dateManager.js'
import { GrMapLocation } from 'react-icons/gr'
import { IoAdd, IoHourglassOutline } from 'react-icons/io5'
import { IoMdPin } from 'react-icons/io'
import SecurityManager from '/src/managers/securityManager'
import { PiCarProfileDuotone, PiCheckBold } from 'react-icons/pi'
import { Fade } from 'react-awesome-reveal'
import { BiSolidNavigation } from 'react-icons/bi'
import { MobileDatePicker, MobileTimePicker } from '@mui/x-date-pickers-pro'
import moment from 'moment'
import { TbCalendarCheck } from 'react-icons/tb'
import { MdOutlineAccessTime } from 'react-icons/md'
import AlertManager from '/src/managers/alertManager'
import Modal from '/src/components/shared/modal'
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
import { setKey } from 'react-geocode'
import Label from '../shared/label.jsx'
import StringAsHtmlElement from '../shared/stringAsHtmlElement'
import AddressInput from '../shared/addressInput'
import { CgDetailsMore } from 'react-icons/cg'
import ViewSelector from '../shared/viewSelector'
import CheckboxGroup from '../shared/checkboxGroup'
import NavBar from '../navBar'

const Decisions = {
  approved: 'APPROVED',
  rejected: 'REJECTED',
  delete: 'DELETE',
}

export default function TransferRequests() {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, refreshKey, authUser} = state
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
  const [sendWithAddress, setSendWithAddress] = useState(false)

  const resetForm = async () => {
    Manager.resetForm('edit-event-form')
    setRequestTime('')
    setRequestLocation('')
    setRequestDate('')
    setResponseDueDate('')
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(authUser?.email)
    setState({...state, currentUser: updatedCurrentUser})
  }

  const update = async () => {
    // Fill -> overwrite
    let updatedRequest = {...activeRequest}
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
    await DB.updateEntireRecord(`${DB.tables.transferChangeRequests}/${currentUser?.key}`, cleanedRequest, activeRequest.id)
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
        await DB.deleteById(`${DB.tables.transferChangeRequests}/${currentUser.key}`, activeRequest?.id)
        AlertManager.successAlert(`Transfer Change Request has been deleted.`)
        setShowDetails(false)
      })
    }
  }

  const selectDecision = async (decision) => {
    const recipient = await DB_UserScoped.getCoparentByKey(activeRequest.recipientKey, currentUser)
    const recipientName = recipient.name
    // Rejected
    if (decision === Decisions.rejected) {
      await DB.updateEntireRecord(`${DB.tables.transferChangeRequests}/${currentUser.key}`, activeRequest, activeRequest.id)
      const notifMessage = NotificationManager.templates.transferRequestRejection(activeRequest, recipientName)
      await NotificationManager.sendNotification(
        'Transfer Request Decision',
        notifMessage,
        activeRequest?.ownerKey,
        currentUser,
        ActivityCategory.transferRequest
      )
      setShowDetails(false)
    }

    // Approved
    if (decision === Decisions.approved) {
      await DB.updateEntireRecord(`${DB.tables.transferChangeRequests}/${currentUser.key}`, activeRequest, activeRequest.id)
      const notifMessage = NotificationManager.templates.transferRequestApproval(activeRequest, recipientName)
      setShowDetails(false)
      await NotificationManager.sendNotification(
        'Transfer Request Decision',
        notifMessage,
        activeRequest?.ownerKey,
        currentUser,
        ActivityCategory.transferRequest
      )
    }
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, DB.tables.transferChangeRequests), async () => {
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
    let notificationMessage = `${StringManager.getFirstWord(StringManager.uppercaseFirstLetterOfAllWords(currentUser.name))} at ${
      activeRequest?.location
    }`
    if (!sendWithAddress) {
      notificationMessage = `${StringManager.getFirstWord(StringManager.uppercaseFirstLetterOfAllWords(currentUser.name))} has Arrived`
    }
    const notifPhone = activeRequest?.ownerKey === currentUser.key ? activeRequest.recipientPhone : currentUser.key
    await NotificationManager.sendNotification(
      'Transfer Destination Arrival',
      notificationMessage,
      notifPhone,
      currentUser,
      ActivityCategory.expenses
    )
    AlertManager.successAlert('Arrival notification sent!')
  }

  const getCurrentUserAddress = async () => {
    // const address = await LocationManager.getAddress()
  }

  useEffect(() => {
    if (activeRequest) {
      setDefaults()
    }
  }, [activeRequest])

  useEffect(() => {
    onTableChange().then((r) => r)
    getCurrentUserAddress().then((r) => r)
    // eslint-disable-next-line no-undef
    setKey(process.env.REACT_APP_GOOGLE_MAPS_API_KEY)
  }, [])

  return (
    <>
      {/* DETAILS CARD */}
      <Modal
        refreshKey={refreshKey}
        submitText={'Approve'}
        onDelete={() => deleteRequest('deleted')}
        title={'Request Details'}
        hasDelete={activeRequest?.ownerKey === currentUser?.key && view === 'edit'}
        hasSubmitButton={activeRequest?.ownerKey !== currentUser?.key}
        onSubmit={() => selectDecision(Decisions.approved)}
        wrapperClass="transfer-change"
        submitIcon={<PiCheckBold />}
        viewSelector={<ViewSelector shouldUpdateStateOnLoad={true} labels={['Details', 'Edit']} updateState={(e) => setView(e.toLowerCase())} />}
        className="transfer-change"
        onClose={() => setShowDetails(false)}
        showCard={showDetails}>
        <div id="details" className={`content ${activeRequest?.reason.length > 20 ? 'long-text' : ''}`}>
          <Spacer height={8} />

          {view === 'details' && (
            <>
              {/* TRANSFER DATE */}
              {Manager.isValid(activeRequest?.startDate) && (
                <div className="flex">
                  <b>
                    <TbCalendarCheck />
                    Transfer Date
                  </b>
                  <p>{activeRequest.endDate}</p>
                  <span>{DateManager.formatDate(activeRequest?.startDate)}</span>
                </div>
              )}

              {/* RESPOND BY */}
              {Manager.isValid(activeRequest?.responseDueDate) && (
                <div className="flex">
                  <b>
                    <IoHourglassOutline />
                    Respond by
                  </b>
                  <span>
                    {DateManager.formatDate(activeRequest?.responseDueDate)},&nbsp;
                    {moment(moment(activeRequest?.responseDueDate).startOf('day')).fromNow().toString()}
                  </span>
                  {Manager.isValid(activeRequest?.endDate) && (
                    <>
                      <b>
                        <IoHourglassOutline />
                        Respond by
                      </b>
                      <span>
                        {DateManager.formatDate(activeRequest?.responseDueDate)}&nbsp;to&nbsp;{DateManager.formatDate(activeRequest?.endDate)}
                        {moment(moment(activeRequest?.responseDueDate).startOf('day')).fromNow().toString()}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* TIME */}
              {Manager.isValid(activeRequest?.time) && (
                <div className="flex">
                  <b>
                    <MdOutlineAccessTime />
                    Time
                  </b>
                  <span>{activeRequest?.time}</span>
                </div>
              )}

              {/* REASON */}
              {Manager.isValid(activeRequest?.reason) && (
                <div className="flex">
                  <b>
                    <CgDetailsMore />
                    Reason
                  </b>
                  <StringAsHtmlElement text={activeRequest?.reason} />
                </div>
              )}

              {/* LOCATION */}
              {Manager.isValid(activeRequest?.location) && (
                <>
                  <div className="flex">
                    <b>
                      <GrMapLocation />
                      Location
                    </b>
                    <span>{activeRequest?.location}</span>
                  </div>
                  <a className="nav-detail" href={activeRequest?.directionsLink} target="_blank" rel="noreferrer">
                    <BiSolidNavigation /> Navigation
                  </a>
                  {/* ARRIVED */}
                  <button className="button default center" onClick={checkIn}>
                    We&apos;re Here <IoMdPin />
                  </button>
                  <Spacer height={5} />
                  <CheckboxGroup
                    checkboxArray={Manager.buildCheckboxGroup({
                      currentUser,
                      customLabelArray: ['Include Current Address'],
                    })}
                    skipNameFormatting={true}
                    onCheck={() => setSendWithAddress(!sendWithAddress)}
                  />
                  <Spacer height={10} />
                  <Label text={'Transfer Location'} classes="center-text" />
                  <Spacer height={5} />
                  {/* MAP */}
                  <Map locationString={activeRequest?.location} />
                </>
              )}
            </>
          )}

          {view === 'edit' && (
            <>
              {/* DATE */}
              {!DomManager.isMobile() && (
                <InputWrapper inputType={'date'} labelText={'Date'}>
                  <MobileDatePicker
                    onOpen={addThemeToDatePickers}
                    className={`${theme}`}
                    defaultValue={moment(activeRequest?.date)}
                    onChange={(e) => setRequestDate(moment(e).format(DateFormats.dateForDb))}
                  />
                </InputWrapper>
              )}

              {DomManager.isMobile() && (
                <InputWrapper useNativeDate={true} inputType={'date'} labelText={'Date'} required={true} defaultValue={moment(activeRequest?.date)} />
              )}

              {/* TIME */}
              <InputWrapper inputType={'date'} labelText={'Time'}>
                <MobileTimePicker
                  slotProps={{
                    actionBar: {
                      actions: ['clear', 'accept'],
                    },
                  }}
                  onOpen={addThemeToDatePickers}
                  defaultValue={moment(activeRequest?.time, DateFormats.timeForDb)}
                  className={`${theme}`}
                  onChange={(e) => setRequestTime(moment(e).format(DateFormats.timeForDb))}
                />
              </InputWrapper>

              {/*  NEW LOCATION*/}
              <InputWrapper inputType={'location'} labelText={'Location'}>
                <AddressInput defaultValue={requestLocation} onSelection={(address) => setRequestLocation(address)} />
              </InputWrapper>

              {/* RESPONSE DUE DATE */}
              {!DomManager.isMobile() && (
                <InputWrapper inputType={'date'} labelText={'Respond by'}>
                  <MobileDatePicker
                    onOpen={addThemeToDatePickers}
                    className={`${theme}`}
                    defaultValue={moment(activeRequest?.responseDueDate)}
                    onChange={(e) => setResponseDueDate(moment(e).format(DateFormats.dateForDb))}
                  />
                </InputWrapper>
              )}

              {DomManager.isMobile() && (
                <InputWrapper
                  onChange={(e) => setResponseDueDate(moment(e.target.value).format(DateFormats.dateForDb))}
                  useNativeDate={true}
                  inputType={'date'}
                  labelText={'Respond by'}
                  required={true}
                  defaultValue={moment(activeRequest?.responseDueDate)}
                />
              )}

              {/* BUTTONS */}
              <div className="card-buttons">
                <>
                  <button className="button default submit center" data-request-id={activeRequest?.id} onClick={update}>
                    Update Request
                  </button>
                  {activeRequest?.ownerKey !== currentUser?.key && (
                    <button
                      className="button default red center"
                      data-request-id={activeRequest?.id}
                      onClick={async () => {
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
      </Modal>

      <div id="transfer-requests-container" className={`${theme} page-container form`}>
        {existingRequests.length === 0 && <NoDataFallbackText text={'There are currently no requests'} />}

        <div className="flex" id="screen-title-wrapper">
          <p className="screen-title">Transfer Change Requests</p>
          {!DomManager.isMobile() && <IoAdd id={'add-new-button'} onClick={() => setShowNewRequestCard(true)} />}
        </div>
        <p className="text-screen-intro">A proposal to modify the time and/or location for the child exchange on a designated day.</p>
        <Spacer height={10} />
        {/* LOOP REQUESTS */}
        {!showNewRequestCard && (
          <div id="all-transfer-requests-container" className="mt-15">
            <Fade direction={'right'} duration={800} triggerOnce={true} className={'expense-tracker-fade-wrapper'} cascade={true} damping={0.2}>
              {Manager.isValid(existingRequests) &&
                existingRequests.map((request, index) => {
                  return (
                    <div
                      key={index}
                      className="flex row"
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
                          {moment(request.startDate).format(DateFormats.readableMonthAndDay)}
                          <span className={`${request.status} status`} id="request-status">
                            {StringManager.uppercaseFirstLetterOfAllWords(request.status)}
                          </span>
                        </p>
                        {request?.recipientKey === currentUser.key && <p id="subtitle">From {StringManager.getFirstNameOnly(request?.createdBy)}</p>}
                        {request?.recipientKey !== currentUser.key && (
                          <p id="subtitle">
                            Request Sent to&nbsp;
                            {StringManager.getFirstNameOnly(currentUser?.coparents?.filter((x) => x?.key === request?.recipientKey)[0]?.name)}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
            </Fade>
          </div>
        )}
        <NavBar/>
      </div>
    </>
  )
}