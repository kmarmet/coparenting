// Path: src\components\screens\auth\login.jsx
import InputWrapper from '/src/components/shared/inputWrapper'
import ScreenNames from '/src/constants/screenNames'
import globalState from '/src/context.js'
import firebaseConfig from '/src/firebaseConfig'
import AlertManager from '/src/managers/alertManager'
import DomManager from '/src/managers/domManager'
import Manager from '/src/managers/manager'
import {initializeApp} from 'firebase/app'
import {browserLocalPersistence, getAuth, sendEmailVerification, setPersistence, signInWithEmailAndPassword} from 'firebase/auth'
import React, {useContext, useEffect, useRef, useState} from 'react'
import {PiEyeClosedDuotone, PiEyeDuotone} from 'react-icons/pi'
import Turnstile, {useTurnstile} from 'react-turnstile'
import validator from 'validator'
import InputTypes from '../../../constants/inputTypes'
import LogManager from '../../../managers/logManager'
import Checkbox from '../../shared/checkbox'
import ScreenHeader from '../../shared/screenHeader'
import Spacer from '../../shared/spacer'

export default function Login() {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const [viewPassword, setViewPassword] = useState(false)
  const [isPersistent, setIsPersistent] = useState(false)
  const [challengeSolved, setChallengeSolved] = useState(false)
  const turnstile = useTurnstile()

  const credentials = useRef({email: '', password: ''})

  // Init Firebase
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

  const Login = async () => {
    // Validation
    if (!validator.isEmail(credentials.current.email)) {
      AlertManager.throwError('Email address is not valid')
      setState({...state, isLoading: false})
      return false
    }
    const errorString = Manager.GetInvalidInputsErrorString([
      {name: 'Email', value: credentials.current.email},
      {name: 'Password', value: credentials.current.password},
    ])

    if (Manager.IsValid(errorString, true)) {
      AlertManager.throwError(errorString)
      setState({...state, isLoading: false})
      return false
    }

    if (isPersistent) {
      setPersistence(auth, browserLocalPersistence).then(async () => {
        await SignInWithEmailAndPassword()
      })
    } else {
      await SignInWithEmailAndPassword()
    }
  }

  const SignInWithEmailAndPassword = () => {
    return (
      signInWithEmailAndPassword(auth, credentials.current.email, credentials.current.password)
        .then(async (userCredential) => {
          const user = userCredential?.user

          // USER NEEDS TO VERIFY EMAIL
          if (!user.emailVerified) {
            AlertManager.oneButtonAlert(
              'Email Address Verification Needed',
              `For security purposes, we need to verify ${user.email}. Please ${DomManager.tapOrClick()} the link sent to your email and then login.`,
              'info',
              () => setState({...state, isLoading: false})
            )
            sendEmailVerification(user)
          }

          // EMAIL IS VERIFIED -> REDIRECT TO CALENDAR
          else {
            setState({
              ...state,
              userIsLoggedIn: true,
              authUser: user,
              isLoading: false,
              currentScreen: ScreenNames.calendar,
            })
          }
        })

        // SIGN IN ERROR
        .catch((error) => {
          LogManager.Log(`Error: ${error} | Code File: Login | Function: SignInWithEmailAndPassword`, error.stack)
          setState({...state, isLoading: false})
          if (Manager.Contains(error.message, 'user-not-found')) {
            AlertManager.throwError(
              `No account with email ${credentials.current.email} found.`,
              `If you have forgotten your password, please ${DomManager.tapOrClick()} Forgot Password`
            )
          } else {
            AlertManager.throwError(`Incorrect password`, `Please ${DomManager.tapOrClick()} Forgot Password`)
            return false
          }
        })
    )
  }

  useEffect(() => {
    setState({...state, isLoading: false})
  }, [])

  return (
    <>
      {/* PAGE CONTAINER */}
      <div id="login-container" className={`page-container login`}>
        {!window.location.href.includes('localhost') && (
          <Turnstile
            /* eslint-disable-next-line no-undef */
            sitekey={process.env.REACT_APP_CLOUDFARE_CAPTCHA_SITE_KEY}
            onSuccess={() => {
              console.log(`Captcha Challenge Solved`)
              setChallengeSolved(true)
            }}
            onFail={() => {
              setState({...state, successAlertMessage: 'Pre-Authentication Failed. Please close and reopen the app again'})
            }}
            onError={(error) => {
              setState({...state, successAlertMessage: 'Pre-Authentication Failed. Please close and reopen the app again'})
              LogManager.Log(`Error: ${error} | Code File: Login | Function: None  `)
              console.log(`Captcha Error: ${error}`)
            }}
            onExpire={() => {
              console.log('Captcha Expired')
            }}
          />
        )}

        <ScreenHeader wrapperClass="login-header">
          <img
            onClick={() => setState({...state, currentScreen: ScreenNames.landing})}
            /* eslint-disable-next-line no-undef */
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

          <Spacer height={8} />

          {/* INSTALL BUTTON */}
          <p
            id="install-button"
            className="button"
            onClick={() => {
              setState({...state, menuIsOpen: false, currentScreen: ScreenNames.installApp})
            }}>
            Install
          </p>
        </ScreenHeader>

        {/* FORM/INPUTS */}
        <div className="screen-content">
          <div className="form-container">
            {/* EMAIL */}
            <InputWrapper
              inputClasses="email login-input"
              inputType={InputTypes.email}
              required={true}
              wrapperClasses="white"
              placeholder={'Email Address'}
              onChange={(e) => (credentials.current.email = e.target.value)}
            />
            {/* PASSWORD */}
            <div className="flex">
              <InputWrapper
                inputType={viewPassword ? InputTypes.text : InputTypes.password}
                required={true}
                hasBottomSpacer={false}
                wrapperClasses="password white"
                placeholder={'Password'}
                inputClasses="password login-input"
                onChange={(e) => (credentials.current.password = e.target.value)}
              />
              {!viewPassword && <PiEyeDuotone onClick={() => setViewPassword(true)} className={'blue eye-icon '} />}
              {viewPassword && <PiEyeClosedDuotone onClick={() => setViewPassword(false)} className={'blue eye-icon '} />}
            </div>

            <div id="below-inputs-wrapper" className="flex space-between align-center">
              {/* REMEMBER ME */}
              <Checkbox text={'Remember Me'} onCheck={() => setIsPersistent(!isPersistent)} />
              {/* FORGOT PASSWORD BUTTON */}
              <p id="forgot-password-link" onClick={() => setState({...state, currentScreen: ScreenNames.resetPassword})}>
                Forgot Password
              </p>
            </div>

            <Spacer height={10} />

            {/* LOGIN BUTTONS */}
            {challengeSolved && !window.location.href.includes('localhost') && (
              <button className="button default green" id="login-button" onClick={Login}>
                Login
              </button>
            )}
            {window.location.href.includes('localhost') && (
              <button className="button default green" id="login-button" onClick={Login}>
                Login
              </button>
            )}

            {!challengeSolved && !window.location.href.includes('localhost') && <p id="captcha-loading-text">Pre-Authentication in Progress...</p>}

            <p id="sign-up-link" onClick={() => setState({...state, currentScreen: ScreenNames.registration})}>
              Don&#39;t have an account? <span>Sign Up</span>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}