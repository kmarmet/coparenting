// Path: src\components\screens\account\resetPassword.jsx
import React, { useContext, useState } from 'react'
import globalState from '../../../context'
import ScreenNames from '../../../constants/screenNames'
import validator from 'validator'
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'
import firebaseConfig from '../../../firebaseConfig'
import { initializeApp } from 'firebase/app'
import AlertManager from '../../../managers/alertManager'
import InputWrapper from '../../shared/inputWrapper'
import Spacer from '../../shared/spacer'

export default function ResetPassword() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, firebaseUser } = state
  const [email, setEmail] = useState('')
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

  const sendResetLink = async () => {
    if (!validator.isEmail(email)) {
      AlertManager.throwError('Email is not valid')
      return false
    }
    await sendPasswordResetEmail(auth, email)
      .then(async () => {
        AlertManager.successAlert('A reset link has been sent to your email')
        setState({
          ...state,
          currentScreen: ScreenNames.login,
          userIsLoggedIn: true,
        })
      })
      .catch((error) => {
        AlertManager.throwError('Account not Found', 'We could not find an account with the email provided')
        console.log(error)
        // Some error occurred.
      })
  }

  return (
    <>
      <div id="forgot-password-container" className="page-container light form">
        <p className="screen-title ">Reset Password</p>
        <Spacer height={10} />
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