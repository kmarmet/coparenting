import React, { useState, useEffect, useContext } from 'react'
import DB from '@db'
import globalState from '../../../context'
import Alert from '@shared/alert'
import Manager from '@manager'
import SmsManager from '@managers/smsManager'
import ScreenNames from '@screenNames'
import { useSwipeable } from 'react-swipeable'

export default function ForgotPassword() {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [codeFromInput, setCodeFromInput] = useState(null)
  const [codeSentToUser, setCodeSendToUser] = useState(null)
  const [showSendCodeButton, setShowSendCodeButton] = useState(true)

  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      console.log('User Swiped!', eventData)
      setState({ ...state, currentScreen: ScreenNames.account })
    },
  })

  const reset = async () => {
    validateInputs()

    if (password !== confirmPassword) {
      setState({ ...state, showAlert: true, alertMessage: 'Passwords do not match', alertType: 'error' })
      return false
    }
    await DB.getTable(DB.tables.users).then((people) => {
      if (people) {
        people = DB.convertKeyObjectToArray(people)
        const foundUser = people.filter((x) => x.phone === phone)[0]
        // Verify security code
        if (foundUser !== null && foundUser !== undefined && Number(codeFromInput) === codeSentToUser) {
          // Update password
          DB.updateRecord(DB.tables.users, foundUser, 'password', password).finally(() => {
            // Log user in
            setState({
              ...state,
              currentScreen: ScreenNames.login,
              currentUser: foundUser,
              userIsLoggedIn: true,
            })
          })
        }
      }
    })
  }

  const validateInputs = () => {
    if (Manager.validation([email, phone, confirmPassword, password]) > 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please fill out all fields', alertType: 'error' })
      return false
    }
  }

  const sendSecurityCode = async () => {
    validateInputs()
    if (password !== confirmPassword) {
      setState({ ...state, showAlert: true, alertMessage: 'Passwords do not match', alertType: 'error' })
      return false
    }
    await DB.getTable(DB.tables.users).then((people) => {
      if (people) {
        people = DB.convertKeyObjectToArray(people)

        const foundUser = people.filter((x) => x.phone === phone)[0]
        if (foundUser) {
          const code = Manager.createVerificationCode()
          setCodeSendToUser(code)
          setCodeFromInput(code)
          setShowSendCodeButton(false)
          SmsManager.send(foundUser.phone, `Please enter your forgot password security code: ${code}${SmsManager.signature}`)
        }
      }
    })
  }

  useEffect(() => {
    setState({ ...state, previousScreen: ScreenNames.login, showMenuButton: false, showBackButton: true })
    Manager.toggleForModalOrNewForm()
  }, [])

  return (
    <>
      <p className="screen-title ">Forgot Password</p>
      <div {...handlers} id="forgot-password-container" className="page-container dark form">
        <div className="form" autoComplete="off">
          <label>
            Phone<span className="asterisk">*</span>
          </label>
          <input className="mb-15" value={phone} type="number" pattern="[0-9]*" inputMode="numeric" onChange={(e) => setPhone(e.target.value)} />
          <label>
            Email<span className="asterisk">*</span>
          </label>
          <input autoComplete="off" className="mb-15" value={email} type="email" onChange={(e) => setEmail(e.target.value)} />
          <label>
            Password<span className="asterisk">*</span>
          </label>
          <input className="mb-15" value={password} type="password" autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} />
          <label>
            Confirm Password<span className="asterisk">*</span>
          </label>
          <input className="mb-15" value={confirmPassword} type="password" autoComplete="off" onChange={(e) => setConfirmPassword(e.target.value)} />
          <label>
            Security Code sent to Your Device<span className="asterisk">*</span>
          </label>
          <input className="mb-15" type="number" pattern="[0-9]*" inputMode="numeric" onChange={(e) => setCodeFromInput(e.target.value)} />
          {showSendCodeButton && (
            <>
              <button className="button w-50 default send-security-code green" onClick={sendSecurityCode}>
                Send Code to Me
              </button>
            </>
          )}
          {!showSendCodeButton && (
            <button className="button default green" onClick={reset}>
              Reset
            </button>
          )}
        </div>
      </div>
    </>
  )
}
