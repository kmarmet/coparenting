import React, { useContext, useLayoutEffect, useState } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../../context.js'
import Manager from '@manager'
import CheckboxGroup from '@shared/checkboxGroup.jsx'
import InstallAppPopup from 'components/installAppPopup.jsx'
import { IoPersonAddOutline } from 'react-icons/io5'
import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  setPersistence,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import firebaseConfig from '../../../firebaseConfig'
import { initializeApp } from 'firebase/app'
import { PiEyeClosedDuotone, PiEyeDuotone } from 'react-icons/pi'
import validator from 'validator'
import { MdOutlinePassword } from 'react-icons/md'
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
import AlertManager from '../../../managers/alertManager'
import InputWrapper from '../../shared/inputWrapper'
import { SlLogin } from 'react-icons/sl'

export default function Login() {
  const { state, setState } = useContext(globalState)
  const { theme } = state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [viewPassword, setViewPassword] = useState(false)
  const [isPersistent, setIsPersistent] = useState(false)

  // Init Firebase
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

  const signIn = async () => {
    // Validation
    if (!validator.isEmail(email)) {
      AlertManager.throwError('Email address is not valid')
      setState({ ...state, isLoading: false })
      return false
    }
    if (email.length === 0 || password.length === 0) {
      AlertManager.throwError('Please fill out all fields')
      setState({ ...state, isLoading: false })
      return false
    }

    // Is Persistent
    if (isPersistent) {
      setState({ ...state, isLoading: true })
      setPersistence(auth, browserLocalPersistence).then(async () => {
        return signInWithEmailAndPassword(auth, email, password)
          .then(async (userCredential) => {
            const user = userCredential.user
            // USER NEEDS TO VERIFY EMAIL
            if (!user.emailVerified) {
              AlertManager.oneButtonAlert(
                'Email Address Verification Needed',
                `For security purposes, we need to verify ${user.email}. Please click the link sent to your email. Once your email is verified, return here and tap/click 'Okay'`,
                'info',
                () => {}
              )
              sendEmailVerification(user)
              setState({
                ...state,
                userIsLoggedIn: true,
                isLoading: false,
                currentScreen: ScreenNames.calendar,
              })
            } else {
              setState({
                ...state,
                userIsLoggedIn: true,
                isLoading: false,
                currentScreen: ScreenNames.calendar,
              })
            }
          })
          .catch((error) => {
            setState({ ...state, isLoading: false })
            console.error('Sign in error:', error.message)
            if (contains(error.message, 'wrong-password')) {
              console.log('found')
              AlertManager.throwError(`Incorrect Password`, 'Please tap Reset Password below')
            }
          })
      })
    }

    // Not Persistent
    else {
      await firebaseSignIn()
    }
  }

  const firebaseSignIn = async () => {
    setState({ ...state, isLoading: true })
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user
        // USER NEEDS TO VERIFY EMAIL
        if (!user.emailVerified) {
          AlertManager.oneButtonAlert(
            'Email Address Verification Needed',
            `For security purposes, we need to verify ${user.email}. Please click the link sent to your email. Once your email is verified, come back here and tap/click 'Okay'`,
            'info',
            () => {}
          )
          sendEmailVerification(user)
          setState({
            ...state,
            userIsLoggedIn: true,
            isLoading: false,
            currentScreen: ScreenNames.calendar,
          })
        } else {
          setState({
            ...state,
            userIsLoggedIn: true,
            isLoading: false,
            currentScreen: ScreenNames.calendar,
          })
        }
      })
      .catch((error) => {
        setState({ ...state, isLoading: false })
        console.error('Sign in error:', error.message)
        if (contains(error.message, 'user-not-found')) {
          AlertManager.throwError(`No account with email ${email} found.`, 'If you have forgotten your password, please tap Reset Password')
        } else {
          AlertManager.throwError(`Incorrect password`, 'Please tap Reset Password.')
        }
      })
  }

  const togglePersistence = (e) => {
    const clickedEl = e.currentTarget
    const checkbox = clickedEl.querySelector('.box')
    if (checkbox.classList.contains('active')) {
      checkbox.classList.remove('active')
      setIsPersistent(false)
    } else {
      checkbox.classList.add('active')
      setIsPersistent(true)
    }
  }

  useLayoutEffect(() => {
    setState({ ...state, isLoading: true })
    Manager.showPageContainer()
    document.querySelector('.App').classList.remove('pushed')
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in.
        setState({
          ...state,
          currentScreen: ScreenNames.calendar,
          userIsLoggedIn: true,
          isLoading: false,
        })
      } else {
        // No user is signed in.
        setState({ ...state, isLoading: false })
        console.log('Signed out or no user exists')
      }
    })
  }, [])

  return (
    <>
      {/* INSTALL APP MODAL */}
      <InstallAppPopup />

      {/* PAGE CONTAINER */}
      <div id="login-container" className={`page-container form login`}>
        <img className="ml-auto mr-auto" src={require('../../../img/logo.png')} alt="Peaceful coParenting" />
        {/* QUOTE CONTAINER */}
        <div id="quote-container">
          <p id="quote">
            Co-parenting. It's not a competition between two homes. It's <b>a collaboration of parents doing what is best for the kids.</b>
          </p>
          <p id="author">~ Heather Hetchler</p>
        </div>

        {/* INSTALL BUTTON */}
        <p
          id="install-button"
          className="mb-10 button mt-20"
          onClick={() => {
            setState({ ...state, menuIsOpen: false })
            document.querySelector('.install-app').classList.add('active')
            Manager.showPageContainer('hide')
          }}>
          Install App <span className="material-icons">install_mobile</span>
        </p>

        {/* FORM/INPUTS */}
        <div className="flex form-container">
          <div className="form w-80">
            {/* EMAIL */}
            <InputWrapper inputValueType="email" required={true} labelText={'Email Address'} onChange={(e) => setEmail(e.target.value)} />
            {/* PASSWORD */}
            <div className="flex inputs">
              <InputWrapper
                inputValueType={viewPassword ? 'text' : 'password'}
                required={true}
                labelText={'Password'}
                inputClasses="mb-0"
                onChange={(e) => setPassword(e.target.value)}
              />
              {!viewPassword && <PiEyeDuotone onClick={() => setViewPassword(true)} className={'blue eye-icon ml-10'} />}
              {viewPassword && <PiEyeClosedDuotone onClick={() => setViewPassword(false)} className={'blue eye-icon ml-10'} />}
            </div>

            {/* REMEMBER ME */}
            <CheckboxGroup
              elClass={'light mb-15'}
              boxWidth={50}
              onCheck={togglePersistence}
              checkboxLabels={['Remember Me']}
              skipNameFormatting={true}
            />
            <div className="flex w-100 mb-15 gap">
              <button className="button default green w-50" onClick={signIn}>
                Login <SlLogin />
              </button>
              <button className="button default w-50 light" onClick={() => setState({ ...state, currentScreen: ScreenNames.registration })}>
                Sign Up <IoPersonAddOutline />
              </button>
            </div>
          </div>

          {/* FORGOT PASSWORD BUTTON */}
          <p id="forgot-password-link" onClick={() => setState({ ...state, currentScreen: ScreenNames.resetPassword })}>
            Reset Password <MdOutlinePassword />
          </p>

          <p id="contact-support-text">
            If you need to reset your email address, please contact us at
            <br />
            <a href="mailto:support@peaceful-coparenting.app">support@peaceful-coparenting.app</a>
          </p>
        </div>
      </div>
    </>
  )
}