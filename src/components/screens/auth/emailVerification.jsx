import React, { useState, useEffect, useContext } from 'react'
import DB from '@db'
import globalState from '../../../context'
import Alert from '@shared/alert'
import Manager from '@manager'
import SmsManager from '@managers/smsManager'
import ScreenNames from '@screenNames'
import { useSwipeable } from 'react-swipeable'
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
  uniqueArray,
  getFileExtension,
} from '../../../globalFunctions'
import { getAuth, sendSignInLinkToEmail } from 'firebase/auth'
import firebaseConfig from '../../../firebaseConfig'
import { initializeApp } from 'firebase/app'

export default function EmailVerification() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, currentScreen } = state
  const [email, setEmail] = useState('')
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

  const actionCodeSettings = {
    // URL you want to redirect back to. The domain (www.example.com) for this
    // URL must be in the authorized domains list in the Firebase Console.
    url: 'https://peaceful-coparenting.app',
    // This must be true.
    handleCodeInApp: true,
  }

  const isValidEmail = () => Manager.validateEmail(email)

  const sendLink = async () => {
    if (isValidEmail()) {
      try {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings)
          .then(() => {
            // The link was successfully sent. Inform the user.
            // Save the email locally so you don't need to ask the user for it again
            // if they open the link on the same device.
            displayAlert('success', 'Verification Email Sent', 'Verification Email Sent')
            window.localStorage.setItem('emailForSignIn', email)
            setState({ ...state, currentScreen: ScreenNames.login })
            // ...
          })
          .catch((error) => {
            const errorCode = error.code
            const errorMessage = error.message
            console.error(error)
            // ...
          })
      } catch (err) {
        console.log(err)
      }
    }
  }

  useEffect(() => {
    Manager.toggleForModalOrNewForm()
  }, [])

  return (
    <>
      {/*<p className="screen-title ">Forgot Password</p>*/}
      <div id="forgot-password-container" className="page-container light form">
        <div className="form" autoComplete="off">
          <label>
            Email Address<span className="asterisk">*</span>
          </label>
          <input autoComplete="off" className="mb-15" value={email} type="email" onChange={(e) => setEmail(e.target.value)} />
          <button className="button default green w-70" onClick={sendLink}>
            Send Verification Email <span className="material-icons-round fs-22">forward_to_inbox</span>
          </button>
        </div>
      </div>
    </>
  )
}
