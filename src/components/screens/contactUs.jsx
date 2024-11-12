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
  hasClass,
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

import { MdOutlineAppShortcut, MdOutlineEmail } from 'react-icons/md'
import { VscFeedback } from 'react-icons/vsc'
import Label from '../shared/label'
import NavBar from '../navBar'

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
              <Label text={'Feature Name'} required={true}></Label>
              <input onChange={(e) => setFeatureName(e.target.value)} type="text" className="mb-15" />
              <Label text={'Request Details'} required={true}></Label>
              <textarea onChange={(e) => setFeatureDescription(e.target.value)} className="mb-20"></textarea>
            </div>
          </div>
        </div>
        <div className="buttons">
          <button className="green card-button" onClick={submitFeatureRequest}>
            Request Feature
          </button>
          <button className="card-button cancel" onClick={() => setShowFeatureRequestCard(false)}>
            Cancel
          </button>
        </div>
      </BottomCard>

      {/* FEEDBACK */}
      <BottomCard className="feedback-wrapper" title={'Give us your Feedback'} showCard={showFeedbackCard} onClose={() => setShowFeedbackCard(false)}>
        <div className="feedback-wrapper">
          <div id="feedback-container" className={`${theme} form`}>
            <div className="form">
              <Label text={'Your Feedback'} required={true}></Label>
              <textarea onChange={(e) => setFeedback(e.target.value)} className="mb-20"></textarea>
            </div>
          </div>
        </div>
        <div className="buttons">
          <button className="card-button" onClick={submitFeedback}>
            Send Feedback
          </button>
          <button className="card-button cancel" onClick={() => setShowFeedbackCard(false)}>
            Cancel
          </button>
        </div>
      </BottomCard>

      {/* CONTACT SUPPORT */}
      <BottomCard className="support-wrapper" title={'How can we Help?'} showCard={showSupportCard} onClose={() => setShowSupportCard(false)}>
        <div className="support-wrapper">
          <div id="support-container" className={`${theme} form`}>
            <div className="form">
              <Label text={'Problem Description or Question'} required={true}></Label>
              <textarea onChange={(e) => setSupportNotes(e.target.value)} className="mb-20"></textarea>
            </div>
          </div>
        </div>
        <div className="buttons">
          <button className="card-button" onClick={submitSupportRequest}>
            Get Support
          </button>
          <button className="card-button cancel" onClick={() => setShowSupportCard(false)}>
            Cancel
          </button>
        </div>
      </BottomCard>

      {/* CONTACT US */}
      <div id="contact-us-container" className={`${theme} page-container form`}>
        <p className="screen-title">Contact Us</p>
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
            <MdOutlineEmail />
            Contact Support
          </p>
        </div>
      </div>
      {!showFeatureRequestCard && !showFeedbackCard && !showSupportCard && <NavBar navbarClass={'no-add-new-button'}></NavBar>}
    </>
  )
}
