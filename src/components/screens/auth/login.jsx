import React, { useContext, useLayoutEffect, useState } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../../context.js'
import DB from '@db'
import Manager from '@manager'
import CheckboxGroup from '@shared/checkboxGroup.jsx'
import DB_UserScoped from '@userScoped'
import InstallAppPopup from 'components/installAppPopup.jsx'
import { child, getDatabase, ref, set } from 'firebase/database'
import { getAuth, sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import firebaseConfig from '../../../firebaseConfig'
import { initializeApp } from 'firebase/app'
import { PiEyeClosedDuotone, PiEyeDuotone } from 'react-icons/pi'
import validator from 'validator'

import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  hasClass,
  inputAlert,
  isAllUppercase,
  oneButtonAlert,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  successAlert,
  throwError,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'

export default function Login() {
  const { state, setState } = useContext(globalState)
  const { theme } = state
  const [email, setEmail] = useState(null)
  const [password, setPassword] = useState(null)
  const [viewPassword, setViewPassword] = useState(false)

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

  const autoLogin = async () => {
    const foundUser = await tryGetCurrentUser()
    const rememberMeKey = localStorage.getItem('rememberKey')

    if (foundUser) {
      subscribeUser(foundUser)

      // SIGN USER IN BASED ON rememberMe KEY
      if (Manager.isValid(rememberMeKey)) {
        setState({
          ...state,
          userIsLoggedIn: true,
          currentScreen: ScreenNames.calendar,
          currentUser: foundUser,
          firebaseUser: auth.currentUser,
          isLoading: false,
          theme: foundUser?.settings?.theme,
        })
      }
    } else {
      setState({ ...state, isLoading: false })
    }
  }

  const tryGetCurrentUser = async () =>
    new Promise(async (resolve) => {
      await DB.getTable(DB.tables.users)
        .then(async (users) => {
          users = Manager.convertToArray(users)
          const rememberMeKey = localStorage.getItem('rememberKey')
          let foundUser
          foundUser = users.filter((user) => user.id === rememberMeKey)[0]
          if (foundUser) {
            resolve(foundUser || null)
          } else {
            foundUser = users.filter((user) => user.email === email)[0]
            resolve(foundUser || null)
          }
        })
        .catch((error) => {
          console.log(error)
        })
    })

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

  const loginActions = async (foundUser) => {
    if (foundUser) {
      // console.log(user)
      const rememberMeKey = localStorage.getItem('rememberKey')

      if (rememberMeKey) {
        localStorage.setItem('rememberKey', foundUser.id)
        DB_UserScoped.updateUserRecord(foundUser.phone, 'rememberMe', true)
      } else {
        localStorage.setItem('rememberKey', foundUser.id)
      }
      setState({
        ...state,
        userIsLoggedIn: true,
        isLoading: false,
        currentScreen: ScreenNames.calendar,
        currentUser: foundUser,
      })
    } else {
      console.log('No Firebase User Found')
      setState({ ...state, isLoading: false })
    }
  }

  const signIn = async () => {
    const foundUser = await tryGetCurrentUser()
    if (!validator.isEmail(email)) {
      throwError('Email address is not valid')
      return false
    }

    if (Manager.validation([email, password]) > 0) {
      throwError('Please fill out all fields')
      setState({ ...state, isLoading: false })
      return false
    }
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user

        // USER NEEDS TO VERIFY EMAIL
        if (!user.emailVerified) {
          oneButtonAlert(
            'Email Address Verification Needed',
            `For security purposes, we need to verify ${user.email}. Please click the link sent to your email. Once your email is verified, come back here and tap/click 'Okay'`,
            'info',
            () => {}
          )
          sendEmailVerification(user)
          if (foundUser) {
            loginActions(foundUser)
          } else {
            console.log('No Firebase User Found')
            setState({ ...state, isLoading: false })
          }
        } else {
          if (foundUser) {
            loginActions(foundUser)
          } else {
            console.log('No Firebase User Found')
            setState({ ...state, isLoading: false })
          }
        }
      })
      .catch((error) => {
        setState({ ...state, isLoading: false })
        console.error('Sign in error:', error.message)
        throwError('Incorrect phone and/or password')
      })
  }
  const toggleRememberMe = (e) => {
    const clickedEl = e.currentTarget
    const checkbox = clickedEl.querySelector('.box')
    if (checkbox.classList.contains('active')) {
      checkbox.classList.remove('active')
    } else {
      checkbox.classList.add('active')
    }
  }

  const logout = () => {
    localStorage.removeItem('rememberKey')

    signOut(auth)
      .then(() => {
        setState({
          ...state,
          currentScreen: ScreenNames.login,
          currentUser: null,
          userIsLoggedIn: false,
        })
        // Sign-out successful.
        console.log('User signed out')
      })
      .catch((error) => {
        // An error happened.
      })
  }

  useLayoutEffect(() => {
    // logout()
    autoLogin().then((r) => r)
    Manager.showPageContainer('show')
    document.querySelector('.App').classList.remove('pushed')
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
            <CheckboxGroup elClass={'light'} boxWidth={50} onCheck={toggleRememberMe} checkboxLabels={['Remember Me']} skipNameFormatting={true} />
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
