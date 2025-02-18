// Path: src\components\screens\contactUs.jsx
import React, { useContext, useState } from 'react'
import globalState from '../../context'
import Manager from '../../managers/manager'
import BottomCard from '../shared/bottomCard'
import EmailManager from '../../managers/emailManager'
import { Fade } from 'react-awesome-reveal'
import StringManager from '../../managers/stringManager'
import { MdOutlineAppShortcut, MdOutlineEmail } from 'react-icons/md'
import { VscFeedback } from 'react-icons/vsc'
import NavBar from '../navBar'
import InputWrapper from '../shared/inputWrapper'
import AlertManager from '../../managers/alertManager'

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
      AlertManager.throwError('Please enter a description of the feature you would like to add')
      return false
    }

    AlertManager.successAlert('We have received your feature request!')
    EmailManager.SendFeatureRequest(currentUser?.email, `Feature Name: ${featureName} \n Description: ${featureDescription}`)
    setShowFeatureRequestCard(false)
    resetFormFeatureRequestForm()
  }

  const submitSupportRequest = () => {
    if (supportNotes.length === 0) {
      AlertManager.throwError('Please a description of the problem you are facing')
      return false
    }

    AlertManager.successAlert('Thank you for reporting this issue. We will be in touch soon!')
    EmailManager.SendSupportEmail(currentUser?.email, supportNotes)
    setShowSupportCard(false)
    resetSupportForm()
  }

  const submitFeedback = () => {
    if (feedback.length === 0) {
      AlertManager.throwError('Please enter your feedback')
      return false
    }

    AlertManager.successAlert('Thank you! We have received your app feedback!')
    EmailManager.SendAppFeedback(currentUser?.email, feedback)
    setShowFeedbackCard(false)
    resetFeedbackForm()
  }

  return (
    <>
      {/* FEATURE REQUEST */}
      <BottomCard
        onSubmit={submitFeatureRequest}
        submitText={'Send Request'}
        wrapperClass="feature-request"
        showCard={showFeatureRequestCard}
        onClose={() => setShowFeatureRequestCard(false)}
        title={'Request New Feature'}>
        <div className="feature-request-wrapper">
          <div id="feature-request-container" className={`${theme} form`}>
            <div className="form">
              <InputWrapper
                inputType={'input'}
                labelText={'Feature Name'}
                required={true}
                onChange={(e) => setFeatureName(e.target.value)}
                type="text"
              />
              <InputWrapper
                inputType={'textarea'}
                labelText={'Request Details'}
                required={true}
                onChange={(e) => setFeatureDescription(e.target.value)}
              />
            </div>
          </div>
        </div>
      </BottomCard>

      {/* FEEDBACK */}
      <BottomCard
        submitText={'Send Feedback'}
        className="feedback-wrapper"
        wrapperClass="feedback-wrapper"
        title={'Give us your Feedback'}
        onSubmit={submitFeedback}
        showCard={showFeedbackCard}
        onClose={() => setShowFeedbackCard(false)}>
        <div className="feedback-wrapper">
          <div id="feedback-container" className={`${theme} form`}>
            <div className="form">
              <InputWrapper
                inputType={'textarea'}
                labelText={'App Feedback'}
                required={true}
                onChange={(e) => setFeedback(e.target.value)}
                type="text"
              />
            </div>
          </div>
        </div>
      </BottomCard>

      {/* CONTACT SUPPORT */}
      <BottomCard
        submitText={'Send Support Request'}
        onSubmit={submitSupportRequest}
        wrapperClass="support-wrapper"
        className="support-wrapper"
        title={'How can we Help?'}
        showCard={showSupportCard}
        onClose={() => setShowSupportCard(false)}>
        <div className="support-wrapper">
          <div id="support-container" className={`${theme} form`}>
            <div className="form">
              <InputWrapper
                inputType={'textarea'}
                labelText={'Problem Description or Question'}
                required={true}
                onChange={(e) => setSupportNotes(e.target.value)}
                type="text"
              />
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
        <Fade direction={'up'} duration={1000} className={'contact-us-fade-wrapper'} triggerOnce={true} cascade={true}>
          <p className="screen-title">Get in Touch</p>
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
        </Fade>
      </div>
      {!showFeatureRequestCard && !showFeedbackCard && !showSupportCard && <NavBar navbarClass={'no-add-new-button'}></NavBar>}
    </>
  )
}