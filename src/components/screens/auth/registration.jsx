import { child, getDatabase, ref, set } from 'firebase/database'
import React, { useContext, useEffect, useState } from 'react'
import PasswordChecklist from 'react-password-checklist'
import ScreenNames from '@screenNames'
import globalState from '../../../context.js'
import User from '../../../models/user.js'
import Manager from '@manager'
import ChildrenInput from '../../childrenInput.jsx'
import CoparentInputs from '../../coparentInput.jsx'
import CheckboxGroup from '@shared/checkboxGroup.jsx'
import SmsManager from '@managers/smsManager.js'
import NotificationManager from '@managers/notificationManager.js'
import PushAlertApi from '@api/pushAlert'
import ChildUser from 'models/child/childUser.js'
import ParentInput from '../../parentInput'
import { MdOutlineSecurity, MdOutlineSystemSecurityUpdateGood } from 'react-icons/md'
import AccordionSummary from '@mui/material/AccordionSummary'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'

import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  formatPhone,
  getFileExtension,
  getFirstWord,
  hasClass,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import ModelNames from '../../../models/modelNames'
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth'
import firebaseConfig from '../../../firebaseConfig'
import { initializeApp } from 'firebase/app'
import InstallAppPopup from '../../installAppPopup'
import BottomCard from '../../shared/bottomCard'
import { PiInfoDuotone } from 'react-icons/pi'
import validator from 'validator'
import Label from '../../shared/label'
import ObjectManager from '../../../managers/objectManager'
import AlertManager from '../../../managers/alertManager'
import InputWrapper from '../../shared/inputWrapper'
import LogManager from '../../../managers/logManager'
import { TbDeviceMobileMessage } from 'react-icons/tb'

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
  const [parentPhone, setParentPhone] = useState('')
  const [parents, setParents] = useState([])
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

  // SEND VERIFICATION CODE
  const sendChildVerificationCode = async () => {
    const requiredInputs = [userPhone, email, parentPhone, userName, password, confirmedPassword, parents]
    const isInvalid = requiredInputs.filter((x) => !Manager.isValid(x) || x?.value?.length === 0 || x.length == 0).length > 0
    if (isInvalid) {
      AlertManager.throwError('Please complete all fields')
      return false
    }
    if (validator.isMobilePhone(userPhone)) {
      const permissionCode = Manager.getUid().slice(0, 6)
      SmsManager.send(parentPhone, SmsManager.getParentVerificationTemplate(userName, permissionCode))

      localStorage.setItem('parentPermissionCode', permissionCode)

      // Enter code alert
      AlertManager.inputAlert('Enter the code provided by your parent', ``, async (e) => {
        const localStorageCode = localStorage.getItem('parentPermissionCode')
        console.log(e)
        if (localStorageCode === e) {
          await submitChild()
        }
        localStorage.removeItem('parentPermissionCode')
      })
    }
  }

  // SUBMIT PARENT
  const submitParent = async () => {
    const validForm = await formIsValid() // Check for existing account

    if (validForm) {
      let newUser = new User()
      newUser.id = Manager.getUid()
      newUser.email = email
      newUser.name = uppercaseFirstLetterOfAllWords(userName)
      newUser.accountType = 'parent'
      newUser.children = children
      newUser.phone = formatPhone(userPhone)
      newUser.coparents = coparents
      newUser.parentType = parentType
      newUser.settings.theme = 'light'
      newUser.settings.eveningReminderSummaryHour = '8pm'
      newUser.settings.morningReminderSummaryHour = '10am'

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
          if (contains(error.message, 'email-already-in-use')) {
            AlertManager.throwError('Account already exists. If this is you, please login')
            setShowVerificationCard(false)
          }
        })

      // const dbRef = ref(getDatabase())
      const subId = await NotificationManager.getUserSubIdFromApi('3307494534')
      PushAlertApi.sendMessage('New Registration', `Phone: ${userPhone} \n Name: ${userName}`, subId)
    }
  }

  // SUBMIT CHILD
  const submitChild = async () => {
    const requiredInputs = [userPhone, email, parentPhone, userName, password, confirmedPassword, parents]
    const isInvalid = requiredInputs.filter((x) => !Manager.isValid(x) || x?.value?.length === 0 || x.length == 0).length > 0
    if (isInvalid) {
      AlertManager.throwError('Please complete all fields')
      return false
    }
    let childUser = new ChildUser()
    childUser.id = Manager.getUid()
    childUser.name = uppercaseFirstLetterOfAllWords(userName)
    childUser.accountType = 'child'
    childUser.parents = parents
    childUser.email = email
    childUser.settings.theme = 'light'
    childUser.phone = formatPhone(userPhone)
    const cleanChild = ObjectManager.cleanObject(childUser, ModelNames.childUser)
    const dbRef = ref(getDatabase())
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        // Signed up successfully
        const user = userCredential.user
        console.log('Signed up as:', user.email)
        await set(child(dbRef, `users/${cleanChild.phone}`), cleanChild)
      })
      .catch((error) => {
        console.error('Sign up error:', error.message)
      })

    // SEND SMS MESSAGES
    // Send to parent
    const parentSubId = await NotificationManager.getUserSubIdFromApi(parentPhone)
    PushAlertApi.sendMessage(
      'Child Registration',
      `${userName} is now signed up. If you would like to be able to provide viewing access for them, add them in the Child Info section of the app. Including their phone number is required.`,
      parentSubId
    )
    // Send to child
    const childSubId = await NotificationManager.getUserSubIdFromApi(userPhone)
    PushAlertApi.sendMessage('Welcome Aboard!', 'You are now signed up!', childSubId)
    // Send to me
    const mySubId = await NotificationManager.getUserSubIdFromApi('3307494534')
    PushAlertApi.sendMessage('New Registration', `Phone: ${userPhone}`, mySubId)
    AlertManager.successAlert(`Welcome Aboard ${formatNameFirstNameOnly(userName)}!`)
    setState({ ...state, currentScreen: ScreenNames.login })
  }

  const formIsValid = async () => {
    let isValid = true
    // await DB.getTable(DB.tables.users).then((users) => {
    //   users = Manager.convertToArray(users)
    //   const foundUser = users?.filter((x) => x?.email === email || x?.phone === userPhone)[0]
    //   if (foundUser) {
    //     AlertManager.throwError('Account already exists, please login')
    //     setAccountAlreadyExists(true)
    //     isValid = false
    //   }
    // })

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

    if (Manager.validation([userName, parentType]) > 0) {
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

  const handleParentType = (e) => Manager.handleCheckboxSelection(e, setParentType(null), setParentType(e.currentTarget.dataset.label))

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

  // PARENTS
  const addParent = (parentObject) => setParents([...parents, parentObject])
  const addParentInput = () => setParentInputs([...parentInputs, <ParentInput add={addParent} parentsLength={parentInputs.length + 1} />])
  const [parentInputs, setParentInputs] = useState([<ParentInput add={addParent} />])

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
      SmsManager.send(userPhone, SmsManager.getPhoneVerificationTemplate(phoneCode))
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
      <BottomCard hasSubmitButton={false} showCard={showVerificationCard} title={'Verify Your Phone'} onClose={() => setShowVerificationCard(false)}>
        <div id="phone-verification-container" className=" form">
          <div className="form" autoComplete="off">
            {!phoneIsVerified && !phoneVerificationSent && (
              <>
                <InputWrapper
                  inputValue={userPhone}
                  inputType={'input'}
                  inputValueType="phone"
                  labelText={'Phone Number'}
                  required={true}
                  onChange={(e) => setUserPhone(formatPhone(e.target.value))}
                />
                <button className="button default green center mt-15" onClick={sendPhoneVerificationCode}>
                  Send Phone Verification Code <MdOutlineSystemSecurityUpdateGood />
                </button>
              </>
            )}
            {phoneVerificationSent && (
              <>
                <InputWrapper
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
            <p>
              Click <b>Install App</b> button below to read the extremely fast installation steps.
            </p>
            {/* INSTALL BUTTON */}
            <p
              id="install-button"
              className="mb-20 button mt-20"
              onClick={() => {
                setState({ ...state, menuIsOpen: false })
                document.querySelector('.install-app').classList.add('active')
                Manager.showPageContainer('hide')
              }}>
              Install App <span className="material-icons">install_mobile</span>
            </p>
            <InstallAppPopup />
            <Label text={'Choose your Account Type'} required={true} />
            <div className="button-group flex mt-10">
              <button className="button default w-50 mr-10" onClick={() => setAccountType('parent')}>
                Parent
              </button>
              <button className="w-50 default button" onClick={() => setAccountType('child')}>
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
              inputValueType="number"
              required={true}
              labelText={'Phone Number of Parent that has the App'}
              onChange={(e) => setParentPhone(formatPhone(e.target.value))}
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
            {parentInputs.map((input, index) => {
              return <span key={index}>{input}</span>
            })}
            {parents.length > 0 && (
              <button id="add-parent-button" className="button default" onClick={addParentInput}>
                Add Another Parent
              </button>
            )}

            <Label classes="mt-20" text={'Request Parent Sharing Permissions'} />
            <p>For privacy and security, your parent must provide a code to give you access to view items within the app.</p>
            <p>
              A text message will be sent to your parent with the code. Once they provide the code to you, you will have access to the application.
            </p>

            <button
              className="button default mt-20 green"
              onClick={async () => {
                await sendChildVerificationCode()
              }}>
              Send Message <TbDeviceMobileMessage />
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
            {children.length > 0 && (
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