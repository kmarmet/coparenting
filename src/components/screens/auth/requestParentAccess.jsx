// Path: src\components\screens\auth\requestParentAccess.jsx
import React, {useContext, useState} from 'react'
import globalState from '../../../context'
import InputWrapper from '/src/components/shared/inputWrapper'
import DomManager from '/src/managers/domManager'
import AlertManager from '/src/managers/alertManager'
import Manager from '../../../managers/manager'
import SmsManager from '/src/managers/smsManager.js'
import validator from 'validator'
import DB from '../../../database/DB'
import StringManager from '../../../managers/stringManager'
import ScreenNames from '../../../constants/screenNames'
import InputTypes from '../../../constants/inputTypes'

export default function RequestParentAccess() {
  const {state, setState} = useContext(globalState)
  const {currentUser} = state
  const [readyToVerify, setReadyToVerify] = useState(false)
  const [parentPhone, setParentPhone] = useState(null)
  const [enteredCode, setEnteredCode] = useState(0)
  const [verificationCode, setVerificationCode] = useState('')
  const [userName, setUserName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  // SEND VERIFICATION CODE
  const sendPhoneVerificationCode = async (codeResent = false) => {
    const errorString = Manager.GetInvalidInputsErrorString([
      {name: 'Your Name', value: userName},
      {name: 'Parent Email', value: parentEmail},
      {name: 'Parent Phone', value: parentPhone},
    ])

    if (Manager.isValid(errorString)) {
      AlertManager.throwError(errorString)
      return false
    }
    if ((!parentPhone || !validator.isMobilePhone(parentPhone)) && !codeResent) {
      AlertManager.throwError('Phone number is not valid')
      return false
    } else {
      const parent = await DB.find(DB.tables.users, ['email', parentEmail], true)

      if (!parent) {
        AlertManager.throwError(
          'No Parent Profile Found',
          'Please check the email and enter again or let your parent know they will need to register an account'
        )
        return false
      }
      if (parentPhone === currentUser?.phone) {
        AlertManager.throwError('Unable to request access', "Your parent's phone number cannot be your phone number")
        return false
      }
      const phoneCode = Manager.getUid().slice(0, 6)
      setVerificationCode(phoneCode)
      setState({...state, isLoading: true, loadingText: 'Sending security code...'})
      await SmsManager.send(parentPhone, SmsManager.getParentVerificationTemplate(userName, phoneCode))
      setReadyToVerify(true)
      setState({...state, isLoading: false})
    }
  }

  const verifyPhoneCode = async () => {
    if (enteredCode.length === 0) {
      AlertManager.throwError('Access code is required')
      return false
    }

    // Access granted
    if (enteredCode === verificationCode) {
      const parent = await DB.find(DB.tables.users, ['email', parentEmail], true)

      if (parent) {
        await DB.add(`${DB.tables.users}/${currentUser?.key}/parents`, {name: parent?.name, phone: parent?.phone, linkedKey: parent?.key})
        await DB.updateByPath(`${DB.tables.users}/${currentUser?.key}/parentAccessGranted`, true)
        await DB.updateByPath(`${DB.tables.users}/${currentUser?.key}/name`, StringManager.uppercaseFirstLetterOfAllWords(userName))
        setState({...state, currentScreen: ScreenNames.calendar, successAlertMessage: 'Access Granted'})
      } else {
        AlertManager.throwError(
          'No parent profile found with provided email',
          'Please check the email and enter again or let your parent know they will need to register an account'
        )
        return false
      }
    } else {
      AlertManager.throwError('Security code is incorrect, please try again')
      return false
    }
  }

  return (
    <div className="page-container parent-access">
      <p className="screen-title">Request Access from Parent</p>
      <p className="mb-10">For privacy and security, your parent must provide a code to give you access.</p>
      <p className="mb-10">
        When you enter your parent&#39;s phone number and {DomManager.tapOrClick()} the Request Access button, a text message with the code will be
        sent to your parent.
      </p>
      <p className="mb-10">Ask them to provide it to you and enter it below.</p>

      {/* NAME */}
      {!readyToVerify && (
        <InputWrapper inputType={InputTypes.text} required={true} labelText={'Your Name'} onChange={(e) => setUserName(e.target.value)} />
      )}

      {!readyToVerify && (
        <InputWrapper
          inputType={InputTypes.email}
          required={true}
          labelText={'Parent Email Address'}
          onChange={(e) => setParentEmail(e.target.value)}
        />
      )}

      {/* PARENT PHONE */}
      {!readyToVerify && (
        <InputWrapper
          inputType={InputTypes.phone}
          required={true}
          labelText={'Parent Phone Number'}
          onChange={(e) => setParentPhone(e.target.value)}
        />
      )}
      {readyToVerify && <InputWrapper labelText={'Access Code'} inputType={InputTypes.text} onChange={(e) => setEnteredCode(e.target.value)} />}
      {!readyToVerify && (
        <button className="button default green center mt-30" onClick={sendPhoneVerificationCode}>
          Request Access
        </button>
      )}
      {readyToVerify && (
        <button className="button default green center mt-30" onClick={verifyPhoneCode}>
          Verify Code
        </button>
      )}
      {readyToVerify && (
        <button
          className="button default submit center mt-10"
          onClick={async () => {
            setReadyToVerify(false)
            setParentPhone('')
            setEnteredCode('')
            setVerificationCode('')
            await sendPhoneVerificationCode(true)
          }}>
          Resend
        </button>
      )}
    </div>
  )
}