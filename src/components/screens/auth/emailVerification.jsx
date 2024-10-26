import React, { useState, useEffect, useContext } from 'react'
import DB from '@db'
import globalState from '../../../context'
import Alert from '@shared/alert'
import Manager from '@manager'
import SmsManager from '@managers/smsManager'
import ScreenNames from '@screenNames'
import { phone } from 'phone'

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
  displayAlert,
  throwError,
  uniqueArray,
  getFileExtension,
  formatPhone,
  successAlert,
} from '../../../globalFunctions'
import { getAuth, sendSignInLinkToEmail } from 'firebase/auth'
import firebaseConfig from '../../../firebaseConfig'
import { initializeApp } from 'firebase/app'
import ParentPermissionCode from '../../../models/parentPermissionCode'
import DateFormats from '../../../constants/dateFormats'
import EmailManager from '../../../managers/emailManager'

export default function EmailVerification() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, currentScreen } = state
  const [email, setEmail] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [phoneIsVerified, setPhoneIsVerified] = useState(false)

  // Firebase Init
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

  const phoneIsValid = () => {
    let phoneIsValid = true
    var regExp = /[a-zA-Z]/g
    const validatePhone = phone(`+1${formatPhone(userPhone)}`)
    const { isValid } = validatePhone
    const hasLetters = regExp.test(userPhone)
    if (isValid) {
      phoneIsValid = true
    }
    if (hasLetters) {
      phoneIsValid = false
    }
    if (userPhone.length > 10 || userPhone.length < 10) {
      phoneIsValid = false
    }
    return phoneIsValid
  }

  useEffect(() => {
    Manager.showPageContainer()
  }, [])

  return (
    <>
      <div id="email-verification-container" className="page-container form">
        <div className="form" autoComplete="off">
          {!phoneIsVerified && (
            <>
              <label>
                Phone Number <span className="asterisk">*</span>
              </label>
              <input type="phone" onChange={(e) => setUserPhone(e.target.value)} />
              <button className="button default green w-100 mt-15" onClick={sendPhoneVerificationCode}>
                Send Phone Verification Code <span className="material-icons-round fs-22">phone_iphone</span>
              </button>
            </>
          )}
          {phoneIsVerified && (
            <>
              <label>
                Email Address<span className="asterisk">*</span>
              </label>
              <input autoComplete="off" className="mb-15" value={email} type="email" onChange={(e) => setEmail(e.target.value)} />
              <button className="button default green w-100" onClick={sendLink}>
                Send Verification Email <span className="material-icons-round fs-22">forward_to_inbox</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
