import React, { useContext, useEffect, useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import ScreenNames from '@screenNames'
import globalState from '../../../context'
import Manager from '@manager'
import EmailManager from 'managers/emailManager'
import BottomButton from 'components/shared/bottomButton'
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
  uniqueArray,
  getFileExtension,
} from '../../../globalFunctions'

function ContactSupport() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, setTheme } = state
  const [supportNotes, setSupportNotes] = useState('')

  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      console.log('User Swiped!', eventData)
      setState({ ...state, currentScreen: ScreenNames.settings })
    },
  })

  const resetForm = () => {
    Manager.resetForm('support-wrapper')
    setSupportNotes('')
  }

  const submit = () => {
    if (supportNotes.length === 0) {
      displayAlert('error', 'Please a description of the problem you are facing')
      return false
    }

    displayAlert('success', '', 'Thank you for reporting this issue. We will reply soon!!')
    EmailManager.SendSupportEmail(currentUser.email)
    resetForm()
  }

  useEffect(() => {
    Manager.showPageContainer()
  }, [])

  return (
    <div className="support-wrapper">
      <div {...handlers} id="support-container" className={`${theme} page-container form`}>
        <div className="form">
          <label>
            What can we help you with? <span className="asterisk">*</span>
          </label>
          <textarea onChange={(e) => setSupportNotes(e.target.value)} className="mb-20"></textarea>
          <button className="button default green center" onClick={submit}>
            Get Support
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContactSupport
