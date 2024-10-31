import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import Manager from '@manager'
import '@prototypes'
import BottomCard from '../shared/bottomCard'
import EmailManager from '../../managers/emailManager'
import {
  confirmAlert,
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  isAllUppercase,
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
} from '../../globalFunctions'

import { MdOutlineAppShortcut } from 'react-icons/md'
import { VscFeedback } from 'react-icons/vsc'
import { AiTwotoneMail } from 'react-icons/ai'

export default function ContactUs() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [featureName, setFeatureName] = useState('')
  const [featureDescription, setFeatureDescription] = useState('')
  const [showFeatureRequestCard, setShowFeatureRequestCard] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [showFeedbackCard, setShowFeedbackCard] = useState(false)
  const [supportNotes, setSupportNotes] = useState('')
  const [showSupportCard, setShowSupportCard] = useState(false)

  const resetFormFeatureRequestForm = () => {
    Manager.resetForm('feature-request-wrapper')
    setFeatureName('')
    setFeatureDescription('')
  }

  const resetFeedbackForm = () => {
    Manager.resetForm('feedback-wrapper')
    setFeatureName('')
    setFeatureDescription('')
  }

  const resetSupportForm = () => {
    Manager.resetForm('support-wrapper')
    setFeatureName('')
    setFeatureDescription('')
  }

  const submitFeatureRequest = () => {
    if (featureDescription.length === 0) {
      displayAlert('error', 'Please enter a description of the feature you would like to add')
      return false
    }

    successAlert('We have received your feature request!')
    EmailManager.SendFeatureRequest(currentUser.email, `Feature Name: ${featureName} \n Description: ${featureDescription}`)
    setShowFeatureRequestCard(false)
    resetFormFeatureRequestForm()
  }

  const submitSupportRequest = () => {
    if (supportNotes.length === 0) {
      displayAlert('error', 'Please a description of the problem you are facing')
      return false
    }

    successAlert('Thank you for reporting this issue. We will reply soon!')
    EmailManager.SendSupportEmail(currentUser.email, supportNotes)
    setShowSupportCard(false)
    resetSupportForm()
  }

  const submitFeedback = () => {
    if (feedback.length === 0) {
      displayAlert('error', 'Please enter your feedback')
      return false
    }

    successAlert('Thank you! We have received your app feedback!')
    EmailManager.SendAppFeedback(currentUser.email, feedback)
    setShowFeedbackCard(false)
    resetFeedbackForm()
  }

  useEffect(() => {
    Manager.showPageContainer()
  }, [])

  return (
    <>
      {/* FEATURE REQUEST */}
      <BottomCard showCard={showFeatureRequestCard} onClose={() => setShowFeatureRequestCard(false)} title={'Request New Feature'}>
        <div className="feature-request-wrapper">
          <div id="feature-request-container" className={`${theme} form`}>
            <div className="form">
              <label>
                Name of the feature <span className="asterisk">*</span>
              </label>
              <input onChange={(e) => setFeatureName(e.target.value)} type="text" className="mb-15" />
              <label>
                Request Details <span className="asterisk">*</span>
              </label>
              <textarea onChange={(e) => setFeatureDescription(e.target.value)} className="mb-20"></textarea>
              <button className="button green default center" onClick={submitFeatureRequest}>
                Request Feature
              </button>
            </div>
          </div>
        </div>
      </BottomCard>

      {/* FEEDBACK */}
      <BottomCard className="feedback-wrapper" title={'Give us your Feedback'} showCard={showFeedbackCard} onClose={() => setShowFeedbackCard(false)}>
        <div className="feedback-wrapper">
          <div id="feedback-container" className={`${theme} form`}>
            <div className="form">
              <label>
                Your Feedback <span className="asterisk">*</span>
              </label>
              <textarea onChange={(e) => setFeedback(e.target.value)} className="mb-20"></textarea>
              <button className="button default green center" onClick={submitFeedback}>
                Send App Feedback
              </button>
            </div>
          </div>
        </div>
      </BottomCard>

      {/* CONTACT SUPPORT */}
      <BottomCard className="support-wrapper" title={'How can we Help?'} showCard={showSupportCard} onClose={() => setShowSupportCard(false)}>
        <div className="support-wrapper">
          <div id="support-container" className={`${theme} form`}>
            <div className="form">
              <label>
                Problem Description or Question <span className="asterisk">*</span>
              </label>
              <textarea onChange={(e) => setSupportNotes(e.target.value)} className="mb-20"></textarea>
              <button className="button default green center" onClick={submitSupportRequest}>
                Get Support
              </button>
            </div>
          </div>
        </div>
      </BottomCard>

      {/* CONTACT US */}
      <div id="contact-us-container" className={`${theme} form`}>
        {/* SECTIONS */}
        <div className="sections">
          <p className="section" onClick={() => setShowFeatureRequestCard(true)}>
            <MdOutlineAppShortcut />
            Feature Request
          </p>
          <p className="section" onClick={() => setShowFeedbackCard(true)}>
            <VscFeedback />
            Send App Feedback
          </p>
          <p className="section" onClick={() => setShowSupportCard(true)}>
            <AiTwotoneMail />
            Contact Support
          </p>
        </div>
      </div>
    </>
  )
}
