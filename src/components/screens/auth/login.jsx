import React, { useContext, useEffect, useLayoutEffect, useState } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../../context.js'
import DB from '@db'
import Manager from '@manager'
import CheckboxGroup from '@shared/checkboxGroup.jsx'
import DB_UserScoped from '@userScoped'
import InstallAppPopup from 'components/installAppPopup.jsx'
import ThemeManager from '../../../managers/themeManager'
import { child, get, getDatabase, push, ref, remove, set, update } from 'firebase/database'
import doc from '../../../models/doc'

export default function Login() {
  const { state, setState } = useContext(globalState)

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [viewPassword, setViewPassword] = useState(false)

  const manualLogin = async () => {
    const foundUser = await tryGetCurrentUser()
    if (Manager.validation([phone, password]) > 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please fill out all fields' })
      return false
    }

    if (foundUser) {
      document.body.classList.add(foundUser?.settings.theme)
      if (rememberMe) {
        localStorage.setItem('rememberKey', foundUser.id)
        await DB_UserScoped.updateUserRecord(foundUser.phone, 'rememberMe', true)
      }
      setState({
        ...state,
        userIsLoggedIn: true,
        currentScreen: ScreenNames.calendar,
        currentUser: foundUser,
        isLoading: false,
      })
    } else {
      setState({ ...state, showAlert: true, alertMessage: 'Incorrect phone and/or password' })
    }
  }

  const autoLogin = async () => {
    const foundUser = await tryGetCurrentUser()
    const rememberMeKey = localStorage.getItem('rememberKey')
    if (foundUser) {
      subscribeUser(foundUser)

      document.body.classList.add(foundUser?.settings.theme)

      // SIGN USER IN BASED ON rememberMe KEY
      if (Manager.isValid(rememberMeKey)) {
        setState({
          ...state,
          userIsLoggedIn: true,
          currentScreen: ScreenNames.calendar,
          currentUser: foundUser,
          isLoading: false,
        })
      }
    } else {
      setState({ ...state, isLoading: false })
    }
  }

  const tryGetCurrentUser = async () =>
    new Promise(async (resolve) => {
      await DB.getTable(DB.tables.users).then(async (users) => {
        users = DB.convertKeyObjectToArray(users)
        const rememberMeKey = localStorage.getItem('rememberKey')
        let foundUser
        foundUser = users.filter((user) => user.id === rememberMeKey)[0]
        if (foundUser) {
          resolve(foundUser || null)
        } else {
          foundUser = users.filter((user) => user.phone === phone && user.password === password)[0]
          resolve(foundUser || null)
        }
      })
    })

  const subscribeUser = (user) => {
    ;(pushalertbyiw = window.pushalertbyiw || []).push(['addToSegment', 38837, onSubscribe])

    async function onSubscribe(result) {
      let pushalertbyiw = []
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
            const subId = PushAlertCo.subs_id
            set(child(dbRef, `pushAlertSubscribers/${user.phone}/`), subId)
          }
        })
      })
    }
  }

  const toggleRememberMe = (e) => {
    const clickedEl = e.currentTarget
    const checkbox = clickedEl.querySelector('.box')
    if (checkbox.classList.contains('active')) {
      setRememberMe(false)
      checkbox.classList.remove('active')
    } else {
      checkbox.classList.add('active')
      setRememberMe(true)
    }
  }

  useLayoutEffect(() => {
    setTimeout(() => {
      setState({ ...state, showMenuButton: false, showBackArrow: false })
      autoLogin().then((r) => r)
      Manager.toggleForModalOrNewForm('show')
    }, 500)
  }, [])

  return (
    <>
      {/* INSTALL APP MODAL */}
      <InstallAppPopup />

      {/* SCREEN TITLE */}
      <p className="screen-title  show center-text mt-20  mb-10 w-100 p-0">Login</p>

      {/* PAGE CONTAINER */}
      <div id="login-container" className={`dark page-container form`}>
        {/* INSTALL BUTTON */}
        <p
          id="install-button"
          className="mb-10 button mt-10"
          onClick={() => {
            setState({ ...state, menuIsOpen: false })
            document.querySelector('.install-app').classList.add('active')
            Manager.toggleForModalOrNewForm('hide')
          }}>
          Install App <span className="material-icons">install_mobile</span>
        </p>

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

        {/* FORM/INPUTS */}
        <div className="flex form-container">
          <div className="form w-80">
            <label>
              Phone Number <span className="asterisk">*</span>
            </label>
            <input className="mb-15" type="number" pattern="[0-9]*" inputMode="numeric" onChange={(e) => setPhone(e.target.value)} />
            <label>
              Password <span className="asterisk">*</span>
            </label>
            <div className="flex inputs mb-20">
              <input type={viewPassword ? 'text' : 'password'} onChange={(e) => setPassword(e.target.value)} />
              {!viewPassword && (
                <span className="material-icons-round accent" onClick={() => setViewPassword(true)}>
                  visibility
                </span>
              )}
              {viewPassword && (
                <span className="material-icons-round accent" onClick={() => setViewPassword(false)}>
                  visibility_off
                </span>
              )}
            </div>
            <CheckboxGroup boxWidth={50} onCheck={toggleRememberMe} labels={['Remember Me']} skipNameFormatting={true} />
            <div className="flex w-100 mb-15 gap">
              <button className="button default green w-50" onClick={manualLogin}>
                Login <span className="material-icons-round">lock_open</span>
              </button>
              <button className="button default w-50 " onClick={() => setState({ ...state, currentScreen: ScreenNames.registration })}>
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
