import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import InputWrapper from '/src/components/shared/inputWrapper'
import DomManager from '/src/managers/domManager'
import AlertManager from '/src/managers/alertManager'
import Manager from '../../../managers/manager'
import SmsManager from '/src/managers/smsManager.js'
import validator from 'validator'
import DB from '../../../database/DB'
import ScreenNames from '../../../constants/screenNames'
import StringManager from '../../../managers/stringManager'

export default function RequestParentAccess() {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state
  const [readyToVerify, setReadyToVerify] = useState(false)
  const [parentPhone, setParentPhone] = useState(null)
  const [enteredCode, setEnteredCode] = useState(0)
  const [verificationCode, setVerificationCode] = useState('')

  // SEND VERIFICATION CODE
  const sendPhoneVerificationCode = async (codeResent = false) => {
    if ((!parentPhone || !validator.isMobilePhone(parentPhone)) && !codeResent) {
      AlertManager.throwError('Phone number is not valid')
      return false
    } else {
      const parent = await getParentAccount()
      if (!parent) {
        AlertManager.throwError('No parent account found with provided phone number', 'Please check the phone number and enter again')
        setErrorAlertTextColor()
        return false
      }
      if (parentPhone === currentUser?.phone) {
        AlertManager.throwError('Unable to request access', "Your parent's phone number cannot be your phone number")
        setErrorAlertTextColor()
        return false
      }
      const phoneCode = Manager.getUid().slice(0, 6)
      setVerificationCode(phoneCode)
      setState({ ...state, isLoading: true, loadingText: 'Sending security code...' })
      await SmsManager.send(parentPhone, SmsManager.getParentVerificationTemplate(currentUser?.name, phoneCode))
      setReadyToVerify(true)
      setState({ ...state, isLoading: false })
    }
  }

  const verifyPhoneCode = async (e) => {
    if (enteredCode.length === 0) {
      AlertManager.throwError('Access code is required')
      return false
    }

    // Access granted
    if (enteredCode === verificationCode) {
      const childAccount = {
        phone: currentUser?.phone,
        name: StringManager.formatNameFirstNameOnly(StringManager.uppercaseFirstLetterOfAllWords(currentUser?.name)),
      }
      const parent = await getParentAccount()
      if (parent) {
        await DB.add(`${DB.tables.users}/${parent?.phone}/childAccounts`, childAccount)
        await DB.add(`${DB.tables.users}/${currentUser?.phone}/parents`, { name: parent?.name, phone: parent?.phone })
        await DB.updateByPath(`${DB.tables.users}/${currentUser?.phone}/parentAccessGranted`, true)
        AlertManager.successAlert('Access Granted!')
        setState({ ...state, currentScreen: ScreenNames.calendar })
      }
    } else {
      AlertManager.throwError('Security code is incorrect, please try again', 'Please check with your parent to see if the request was denied.')
      setErrorAlertTextColor()
      return false
    }
  }

  const getParentAccount = async () => await DB.getTable(`${DB.tables.users}/${parentPhone}`, true)

  const setErrorAlertTextColor = () => {
    const text = document.getElementById('swal2-html-container')
    text.style.color = 'white'
  }

  return (
    <div className="page-container parent-access">
      <p className="screen-title">Request Access from Parent</p>
      <p className="mb-10">For privacy and security, your parent must provide a code to give you access.</p>
      <p className="mb-10">
        When you enter your parent's phone number and {DomManager.tapOrClick()} the Request Access button, a text message with the will be sent to your parent.
      </p>
      <p className="mb-10">That parent will receive a security code. Ask them to provide it to you and enter it below.</p>
      {!readyToVerify && (
        <InputWrapper
          inputType={'input'}
          inputValueType="number"
          required={true}
          labelText={'Parent Phone Number'}
          onChange={(e) => setParentPhone(e.target.value)}
        />
      )}
      {readyToVerify && <InputWrapper labelText={'Access Code'} onChange={(e) => setEnteredCode(e.target.value)} />}
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