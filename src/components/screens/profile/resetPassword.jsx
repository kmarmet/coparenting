// Path: src\components\screens\profile\resetPassword.jsx
import React, {useContext, useState} from 'react'
import globalState from '../../../context'
import ScreenNames from '../../../constants/screenNames'
import validator from 'validator'
import {getAuth, sendPasswordResetEmail} from 'firebase/auth'
import firebaseConfig from '../../../firebaseConfig'
import {initializeApp} from 'firebase/app'
import AlertManager from '../../../managers/alertManager'
import InputWrapper from '../../shared/inputWrapper'
import Spacer from '../../shared/spacer'
import InputTypes from '../../../constants/inputTypes'

export default function ResetPassword() {
  const {state, setState} = useContext(globalState)
  const {theme, firebaseUser} = state
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
        AlertManager.throwError('Profile not Found', 'We could not find an profile with the email provided')
        console.log(error)
        // Some error occurred.
      })
  }

  return (
    <>
      <div id="forgot-password-container" className="page-container light form">
        <p className="screen-title ">Reset Password</p>
        <Spacer height={10} />
        <InputWrapper labelText={'Email Address'} required={true} inputType={InputTypes.email} onChange={(e) => setEmail(e.target.value)} />
        <button className="button default green w-100" onClick={sendResetLink}>
          Send Reset Link
        </button>
      </div>
      <button className="button default back-to-login-button" onClick={() => setState({...state, currentScreen: ScreenNames.login})}>
        Back to Login
      </button>
    </>
  )
}