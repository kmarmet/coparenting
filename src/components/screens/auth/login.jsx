// Path: src\components\screens\auth\login.jsx
import {initializeApp} from 'firebase/app'
import {browserLocalPersistence, getAuth, sendEmailVerification, setPersistence, signInWithEmailAndPassword} from 'firebase/auth'
import React, {useContext, useState} from 'react'
import {Fade} from 'react-awesome-reveal'
import {PiEyeClosedDuotone, PiEyeDuotone} from 'react-icons/pi'
import {FaArrowCircleDown} from 'react-icons/fa'
import validator from 'validator'
import CheckboxGroup from '/src/components/shared/checkboxGroup.jsx'
import InputWrapper from '/src/components/shared/inputWrapper'
import ScreenNames from '/src/constants/screenNames'
import globalState from '/src/context.js'
import firebaseConfig from '/src/firebaseConfig'
import AlertManager from '/src/managers/alertManager'
import DomManager from '/src/managers/domManager'
import Manager from '/src/managers/manager'
import DB from '../../../database/DB'
import Spacer from '../../shared/spacer'
import ReCAPTCHA from 'react-google-recaptcha'
import InputTypes from '../../../constants/inputTypes'

export default function Login() {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [viewPassword, setViewPassword] = useState(false)
  const [isPersistent, setIsPersistent] = useState(false)
  const [recaptchaVerified, setRecaptchaVerified] = useState(false)
  const [recaptchaSitekey, setRecaptchaSitekey] = useState(process.env.REACT_APP_RECAPTCHA_SITE_KEY)
  const recaptchaRef = React.createRef()
  // Init Firebase
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

  const signIn = async () => {
    // Validation
    if (!validator.isEmail(email)) {
      AlertManager.throwError('Email address is not valid')
      setState({...state, isLoading: false})
      return false
    }
    if (email.length === 0 || password.length === 0) {
      AlertManager.throwError('Please fill out all fields')
      setState({...state, isLoading: false})
      return false
    }

    // Is Persistent
    if (isPersistent) {
      setPersistence(auth, browserLocalPersistence).then(async () => {
        return signInWithEmailAndPassword(auth, email, password)
          .then(async (userCredential) => {
            const user = userCredential.user
            const users = await DB.getTable(DB.tables.users)
            const dbUser = users?.find((u) => u?.email === user?.email)
            let nextScreen = dbUser ? ScreenNames.calendar : ScreenNames.userDetails
            if (dbUser?.accountType === 'child') {
              if (dbUser?.parentAccessGranted === false) {
                nextScreen = ScreenNames.requestParentAccess
              }
            }
            // USER NEEDS TO VERIFY EMAIL
            if (!user.emailVerified) {
              AlertManager.oneButtonAlert(
                'Email Address Verification Needed',
                `For security purposes, we need to verify ${user.email}. Please ${DomManager.tapOrClick()} the link sent to your email and login.`,
                'info',
                () => {}
              )
              sendEmailVerification(user)
              setState({...state, isLoading: false})
            }

            // Persistent AND Email is Verified
            else {
              setState({
                ...state,
                userIsLoggedIn: true,
                isLoading: false,
                currentScreen: nextScreen,
              })
            }
          })
          .catch((error) => {
            setState({...state, isLoading: false})
            console.error('Sign in error:', error.message)
            if (Manager.contains(error.message, 'wrong-password')) {
              console.log('found')
              AlertManager.throwError(`Incorrect Password`, `Please ${DomManager.tapOrClick(true)} Reset Password below`)
            }
          })
      })
    }

    // Not Persistent
    else {
      setState({...state, isLoading: false})
      await firebaseSignIn()
    }
  }

  const firebaseSignIn = async () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user
        const users = await DB.getTable(DB.tables.users)
        const dbUser = users?.find((u) => u?.email === user?.email)
        let nextScreen = dbUser ? ScreenNames.calendar : ScreenNames.userDetails
        if (dbUser?.accountType === 'child') {
          if (dbUser?.parentAccessGranted === false) {
            nextScreen = ScreenNames.requestParentAccess
          }
        }
        // USER NEEDS TO VERIFY EMAIL
        if (!user.emailVerified) {
          AlertManager.oneButtonAlert(
            'Email Address Verification Needed',
            `For security purposes, we need to verify ${user.email}. Please ${DomManager.tapOrClick()} the link sent to your email and then login.`,
            'info',
            () => {}
          )
          sendEmailVerification(user)
          setState({...state, isLoading: false})
        }

        // EMAIL IS VERIFIED
        else {
          setState({
            ...state,
            userIsLoggedIn: true,
            isLoading: false,
            currentScreen: nextScreen,
          })
        }
      })
      .catch((error) => {
        setState({...state, isLoading: false})
        console.error('Sign in error:', error.message)
        if (Manager.contains(error.message, 'user-not-found')) {
          AlertManager.throwError(
            `No account with email ${email} found.`,
            `If you have forgotten your password, please ${DomManager.tapOrClick()} Reset Password`
          )
          setErrorAlertTextColor()
        } else {
          AlertManager.throwError(`Incorrect password`, `Please ${DomManager.tapOrClick()} Reset Password.`)
        }
      })
  }

  const setErrorAlertTextColor = () => {
    const text = document.getElementById('swal2-html-container')
    text.style.color = 'white'
  }

  const togglePersistence = (e) => {
    const clickedEl = e.currentTarget
    if (clickedEl) {
      if (clickedEl.classList.contains('active')) {
        clickedEl.classList.remove('active')
        setIsPersistent(false)
      } else {
        clickedEl.classList.add('active')
        setIsPersistent(true)
      }
    }
  }

  return (
    <>
      {/* PAGE CONTAINER */}
      <div id="login-container" className={`page-container form login`}>
        <Fade direction={'right'} duration={800} damping={0.2} cascade={true} className={'visitation-fade-wrapper'} triggerOnce={true}>
          <img
            onClick={() => setState({...state, currentScreen: ScreenNames.home})}
            className="ml-auto mr-auto"
            src={require('../../../img/logo.png')}
            alt="Peaceful coParenting"
          />
          {/* QUOTE CONTAINER */}
          <div id="quote-container">
            <p id="quote">
              Co-Parenting. It&#39;s not a competition between two homes. It&#39;s <b>a collaboration of parents doing what is best for the kids.</b>
            </p>
            <p id="author">~ Heather Hetchler</p>
          </div>

          {/* INSTALL BUTTON */}
          <p
            id="install-button"
            className="mb-10 button mt-20"
            onClick={() => {
              setState({...state, menuIsOpen: false, currentScreen: ScreenNames.installApp})
            }}>
            Install <FaArrowCircleDown className={'fs-16 ml-10'} />
          </p>

          {/* FORM/INPUTS */}
          <div className="flex form-container">
            <div className="form">
              {/* EMAIL */}
              <InputWrapper
                inputClasses="email login-input"
                inputType={InputTypes.email}
                required={true}
                labelText={'Email Address'}
                onChange={(e) => setEmail(e.target.value)}
              />
              {/* PASSWORD */}
              <div className="flex inputs">
                <InputWrapper
                  inputType={InputTypes.password}
                  required={true}
                  wrapperClasses="password"
                  labelText={'Password'}
                  inputClasses="password login-input"
                  onChange={(e) => setPassword(e.target.value)}
                />
                {!viewPassword && <PiEyeDuotone onClick={() => setViewPassword(true)} className={'blue eye-icon ml-10'} />}
                {viewPassword && <PiEyeClosedDuotone onClick={() => setViewPassword(false)} className={'blue eye-icon ml-10'} />}
              </div>

              <div id="below-inputs-wrapper" className="flex space-between align-center">
                {/* REMEMBER ME */}
                <CheckboxGroup
                  elClass={'light'}
                  onCheck={togglePersistence}
                  checkboxArray={Manager.buildCheckboxGroup({
                    customLabelArray: ['Remember Me'],
                  })}
                  skipNameFormatting={true}
                />
                {/* FORGOT PASSWORD BUTTON */}
                <p id="forgot-password-link" onClick={() => setState({...state, currentScreen: ScreenNames.resetPassword})}>
                  Forgot Password
                </p>
              </div>

              <Spacer height={10} />

              {/* LOGIN BUTTONS */}
              {recaptchaVerified && (
                <button className="button default green" id="login-button" onClick={signIn}>
                  Login
                </button>
              )}
            </div>

            {/* RECAPTCHA */}
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={recaptchaSitekey}
              onChange={(e) => {
                if (Manager.isValid(e, true)) {
                  setRecaptchaVerified(true)
                }
              }}
            />

            <p id="sign-up-link" onClick={() => setState({...state, currentScreen: ScreenNames.registration})}>
              Don&#39;t have an account? <span>Sign Up</span>
            </p>
          </div>
        </Fade>
      </div>
    </>
  )
}