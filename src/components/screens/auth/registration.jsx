import React, { useContext, useEffect, useState } from 'react'
import { child, getDatabase, ref, set } from 'firebase/database'
import PasswordChecklist from 'react-password-checklist'
import globalState from '/src/context.js'
import ScreenNames from '/src/constants/screenNames'
import User from '/src/models/user.js'
import ChildrenInput from '/src/components/childrenInput.jsx'
import CoparentInputs from '/src/components/coparentInput.jsx'
import CheckboxGroup from '/src/components/shared/checkboxGroup.jsx'
import SmsManager from '/src/managers/smsManager'
import ChildUser from '/src/models/child/childUser.js'
import { MdOutlineSecurity, MdOutlineSystemSecurityUpdateGood } from 'react-icons/md'
import AccordionSummary from '@mui/material/AccordionSummary'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import ModelNames from '/src/models/modelNames'
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth'
import firebaseConfig from '/src/firebaseConfig'
import { initializeApp } from 'firebase/app'
import BottomCard from '/src/components/shared/bottomCard'
import { PiInfoDuotone } from 'react-icons/pi'
import validator from 'validator'
import Label from '/src/components/shared/label'
import ObjectManager from '/src/managers/objectManager'
import AlertManager from '/src/managers/alertManager'
import InputWrapper from '/src/components/shared/inputWrapper'
import LogManager from '/src/managers/logManager.js'
import DateFormats from '../../../constants/dateFormats.js'
import moment from 'moment'
import DB from '../../../database/DB'
import Manager from '../../../managers/manager.js'
import StringManager from '../../../managers/stringManager.js'


export default function Registration() {
  const { state, setState } = useContext(globalState)
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmedPassword, setConfirmedPassword] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [children, setChildren] = useState([])
  const [parentType, setParentType] = useState('')
  const [accountType, setAccountType] = useState('')
  const [coparents, setCoparents] = useState([])
  const [parentTypeAccExpanded, setParentTypeAccExpanded] = useState(false)
  const [accountAlreadyExists, setAccountAlreadyExists] = useState(false)
  const [phoneIsVerified, setPhoneIsVerified] = useState(false)
  const [showVerificationCard, setShowVerificationCard] = useState(false)
  const [phoneVerificationSent, setPhoneVerificationSent] = useState(false)
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('')
  const [enteredPhoneCode, setEnteredPhoneCode] = useState('')

  // Firebase init
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const user = auth.currentUser


  // SUBMIT PARENT
  const submitParent = async () => {
    const validForm = await formIsValid() // Check for existing account

    if (validForm) {
      let newUser = new User()
      newUser.id = Manager.getUid()
      newUser.email = email
      newUser.name = StringManager.uppercaseFirstLetterOfAllWords(userName).trim()
      newUser.accountType = 'parent'
      newUser.children = children
      newUser.phone = StringManager.formatPhone(userPhone)
      newUser.coparents = coparents
      newUser.parentType = parentType
      newUser.settings.notificationsEnabled = true
      newUser.settings.theme = 'light'
      newUser.dailySummaries.eveningReminderSummaryHour = '8pm'
      newUser.dailySummaries.morningReminderSummaryHour = '10am'
      newUser.dailySummaries.eveningSentDate = moment().format(DateFormats.dateForDb)
      newUser.dailySummaries.morningSentDate = moment().format(DateFormats.dateForDb)
      createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
          try {
            const dbRef = ref(getDatabase())
            // Signed up successfully
            const user = userCredential.user
            console.log('Signed up as:', user.email)
            const cleanUser = ObjectManager.cleanObject(newUser, ModelNames.user)
            await set(child(dbRef, `users/${cleanUser.phone}`), cleanUser)
            AlertManager.successAlert(`Welcome aboard ${newUser.name}!`)
            setState({ ...state, currentScreen: ScreenNames.login })
          } catch (error) {
            LogManager.log(error.message, LogManager.logTypes.error)
          }
        })
        .catch((error) => {
          console.error('Sign up error:', error.message)
          if (Manager.contains(error.message, 'email-already-in-use')) {
            AlertManager.throwError('Account already exists. If this is you, please login')
            setShowVerificationCard(false)
          }
        })
    }
  }

  // SUBMIT CHILD
  const submitChild = async () => {
    const requiredInputs = [userPhone, email, userName, password, confirmedPassword]
    const isInvalid = requiredInputs.filter((x) => !Manager.isValid(x) || x?.value?.length === 0 || x.length === 0).length > 0
    if (isInvalid) {
      AlertManager.throwError('Please complete all fields')
      return false
    }
    let childUser = new ChildUser()
    childUser.name = StringManager.uppercaseFirstLetterOfAllWords(userName).trim()
    childUser.accountType = 'child'
    childUser.email = email
    childUser.settings.notificationsEnabled = true
    childUser.settings.theme = 'light'
    childUser.dailySummaries.eveningReminderSummaryHour = '8pm'
    childUser.dailySummaries.morningReminderSummaryHour = '10am'
    childUser.dailySummaries.eveningSentDate = moment().format(DateFormats.dateForDb)
    childUser.dailySummaries.morningSentDate = moment().format(DateFormats.dateForDb)
    childUser.phone = StringManager.formatPhone(userPhone)
    const cleanChild = ObjectManager.cleanObject(childUser, ModelNames.childUser)
    const dbRef = ref(getDatabase())

    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        // Signed up successfully
        const user = userCredential.user
        console.log('Signed up as:', user.email)
        await set(child(dbRef, `users/${cleanChild.phone}`), cleanChild)
        AlertManager.successAlert(`Welcome Aboard ${StringManager.formatNameFirstNameOnly(userName)}!`)
        setState({ ...state, currentScreen: ScreenNames.login })
      })
      .catch((error) => {
        console.error('Sign up error:', error.message)
      })
  }

  const formIsValid = async () => {
    let isValid = true
    await DB.getTable(DB.tables.users).then((users) => {
      users = Manager.convertToArray(users)
      const foundUser = users?.filter((x) => x?.email === email || x?.phone === userPhone)[0]
      if (foundUser) {
        AlertManager.throwError('Account already exists, please login')
        setAccountAlreadyExists(true)
        isValid = false
      }
    })

    if (!validator.isMobilePhone(userPhone)) {
      AlertManager.throwError('Phone number is not valid')
      isValid = false
      return false
    }

    if (parentType.length === 0) {
      AlertManager.throwError('Please select your parent type')
      isValid = false
    }

    if (!validator.isEmail(email)) {
      AlertManager.throwError('Email address is not valid')
      isValid = false
      return false
    }

    if (userName.length === 0 || parentType.length === 0) {
      AlertManager.throwError('Please fill out all fields')
      isValid = false
    }

    if (children.length === 0) {
      AlertManager.throwError('Please enter at least one child')
      isValid = false
    }

    if (coparents?.length === 0) {
      AlertManager.throwError('Please enter at least one co-parent')
      isValid = false
    }

    return isValid
  }

  const handleParentType = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        console.log(e)
        setParentType(e)
      },
      () => {
        setParentType(null)
      }
    )
  }

  // CHILDREN
  const addChild = (childObject) => setChildren([...children, childObject])
  const [childrenInputs, setChildrenInputs] = useState([
    <ChildrenInput add={addChild} childrenCount={1} onChange={(e) => setChildren([...children, e.target.value])} />,
  ])
  const addChildInput = () => setChildrenInputs([...childrenInputs, <ChildrenInput childrenCount={childrenInputs.length + 1} add={addChild} />])

  // COPARENTS
  const addCoparent = (parentObject) => setCoparents([...coparents, parentObject])
  const addCoparentInput = () =>
    setCoparentInputs([...coparentInputs, <CoparentInputs add={addCoparent} coparentsLength={coparentInputs.length + 1} />])
  const [coparentInputs, setCoparentInputs] = useState([<CoparentInputs add={addCoparent} />])

  // SEND VERIFICATION CODE
  const sendPhoneVerificationCode = async () => {
    if (userPhone.length === 0) {
      AlertManager.throwError('Phone number is required')
    }
    if (!validator.isMobilePhone(userPhone)) {
      AlertManager.throwError('Phone number is not valid')
      return false
    } else {
      const phoneCode = Manager.getUid().slice(0, 6)
      setPhoneVerificationCode(phoneCode)
      SmsManager.send(userPhone, SmsManager.send(userPhone, SmsManager.getPhoneVerificationTemplate(phoneCode)))
      setPhoneVerificationSent(true)
    }
  }

  const verifyPhoneCode = async (e) => {
    if (enteredPhoneCode.length === 0) {
      AlertManager.throwError('Verification code is required')
      return false
    }
    if (phoneVerificationCode === enteredPhoneCode) {
      setPhoneIsVerified(true)
      await submitParent()
    } else {
      AlertManager.throwError('Verification code is incorrect, please try again')
    }
  }

  useEffect(() => {
    Manager.showPageContainer()
    setTimeout(() => {
      setState({
        ...state,
        currentScreen: ScreenNames.registration,
        isLoading: false,
      })
    }, 500)
  }, [])

  return (
    <>
      {/* VERIFY YOUR PHONE */}
      <BottomCard
        hasSubmitButton={false}
        wrapperClass="verify-phone"
        showCard={showVerificationCard}
        title={'Verify Your Phone'}
        subtitle="If you do not receive a code within 3 minutes, please tap the (X) button at the top right and tap Verify Phone again."
        onClose={() => {
          setPhoneVerificationSent(false)
          setShowVerificationCard(false)
        }}>
        <div id="phone-verification-container" className=" form">
          <div className="form" autoComplete="off">
            {!phoneIsVerified && !phoneVerificationSent && (
              <>
                <InputWrapper
                  wrapperClasses="mt-15"
                  inputValue={userPhone}
                  inputType={'input'}
                  inputValueType="phone"
                  labelText={'Phone Number'}
                  required={true}
                  onChange={(e) => setUserPhone(StringManager.formatPhone(e.target.value))}
                />
                <button className="button default green center mt-15" onClick={sendPhoneVerificationCode}>
                  Send Phone Verification Code <MdOutlineSystemSecurityUpdateGood />
                </button>
              </>
            )}
            {phoneVerificationSent && (
              <>
                <InputWrapper
                  wrapperClasses="mt-15"
                  inputType={'input'}
                  inputValueType="phone"
                  labelText={'Verification Code'}
                  required={true}
                  onChange={(e) => setEnteredPhoneCode(e.target.value)}
                />
                <button className="button default green center mt-15" onClick={verifyPhoneCode}>
                  Verify <MdOutlineSystemSecurityUpdateGood />
                </button>
              </>
            )}
          </div>
        </div>
      </BottomCard>
      {/* PAGE CONTAINER */}
      <div id="registration-container" className="page-container form">
        <p className="screen-title">Sign Up</p>
        {accountAlreadyExists && (
          <button className="button default dead-center h-40 w-80" onClick={() => setState({ ...state, currentScreen: ScreenNames.login })}>
            Login
          </button>
        )}
        {/* SET ACCOUNT TYPE */}
        {!accountType && (
          <>
            <p className="mt-15">
              It is <b>HIGHLY</b> recommended to install the application for the best experience. You can register/login once the application is
              installed as well.
            </p>
            <button className="button default green center mt-15" onClick={() => setState({ ...state, currentScreen: ScreenNames.installApp })}>
              Install App First
            </button>
            <Label text={'Choose your Account Type'} classes="mt-15" required={true} />
            <div className="button-group flex mt-10">
              <button className="button parent default green w-50 mr-10" onClick={() => setAccountType('parent')}>
                Parent
              </button>
              <button className="w-50 child default button" onClick={() => setAccountType('child')}>
                Child
              </button>
            </div>
          </>
        )}

        {/* CHILD FORM */}
        {!accountAlreadyExists && accountType && accountType === 'child' && (
          <div className="form mb-20">
            <p className="mb-20">A parent is required to have Peaceful coParenting installed before you can register, to provide you with access.</p>
            <InputWrapper inputType={'input'} required={true} labelText={'Name'} onChange={(e) => setUserName(e.target.value)} />
            <InputWrapper
              inputType={'input'}
              inputValueType="email"
              required={true}
              labelText={'Email Address'}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputWrapper
              inputType={'input'}
              inputValueType="number"
              required={true}
              labelText={'Phone Number'}
              onChange={(e) => setUserPhone(e.target.value)}
            />
            <InputWrapper
              inputType={'input'}
              inputValueType="password"
              required={true}
              labelText={'Password'}
              onChange={(e) => setPassword(e.target.value)}
            />
            <InputWrapper
              inputType={'input'}
              inputValueType="password"
              required={true}
              labelText={'Confirm Password'}
              onChange={(e) => setConfirmedPassword(e.target.value)}
            />
            <PasswordChecklist
              rules={['minLength', 'specialChar', 'number', 'capital', 'match', 'notEmpty']}
              minLength={5}
              className={'password-validation'}
              value={password}
              valueAgain={confirmedPassword}
              onChange={(isValid) => {
                if (isValid) {
                  setPassword(password)
                }
              }}
            />
            {/*{parentInputs.map((input, index) => {*/}
            {/*  return <span key={index}>{input}</span>*/}
            {/*})}*/}
            {/*{parents.length > 0 && (*/}
            {/*  <button id="add-parent-button" className="button default" onClick={addParentInput}>*/}
            {/*    Add Another Parent*/}
            {/*  </button>*/}
            {/*)}*/}

            {/*<Label classes="mt-20" text={'Request Parent Sharing Permissions'} />*/}
            {/*<p>For privacy and security, your parent must provide a code to give you access to view items within the app.</p>*/}
            {/*<p>*/}
            {/*  A text message will be sent to your parent with the code. Once they provide the code to you, you will have access to the application.*/}
            {/*</p>*/}

            {/*<button*/}
            {/*  className="button default mt-20 green"*/}
            {/*  onClick={async () => {*/}
            {/*    await sendChildVerificationCode()*/}
            {/*  }}>*/}
            {/*  Send Message <TbDeviceMobileMessage />*/}
            {/*</button>*/}
            <button className="button mt-15 default green" onClick={submitChild}>
              Register
            </button>
            <button className="button default" onClick={() => setState({ ...state, currentScreen: ScreenNames.login })}>
              Back to Login
            </button>
          </div>
        )}

        {/* PARENT FORM */}
        {!accountAlreadyExists && accountType && accountType === 'parent' && (
          <div className="form mb-20">
            <Accordion id={'checkboxes'} expanded={parentTypeAccExpanded}>
              <AccordionSummary>
                <Label classes="flex" text={'Which type of parent are you?'} required={true}>
                  <PiInfoDuotone className={'ml-auto fs-24'} onClick={() => setParentTypeAccExpanded(!parentTypeAccExpanded)} />
                </Label>
              </AccordionSummary>
              <AccordionDetails>
                <p className="caption">
                  <i>
                    If you are primarily using the app for your biological children, select Biological. Otherwise, select Step-Parent, if it is
                    relevant for you.
                  </i>
                </p>
                <p className="caption">
                  <i>If you will be using the app as both Step-Parent and Biological, select Biological and we will handle the rest. </i>
                </p>
              </AccordionDetails>
            </Accordion>
            <CheckboxGroup
              skipNameFormatting={true}
              elClass={'parent-type '}
              checkboxLabels={['Biological Parent', 'Step-Parent']}
              onCheck={handleParentType}
            />
            <InputWrapper inputType={'input'} required={true} labelText={'Name'} onChange={(e) => setUserName(e.target.value)} />
            <InputWrapper
              inputType={'input'}
              inputValueType="email"
              required={true}
              labelText={'Email Address'}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputWrapper
              inputType={'input'}
              inputValueType="number"
              required={true}
              labelText={'Phone Number'}
              onChange={(e) => setUserPhone(e.target.value)}
            />
            <InputWrapper
              inputType={'input'}
              inputValueType="password"
              required={true}
              labelText={'Password'}
              onChange={(e) => setPassword(e.target.value)}
            />
            <InputWrapper
              inputType={'input'}
              inputValueType="password"
              required={true}
              labelText={'Confirm Password'}
              onChange={(e) => setConfirmedPassword(e.target.value)}
            />
            <PasswordChecklist
              rules={['minLength', 'specialChar', 'number', 'capital', 'match', 'notEmpty']}
              minLength={5}
              className={'password-validation'}
              value={password}
              valueAgain={confirmedPassword}
              onChange={(isValid) => {
                if (isValid) {
                  setPassword(password)
                }
              }}
            />
            {coparentInputs.map((input, index) => {
              return <span key={index}>{input}</span>
            })}

            {/* COPARENTS */}
            {coparents?.length > 0 && (
              <button id="add-coparent-button" className="button default " onClick={addCoparentInput}>
                Add Another Co-Parent
              </button>
            )}

            {/* CHILDREN */}
            <div className="children">
              {childrenInputs.map((input, index) => {
                return <span key={index}>{input}</span>
              })}
            </div>
            {children?.length > 0 && (
              <button id="add-child-button" className="button default " onClick={addChildInput}>
                Add Another Child
              </button>
            )}

            {/* VERIFY PHONE BUTTON */}
            {userPhone.length > 0 &&
              userName.length > 0 &&
              email.length > 0 &&
              password.length > 0 &&
              confirmedPassword.length > 0 &&
              parentType.length > 0 && (
                <button
                  className="button default mt-10 green"
                  onClick={async () => {
                    const isValidForm = await formIsValid()
                    if (isValidForm) {
                      setShowVerificationCard(true)
                    }
                  }}>
                  Verify Phone <MdOutlineSecurity />
                </button>
              )}
            <button id="back-to-login-button" className="button default " onClick={() => setState({ ...state, currentScreen: ScreenNames.login })}>
              Back to Login
            </button>
          </div>
        )}
      </div>
    </>
  )
}