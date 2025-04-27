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
import DomManager from '/src/managers/domManager.js'
import InputTypes from '../../../constants/inputTypes'
import CheckboxGroup from '../../shared/checkboxGroup'
import DB_UserScoped from '../../../database/db_userScoped'

export default function Registration() {
  const {state, setState} = useContext(globalState)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmedPassword, setConfirmedPassword] = useState('')
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [accountType, setAccountType] = useState('')

  // Firebase init
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

  // SUBMIT
  const Submit = async () => {
    if (!validator.isEmail(email)) {
      AlertManager.throwError('Email address is not valid')
      return false
    }

    const errorString = Manager.GetInvalidInputsErrorString([
      {name: 'Your Name', value: name},
      {name: 'Your Phone Number', value: phoneNumber},
      {name: 'Profile Type', value: accountType},
      {name: 'Email', value: email},
      {name: 'Password', value: password},
      {name: 'Password Confirmation', value: confirmedPassword},
    ])
    if (Manager.isValid(errorString, true)) {
      AlertManager.throwError(errorString)
      return false
    }

    // CREATE FIREBASE USER
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        try {
          // Signed up successfully
          const user = userCredential.user
          console.log('Signed up as:', user.email)
          setState({...state, successAlertMessage: 'Welcome aboard!'})
          const userObject = {
            phone: phoneNumber,
            email: email,
            accountType,
            authUser: user,
            name,
            key: user?.uid,
          }
          const newUser = await DB_UserScoped.createAndInsertUser(userObject)
          setState({
            ...state,
            currentScreen: accountType === 'parent' ? ScreenNames.onboarding : ScreenNames.requestParentAccess,
            currentUser: newUser,
            successAlertMessage: 'Success',
          })
        } catch (error) {
          console.log(`Error: ${error} | Code File: Registration  | Function:  Submit `)
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

  const HandleAccountType = (type) => {
    Manager.handleCheckboxSelection(
      type,
      (type) => {
        setAccountType(type)
      },
      () => {},
      false
    )
  }

  return (
    <>
      {/* PAGE CONTAINER */}
      <div id="registration-container" className="page-container form">
        <p className="screen-title">Sign Up</p>
        <p className="screen-intro-text">
          Please provide your information below to set up an account and begin your harmonious co-parenting experience
        </p>

        <Spacer height={15} />

        {/* PARENT FORM */}
        <div className="form">
          <InputWrapper inputType={InputTypes.text} required={true} labelText={'Name'} onChange={(e) => setName(e.target.value)} />

          <InputWrapper inputType={InputTypes.phone} required={true} labelText={'Phone Number'} onChange={(e) => setPhoneNumber(e.target.value)} />

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

          <Spacer height={10} />

          <CheckboxGroup
            onCheck={HandleAccountType}
            parentLabel="Profile Type (cannot be changed later)"
            labelText="Profile Type"
            checkboxArray={Manager.buildCheckboxGroup({
              customLabelArray: ['Parent', 'Child'],
            })}
            required={true}
            textOnly={true}
            dataKey={['Parent', 'Child']}
          />
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
              AlertManager.confirmAlert('Are the details you provided correct? Profile Type cannot be changed after signing up', 'Yes', 'No', Submit)
            }}>
            Create Account
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