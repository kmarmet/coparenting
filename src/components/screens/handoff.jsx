// Path: src\components\screens\pickupDropOff?.jsx
import moment from "moment"
import React, {useContext, useEffect, useState} from "react"
import {setKey} from "react-geocode"
import {MdPersonPinCircle} from "react-icons/md"
import {RiMapPinTimeFill} from "react-icons/ri"
import ButtonThemes from "../../constants/buttonThemes"
import DatetimeFormats from "../../constants/datetimeFormats"
import InputTypes from "../../constants/inputTypes"
import ScreenNames from "../../constants/screenNames"
import ActivityCategory from "../../constants/updateCategory"
import globalState from "../../context.js"
import DB from "../../database/DB"
import useCoParents from "../../hooks/useCoParents"
import useCurrentUser from "../../hooks/useCurrentUser"
import useHandoffRequests from "../../hooks/useHandoffRequests"
import AlertManager from "../../managers/alertManager"
import DomManager from "../../managers/domManager"
import Manager from "../../managers/manager"
import ObjectManager from "../../managers/objectManager"
import StringManager from "../../managers/stringManager"
import UpdateManager from "../../managers/updateManager.js"
import HandoffChangeRequest from "../../models/new/handoffChangeRequest"
import NavBar from "../navBar"
import AddressInput from "../shared/addressInput"
import CardButton from "../shared/cardButton"
import DetailBlock from "../shared/detailBlock"
import Form from "../shared/form"
import InputField from "../shared/inputField"
import Label from "../shared/label.jsx"
import Map from "../shared/map.jsx"
import Screen from "../shared/screen"
import ScreenHeader from "../shared/screenHeader"
import Spacer from "../shared/spacer.jsx"
import ToggleButton from "../shared/toggleButton"
import ViewDropdown from "../shared/viewDropdown"

const Decisions = {
      approved: "APPROVED",
      declined: "DECLINED",
      delete: "DELETE",
}

export default function Handoff() {
      const {state, setState} = useContext(globalState)
      const {theme} = state
      const [declineReason, setDeclineReason] = useState("")
      const [showNewRequestCard, setShowNewRequestCard] = useState(false)
      const [activeRequest, setActiveRequest] = useState(null)
      const [showDetails, setShowDetails] = useState(false)
      const [view, setView] = useState({label: "Details", value: "Details"})
      const [sendWithAddress, setSendWithAddress] = useState(false)
      const [requestTimeRemaining, setRequestTimeRemaining] = useState(false)

      // Hooks
      const {handoffRequests, handoffRequestsAreLoading} = useHandoffRequests()
      const {currentUser, currentUserIsLoading} = useCurrentUser()
      const {coParents, coParentsAreLoading} = useCoParents()

      // Refs
      const formRef = React.useRef({...activeRequest, ...new HandoffChangeRequest()})

      const ResetForm = (successMessage = "") => {
            Manager.ResetForm("edit-event-form")
            setShowDetails(false)
            setView({label: "Details", value: "Details"})
            setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: successMessage})
      }

      const Update = async () => {
            let updatedRequest = ObjectManager.Merge(activeRequest, formRef.current, "deep")
            console.log("udpatedRequest", updatedRequest)
            const cleaned = ObjectManager.CleanObject(updatedRequest)
            if (cleaned?.owner?.key === currentUser?.key) {
                  const index = DB.GetIndexById(handoffRequests, cleaned?.id)
                  if (parseInt(index) === -1) return false
                  await DB.ReplaceEntireRecord(`${DB.tables.handoffChangeRequests}/${currentUser?.key}/${index}`, cleaned)
            }
            setActiveRequest(updatedRequest)
            setShowDetails(false)
            ResetForm("Handoff Request Updated")
      }

      const DeleteRequest = async (action = "deleted") => {
            if (action === "deleted") {
                  AlertManager.confirmAlert("Are you sure you would like to Delete this request?", "I'm Sure", true, async () => {
                        await DB.deleteById(`${DB.tables.handoffChangeRequests}/${currentUser?.key}`, activeRequest?.id)
                        setState({...state, successAlertMessage: "Handoff Change Request Deleted", refreshKey: Manager.GetUid()})
                        setShowDetails(false)
                  })
            }
      }

      const SelectDecision = async (decision) => {
            const recipient = coParents?.find((x) => x.userKey === activeRequest?.recipient?.key)
            const recipientName = recipient?.name
            // Rejected
            if (decision === Decisions.declined) {
                  activeRequest.status = "declined"
                  activeRequest.declineReason = declineReason
                  await DB.updateEntireRecord(`${DB.tables.handoffChangeRequests}/${activeRequest?.owner?.key}`, activeRequest, activeRequest.id)
                  const message = UpdateManager.templates.handoffChangeRequestRejection(activeRequest, recipientName)
                  await UpdateManager.SendUpdate(
                        "Handoff Request Decision",
                        message,
                        activeRequest?.owner?.key,
                        currentUser,
                        ActivityCategory.handoffChangeRequest
                  )
                  setShowDetails(false)
            }

            // Approved
            if (decision === Decisions.approved) {
                  activeRequest.status = "approved"
                  await DB.updateEntireRecord(`${DB.tables.handoffChangeRequests}/${activeRequest?.owner?.key}`, activeRequest, activeRequest.id)
                  const message = UpdateManager.templates.handoffChangeRequestApproval(activeRequest, recipientName)
                  setShowDetails(false)
                  await UpdateManager.SendUpdate(
                        "Handoff Request Decision",
                        message,
                        activeRequest?.owner?.key,
                        currentUser,
                        ActivityCategory.handoffChangeRequest
                  )
            }

            setState({...state, refreshKey: Manager.GetUid(), successAlertMessage: `Decision Sent to ${recipientName}`})
      }

      const CheckIn = async () => {
            setShowDetails(false)
            let notificationMessage = `${StringManager.GetFirstWord(StringManager.UppercaseFirstLetterOfAllWords(currentUser?.name))} at ${
                  activeRequest?.address
            }`
            if (!sendWithAddress) {
                  notificationMessage = `${StringManager.GetFirstWord(StringManager.UppercaseFirstLetterOfAllWords(currentUser?.name))} has arrived at the handoff destination`
            }

            await UpdateManager.SendUpdate(
                  "Handoff Destination Arrival",
                  notificationMessage,
                  formRef.current?.recipient?.key,
                  currentUser,
                  ActivityCategory.expenses
            )
            setState({...state, successAlertMessage: "Arrival Notification Sent"})
      }

      const GetFromOrToName = (key) => {
            if (key === currentUser?.key) {
                  return "Me"
            } else {
                  return coParents?.find((c) => c.userKey === key)?.name
            }
      }

      const GetCurrentUserAddress = async () => {
            // const address = await LocationManager.getAddress()
      }

      useEffect(() => {
            GetCurrentUserAddress().then((r) => r)
            setKey(process.env.REACT_APP_GOOGLE_MAPS_API_KEY)
      }, [])

      useEffect(() => {
            if (showDetails) {
                  setRequestTimeRemaining(moment(moment(activeRequest?.requestedResponseDate).startOf("day")).fromNow().toString())
            }
      }, [showDetails])

      useEffect(() => {
            if (Manager.IsValid(currentUser)) {
                  setTimeout(() => {
                        DomManager.ToggleAnimation("add", "row", DomManager.AnimateClasses.names.fadeInUp, 85)
                        DomManager.ToggleAnimation("add", "block", DomManager.AnimateClasses.names.fadeInUp, 85)
                  }, 300)
            }
      }, [currentUser, view])

      return (
            <Screen
                  activeScreen={ScreenNames.handoff}
                  loadingByDefault={true}
                  stopLoadingBool={!currentUserIsLoading && !coParentsAreLoading && !handoffRequestsAreLoading}>
                  {/* DETAILS CARD */}
                  <Form
                        submitText={"Approve"}
                        onDelete={() => DeleteRequest("deleted")}
                        title={"Request Details"}
                        hasDelete={activeRequest?.owner?.key === currentUser?.key && view?.label === "Edit"}
                        hasSubmitButton={activeRequest?.owner?.key !== currentUser?.key}
                        onSubmit={() => SelectDecision(Decisions.approved)}
                        wrapperClass="pickup-dropoff"
                        viewDropdown={<ViewDropdown dropdownPlaceholder="Details" selectedView={view} onSelect={(e) => setView(e)} />}
                        thirdButtonText="Decline"
                        className="pickup-dropoff"
                        extraButtons={[
                              <>
                                    {activeRequest?.owner?.key !== currentUser?.key && view?.label === "Edit" && (
                                          <CardButton
                                                onClick={() => {
                                                      AlertManager.inputAlert(
                                                            "Reason for Declining Request",
                                                            "Please enter the reason for declining this request",
                                                            (e) => {
                                                                  if (e.value.length === 0) {
                                                                        AlertManager.throwError("Reason for declining is required")
                                                                        return false
                                                                  } else {
                                                                        SelectDecision(Decisions.declined).then(ResetForm)
                                                                        setDeclineReason(e.value)
                                                                  }
                                                            },
                                                            true,
                                                            true,
                                                            "textarea"
                                                      )
                                                }}
                                                text="Decline"
                                                buttonTheme={ButtonThemes.red}
                                                key={Manager.GetUid()}
                                          />
                                    )}
                                    ,
                                    <CardButton buttonTheme={ButtonThemes.green} key={Manager.GetUid()} onClick={Update} text={"Update"} />
                              </>,
                        ]}
                        hasThirdButton={true}
                        onClose={() => ResetForm()}
                        showCard={showDetails}>
                        <div className={`details content ${activeRequest?.requestReason?.length > 20 ? "long-text" : ""}`}>
                              {view?.label === "Details" && (
                                    <>
                                          {/* BLOCKS */}
                                          <div className="blocks">
                                                {/* Start Date */}
                                                <DetailBlock
                                                      text={moment(activeRequest?.startDate).format(
                                                            DatetimeFormats.readableMonthAndDayWithDayDigitOnly
                                                      )}
                                                      valueToValidate={activeRequest?.startDate}
                                                      title={"Handoff Date"}
                                                />

                                                {/*  End Date */}
                                                <DetailBlock
                                                      text={moment(activeRequest?.endDate).format(
                                                            DatetimeFormats.readableMonthAndDayWithDayDigitOnly
                                                      )}
                                                      valueToValidate={activeRequest?.endDate}
                                                      title={"Return Date"}
                                                />

                                                {/*  Time */}
                                                <DetailBlock
                                                      text={moment(activeRequest?.time, DatetimeFormats.timeForDb).format(DatetimeFormats.timeForDb)}
                                                      valueToValidate={activeRequest?.time}
                                                      title={"Handoff Time"}
                                                />

                                                {/*  Response Due Date */}
                                                <DetailBlock
                                                      valueToValidate={activeRequest?.requestedResponseDate}
                                                      title={"Requested Response Date"}
                                                      text={moment(activeRequest?.requestedResponseDate).format(
                                                            DatetimeFormats.readableMonthAndDayWithDayDigitOnly
                                                      )}
                                                />

                                                {/*  Time Remaining */}
                                                <DetailBlock
                                                      classes={requestTimeRemaining.toString().includes("ago") ? "red" : "green"}
                                                      title={"Response Time Remaining"}
                                                      text={`${requestTimeRemaining}`}
                                                      valueToValidate={requestTimeRemaining}
                                                />

                                                {/* FROM/TO */}
                                                <DetailBlock
                                                      title={"From"}
                                                      valueToValidate={"From"}
                                                      text={GetFromOrToName(activeRequest?.owner?.key)}
                                                />
                                                <DetailBlock
                                                      title={"To"}
                                                      valueToValidate={"To"}
                                                      text={GetFromOrToName(activeRequest?.recipient?.key)}
                                                />

                                                {/* REASON */}
                                                <DetailBlock
                                                      text={activeRequest?.requestReason}
                                                      valueToValidate={activeRequest?.requestReason}
                                                      isFullWidth={true}
                                                      title={"Reason for Request"}
                                                />
                                          </div>

                                          <div className="multiline-blocks">
                                                {/* Location */}
                                                <DetailBlock
                                                      isNavLink={true}
                                                      title={"Go"}
                                                      text={activeRequest?.address}
                                                      valueToValidate={activeRequest?.address}
                                                      linkUrl={activeRequest?.address}
                                                />

                                                {/*  CHECK IN */}
                                                {activeRequest?.address && (
                                                      <DetailBlock title={"Check In"} valueToValidate={"Check In"} isCustom={true}>
                                                            <div className="card-icon-button" onClick={CheckIn}>
                                                                  <MdPersonPinCircle />
                                                                  <span className="location-pin-animation"></span>
                                                            </div>
                                                            <Spacer height={2} />
                                                      </DetailBlock>
                                                )}
                                          </div>
                                          <Spacer height={2} />

                                          {/*  SEND WITH ADDRESS */}
                                          {Manager.IsValid(activeRequest?.address) && (
                                                <>
                                                      <div className="flex send-with-address-toggle">
                                                            <Label text={"Include Address with Check-In"} classes="toggle " />
                                                            <ToggleButton
                                                                  onCheck={() => setSendWithAddress(!sendWithAddress)}
                                                                  toggleState={sendWithAddress}
                                                            />
                                                      </div>
                                                      <Spacer height={5} />
                                                      {/* MAP */}
                                                      {Manager.IsValid(activeRequest?.address, true) && (
                                                            <Map locationString={activeRequest?.address} />
                                                      )}
                                                </>
                                          )}
                                    </>
                              )}

                              {view?.label === "Edit" && (
                                    <>
                                          {/* DATE */}
                                          <InputField
                                                defaultValue={moment(activeRequest?.startDate)}
                                                inputType={InputTypes.date}
                                                placeholder={"Date"}
                                                uidClass="handoff-request-date"
                                                onDateOrTimeSelection={(e) =>
                                                      (formRef.current.startDate = moment(e).format(DatetimeFormats.dateForDb))
                                                }
                                          />

                                          {/* TIME */}
                                          <InputField
                                                defaultValue={activeRequest?.time}
                                                inputType={InputTypes.time}
                                                uidClass="handoff-request-time"
                                                placeholder={"Handoff Time"}
                                                onDateOrTimeSelection={(e) => (formRef.current.time = moment(e).format(DatetimeFormats.timeForDb))}
                                          />

                                          {/*  NEW LOCATION*/}
                                          <AddressInput
                                                placeholder={"Address"}
                                                defaultValue={activeRequest?.address}
                                                onChange={(address) => (formRef.current.address = address)}
                                          />

                                          {/* RESPONSE DUE DATE */}
                                          <InputField
                                                defaultValue={activeRequest?.requestedResponseDate}
                                                onDateOrTimeSelection={(e) =>
                                                      (formRef.current.requestedResponseDate = moment(e).format(DatetimeFormats.dateForDb))
                                                }
                                                inputType={InputTypes.date}
                                                uidClass="handoff-request-response-date"
                                                placeholder={"Requested Response Date"}
                                          />

                                          {/* REASON */}
                                          {activeRequest?.owner?.key !== currentUser?.key && (
                                                <InputField
                                                      defaultValue={activeRequest?.requestReason}
                                                      onChange={(e) => (formRef.current.reason = e)}
                                                      inputType={InputTypes.textarea}
                                                      placeholder={"Reason for Request"}
                                                />
                                          )}
                                    </>
                              )}
                        </div>
                  </Form>

                  <div id="handoff-requests-container" className={`${theme} page-container`}>
                        <ScreenHeader
                              title={"Handoff Requests"}
                              titleIcon={<RiMapPinTimeFill />}
                              screenDescription="Submit or review requests to change pickup/drop-off time (and/or location) for a given date"
                              showNewRequestCard={showNewRequestCard}
                              toggleNewRequestCard={() => setShowNewRequestCard(!showNewRequestCard)}
                        />

                        <Spacer height={10} />
                        <div className="screen-content">
                              {handoffRequests?.length === 0 && <p className={"no-data-fallback-text"}>No Requests</p>}
                              {/* LOOP REQUESTS */}
                              {!showNewRequestCard && (
                                    <div>
                                          {Manager.IsValid(handoffRequests) &&
                                                handoffRequests?.map((request, index) => {
                                                      return (
                                                            <div
                                                                  key={index}
                                                                  className="flex row"
                                                                  onClick={() => {
                                                                        console.log(request)
                                                                        setActiveRequest(request)
                                                                        setShowDetails(true)
                                                                  }}>
                                                                  <div data-request-id={request.id} className="content">
                                                                        {/* DATE */}
                                                                        <p className="row-title">
                                                                              {moment(request.startDate).format(DatetimeFormats.readableMonthAndDay)}
                                                                              <span className={`${request.status} request-status`}>
                                                                                    {StringManager.UppercaseFirstLetterOfAllWords(request.status)}
                                                                              </span>
                                                                        </p>
                                                                        {request?.recipient?.key === currentUser?.key && (
                                                                              <p className="row-subtitle">
                                                                                    from {coParents.find((x) => x.key === request.owner?.key)?.name}
                                                                              </p>
                                                                        )}
                                                                        {request?.recipient?.key !== currentUser?.key && (
                                                                              <p className="row-subtitle">
                                                                                    to&nbsp;
                                                                                    {StringManager.GetFirstNameOnly(
                                                                                          coParents?.find(
                                                                                                (x) => x?.userKey === request?.recipient?.key
                                                                                          )?.name
                                                                                    )}
                                                                              </p>
                                                                        )}
                                                                  </div>
                                                            </div>
                                                      )
                                                })}
                                    </div>
                              )}
                        </div>
                        <NavBar />
                  </div>
            </Screen>
      )
}