import React, { useContext, useLayoutEffect, useState } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../../context.js'
import DB from '@db'
import Manager from '@manager'
import CheckboxGroup from '@shared/checkboxGroup.jsx'
import InstallAppPopup from 'components/installAppPopup.jsx'
import { child, getDatabase, ref, set } from 'firebase/database'
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

  const tryGetCurrentUser = async (firebaseUser) => {
    const users = await DB.getTable(DB.tables.users)
    const relevantUser = users.filter((x) => x.email === firebaseUser.email)[0]
    return relevantUser
  }

  const subscribeUser = (user) => {
    // eslint-disable-next-line no-undef
    let pushalertbyiw = []
    ;(pushalertbyiw = window.pushalertbyiw || []).push(['addToSegment', 38837, onSubscribe])

    async function onSubscribe(result) {
      if (result.success) {
        ;(pushalertbyiw = window.pushalertbyiw || []).push(['onReady', onPushAlertReady])
      } else {
        ;(pushalertbyiw = window.pushalertbyiw || []).push(['subscribeToSegment', 38837])
      }
    }

    async function onPushAlertReady() {
      console.log('onPushAlertReady')
      const dbRef = ref(getDatabase())

      DB.getTable(DB.tables.pushAlertSubscribers).then((users) => {
        const subscribers = Object.entries(users)
        subscribers.forEach((sub) => {
          const phone = sub[0]
          const id = sub[1]
          if (user && phone === user.phone) {
            return false
          } else {
            // eslint-disable-next-line no-undef
            const subId = PushAlertCo.subs_id
            set(child(dbRef, `pushAlertSubscribers/${user.phone}/`), subId)
          }
        })
      })
    }
  }

  const signIn = async () => {
    // Validation
    if (!validator.isEmail(email)) {
      AlertManager.throwError('Email address is not valid')
      setState({ ...state, isLoading: false })
      return false
    }

    if (Manager.validation([email, password]) > 0) {
      AlertManager.throwError('Please fill out all fields')
      setState({ ...state, isLoading: false })
      return false
    }

    // Is Persistent
    if (isPersistent) {
      setState({ ...state, isLoading: true })
      setPersistence(auth, browserLocalPersistence)
        .then(async () => {
          return signInWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
              const user = userCredential.user
              const _currentUser = await tryGetCurrentUser(user)
              subscribeUser(_currentUser)
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
                  currentUser: _currentUser,
                })
              } else {
                setState({
                  ...state,
                  userIsLoggedIn: true,
                  isLoading: false,
                  currentScreen: ScreenNames.calendar,
                  currentUser: _currentUser,
                })
              }
            })
            .catch((error) => {
              setState({ ...state, isLoading: false })
              console.error('Sign in error:', error.message)
              AlertManager.throwError('Incorrect phone and/or password')
            })
        })
        .catch((error) => {
          setState({ ...state, isLoading: false })
          console.error('Sign in error:', error.message)
          AlertManager.throwError('Incorrect phone and/or password')
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
        const _currentUser = await tryGetCurrentUser(user)
        subscribeUser(_currentUser)
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
            currentUser: _currentUser,
          })
        } else {
          setState({
            ...state,
            userIsLoggedIn: true,
            isLoading: false,
            currentScreen: ScreenNames.calendar,
            currentUser: _currentUser,
          })
        }
      })
      .catch((error) => {
        setState({ ...state, isLoading: false })
        console.error('Sign in error:', error.message)
        AlertManager.throwError('Incorrect phone and/or password')
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
        const _currentUser = await tryGetCurrentUser(user)
        // User is signed in.
        setState({
          ...state,
          currentScreen: ScreenNames.calendar,
          currentUser: _currentUser,
          userIsLoggedIn: true,
          isLoading: false,
        })
        console.log('Signed In...redirecting to calendar')
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
      <div id="login-container" className={`light page-container form login`}>
        <img className="ml-auto mr-auto" src={require('../../../img/logo.png')} alt="Peaceful coParenting" />
        {/* QUOTE CONTAINER */}
        <div id="quote-container">
          <span>
            <code>❝</code>
          </span>
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
            <label>
              Email Address <span className="asterisk">*</span>
            </label>
            <input required={true} className="mb-15" type="email" onChange={(e) => setEmail(e.target.value)} />

            {/* PASSWORD */}
            <label>
              Password <span className="asterisk">*</span>
            </label>
            <div className="flex inputs mb-20">
              <input required={true} type={viewPassword ? 'text' : 'password'} onChange={(e) => setPassword(e.target.value)} />
              {!viewPassword && <PiEyeDuotone onClick={() => setViewPassword(true)} className={'blue ml-10'} />}
              {viewPassword && <PiEyeClosedDuotone onClick={() => setViewPassword(false)} className={'blue ml-10'} />}
            </div>

            {/* REMEMBER ME */}
            <CheckboxGroup elClass={'light'} boxWidth={50} onCheck={togglePersistence} checkboxLabels={['Remember Me']} skipNameFormatting={true} />
            <div className="flex w-100 mb-15 gap">
              <button className="button default green w-50" onClick={signIn}>
                Login <span className="material-icons-round">lock_open</span>
              </button>
              <button className="button default w-50 light" onClick={() => setState({ ...state, currentScreen: ScreenNames.registration })}>
                Register <span className="material-icons-round">person_add</span>
              </button>
            </div>
          </div>

          {/* FORGOT PASSWORD BUTTON */}
          <p id="forgot-password-link" className="mt-20" onClick={() => setState({ ...state, currentScreen: ScreenNames.forgotPassword })}>
            Forgot Password <span className="material-icons-round">password</span>
          </p>
        </div>
      </div>
    </>
  )
}