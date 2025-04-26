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
  const [userName, setUserName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const {currentUser} = useCurrentUser()

  // SEND VERIFICATION CODE
  const SendPhoneVerificationCode = async (codeResent = false) => {
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
      setState({...state, isLoading: true, loadingText: 'Sending security code...'})
      await SmsManager.send(parentPhone, SmsManager.getParentVerificationTemplate(userName, phoneCode))
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
      const parent = await DB.find(DB.tables.users, ['email', parentEmail], true)

      if (parent) {
        const existingChild = parent?.children?.find((x) => x?.general?.phone === currentUser?.phone || x?.general?.email === currentUser?.email)

        // ADD OR UPDATE CHILD RECORD UNDER PARENT
        // -> Add
        if (!Manager.isValid(existingChild) || ObjectManager.isEmpty(existingChild)) {
          const childToAdd = new Child()
          const general = new General()
          general.phone = currentUser?.phone
          general.name = StringManager.uppercaseFirstLetterOfAllWords(userName)
          childToAdd.general = general
          childToAdd.userKey = currentUser?.key
          const cleanChild = ObjectManager.cleanObject(childToAdd, ModelNames.child)
          await DB_UserScoped.addUserChild(parent, cleanChild)
        }

        // -> Update
        else {
          const existingChildKey = await DB.getSnapshotKey(`${DB.tables.users}/${parent?.key}/children`, existingChild, 'id')

          if (Manager.isValid(existingChildKey)) {
            existingChild.userKey = currentUser?.key
            await DB.updateByPath(`${DB.tables.users}/${parent?.key}/children/${existingChildKey}`, existingChild)
          }
        }

        // Add parent
        await DB.add(`${DB.tables.users}/${currentUser?.key}/parents`, {
          name: parent?.name,
          phone: parent?.phone,
          userKey: parent?.key,
          email: parent?.email,
        })
        await DB.updateByPath(`${DB.tables.users}/${currentUser?.key}/parentAccessGranted`, true)
        await DB.updateByPath(`${DB.tables.users}/${currentUser?.key}/name`, StringManager.uppercaseFirstLetterOfAllWords(userName))
        setState({...state, currentScreen: ScreenNames.onboarding, successAlertMessage: 'Access Granted'})
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

  useEffect(() => {
    if (Manager.isValid(currentUser)) {
      if (Manager.isValid(currentUser?.parentAccessGranted) && currentUser?.parentAccessGranted === true) {
        setState({...state, currentScreen: ScreenNames.calendar})
      }
    }
  }, [currentUser])

  return (
    <div className="page-container parent-access">
      <p className="screen-title">Request Access from Parent</p>
      <Spacer height={5} />
      <p>To ensure privacy and security, your parent needs to provide a code for you to gain access.</p>
      <Spacer height={5} />
      <p>
        When you enter your parent&#39;s phone number and {DomManager.tapOrClick()} the <b>Request Access</b> button, a text message containing the
        code will be sent to them.
      </p>
      <Spacer height={5} />
      <p>Please ask your parent for the code and enter it below.</p>
      <Spacer height={10} />
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
      <Spacer height={10} />
      {readyToVerify && (
        <InputWrapper labelText={'Access Code'} inputType={InputTypes.text} required={true} onChange={(e) => setEnteredCode(e.target.value)} />
      )}
      {!readyToVerify && (
        <button className="button default green center" onClick={SendPhoneVerificationCode}>
          Request Access
        </button>
      )}
      <Spacer height={10} />
      {readyToVerify && (
        <button className="button default green center" onClick={VerifyPhoneCode}>
          Verify Code
        </button>
      )}
      <Spacer height={10} />
      {readyToVerify && (
        <button
          className="button default submit center"
          onClick={async () => {
            setReadyToVerify(false)
            setParentPhone('')
            setEnteredCode('')
            setVerificationCode('')
            await SendPhoneVerificationCode(true)
          }}>
          Resend
        </button>
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