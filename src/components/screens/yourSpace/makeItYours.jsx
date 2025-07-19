import {initializeApp} from "firebase/app"
import {EmailAuthProvider, getAuth, reauthenticateWithCredential, signOut, updateEmail} from "firebase/auth"
import React, {useContext, useState} from "react"
import {IoIosRemoveCircle} from "react-icons/io"
import {MdOutlineAppShortcut, MdThumbsUpDown, MdTipsAndUpdates} from "react-icons/md"
import validator from "validator"
import InputTypes from "../../../constants/inputTypes"
import ScreenNames from "../../../constants/screenNames"
import globalState from "../../../context.js"
import DB from "../../../database/DB"
import DB_UserScoped from "../../../database/db_userScoped"
import Storage from "../../../database/storage"
import firebaseConfig from "../../../firebaseConfig"
import useCurrentUser from "../../../hooks/useCurrentUser"
import AlertManager from "../../../managers/alertManager"
import EmailManager from "../../../managers/emailManager"
import Manager from "../../../managers/manager"
import StringManager from "../../../managers/stringManager"
import UpdateManager from "../../../managers/updateManager"
import NavBar from "../../navBar"
import Form from "../../shared/form"
import InputField from "../../shared/inputField"
import Label from "../../shared/label"
import Screen from "../../shared/screen"
import ScreenHeader from "../../shared/screenHeader"
import Spacer from "../../shared/spacer"
import Profile from "./profile"
import ResetPassword from "./resetPassword"
import Settings from "./settings"

export default function MakeItYours() {
      const {state, setState} = useContext(globalState)
      const {theme} = state
      const {currentUser} = useCurrentUser()

      // STATE
      const [featureName, setFeatureName] = useState("")
      const [featureDescription, setFeatureDescription] = useState("")
      const [showFeatureRequestCard, setShowFeatureRequestCard] = useState(false)
      const [feedback, setFeedback] = useState("")
      const [showFeedbackCard, setShowFeedbackCard] = useState(false)
      const [showResetPasswordForm, setShowResetPasswordForm] = useState(false)
      const [updateType, setUpdateType] = useState("email")
      const [showUpdateCard, setShowUpdateCard] = useState(false)
      const [email, setEmail] = useState("")
      const [phone, setPhone] = useState("")
      const [showUpdateEmailForm, setShowUpdateEmailForm] = useState(false)

      // Init Firebase
      const app = initializeApp(firebaseConfig)
      const auth = getAuth(app)
      const firebaseUser = auth.currentUser

      const ResetFormFeatureRequestForm = () => {
            Manager.ResetForm("feature-request-wrapper")
            setFeatureName("")
            setFeatureDescription("")
      }

      const Logout = () => {
            signOut(auth)
                  .then(() => {
                        const screenOverlay = document.getElementById("screen-overlay")
                        if (screenOverlay) {
                              screenOverlay.classList.remove("active")
                        }
                        setState({
                              ...state,
                              currentScreen: ScreenNames.login,
                              currentUser: null,
                              userIsLoggedIn: false,
                              isLoading: false,
                        })
                        // Sign-out successful.
                        console.log("User signed out")
                  })
                  .catch((error) => {
                        // An error happened.
                        console.log(error)
                  })
      }

      const UpdateUserEmail = async () => {
            AlertManager.successAlert("Email has been updated!")
            if (!Manager.IsValid(email)) {
                  AlertManager.throwError(
                        `Please enter your new ${StringManager.UppercaseFirstLetterOfAllWords(updateType)} ${updateType === "phone" ? "number" : "Address"}`
                  )
                  return false
            }
            if (!validator?.isEmail(email)) {
                  AlertManager.throwError("Email is not valid")
                  return false
            }
            AlertManager.inputAlert(
                  "Enter Your Password",
                  "To update your email, we need to re-authenticate your profile for security purposes",
                  (e) => {
                        const user = auth.currentUser
                        const credential = EmailAuthProvider.credential(user.email, e.value)
                        reauthenticateWithCredential(auth.currentUser, credential)
                              .then(async () => {
                                    // User re-authenticated.
                                    await updateEmail(auth.currentUser, email, {
                                          email: email,
                                    })
                                    await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser?.key}/email`, email)
                                    setState({...state, isLoading: false})
                                    Logout()
                              })
                              .catch((error) => {
                                    // An error occurred
                                    if (Manager.Contains(error.message, "auth/wrong-password")) {
                                          AlertManager.throwError("Password is incorrect")
                                    }
                                    if (Manager.Contains(error.message, "email-already-in-use")) {
                                          AlertManager.throwError("Profile already exists with this email")
                                    }
                                    console.log(error.message)
                                    // ...
                              })
                  },
                  true,
                  true,
                  "text",
                  "yellow"
            )
      }

      const UpdateUserPhone = async () => {
            if (!Manager.IsValid(phone)) {
                  AlertManager.throwError(`Please enter your new ${StringManager.UppercaseFirstLetterOfAllWords(updateType)} Number`)
                  return false
            }
            if (!validator?.isMobilePhone(phone)) {
                  AlertManager.throwError("Phone number is not valid")
                  return false
            }

            // Update Phone
            if (updateType === "phone") {
                  await DB_UserScoped.updateUserContactInfo(currentUser, currentUser?.phone, phone, "phone")
                  AlertManager.successAlert("Phone number has been updated")
                  Logout()
            }
      }

      const ResetFeedbackForm = () => {
            Manager.ResetForm("feedback-wrapper")
            setFeatureName("")
            setFeatureDescription("")
      }

      const SubmitFeatureRequest = () => {
            if (!Manager.IsValid(featureDescription, true)) {
                  AlertManager.throwError("Please share a description of the feature you are interested in requesting")
                  return false
            } else {
                  setState({...state, successAlertMessage: "Feature Request Received"})
                  EmailManager.SendFeatureRequest(currentUser?.email, `Feature Name: ${featureName} \n Description: ${featureDescription}`)
                  // setShowFeatureRequestCard(false)
                  ResetFormFeatureRequestForm()
            }
      }

      const SubmitFeedback = () => {
            if (feedback.length === 0) {
                  AlertManager.throwError("Please enter your feedback")
                  return false
            }
            setState({...state, successAlertMessage: "Thank you for Your Feedback!"})

            EmailManager.SendAppFeedback(currentUser?.email, feedback)
            setShowFeedbackCard(false)
            ResetFeedbackForm()
      }

      const CloseAccount = async () => {
            AlertManager.inputAlert(
                  "Enter Your Password",
                  "In order to continue with the profile deletion process, you are required to enter your password for security (verification) purposes",
                  (e) => {
                        const user = auth.currentUser
                        const credential = EmailAuthProvider.credential(user.email, e.value)
                        if (!Manager.IsValid(e.value, true)) {
                              AlertManager.throwError("Password is required")
                              return false
                        }
                        reauthenticateWithCredential(auth.currentUser, credential)
                              .then(async () => {
                                    // // Delete from Firebase Storage
                                    const allStorageDirectories = Object.keys(Storage.directories)
                                    for (let dir of allStorageDirectories) {
                                          await Storage.deleteDirectory(dir, currentUser.key)
                                    }

                                    // Delete from OneSignal
                                    const subscriber = await DB.find(DB.tables.updateSubscribers, ["key", currentUser.key], true)

                                    if (subscriber) {
                                          await UpdateManager.deleteUser(subscriber?.oneSignalId, subscriber?.subscriptionId)
                                    }

                                    // Delete from Realtime Database
                                    await DB_UserScoped.deleteUserData(currentUser)

                                    // Delete from Firebase Auth
                                    firebaseUser
                                          .delete()
                                          .then(async () => {
                                                // Sign Out
                                                signOut(auth)
                                                      .then(() => {
                                                            window.location.reload()
                                                            // Sign-out successful.
                                                            console.log("User signed out")
                                                      })
                                                      .catch((error) => {
                                                            // An error happened.
                                                            console.log(error.message)
                                                      })
                                          })
                                          .catch((error) => {
                                                console.log(error.message)
                                          })
                              })
                              .catch((error) => {
                                    // An error ocurred
                                    console.log(error.message)
                                    // ...
                              })
                  },
                  true,
                  true,
                  "text",
                  "#b12643",
                  "white"
            )
      }

      return (
            <Screen activeScreen={ScreenNames.makeItYours}>
                  {/* FEATURE REQUEST */}
                  <Form
                        onSubmit={SubmitFeatureRequest}
                        submitText={"Send Request"}
                        wrapperClass="feature-request"
                        showCard={showFeatureRequestCard}
                        subtitle="We encourage you to request a new feature for the app! Whether big or small, we are excited to receive your ideas and may include YOUR feature suggestion in the app!"
                        onClose={() => setShowFeatureRequestCard(false)}
                        title={"Request New Feature"}>
                        <Spacer height={8} />
                        <div className="feature-request-wrapper">
                              <div id="feature-request-container" className={`${theme}`}>
                                    <InputField
                                          placeholder={"Feature Name"}
                                          required={true}
                                          onChange={(e) => setFeatureName(e.target.value)}
                                          inputType={InputTypes.text}
                                    />
                                    <Spacer height={3} />
                                    <InputField
                                          inputType={InputTypes.textarea}
                                          placeholder={StringManager.FormatTitle("Tell us all about your idea!")}
                                          required={true}
                                          onChange={(e) => setFeatureDescription(e.target.value)}
                                    />
                              </div>
                        </div>
                  </Form>

                  {/* RESET PASSWORD */}
                  <ResetPassword showCard={showResetPasswordForm} onClose={() => setShowResetPasswordForm(false)} />

                  {/* UPDATE CARD */}
                  <Form
                        onSubmit={async () => {
                              if (updateType === "phone") {
                                    await UpdateUserPhone()
                              } else {
                                    await UpdateUserEmail()
                              }
                        }}
                        submitText={`Update`}
                        onClose={() => {
                              setShowUpdateCard(false)
                        }}
                        wrapperClass="update-card"
                        showCard={showUpdateCard}
                        title={`Update your ${StringManager.UppercaseFirstLetterOfAllWords(updateType)}`}>
                        <div id="update-contact-info-container" className={`${theme}`}>
                              <InputField
                                    inputType={InputTypes.email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={"New Email Address"}
                                    required={true}></InputField>
                        </div>
                  </Form>

                  {/*  CARD */}
                  <Form
                        onSubmit={async () => {
                              console.log("here")
                        }}
                        onClose={() => {
                              setShowUpdateEmailForm(false)
                        }}
                        wrapperClass="re-auth-card"
                        submitButtonColor="red with-bg"
                        submitText={"Deactivate"}
                        showCard={showUpdateEmailForm}
                        title={"Please login to complete <br/>Account Deactivation"}>
                        <div id="reauthentication-wrapper" className={`${theme}`}>
                              <InputField
                                    onChange={(e) => setEmail(e?.currentTarget?.value)}
                                    placeholder={"Email Address"}
                                    inputType={InputTypes.email}
                                    required={true}
                              />
                              {/*<InputField*/}
                              {/*    onChange={(e) => setPhone(e?.currentTarget?.value)}*/}
                              {/*    placeholder={'Password'}*/}
                              {/*    inputType={InputTypes.password}*/}
                              {/*    required={true}*/}
                              {/*/>*/}
                        </div>
                  </Form>

                  {/* FEEDBACK */}
                  <Form
                        submitText={"Send Feedback"}
                        className="feedback-wrapper"
                        wrapperClass="feedback-wrapper form"
                        title={"Share Your Thoughts With Us"}
                        subtitle="Your feedback helps us improve the app! Whether it's a feature request or an feature needing improvement, we value your input."
                        onSubmit={SubmitFeedback}
                        showCard={showFeedbackCard}
                        onClose={() => setShowFeedbackCard(false)}>
                        <Spacer height={8} />
                        <div className="feedback-wrapper">
                              <div id="feedback-container" className={`${theme}`}>
                                    <InputField
                                          inputType={InputTypes.textarea}
                                          placeholder={"Thoughts here..."}
                                          required={true}
                                          onChange={(e) => setFeedback(e.target.value)}
                                          type="text"
                                    />
                              </div>
                        </div>
                  </Form>

                  {/* PAGE CONTAINER */}
                  <div id="make-it-yours-wrapper" className={`${theme} page-container`}>
                        <ScreenHeader
                              screenDescription={`Hey ${StringManager.GetFirstNameOnly(currentUser?.name)}! This is your space to tailor the app to your needs.`}
                              title={"Make It Yours"}
                              titleIcon={<MdOutlineAppShortcut />}
                        />
                        <Spacer height={10} />
                        <div className="screen-content">
                              {/* SETTINGS */}
                              <div className="section">
                                    <Label classes={"always-show section-title"} text={"App Preferences"} />
                                    <Spacer height={10} />
                                    <Settings />
                              </div>

                              {/* PROFILE */}
                              <div className="section">
                                    <Profile
                                          toggleUpdateEmailForm={() => setShowUpdateEmailForm(true)}
                                          toggleShowResetPasswordForm={() => setShowResetPasswordForm(true)}
                                    />
                              </div>

                              <div className="section">
                                    <Label classes={"always-show section-title"} text={"Share Your Thoughts"} />
                                    <Spacer height={10} />
                                    <p className="action-row feature-request" onClick={() => setShowFeatureRequestCard(true)}>
                                          <MdTipsAndUpdates />
                                          Feature Request
                                    </p>
                                    <p className="action-row feedback" onClick={() => setShowFeedbackCard(true)}>
                                          <MdThumbsUpDown />
                                          Share Feedback
                                    </p>
                              </div>

                              <p className="deactivate-account" onClick={CloseAccount}>
                                    Deactivate Account
                                    <IoIosRemoveCircle />
                              </p>
                        </div>
                  </div>
                  {<NavBar navbarClass={"profile no-Add-new-button"}></NavBar>}
            </Screen>
      )
}