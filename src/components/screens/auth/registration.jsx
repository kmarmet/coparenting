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
import DB from '@db'
import SmsManager from '@managers/smsManager.js'
import NotificationManager from '@managers/notificationManager.js'
import PushAlertApi from '@api/pushAlert'
import DB_UserScoped from '@userScoped'
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
import moment from 'moment'
import ModelNames from '../../../models/modelNames'
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth'
import firebaseConfig from '../../../firebaseConfig'
import { initializeApp } from 'firebase/app'
import InstallAppPopup from '../../installAppPopup'
import ParentPermissionCode from '../../../models/parentPermissionCode'
import DateFormats from '../../../constants/dateFormats'
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
  const [verificationCode, setVerificationCode] = useState(Manager.getUid().slice(0, 4))
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
    if (validator.isMobilePhone(userPhone)) {
      const permissionCode = Manager.getUid().slice(0, 6)
      SmsManager.send(parentPhone, SmsManager.getParentVerificationTemplate(userName, permissionCode))

      // Add Parent Permission record to DB
      const parentPermissionCode = new ParentPermissionCode()
      parentPermissionCode.code = permissionCode
      parentPermissionCode.parentPhone = parentPhone
      parentPermissionCode.childPhone = userPhone
      parentPermissionCode.expiration = moment().add(5, 'minutes').format(DateFormats.fullDatetime)
      setVerificationCode(permissionCode)

      // Add code to DB
      await DB.add(DB.tables.parentPermissionCodes, parentPermissionCode)

      // Expiration Message
      const expirationMessage = `The code will expire at ${moment().add(5, 'minutes').format('h:mma')}.`

      // Enter code alert
      AlertManager.inputAlert(
        'Enter the code provided by your parent',
        `If the code has expired, please register again to send another code. ${expirationMessage}`,
        async (e) => {
          const existingCodes = Manager.convertToArray(await DB.getTable(DB.tables.parentPermissionCodes))

          if (Manager.isValid(existingCodes, true)) {
            const existingCode = existingCodes.filter((x) => x.parentPhone === parentPhone && x.childPhone === userPhone)[0]
            // Existing code already exists, check expiration
            if (Manager.isValid(existingCode)) {
              const expirationTime = moment(existingCode.expiration, DateFormats.fullDatetime).minute()
              const now = moment().minute()
              const duration = expirationTime - now
              // Expired
              if (duration >= 5) {
                AlertManager.throwError('The code has expired, please send another code')
              }
              // Register
              else {
                if (permissionCode === existingCode.code) {
                  await submitChild()
                }
              }
              const deleteKey = await DB.getFlatTableKey(DB.tables.parentPermissionCodes)
              await DB.deleteByPath(`${DB.tables.parentPermissionCodes}/${deleteKey}`)
            }
          }
        }
      )
    }
  }

  // SUBMIT PARENT
  const submit = async () => {
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
      newUser.updatedApp = true
      newUser.emailVerified = false
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
      // const subId = await NotificationManager.getUserSubId('3307494534')
      // PushAlertApi.sendMessage('New Registration', `Phone: ${userPhone} \n Name: ${userName}`, subId)
    }
  }

  // SUBMIT CHILD
  const submitChild = async () => {
    const isValid = await validateChildForm()
    if (isValid) {
      let parent = await DB_UserScoped.getUser(DB.tables.users, parentPhone)
      if (Manager.isValid(parent)) {
        let childUser = new ChildUser()
        childUser.id = Manager.getUid()
        childUser.phone = userPhone
        childUser.name = uppercaseFirstLetterOfAllWords(userName)
        childUser.accountType = 'child'
        childUser.parents = parents
        childUser.email = ''
        childUser.settings.theme = 'light'
        childUser.settings.eveningReminderSummaryHour = '8pm'
        childUser.settings.morningReminderSummaryHour = '10am'
        childUser.general.name = userName
        childUser.general.phone = userPhone
        childUser.emailVerified = false
        childUser.updatedApp = true
        const cleanChild = ObjectManager.cleanObject(childUser, ModelNames.childUser)
        const dbRef = ref(getDatabase())
        await set(child(dbRef, `users/${userPhone}`), cleanChild)
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
        const parentSubId = await NotificationManager.getUserSubId(parentPhone)
        PushAlertApi.sendMessage(`${userName} has registered.`, parentSubId)
        // Send to child
        const childSubId = await NotificationManager.getUserSubId(userPhone)
        PushAlertApi.sendMessage(`${userName} has registered.`, childSubId)
        // Send to me
        const mySubId = await NotificationManager.getUserSubId('3307494534')
        PushAlertApi.sendMessage('New Registration', `Phone: ${userPhone}`, mySubId)
        AlertManager.successAlert(`Welcome Aboard ${formatNameFirstNameOnly(userName)}!`)
        setState({ ...state, currentScreen: ScreenNames.login })
      } else {
        // Parent account does not exist
        AlertManager.throwError(`There is no account with the phone number ${parentPhone}. Please re-enter or have your parent register.`)
        return false
      }
    }
  }

  const validateChildForm = async () => {
    let isValid = true
    await DB.getTable(DB.tables.users).then(async (users) => {
      users = Manager.convertToArray(users)
      let existingUser = await DB.find(DB.tables.users, ['phone', userPhone], true)
      if (existingUser) {
        AlertManager.throwError('Account already exists, please login')
        isValid = false
        setAccountAlreadyExists(true)
      } else {
        if (userPhone === parentPhone) {
          AlertManager.throwError("Your phone number cannot be the same as your parent's phone number")
          isValid = false
        }
      }
    })
    if (!validator.isMobilePhone(userPhone)) {
      AlertManager.throwError('Phone number is not valid')
      isValid = false
      return false
    }
    if (userName.length === 0) {
      AlertManager.throwError('Your name is required')
      isValid = false
    }
    if (password.length === 0) {
      AlertManager.throwError('Your password is required')
      isValid = false
    }
    if (confirmedPassword.length === 0) {
      AlertManager.throwError('Confirmed password is required')
      isValid = false
    }
    if (confirmedPassword !== password) {
      AlertManager.throwError('Password and confirmed password do not match')
      isValid = false
    }
    return isValid
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
      await submit()
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
                  onChange={(e) => setUserPhone(e.target.value)}
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
              onChange={(e) => setParentPhone(e.target.value)}
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
            <p>
              For privacy and security, your parent must provide a code to give you access to view items within the app. A text message will be sent
              to your parent with the code. Once they provide the code to you, you will have access to the application.
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
            <button
              className="button default w-40 mt-10 green"
              onClick={async () => {
                const isValidForm = await formIsValid()
                if (isValidForm) {
                  setShowVerificationCard(true)
                }
              }}>
              Verify Phone <MdOutlineSecurity />
            </button>
            <button className="button default w-40 " onClick={() => setState({ ...state, currentScreen: ScreenNames.login })}>
              Back to Login
            </button>
          </div>
        )}
      </div>
    </>
  )
}