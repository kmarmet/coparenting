import React, { useContext, useEffect, useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import globalState from '../../../context'
import Manager from '@manager'
import ScreenNames from '@screenNames'
import BottomButton from 'components/shared/bottomButton'
import EmailManager from 'managers/emailManager'

function Feedback() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, currentScreenTitle, setTheme } = state
  const [feedback, setFeedback] = useState('')

  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      console.log('User Swiped!', eventData)
      setState({ ...state, currentScreen: ScreenNames.settings })
    },
  })

  const submit = () => {
    if (feedback.length === 0) {
      setState({ ...state, alertMessage: 'Please enter your feedback about the app (good OR bad)', showAlert: true, alertType: 'error' })
      return false
    }
    EmailManager.sendEmail(currentUser.email, EmailManager.supportEmail, `App Feedback: ${feedback}`)
    setState({ ...state, alertMessage: 'App Feedback Sent!', alertType: 'success', showAlert: true })
    setTimeout(() => {
      setState({ ...state, currentScreen: ScreenNames.settings, alertType: 'error' })
    }, 1000)
  }

  useEffect(() => {
    setState({ ...state, previousScreen: ScreenNames.settings, showMenuButton: false, showBackButton: true })
    Manager.showPageContainer()
  }, [])

  return (
    <>
      <p className="screen-title ">App Feedback</p>
      <div {...handlers} id="feature-request-container" className={`${theme} page-container form`}>
        <div className="form">
          <label>
            Your Feedback <span className="asterisk">*</span>
          </label>
          <textarea onChange={(e) => setFeedback(e.target.value)} className="mb-20"></textarea>
          <BottomButton onClick={submit} text="Send Feedback" iconName="send" />
        </div>
      </div>
    </>
  )
}

export default Feedback
