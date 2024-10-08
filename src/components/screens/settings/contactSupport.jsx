import React, { useContext, useEffect, useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import ScreenNames from '@screenNames'
import globalState from '../../../context'
import Manager from '@manager'
import EmailManager from 'managers/emailManager'
import BottomButton from 'components/shared/bottomButton'
function ContactSupport() {
  const { state, setState } = useContext(globalState)
  const { currentUser, currentScreenTitle, theme, setTheme } = state
  const [supportNotes, setSupportNotes] = useState('')

  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      console.log('User Swiped!', eventData)
      setState({ ...state, currentScreen: ScreenNames.settings })
    },
  })

  const submit = () => {
    if (supportNotes.length === 0) {
      setState({ ...state, alertType: 'error', alertMessage: 'Please enter a description of what we can help you with', showAlert: true })
      return false
    }
    EmailManager.sendEmail(currentUser.email, EmailManager.supportEmail, supportNotes)
    setState({ ...state, alertMessage: 'Support Request Sent!', alertType: 'success', showAlert: true })
    setTimeout(() => {
      setState({ ...state, currentScreen: ScreenNames.settings, alertType: 'error' })
    }, 1000)
  }

  useEffect(() => {
    setState({ ...state, previousScreen: ScreenNames.settings, showMenuButton: false, showBackButton: true })
    Manager.toggleForModalOrNewForm()
  }, [])

  return (
    <>
      <p className="screen-title ">Contact Support</p>
      <div {...handlers} id="support-container" className={`${currentUser?.settings?.theme} page-container form`}>
        <div className="form">
          <label>
            What can we help you with? <span className="asterisk">*</span>
          </label>
          <textarea onChange={(e) => setSupportNotes(e.target.value)} className="mb-20"></textarea>
          <BottomButton onClick={submit} text="Send Feature Request" iconName="send" />
        </div>
      </div>
    </>
  )
}

export default ContactSupport
