import { child, getDatabase, ref, set } from 'firebase/database'
import React, { useContext, useEffect, useState } from 'react'
import PasswordChecklist from 'react-password-checklist'
import ScreenNames from '@screenNames'
import globalState from '../../../context.js'
import User from '../../../models/user.js'
import Manager from '@manager'
import ChildrenInput from '../../childrenInput.jsx'
import { Accordion } from 'rsuite'
import CoparentInputs from '../../coparentInput.jsx'
import CheckboxGroup from '@shared/checkboxGroup.jsx'
import DB from '@db'
import SmsManager from '@managers/smsManager.js'
import NotificationManager from '@managers/notificationManager.js'
import PushAlertApi from '@api/pushAlert'
import MyConfetti from '@shared/myConfetti.js'
import DB_UserScoped from '@userScoped'
import ChildUser from 'models/child/childUser.js'
import { useSwipeable } from 'react-swipeable'
import ParentInput from '../../parentInput'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  uniqueArray,
  formatPhone,
  getFileExtension,
} from '../../../globalFunctions'

export default function Registration() {
  const { state, setState } = useContext(globalState)
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmedPassword, setConfirmedPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [children, setChildren] = useState([])
  const [parentType, setParentType] = useState('')
  const [accountType, setAccountType] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [verificationCode, setVerificationCode] = useState(Manager.getUid().slice(0, 4))
  const [verificationCodeSent, setVerificationCodeSent] = useState(false)
  const [parents, setParents] = useState([])
  const [coparents, setCoparents] = useState([])
  const [parentTypeAccExpanded, setParentTypeAccExpanded] = useState(false)

  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      console.log('User Swiped!', eventData)
      setState({ ...state, currentScreen: ScreenNames.calendar })
    },
  })

  // SUBMIT PARENT
  const submit = async () => {
    const isValid = validateParentForm()
    if (isValid) {
      // Check for existing account
      await DB.getTable(DB.tables.users).then((users) => {
        if (!Array.isArray()) {
          users = DB.convertKeyObjectToArray(users)
        }
        const foundUser = users.filter((x) => x.email === email || x.phone === phone)
        if (foundUser) {
          setState({ ...state, showAlert: true, alertMessage: 'Account already exists, please login', alertType: 'error' })
          return false
        }
      })

      let newUser = new User()
      newUser.id = Manager.getUid()
      newUser.email = email
      newUser.password = password
      newUser.name = uppercaseFirstLetterOfAllWords(userName)
      newUser.accountType = 'parent'
      newUser.children = children
      newUser.phone = formatPhone(phone)
      newUser.coparents = coparents
      newUser.parentType = parentType
      newUser.settings.theme = 'light'
      newUser.settings.eveningReminderSummaryHour = '8pm'
      newUser.settings.morningReminderSummaryHour = '10am'

      const dbRef = ref(getDatabase())
      const subId = await NotificationManager.getUserSubId('3307494534')
      PushAlertApi.sendMessage('New Registration', `Phone: ${phone} | Name: ${userName}`, subId)
      await set(child(dbRef, `users/${newUser.phone}`), newUser)
      setState({ ...state, currentScreen: ScreenNames.login })
    }
  }

  // SUBMIT CHILD
  const submitChild = async () => {
    const isValid = validateChildForm()
    if (isValid) {
      if (!verificationCode || verificationCode?.length === 0) {
        setState({ ...state, showAlert: true, alertMessage: 'Verification code is required', alertType: 'error' })
        return false
      }
      let parent = await DB_UserScoped.getUser(DB.tables.users, parentPhone)
      if (Manager.isValid(parent)) {
        let newUser = new ChildUser()
        newUser.id = Manager.getUid()
        newUser.phone = phone
        newUser.name = uppercaseFirstLetterOfAllWords(userName)
        newUser.accountType = 'child'
        newUser.password = password
        newUser.parents = parents
        newUser.email = ''
        newUser.settings.theme = 'light'
        newUser.settings.eveningReminderSummaryHour = '8pm'
        newUser.settings.morningReminderSummaryHour = '10am'
        const dbRef = ref(getDatabase())
        await set(child(dbRef, `users/${phone}`), newUser)
        MyConfetti.fire()
        setState({ ...state, currentScreen: ScreenNames.login })

        // SEND SMS MESSAGES
        // Send to parent
        const parentSubId = await NotificationManager.getUserSubId(parentPhone)
        PushAlertApi.sendMessage(`${userName} has registered.`, parentSubId)
        // Send to child
        const childSubId = await NotificationManager.getUserSubId(phone)
        PushAlertApi.sendMessage(`${userName} has registered.`, childSubId)
        // Send to me
        const mySubId = await NotificationManager.getUserSubId('3307494534')
        PushAlertApi.sendMessage('New Registration', `Phone: ${phone}`, mySubId)
      } else {
        // Parent account does not exist
        setState({
          ...state,
          showAlert: true,
          alertMessage: `There is no account with the phone number ${parentPhone}. Please re-enter or have your parent register.`,
          alertType: 'error',
        })
        return false
      }

      SmsManager.send(parentPhone, SmsManager.getParentVerificationTemplate())
    }
  }

  const validateChildForm = () => {
    let valid = true
    if (!parentPhone || parentPhone?.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: "Parent's phone number is required", alertType: 'error' })
      valid = false
    }
    if (!Manager.phoneNumberIsValid(parentPhone)) {
      setState({ ...state, showAlert: true, alertMessage: 'Phone number is not valid', alertType: 'error' })
      return false
    }
    if (userName.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Your name is required', alertType: 'error' })
      valid = false
    }
    if (password.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Your password is required', alertType: 'error' })
      valid = false
    }
    if (confirmedPassword.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Confirmed password is required', alertType: 'error' })
      valid = false
    }
    if (confirmedPassword !== password) {
      setState({ ...state, showAlert: true, alertMessage: 'Password and confirmed password do not match', alertType: 'error' })
      valid = false
    }

    return valid
  }

  const validateParentForm = () => {
    let valid = true

    if (!Manager.phoneNumberIsValid(phone)) {
      setState({ ...state, showAlert: true, alertMessage: 'Phone number is not valid', alertType: 'error' })
      return false
    }

    if (parentType.length === 0) {
      setState({ ...state, alertMessage: 'Select your parent type', showAlert: true, alertType: 'error' })
      valid = false
    }

    if (Manager.validation([userName, email, phone, parentType]) > 0) {
      setState({ ...state, alertMessage: 'Please fill out all fields', showAlert: true, alertType: 'error' })
      valid = false
    }

    if (!Manager.formatPhoneNumber(phone)) {
      setState({ ...state, alertMessage: 'Enter a valid phone number', showAlert: true, alertType: 'error' })
    }

    if (children.length === 0) {
      setState({ ...state, alertMessage: 'Please enter at least 1 child', showAlert: true, alertType: 'error' })
      valid = false
    }

    if (coparents.length === 0) {
      setState({ ...state, alertMessage: 'Please enter at least 1 coparent', showAlert: true })
      valid = false
    }

    return valid
  }

  // SEND VERIFICATION CODE
  const sendChildVerificationCode = () => {
    const isValidated = validateChildForm()
    if (isValidated) {
      SmsManager.send(parentPhone, SmsManager.getParentVerificationTemplate(userName, verificationCode))
      setVerificationCodeSent(true)
    }
  }

  const sendParentVerificationCode = () => {
    const isValidated = validateParentForm()
    if (isValidated) {
      SmsManager.send(phone, SmsManager.getRegistrationVerificationTemplate(userName, verificationCode))
      setVerificationCodeSent(true)
    }
  }

  const handleParentType = (e) => Manager.handleCheckboxSelection(e, setParentType(null), setParentType(e.currentTarget.dataset.label))

  // CHILDREN
  const addChild = (parentObject) => setChildren([...children, parentObject])
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

  useEffect(() => {
    Manager.toggleForModalOrNewForm()
    setTimeout(() => {
      setState({
        ...state,
        currentScreen: ScreenNames.registration,
        isLoading: false,
        previousScreen: ScreenNames.login,
        showBackButton: true,
        showMenuButton: false,
      })
    }, 500)
  }, [])

  return (
    <>
      {/* SCREEN TITLE */}
      <p className="screen-title ">Sign Up</p>

      {/* PAGE CONTAINER */}
      <div id="registration-container" className="page-container light form" {...handlers}>
        {/* SET ACCOUNT TYPE */}
        {!accountType && (
          <>
            <label className="account-type-label mb-10 mt-15">
              Account Type <span className="asterisk">*</span>
            </label>
            <div className="button-group flex">
              <button className="button default w-50 mr-10" onClick={() => setAccountType('parent')}>
                Parent
              </button>
              <button className="w-50 default button" onClick={() => setAccountType('child')}>
                Child
              </button>
            </div>
          </>
        )}

        {/* CHILD VERIFICATION CODE INPUT */}
        {verificationCodeSent && accountType === 'child' && (
          <div className="form">
            <label>To ensure privacy and security, please enter the verification code from your parent</label>
            <input type="text" className="verification-code mb-20" onChange={(e) => setVerificationCode(e.target.value)} />
            <button className="button default green center" onClick={submitChild}>
              Register <span className="material-icons-round">person_add</span>
            </button>
          </div>
        )}

        {/* PARENT VERIFICATION CODE INPUT */}
        {verificationCodeSent && accountType === 'parent' && (
          <div className="form">
            <label>To ensure privacy and security, please enter the verification code you received via text message</label>
            <input type="text" className="verification-code mb-20" onChange={(e) => setVerificationCode(e.target.value)} />
            <button className="button default green center" onClick={submit}>
              Register <span className="material-icons-round">person_add</span>
            </button>
          </div>
        )}

        {/* CHILD FORM */}
        {accountType && accountType === 'child' && !verificationCodeSent && (
          <div className="form mb-20">
            <label>
              Name <span className="asterisk">*</span>
            </label>
            <input className="mb-10" type="text" onChange={(e) => setUserName(e.target.value)} />
            <label>
              Your Phone Number <span className="asterisk">*</span>
            </label>
            <input className="mb-10" type="number" pattern="[0-9]*" inputMode="numeric" onChange={(e) => setPhone(e.target.value)} />
            <label>
              Phone Number of parent that has App <span className="asterisk">*</span>
            </label>
            <input className="mb-10" type="number" pattern="[0-9]*" inputMode="numeric" onChange={(e) => setParentPhone(e.target.value)} />
            <label>
              Password<span className="asterisk">*</span>
            </label>
            <input className="mb-10" type="password" onChange={(e) => setPassword(e.target.value)} />
            <label>
              Confirm Password <span className="asterisk">*</span>
            </label>
            <input className="mb-20" type="password" onChange={(e) => setConfirmedPassword(e.target.value)} />
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
            <button id="add-parent-button" className="button default w-60" onClick={addParentInput}>
              Add Another Parent
            </button>

            <button className="button default green" onClick={sendChildVerificationCode}>
              Continue<span className="material-icons-outlined">arrow_forward</span>
            </button>
          </div>
        )}

        {/* PARENT FORM */}
        {accountType && accountType === 'parent' && !verificationCodeSent && (
          <div className="form mb-20">
            <Accordion>
              <label>
                Which type of parent are you? <span className="asterisk">*</span>
                <span onClick={() => setParentTypeAccExpanded(!parentTypeAccExpanded)} className="material-icons-round fs-25 yellow">
                  help
                </span>
              </label>

              <Accordion.Panel expanded={parentTypeAccExpanded}>
                <p className="caption">
                  <i>
                    If you are primarily using the app for your biological children, select Biological. Otherwise, select Step-Parent, if it is
                    relevant for you.
                  </i>
                </p>
                <p className="caption">
                  <i>If you will be using the app as both Step-Parent and Biological, select Biological and we will handle the rest. </i>
                </p>
                <span className="material-icons-round fs-25 blue">insert_emoticon</span>
              </Accordion.Panel>
            </Accordion>
            <CheckboxGroup elClass={'light'} labels={['Biological Parent', 'Step-Parent']} onCheck={handleParentType} />
            <label>
              Name <span className="asterisk">*</span>
            </label>
            <input className="mb-10" type="text" onChange={(e) => setUserName(e.target.value)} />
            <label>
              Email Address <span className="asterisk">*</span>
            </label>
            <input className="mb-10" type="email" onChange={(e) => setEmail(e.target.value)} />
            <label>
              Phone Number <span className="asterisk">*</span>
            </label>
            <input className="mb-10" type="number" pattern="[0-9]*" inputMode="numeric" onChange={(e) => setPhone(e.target.value)} />
            <label>
              Password <span className="asterisk">*</span>
            </label>
            <input className="mb-10" type="password" onChange={(e) => setPassword(e.target.value)} />
            <label>
              Confirm Password <span className="asterisk">*</span>
            </label>
            <input className="mb-10" type="password" onChange={(e) => setConfirmedPassword(e.target.value)} />
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
            <button id="add-coparent-button" className="button default w-60" onClick={addCoparentInput}>
              Add Another Co-Parent
            </button>

            {/* CHILDREN */}
            <div className="children">
              {childrenInputs.map((input, index) => {
                return <span key={index}>{input}</span>
              })}
            </div>
            <button id="add-child-button" className="button default w-60" onClick={addChildInput}>
              Add Another Child
            </button>
            <button className="button default green" onClick={sendParentVerificationCode}>
              Continue<span className="material-icons-outlined">arrow_forward</span>
            </button>
          </div>
        )}
      </div>
    </>
  )
}
