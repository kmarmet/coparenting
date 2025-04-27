// Path: src\components\screens\auth\requestParentAccess.jsx
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../../context'
import InputWrapper from '/src/components/shared/inputWrapper'
import AlertManager from '/src/managers/alertManager'
import Manager from '../../../managers/manager'
import SmsManager from '/src/managers/smsManager.js'
import validator from 'validator'
import DB from '../../../database/DB'
import InputTypes from '../../../constants/inputTypes'
import ScreenNames from '../../../constants/screenNames'
import StringManager from '../../../managers/stringManager'
import useCurrentUser from '../../../hooks/useCurrentUser'
import Spacer from '../../shared/spacer'
import DomManager from '../../../managers/domManager'
import Child from '../../../models/child/child'
import General from '../../../models/child/general'
import DB_UserScoped from '../../../database/db_userScoped'
import ObjectManager from '../../../managers/objectManager'
import ModelNames from '../../../models/modelNames'

export default function RequestParentAccess() {
  const {state, setState} = useContext(globalState)
  const [readyToVerify, setReadyToVerify] = useState(false)
  const [parentPhone, setParentPhone] = useState(null)
  const [enteredCode, setEnteredCode] = useState(0)
  const [verificationCode, setVerificationCode] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const {currentUser} = useCurrentUser()
  const [userName, setUserName] = useState(currentUser?.name)

  // SEND VERIFICATION CODE
  const SendPhoneVerificationCode = async (codeResent = false) => {
    const errorString = Manager.GetInvalidInputsErrorString([
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
          'Please check the email and enter again, or let your parent know they will need to register an account'
        )
        return false
      }
      // if (parentPhone === currentUser?.phone) {
      //   AlertManager.throwError('Unable to request access', "Your parent's phone number cannot be your phone number")
      //   return false
      // }
      const phoneCode = Manager.getUid().slice(0, 6)
      setVerificationCode(phoneCode)
      setState({...state, isLoading: true, loadingText: 'Sending security code to your parent...'})
      await SmsManager.Send(parentPhone, SmsManager.getParentVerificationTemplate(StringManager.getFirstNameOnly(currentUser?.name), phoneCode))
      setReadyToVerify(true)
      setState({...state, isLoading: false})
    }
  }

  const VerifyPhoneCode = async () => {
    if (enteredCode.length === 0) {
      AlertManager.throwError('Access code is required')
      return false
    }

    // Access granted
    if (enteredCode === verificationCode) {
      const existingParentAccount = await DB.find(DB.tables.users, ['email', parentEmail], true)

      if (existingParentAccount) {
        const existingChild = existingParentAccount?.children?.find(
          (x) => x?.general?.phone === currentUser?.phone || x?.general?.email === currentUser?.email
        )

        // ADD OR UPDATE CHILD RECORD UNDER PARENT
        // -> Add child to parent
        if (!Manager.isValid(existingChild) || ObjectManager.isEmpty(existingChild)) {
          const childToAdd = new Child()
          const general = new General()
          general.phone = currentUser?.phone
          general.name = StringManager.uppercaseFirstLetterOfAllWords(userName)
          childToAdd.general = general
          childToAdd.userKey = currentUser?.key
          const cleanChild = ObjectManager.cleanObject(childToAdd, ModelNames.child)
          await DB_UserScoped.addUserChild(existingParentAccount, cleanChild)
        }

        // -> Update
        else {
          const existingChildKey = await DB.getSnapshotKey(`${DB.tables.users}/${existingParentAccount?.key}/children`, existingChild, 'id')

          if (Manager.isValid(existingChildKey)) {
            existingChild.userKey = currentUser?.key
            await DB.updateByPath(`${DB.tables.users}/${existingParentAccount?.key}/children/${existingChildKey}`, existingChild)
          }
        }

        // Add parent to child
        await DB.add(`${DB.tables.users}/${currentUser?.key}/parents`, {
          name: existingParentAccount?.name,
          phone: existingParentAccount?.phone,
          userKey: existingParentAccount?.key,
          email: existingParentAccount?.email,
        })
        await DB_UserScoped.updateUserRecord(currentUser?.key, 'parentAccessGranted', true)
        await DB_UserScoped.updateUserRecord(currentUser?.key, 'sharedDataUsers', [existingParentAccount?.key])
        setState({...state, currentScreen: ScreenNames.onboarding, successAlertMessage: 'Access Granted'})
      } else {
        AlertManager.throwError(
          'No parent profile found with provided email',
          'Please check the email and enter again or let your parent know they will need to register an account'
        )
        return false
      }
    } else {
      AlertManager.throwError('Access code is incorrect, please try again')
      return false
    }
  }

  useEffect(() => {
    if (Manager.isValid(currentUser)) {
      setUserName(currentUser?.name)
    }
  }, [currentUser])

  return (
    <div className="page-container parent-access">
      {!readyToVerify && (
        <>
          <p className="screen-title">Request Access from Parent</p>
          <Spacer height={5} />
          <p>To ensure privacy and security, your parent needs to provide a code for you to gain access.</p>
          <Spacer height={5} />
          <p>
            When you enter your parent&#39;s phone number and {DomManager.tapOrClick()} the <b>Request Access</b> button, a text message containing
            the code will be sent to them.
          </p>
          <Spacer height={5} />
          <p>Please ask your parent for the code and enter it below.</p>
        </>
      )}
      {readyToVerify && <p className="screen-title">Enter Access Code</p>}

      {!readyToVerify && (
        <>
          {/* PARENT EMAIL */}
          <InputWrapper
            inputType={InputTypes.email}
            required={true}
            labelText={'Parent Email Address'}
            onChange={(e) => setParentEmail(e.target.value)}
          />
          {/* PARENT PHONE */}
          <InputWrapper
            inputType={InputTypes.phone}
            required={true}
            labelText={'Parent Phone Number'}
            onChange={(e) => setParentPhone(e.target.value)}
          />
          <button className="button default green center" onClick={SendPhoneVerificationCode}>
            Send Access Code
          </button>
        </>
      )}
      <Spacer height={10} />
      {readyToVerify && (
        <>
          <InputWrapper labelText={'Access Code'} inputType={InputTypes.text} required={true} onChange={(e) => setEnteredCode(e.target.value)} />
          <Spacer height={10} />
          <button className="button w-50 default green center" onClick={VerifyPhoneCode}>
            Verify Code
          </button>
          <Spacer height={5} />
          <button
            className="button default grey center w-50"
            onClick={async () => {
              setReadyToVerify(false)
              setParentPhone('')
              setEnteredCode('')
              setVerificationCode('')
              await SendPhoneVerificationCode(true)
            }}>
            Resend
          </button>
        </>
      )}
      <button
        id="request-access-screen"
        className="button default back-to-login-button"
        onClick={() => setState({...state, currentScreen: ScreenNames.login})}>
        Back to Login
      </button>
    </div>
  )
}