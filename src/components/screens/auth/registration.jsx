// Path: src\components\screens\auth\registration.jsx
import {initializeApp} from 'firebase/app'
import {createUserWithEmailAndPassword, getAuth} from 'firebase/auth'
import React, {useContext, useState} from 'react'
import PasswordChecklist from 'react-password-checklist'
import validator from 'validator'
import Manager from '../../../managers/manager.js'
import InputWrapper from '/src/components/shared/inputWrapper'
import Spacer from '/src/components/shared/spacer'
import ScreenNames from '/src/constants/screenNames'
import globalState from '/src/context.js'
import firebaseConfig from '/src/firebaseConfig'
import AlertManager from '/src/managers/alertManager'
import LogManager from '/src/managers/logManager.js'
import DomManager from '/src/managers/domManager.js'
import InputTypes from '../../../constants/inputTypes'

export default function Registration() {
  const {state, setState} = useContext(globalState)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmedPassword, setConfirmedPassword] = useState('')

  // Firebase init
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

  // SUBMIT
  const Submit = async () => {
    if (!validator.isEmail(email)) {
      AlertManager.throwError('Email address is not valid')
      return false
    }
    if (!Manager.isValid(confirmedPassword) || !Manager.isValid(password)) {
      AlertManager.throwError('Please enter a password')
      return false
    }
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        try {
          // Signed up successfully
          const user = userCredential.user
          console.log('Signed up as:', user.email)
          AlertManager.successAlert(`Welcome aboard!`)
          setState({...state, currentScreen: ScreenNames.login})
        } catch (error) {
          LogManager.log(error.message, LogManager.logTypes.error)
        }
      })
      .catch((error) => {
        console.error('Sign up error:', error.message)
        if (Manager.contains(error.message, 'email-already-in-use')) {
          AlertManager.throwError(`Account already exists. If you meant to login, ${DomManager.tapOrClick()} Back to Login below`)
          return false
        }
      })
  }

  return (
    <>
      {/* PAGE CONTAINER */}
      <div id="registration-container" className="page-container form">
        <p className="screen-title">Sign Up</p>

        <Spacer height={15} />

        {/* PARENT FORM */}
        <div className="form">
          <InputWrapper inputType={InputTypes.text} required={true} labelText={'Email Address'} onChange={(e) => setEmail(e.target.value)} />
          <InputWrapper
            inputType={InputTypes.password}
            inputValueType="password"
            required={true}
            labelText={'Password'}
            onChange={(e) => setPassword(e.target.value)}
          />
          <InputWrapper
            inputType={InputTypes.password}
            inputValueType="password"
            required={true}
            labelText={'Confirm Password'}
            onChange={(e) => setConfirmedPassword(e.target.value)}
          />
          <Spacer height={15} />
          <PasswordChecklist
            rules={['minLength', 'specialChar', 'number', 'capital', 'match', 'notEmpty']}
            minLength={5}
            className={'password-validation'}
            value={password}
            valueAgain={confirmedPassword}
            onChange={(isValid) => {
              if (isValid) {
                setPassword(password)
              }
            }}
          />
          <Spacer height={15} />
          <button
            className="button default green"
            onClick={() => {
              if (!validator.isEmail(email)) {
                AlertManager.throwError('Email address is not valid')
                return false
              }
              if (!Manager.isValid(confirmedPassword) || !Manager.isValid(password)) {
                AlertManager.throwError('Please enter a password')
                return false
              }
              AlertManager.confirmAlert('Are the details you provided correct?', 'Yes', 'No', Submit)
            }}>
            Submit
          </button>
          <button
            id="registration-screen"
            className="button default back-to-login-button"
            onClick={() => setState({...state, currentScreen: ScreenNames.login})}>
            Back to Login
          </button>
        </div>
      </div>
    </>
  )
}