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
import { getAuth, sendCustomPasswordResetEmail, sendPasswordResetEmail } from 'firebase/auth'
import firebaseConfig from '../../../firebaseConfig'
import { initializeApp } from 'firebase/app'

export default function ForgotPassword() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, firebaseUser } = state
  const [email, setEmail] = useState('')
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

  const sendResetLink = async () => {
    if (email.length === 0) {
      displayAlert('error', 'Email is required to reset password')
    }
    await sendPasswordResetEmail(auth, email)
      .then(async (link) => {
        const users = Manager.convertToArray(await DB.getTable(DB.tables.users))
        const foundUser = users.filter((x) => x.email === email)[0]

        if (Manager.isValid(foundUser)) {
          setState({
            ...state,
            currentScreen: ScreenNames.login,
            currentUser: foundUser,
            userIsLoggedIn: true,
          })
        } else {
          console.log('no user')
          displayAlert('error', 'We could not find an account with the email provided')
        }
      })

      .catch((error) => {
        console.log(error)
        // Some error occurred.
      })
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
            Email<span className="asterisk">*</span>
          </label>
          <input autoComplete="off" className="mb-15" value={email} type="email" onChange={(e) => setEmail(e.target.value)} />
          <div className="flex gap">
            <button className="button default green" onClick={sendResetLink}>
              Reset
            </button>
            <button className="button default" onClick={() => setState({ ...state, currentScreen: ScreenNames.login })}>
              Nevermind
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
