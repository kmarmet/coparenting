import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import Manager from '@manager'
import ScreenNames from '@screenNames'

import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
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
import validator from 'validator'
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'
import firebaseConfig from '../../../firebaseConfig'
import { initializeApp } from 'firebase/app'
import AlertManager from '../../../managers/alertManager'
import InputWrapper from '../../shared/inputWrapper'
import DB from '@db'

export default function ResetPassword() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, firebaseUser } = state
  const [viewPassword, setViewPassword] = useState(false)
  const [email, setEmail] = useState('')
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

  const sendResetLink = async () => {
    if (!validator.isEmail(email)) {
      AlertManager.throwError('Email is not valid')
      return false
    }
    await sendPasswordResetEmail(auth, email)
      .then(async (link) => {
        const users = Manager.convertToArray(await DB.getTable(DB.tables.users))
        const foundUser = users.filter((x) => x.email === password)[0]

        AlertManager.successAlert('A reset link has been sent to your email')
        setState({
          ...state,
          currentScreen: ScreenNames.login,
          currentUser: foundUser,
          userIsLoggedIn: true,
        })
      })
      .catch((error) => {
        AlertManager.throwError('error', 'We could not find an account with the email provided')
        console.log(error)
        // Some error occurred.
      })
  }

  useEffect(() => {
    Manager.showPageContainer()
  }, [])

  return (
    <>
      <div id="forgot-password-container" className="page-container light form">
        <p className="screen-title ">Reset Password</p>
        <div className="form" autoComplete="off">
          <InputWrapper labelText={'Email Address'} required={true} inputValueType={'email'} onChange={(e) => setEmail(e.target.value)} />
          <div className="flex gap">
            <button className="button default green" onClick={sendResetLink}>
              Send Reset Link
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