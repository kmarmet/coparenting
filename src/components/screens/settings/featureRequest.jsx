import { child, getDatabase, onValue, ref, remove, set } from 'firebase/database'
import React, { useContext, useEffect, useState } from 'react'
import { DebounceInput } from 'react-debounce-input'
import Autocomplete from 'react-google-autocomplete'
import globalState from '../../../context'
import DB from '@db'
import Manager from '@manager'
import ScreenNames from '@screenNames'
import { useSwipeable } from 'react-swipeable'
import EmailManager from 'managers/emailManager'
import BottomButton from 'components/shared/bottomButton'

function FeatureRequest() {
  const { state, setState } = useContext(globalState)
  const { currentUser, currentScreenTitle, theme, setTheme } = state
  const [featureName, setFeatureName] = useState('')
  const [featureDescription, setFeatureDescription] = useState('')

  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      console.log('User Swiped!', eventData)
      setState({ ...state, currentScreen: ScreenNames.settings })
    },
  })

  const submit = () => {
    if (featureDescription.length === 0) {
      setState({ ...state, alertType: 'error', alertMessage: 'Please enter a description of the feature you would like to add', showAlert: true })
      return false
    }
    EmailManager.sendEmail(
      currentUser.email,
      EmailManager.supportEmail,
      `Feature Request \n Name: ${featureName} \n Description: ${featureDescription}`
    )
    setState({ ...state, alertMessage: 'Feature Request Sent!', alertType: 'success', showAlert: true })
  }

  useEffect(() => {
    setState({ ...state, previousScreen: ScreenNames.settings, showMenuButton: false, showBackButton: true })
    Manager.toggleForModalOrNewForm()
  }, [])

  return (
    <>
      <p className="screen-title ">Feature Request</p>
      <div {...handlers} id="feature-request-container" className="page-container">
        <div className="form">
          <label>
            Name of the feature <span className="asterisk">*</span>
          </label>
          <input onChange={(e) => setFeatureName(e.target.value)} type="text" className="mb-15" />
          <label>
            Request Details <span className="asterisk">*</span>
          </label>
          <textarea onChange={(e) => setFeatureDescription(e.target.value)} className="mb-20"></textarea>
          <BottomButton onClick={submit} text="Send Feature Request" iconName="send" />
        </div>
      </div>
    </>
  )
}

export default FeatureRequest
