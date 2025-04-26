// Path: src\components\screens\contactUs.jsx
import React, {useContext, useState} from 'react'
import globalState from '../../context'
import Manager from '../../managers/manager'
import Modal from '../shared/modal'
import EmailManager from '../../managers/emailManager'
import {Fade} from 'react-awesome-reveal'
import {MdOutlineAppShortcut, MdOutlineEmail} from 'react-icons/md'
import {VscFeedback} from 'react-icons/vsc'
import NavBar from '../navBar'
import InputWrapper from '../shared/inputWrapper'
import AlertManager from '../../managers/alertManager'
import useCurrentUser from '../../hooks/useCurrentUser'
import InputTypes from '../../constants/inputTypes'

export default function ContactUs() {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const [featureName, setFeatureName] = useState('')
  const [featureDescription, setFeatureDescription] = useState('')
  const [showFeatureRequestCard, setShowFeatureRequestCard] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [showFeedbackCard, setShowFeedbackCard] = useState(false)
  const [supportNotes, setSupportNotes] = useState('')
  const [showSupportCard, setShowSupportCard] = useState(false)
  const {currentUser} = useCurrentUser()

  const resetFormFeatureRequestForm = () => {
    Manager.ResetForm('feature-request-wrapper')
    setFeatureName('')
    setFeatureDescription('')
  }

  const resetFeedbackForm = () => {
    Manager.ResetForm('feedback-wrapper')
    setFeatureName('')
    setFeatureDescription('')
  }

  const resetSupportForm = () => {
    Manager.ResetForm('support-wrapper')
    setFeatureName('')
    setFeatureDescription('')
  }

  const submitFeatureRequest = () => {
    if (featureDescription.length === 0) {
      AlertManager.throwError('Please enter a description of the feature you would like to add')
      return false
    }

    setState({...state, successAlertMessage: 'Feature Request Received'})
    EmailManager.SendFeatureRequest(currentUser?.email, `Feature Name: ${featureName} \n Description: ${featureDescription}`)
    setShowFeatureRequestCard(false)
    resetFormFeatureRequestForm()
  }

  const submitSupportRequest = () => {
    if (supportNotes.length === 0) {
      AlertManager.throwError('Please a description of the problem you are facing')
      return false
    }

    setState({...state, successAlertMessage: 'We will be in touch soon!'})
    EmailManager.SendSupportEmail(currentUser?.email, supportNotes)
    setShowSupportCard(false)
    resetSupportForm()
  }

  const submitFeedback = () => {
    if (feedback.length === 0) {
      AlertManager.throwError('Please enter your feedback')
      return false
    }
    setState({...state, successAlertMessage: 'Thank you for Your Feedback!'})

    EmailManager.SendAppFeedback(currentUser?.email, feedback)
    setShowFeedbackCard(false)
    resetFeedbackForm()
  }

  return (
    <>
      {/* FEATURE REQUEST */}
      <Modal
        onSubmit={submitFeatureRequest}
        submitText={'Send Request'}
        wrapperClass="feature-request"
        showCard={showFeatureRequestCard}
        onClose={() => setShowFeatureRequestCard(false)}
        title={'Request New Feature'}>
        <div className="feature-request-wrapper">
          <div id="feature-request-container" className={`${theme} form`}>
            <div className="form">
              <InputWrapper labelText={'Feature Name'} required={true} onChange={(e) => setFeatureName(e.target.value)} inputType={InputTypes.text} />
              <InputWrapper
                inputType={InputTypes.textarea}
                labelText={'Request Details'}
                required={true}
                onChange={(e) => setFeatureDescription(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* FEEDBACK */}
      <Modal
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
                inputType={InputTypes.textarea}
                labelText={'App Feedback'}
                required={true}
                onChange={(e) => setFeedback(e.target.value)}
                type="text"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* CONTACT SUPPORT */}
      <Modal
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
                inputType={InputTypes.textarea}
                labelText={'Problem Description or Question'}
                required={true}
                onChange={(e) => setSupportNotes(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* CONTACT US */}
      <div id="contact-us-container" className={`${theme} page-container form`}>
        <p className="screen-title">Get in Touch</p>
        {/* SECTIONS */}
        <div className="sections">
          <Fade direction={'right'} duration={800} damping={0.2} className={'contact-us-fade-wrapper'} triggerOnce={true} cascade={true}>
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
          </Fade>
        </div>
      </div>
      {!showFeatureRequestCard && !showFeedbackCard && !showSupportCard && <NavBar navbarClass={'no-add-new-button'}></NavBar>}
    </>
  )
}