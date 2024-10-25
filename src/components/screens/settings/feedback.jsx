import React, { useContext, useEffect, useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import globalState from '../../../context'
import Manager from '@manager'
import ScreenNames from '@screenNames'
import BottomButton from 'components/shared/bottomButton'
import EmailManager from 'managers/emailManager'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  displayAlert,
  successAlert,
  uniqueArray,
  getFileExtension,
} from '../../../globalFunctions'

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

  const resetForm = () => {
    Manager.resetForm('feedback-wrapper')
    setFeedback('')
  }

  const submit = () => {
    if (feedback.length === 0) {
      displayAlert('error', 'Please enter your feedback')
      return false
    }

    successAlert('Thank you! We have received your app feedback!')
    EmailManager.SendAppFeedback(currentUser.email)
    resetForm()
  }

  useEffect(() => {
    Manager.showPageContainer()
  }, [])

  return (
    <div className="feedback-wrapper">
      <div {...handlers} id="feedback-container" className={`${theme} page-container form`}>
        <div className="form">
          <label>
            Your Feedback <span className="asterisk">*</span>
          </label>
          <textarea onChange={(e) => setFeedback(e.target.value)} className="mb-20"></textarea>
          <button className="button default green center" onClick={submit}>
            Send App Feedback
          </button>
        </div>
      </div>
    </div>
  )
}

export default Feedback
