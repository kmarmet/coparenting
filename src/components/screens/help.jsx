// Path: src\components\screens\help.jsx
import React, {useContext, useEffect, useState} from 'react'
import {GoVideo} from 'react-icons/go'
import {MdOutlineAppShortcut, MdOutlineEmail} from 'react-icons/md'
import {VscFeedback} from 'react-icons/vsc'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context'
import useCurrentUser from '../../hooks/useCurrentUser'
import AlertManager from '../../managers/alertManager'
import DomManager from '../../managers/domManager'
import EmailManager from '../../managers/emailManager'
import Manager from '../../managers/manager'
import NavBar from '../navBar'
import InputWrapper from '../shared/inputWrapper'
import Modal from '../shared/modal'
import Spacer from '../shared/spacer'

export default function Help() {
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

  const ResetFormFeatureRequestForm = () => {
    Manager.ResetForm('feature-request-wrapper')
    setFeatureName('')
    setFeatureDescription('')
  }

  const ResetFeedbackForm = () => {
    Manager.ResetForm('feedback-wrapper')
    setFeatureName('')
    setFeatureDescription('')
  }

  const ResetSupportForm = () => {
    Manager.ResetForm('support-wrapper')
    setFeatureName('')
    setFeatureDescription('')
  }

  const SubmitFeatureRequest = () => {
    if (featureDescription.length === 0) {
      AlertManager.throwError('Please enter a description of the feature you would like to Add')
      return false
    }

    setState({...state, successAlertMessage: 'Feature Request Received'})
    EmailManager.SendFeatureRequest(currentUser?.email, `Feature Name: ${featureName} \n Description: ${featureDescription}`)
    setShowFeatureRequestCard(false)
    ResetFormFeatureRequestForm()
  }

  const SubmitSupportRequest = () => {
    if (supportNotes.length === 0) {
      AlertManager.throwError('Please a description of the problem you are facing')
      return false
    }

    setState({...state, successAlertMessage: 'We will be in touch soon!'})
    EmailManager.SendSupportEmail(currentUser?.email, supportNotes)
    setShowSupportCard(false)
    ResetSupportForm()
  }

  const SubmitFeedback = () => {
    if (feedback.length === 0) {
      AlertManager.throwError('Please enter your feedback')
      return false
    }
    setState({...state, successAlertMessage: 'Thank you for Your Feedback!'})

    EmailManager.SendAppFeedback(currentUser?.email, feedback)
    setShowFeedbackCard(false)
    ResetFeedbackForm()
  }

  useEffect(() => {
    setTimeout(() => {
      DomManager.ToggleAnimation('add', 'section', DomManager.AnimateClasses.names.fadeInRight)
    }, 300)
  }, [])

  return (
    <>
      {/* FEATURE REQUEST */}
      <Modal
        onSubmit={SubmitFeatureRequest}
        submitText={'Send Request'}
        wrapperClass="feature-request"
        showCard={showFeatureRequestCard}
        subtitle="Request a new feature to be added to the app! Big or small, we want to hear your ideas and possibly place YOUR feature idea on the app!"
        onClose={() => setShowFeatureRequestCard(false)}
        title={'Request New Feature'}>
        <div className="feature-request-wrapper">
          <Spacer height={10} />
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
        subtitle="Your feedback helps us improve the app! Whether it's a feature request or an feature needing improvement, we value your input."
        onSubmit={SubmitFeedback}
        showCard={showFeedbackCard}
        onClose={() => setShowFeedbackCard(false)}>
        <div className="feedback-wrapper">
          <Spacer height={10} />
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
        onSubmit={SubmitSupportRequest}
        wrapperClass="support-wrapper"
        className="support-wrapper"
        subtitle="We genuinely care about your experience with our app. Because of that, we are here to help in any way we can!"
        title={'How can we Help?'}
        showCard={showSupportCard}
        onClose={() => setShowSupportCard(false)}>
        <div className="support-wrapper">
          <Spacer height={10} />
          <div id="support-container" className={`${theme} form`}>
            <div className="form">
              <InputWrapper
                inputType={InputTypes.textarea}
                labelText={'Describe the issue'}
                required={true}
                onChange={(e) => setSupportNotes(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* CONTACT US */}
      <div id="help-container" className={`${theme} page-container form`}>
        <p className="screen-title">We&#39;re Here to Help</p>
        {/* SECTIONS */}
        <div className="sections">
          <p className="section" onClick={() => setShowFeatureRequestCard(true)}>
            <GoVideo />
            Tutorial
          </p>
          <p className="section" onClick={() => setShowFeatureRequestCard(true)}>
            <MdOutlineAppShortcut />
            Feature Request
          </p>
          <p className="section" onClick={() => setShowFeedbackCard(true)}>
            <VscFeedback />
            Provide App Feedback
          </p>
          <p className="section" onClick={() => setShowSupportCard(true)}>
            <MdOutlineEmail />
            Contact Support
          </p>
        </div>
      </div>
      {!showFeatureRequestCard && !showFeedbackCard && !showSupportCard && <NavBar navbarClass={'no-Add-new-button'}></NavBar>}
    </>
  )
}