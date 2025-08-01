// Path: src\components\screens\auth\registration.jsx
import {initializeApp} from "firebase/app"
import {createUserWithEmailAndPassword, getAuth} from "firebase/auth"
import React, {useContext, useEffect, useRef, useState} from "react"
import PasswordChecklist from "react-password-checklist"
import validator from "validator"
import InputTypes from "../../../constants/inputTypes"
import ModelNames from "../../../constants/modelNames"
import ScreenNames from "../../../constants/screenNames"
import globalState from "../../../context"
import DB from "../../../database/DB"
import DB_UserScoped from "../../../database/db_userScoped"
import firebaseConfig from "../../../firebaseConfig"
import AlertManager from "../../../managers/alertManager"
import DatasetManager from "../../../managers/datasetManager"
import DomManager from "../../../managers/domManager"
import LogManager from "../../../managers/logManager"
import Manager from "../../../managers/manager"
import ObjectManager from "../../../managers/objectManager"
import SmsManager from "../../../managers/smsManager.js"
import StringManager from "../../../managers/stringManager"
import Child from "../../../models/child/child"
import General from "../../../models/child/general"
import Form from "../../shared/form"
import InputField from "../../shared/inputField"
import SelectDropdown from "../../shared/selectDropdown"
import Spacer from "../../shared/spacer"

const Steps = {
    Form: "form",
    Onboarding: "onboarding",
    RequestParentAccess: "requestParentAccess",
    VerifyParentAccessCode: "verifyParentAccessCode",
}

export default function Registration() {
    const {state, setState} = useContext(globalState)
    const {registrationExitStep, authUser} = state

    const [accountType, setAccountType] = useState("")
    const [password, setPassword] = useState("")
    const [confirmedPassword, setConfirmedPassword] = useState("")

    // PARENT ACCESS CODE VERIFICATION
    const [enteredCode, setEnteredCode] = useState("")
    const [verificationCode, setVerificationCode] = useState("")

    // STATE
    const [activeStep, setActiveStep] = useState(Manager.IsValid(registrationExitStep) ? Steps.RequestParentAccess : Steps.Form)
    const [localCurrentUser, setLocalCurrentUser] = useState()
    const [showCreateButton, setShowCreateButton] = useState(false)
    const [onboardingScreen, setOnboardingScreen] = useState(1)
    const [codeRetryCount, setCodeRetryCount] = useState(0)

    // REF
    const userRef = useRef({phoneNumber: "", email: "", name: "", password: "", confirmedPassword: ""})
    const parentRef = useRef({phoneNumber: "", email: ""})

    // Firebase init
    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)

    // SUBMIT
    const Submit = async () => {
        setState({...state, isLoading: true})
        if (!validator.isEmail(userRef.current.email)) {
            AlertManager.throwError("Email address is not valid")
            setState({...state, isLoading: false})
            return false
        }
        if (!validator.isMobilePhone(userRef.current.phone) || !StringManager.IsNotAllSameNumber(userRef.current.phone)) {
            AlertManager.throwError("Phone number is not valid")
            setState({...state, isLoading: false})
            return false
        }
        if (!Manager.IsValid(confirmedPassword) || !Manager.IsValid(password)) {
            AlertManager.throwError("Please enter a password")
            return false
        }

        if (password !== confirmedPassword) {
            AlertManager.throwError("Passwords do not match")
            setState({...state, isLoading: false})
            return false
        }

        const errorString = Manager.GetInvalidInputsErrorString([
            {name: "Your Name", value: userRef.current.name},
            {name: "Your Phone Number", value: userRef.current.phone},
            {name: "Profile Type", value: accountType},
            {name: "Email", value: userRef.current.email},
            {name: "Password", value: password},
            {name: "Password Confirmation", value: confirmedPassword},
        ])

        if (Manager.IsValid(errorString, true)) {
            AlertManager.throwError(errorString)
            setState({...state, isLoading: false})
            return false
        }

        localStorage.setItem("pcp_registration_started", "true")

        // CREATE FIREBASE USER
        createUserWithEmailAndPassword(auth, userRef.current.email, password)
            .then(async (userCredential) => {
                try {
                    // Signed up successfully
                    const user = userCredential.user
                    await SmsManager.Send(
                        "3307494534",
                        `New Registration: ${user.email} \n\n Key: ${user?.uid} \n\n Account Type: ${accountType} \n\n Name: ${name} \n\n Phone Number: ${userRef.current.phone}`
                    )

                    const userObject = {
                        phone: userRef.current.phone,
                        email: userRef.current.email,
                        accountType,
                        authUser: user,
                        name,
                        key: user?.uid,
                    }

                    // INSERT USER TO DATABASE
                    const newUser = await DB_UserScoped.CreateAndInsertUser(userObject)
                    setLocalCurrentUser(newUser)

                    setState({
                        ...state,
                        currentUser: newUser,
                        isLoading: false,
                        bannerMessage: "Profile Created",
                    })

                    if (accountType === "parent") {
                        setActiveStep(Steps.Onboarding)
                    } else {
                        setActiveStep(Steps.RequestParentAccess)
                    }

                    if (accountType === "parent") {
                        localStorage.removeItem("pcp_registration_started")
                    }
                } catch (error) {
                    localStorage.removeItem("pcp_registration_started")
                    LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
                    setState({...state, isLoading: false})
                }
            })
            .catch((error) => {
                localStorage.removeItem("pcp_registration_started")
                console.error("Sign up error:", error.message)
                LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
                if (Manager.Contains(error.message, "email-already-in-use")) {
                    AlertManager.throwError(`Account already exists. If you meant to login, ${DomManager.tapOrClick()} Back to Login below`)
                    setState({...state, isLoading: false})
                    return false
                }
            })
    }

    const HandleAccountType = (type) => {
        DomManager.HandleCheckboxSelection(
            type,
            (type) => {
                setAccountType(type.toLowerCase())
            },
            () => {},
            false
        )
    }

    const SendParentAccessCode = async (codeResent = false) => {
        // Create profile for (this user) child
        const errorString = Manager.GetInvalidInputsErrorString([
            {name: "Parent Email", value: parentRef.current.email},
            {name: "Parent Phone", value: parentRef.current.phoneNumber},
        ])

        if (Manager.IsValid(errorString)) {
            AlertManager.throwError(errorString)
            return false
        }
        if ((!parentRef.current.phoneNumber || !validator.isMobilePhone(parentRef.current.phoneNumber)) && !codeResent) {
            AlertManager.throwError("Phone number is not valid")
            return false
        } else {
            const parent = await DB.find(DB.tables.users, ["email", parentRef.current.email], true)

            if (!parent) {
                AlertManager.throwError(
                    "No Parent Profile Found",
                    "Please check the email and enter again, or let your parent know they will need to register an account"
                )
                return false
            }

            if (parentRef.current.phoneNumber === localCurrentUser?.phone) {
                AlertManager.throwError("Unable to request access", "Your parent's phone number cannot be your phone number")
                return false
            }

            const phoneCode = Manager.GetUid().slice(0, 6)
            setVerificationCode(phoneCode)
            setState({...state, isLoading: true, loadingText: "Sending access code to your parent..."})
            await SmsManager.Send(
                parentRef.current.phoneNumber,
                SmsManager.Templates.ParentChildVerification(StringManager.GetFirstNameOnly(name), phoneCode)
            )
            setState({...state, isLoading: false})
            setActiveStep(Steps.VerifyParentAccessCode)
        }
    }

    const VerifyParentAccessCode = async () => {
        if (enteredCode.length === 0) {
            AlertManager.throwError("Access code is required")
            return false
        }

        // Access granted
        try {
            if (enteredCode === verificationCode) {
                const existingParentAccount = await DB.find(DB.tables.users, ["email", parentRef.current.email], true)

                if (existingParentAccount) {
                    let currentUserToUse = localCurrentUser

                    if (!Manager.IsValid(currentUserToUse)) {
                        currentUserToUse = await DB.find(DB.tables.users, ["email", authUser?.email], true)
                    }
                    const existingChild = existingParentAccount?.children?.find(
                        (x) => x?.general?.phone === currentUserToUse?.phone || x?.general?.email === currentUserToUse?.email
                    )

                    // ADD OR UPDATE CHILD RECORD UNDER PARENT
                    // -> Add child to parent
                    if (!Manager.IsValid(existingChild)) {
                        const childToAdd = new Child()
                        const general = new General()
                        general.phone = currentUserToUse?.phone
                        general.name = StringManager.UppercaseFirstLetterOfAllWords(name)
                        general.email = currentUserToUse?.email
                        childToAdd.general = general
                        childToAdd.userKey = currentUserToUse?.key

                        // Add child key to parent sharedDataUserKeys
                        const updatedSharedDataUsers = DatasetManager.AddToArray(existingParentAccount?.sharedDataUserKeys, currentUserToUse?.key)
                        await DB.UpdateByPath(`${DB.tables.users}/${existingParentAccount?.key}/sharedDataUserKeys`, updatedSharedDataUsers)

                        // Add child to parent's children array
                        const cleanChild = ObjectManager.GetModelValidatedObject(childToAdd, ModelNames.child)
                        await DB_UserScoped.AddChildToParentProfile(existingParentAccount, cleanChild)
                    }

                    // -> Update
                    else {
                        const existingChildKey = DB.GetChildIndex(currentUserToUse?.children, existingChild?.id)

                        if (Manager.IsValid(existingChildKey)) {
                            await DB.UpdateByPath(
                                `${DB.tables.users}/${existingParentAccount?.key}/children/${existingChildKey}/userKey/${currentUserToUse?.key}`,
                                existingChild
                            )
                        }
                    }

                    // Add parent to child
                    const newParent = {
                        name: existingParentAccount?.name,
                        phone: existingParentAccount?.phone,
                        userKey: existingParentAccount?.key,
                        email: existingParentAccount?.email,
                    }
                    const cleanParent = ObjectManager.GetModelValidatedObject(newParent, ModelNames.parent)
                    await DB_UserScoped.AddParent(currentUserToUse, cleanParent)
                    await DB_UserScoped.updateUserRecord(currentUserToUse?.key, "parentAccessGranted", true)
                    await DB_UserScoped.updateUserRecord(currentUserToUse?.key, "sharedDataUserKeys", [existingParentAccount?.key])
                    localStorage.removeItem("pcp_registration_started")
                    setActiveStep(Steps.Onboarding)
                } else {
                    AlertManager.throwError(
                        "No parent profile found with provided email",
                        "Please check the email and enter again or let your parent know they will need to register an account"
                    )
                    return false
                }
            } else {
                if (codeRetryCount === 1) {
                    AlertManager.throwError(
                        "Access code is incorrect",
                        "Registration will be aborted for security reasons if access code is incorrect after 5 attempts"
                    )
                    setCodeRetryCount(codeRetryCount + 1)
                    return false
                }
                if (codeRetryCount > 4) {
                    AlertManager.confirmAlert(
                        "Registration aborted for security reasons. Please check the access code with your parent and try again, contact us if the issue continues",
                        "Ok",
                        false,
                        () => setState({...state, currentScreen: ScreenNames.login})
                    )
                    setCodeRetryCount(0)
                    return false
                }
                AlertManager.throwError("Access code is incorrect, please try again")
                setCodeRetryCount(codeRetryCount + 1)
                return false
            }
        } catch (error) {
            // console.log(`Error: ${error} | Code File: requestParentAccess   | Function: VerifyPhoneCode`)
            LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
        }
    }

    useEffect(() => {
        const errorString = Manager.GetInvalidInputsErrorString([
            {name: "Your Name", value: name},
            {name: "Your Phone Number", value: userRef.current.phone},
            {name: "Profile Type", value: accountType},
            {name: "Email", value: userRef.current.email},
            {name: "Password", value: password},
            {name: "Password Confirmation", value: confirmedPassword},
        ])

        if (!Manager.IsValid(errorString, true)) {
            setShowCreateButton(true)
        }
    }, [userRef.current.phone, userRef.current.email, userRef.current.name, accountType, password, confirmedPassword])

    useEffect(() => {
        window.onbeforeunload = function () {
            // Code to execute before the page is unloaded (refreshed or navigated away)
            return "Are you sure you want to leave the page? Any unsaved changes will be lost." // Optional message to confirm
        }
    }, [])

    return (
        <Form
            onSubmit={Submit}
            cancelButtonText="Back to Login"
            onClose={() => setState({...state, currentScreen: ScreenNames.login})}
            subtitle="Please provide your information below to set up an account and begin your harmonious co-parenting experience"
            title={"Sign Up"}
            wrapperClass="registration at-top"
            showCard={true}
            submitText={accountType.toLowerCase() === "parent" ? "Create Account" : "Request Access Code"}>
            {/* PAGE CONTAINER */}
            <div id="registration-container" className="">
                {/* FORM */}
                {activeStep === Steps.Form && (
                    <>
                        <Spacer height={15} />

                        {/* PARENT FORM */}
                        <InputField
                            inputType={InputTypes.text}
                            inputName="Name"
                            required={true}
                            placeholder={"Name"}
                            onChange={(e) => (userRef.current.name = e.target.value)}
                        />

                        {/* PHONE */}
                        <InputField
                            inputType={InputTypes.phone}
                            required={true}
                            placeholder={"Phone Number"}
                            onChange={(e) => (userRef.current.phone = e.target.value)}
                        />

                        {/* EMAIL */}
                        <InputField
                            inputType={InputTypes.email}
                            required={true}
                            placeholder={"Email Address"}
                            onChange={(e) => (userRef.current.email = e.target.value)}
                        />

                        {/* PASSWORD */}
                        <InputField
                            inputType={InputTypes.password}
                            inputValueType="password"
                            required={true}
                            placeholder={"Password"}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {/* CONFIRM PASSWORD */}
                        <InputField
                            inputType={InputTypes.password}
                            inputValueType="password"
                            required={true}
                            placeholder={"Confirm Password"}
                            onChange={(e) => setConfirmedPassword(e.target.value)}
                        />

                        {/* PASSWORD CHECKLIST */}
                        <PasswordChecklist
                            rules={["minLength", "specialChar", "number", "capital", "match", "notEmpty"]}
                            minLength={5}
                            className={"password-validation"}
                            value={password}
                            valueAgain={confirmedPassword}
                            onChange={(isValid) => {
                                if (isValid) {
                                    setConfirmedPassword(password)
                                }
                            }}
                        />

                        <Spacer height={10} />

                        {/* ACCOUNT TYPE */}
                        <SelectDropdown
                            onSelect={(e) => setAccountType(e)}
                            placeholder={"Profile Type (cannot be changed later)"}
                            options={[
                                {label: "Parent", value: "Parent"},
                                {label: "Child", value: "Child"},
                            ]}
                        />
                    </>
                )}

                {/* REQUEST PARENT ACCESS */}
                {activeStep === Steps.RequestParentAccess && (
                    <>
                        <p className="screen-title">Request Access from Parent</p>
                        <Spacer height={5} />
                        <p>To ensure privacy and security, your parent needs to provide a code for you to gain access.</p>
                        <Spacer height={5} />
                        <p>
                            When you enter your parent&#39;s phone number and {DomManager.tapOrClick()} the <b>Request Access</b> button, a text
                            message containing the code will be sent to them.
                        </p>
                        <Spacer height={5} />
                        <p>Please ask your parent for the code and enter it below.</p>

                        <Spacer height={15} />
                        {/* PARENT EMAIL */}
                        <InputField
                            inputType={InputTypes.email}
                            required={true}
                            placeholder={"Parent Email Address"}
                            onChange={(e) => (parentRef.current.email = e.target.value)}
                        />
                        {/* PARENT PHONE */}
                        <InputField
                            inputType={InputTypes.phone}
                            required={true}
                            placeholder={"Parent Phone Number"}
                            onChange={(e) => (parentRef.current.phone = e.target.value)}
                        />
                        <button className="button default green center" onClick={SendParentAccessCode}>
                            Send Access Code
                        </button>
                    </>
                )}

                {/* VERIFY PARENT ACCESS CODE */}
                {activeStep === Steps.VerifyParentAccessCode && (
                    <>
                        <p className="screen-title">Verify Access Code</p>
                        <Spacer height={10} />
                        <InputField
                            placeholder={"Access Code"}
                            inputType={InputTypes.text}
                            required={true}
                            onChange={(e) => setEnteredCode(e.target.value)}
                        />
                        <Spacer height={10} />
                        <button className="button w-50 default green center" onClick={VerifyParentAccessCode}>
                            Verify Code
                        </button>
                        <Spacer height={5} />
                        <button
                            className="button default grey center w-50"
                            onClick={async () => {
                                setEnteredCode("")
                                setVerificationCode("")
                                await SendParentAccessCode(true)
                            }}>
                            Resend
                        </button>
                    </>
                )}

                {/* ONBOARDING */}
                {activeStep === Steps.Onboarding && (
                    <>
                        <div id="onboarding">
                            <div className={onboardingScreen === 1 ? "active screen" : "screen"}>
                                {/* eslint-disable-next-line no-undef */}
                                {/*<img src={require('../../../img/onboarding/welcome.gif')} alt="" />*/}

                                <div className="text-content">
                                    <Spacer height={10} />
                                    <p className="title">You Have Arrived!</p>
                                    <Spacer height={5} />
                                    {accountType === "parent" && (
                                        <p className="text">
                                            Now you can dive into the world of peaceful co-parenting. You’ll be able to share important details such
                                            as expenses and visitation schedules with your co-parent(s).
                                        </p>
                                    )}
                                    {accountType === "child" && (
                                        <p className="text">Now you can dive in and share important details between you and your parent(s)</p>
                                    )}
                                    <Spacer height={5} />
                                    {accountType === "parent" && (
                                        <p className="text">
                                            If you have kids who use the app, you can share calendar events and other essential information with them
                                            too.
                                        </p>
                                    )}
                                </div>
                                <Spacer height={10} />
                                <button onClick={() => setOnboardingScreen(2)}>Next</button>
                            </div>

                            {/* SCREEN 2   */}
                            <div className={onboardingScreen === 2 ? "active screen" : "screen"}>
                                {/* eslint-disable-next-line no-undef */}
                                {/*<img src={require('../../../img/onboarding/calendar.gif')} alt="" />*/}

                                <div className="text-content">
                                    <Spacer height={10} />
                                    <p className="title">So How Does it Work?</p>
                                    <Spacer height={5} />
                                    <p className="text">
                                        In order to share with a {accountType === "parent" ? "co-parent" : "child"}, you will need to add them to your
                                        profile.
                                    </p>
                                    <div className="steps">
                                        <ol>
                                            <li>
                                                Tap the <b>{accountType === "parent" ? "Co-Parents or Children" : "Parents"}</b> menu option
                                            </li>
                                            <li>
                                                Tap <b>More</b> from the navigation bar
                                            </li>
                                            <li>
                                                Tap the <b>Add {accountType === "parent" ? "Co-Parent or Child" : "Parent"}</b> option
                                            </li>
                                        </ol>
                                    </div>
                                    <Spacer height={5} />
                                    <p className="text">
                                        Once that is completed you can begin sharing with your{" "}
                                        {accountType === "parent" ? "co-parents and children" : "parents"}.
                                    </p>
                                </div>
                                <Spacer height={10} />
                                <button onClick={() => setState({...state, currentScreen: ScreenNames.login})}>Let&#39;s Go!</button>
                            </div>
                        </div>
                    </>
                )}

                {/* BACK TO LOG IN BUTTON */}
                {/*<div id="registration-buttons" className="card-buttons">*/}
                {/*  {showCreateButton &&*/}
                {/*    activeStep !== Steps.VerifyParentAccessCode &&*/}
                {/*    activeStep !== Steps.RequestParentAccess &&*/}
                {/*    activeStep !== Steps.Onboarding && (*/}
                {/*      <button*/}
                {/*        className="button default green"*/}
                {/*        onClick={() => {*/}
                {/*          AlertManager.confirmAlert(*/}
                {/*            'Are the details you provided correct? Profile Type cannot be changed after signing up',*/}
                {/*            'Yes',*/}
                {/*            'No',*/}
                {/*            async () => await Submit()*/}
                {/*          )*/}
                {/*        }}>*/}
                {/*        {accountType.toLowerCase() === 'parent' ? 'Create Profile' : 'Request Access'} <LuArrowRight />*/}
                {/*      </button>*/}
                {/*    )}*/}
                {/*</div>*/}
            </div>
        </Form>
    )
}