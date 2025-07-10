// Path: src\components\screens\help.jsx
import React, {useContext, useEffect, useState} from 'react'
import {MdEmail, MdFiberNew, MdThumbsUpDown} from 'react-icons/md'
import {PiVideoFill} from 'react-icons/pi'
import InputTypes from '../../constants/inputTypes'
import ScreenNames from '../../constants/screenNames'
import globalState from '../../context'
import useCurrentUser from '../../hooks/useCurrentUser'
import AlertManager from '../../managers/alertManager'
import DomManager from '../../managers/domManager'
import EmailManager from '../../managers/emailManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'
import NavBar from '../navBar'
import Form from '../shared/form'
import InputField from '../shared/inputField'
import Screen from '../shared/screen'
import ScreenHeader from '../shared/screenHeader'

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
    if (!Manager.IsValid(featureDescription, true)) {
      AlertManager.throwError('Please share a description of the feature you are interested in requesting')
      return false
    } else {
      setState({...state, successAlertMessage: 'Feature Request Received'})
      EmailManager.SendFeatureRequest(currentUser?.email, `Feature Name: ${featureName} \n Description: ${featureDescription}`)
      // setShowFeatureRequestCard(false)
      ResetFormFeatureRequestForm()
    }
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
    DomManager.ToggleAnimation('add', 'section', DomManager.AnimateClasses.names.fadeInUp)
  }, [])

  return (
    <Screen activeScreen={ScreenNames.help}>
      {/* FEATURE REQUEST */}
      <Form
        onSubmit={SubmitFeatureRequest}
        submitText={'Send Request'}
        wrapperClass="feature-request"
        showCard={showFeatureRequestCard}
        subtitle="We encourage you to request a new feature for the app! Whether big or small, we are excited to receive your ideas and may include YOUR feature suggestion in the app!"
        onClose={() => setShowFeatureRequestCard(false)}
        title={'Request New Feature'}>
        <div className="feature-request-wrapper">
          <div id="feature-request-container" className={`${theme}`}>
            <InputField placeholder={'Feature Name'} required={true} onChange={(e) => setFeatureName(e.target.value)} inputType={InputTypes.text} />
            <InputField
              inputType={InputTypes.textarea}
              placeholder={StringManager.FormatTitle('Tell us all about your idea!')}
              required={true}
              onChange={(e) => setFeatureDescription(e.target.value)}
            />
          </div>
        </div>
      </Form>

      {/* FEEDBACK */}
      <Form
        submitText={'Send Feedback'}
        className="feedback-wrapper"
        wrapperClass="feedback-wrapper form"
        title={'Share Your Thoughts With Us'}
        subtitle="Your feedback helps us improve the app! Whether it's a feature request or an feature needing improvement, we value your input."
        onSubmit={SubmitFeedback}
        showCard={showFeedbackCard}
        onClose={() => setShowFeedbackCard(false)}>
        <div className="feedback-wrapper">
          <div id="feedback-container" className={`${theme}`}>
            <InputField
              inputType={InputTypes.textarea}
              placeholder={'Thoughts here...'}
              required={true}
              onChange={(e) => setFeedback(e.target.value)}
              type="text"
            />
          </div>
        </div>
      </Form>

      {/* CONTACT SUPPORT */}
      <Form
        submitText={'Get Support'}
        onSubmit={SubmitSupportRequest}
        wrapperClass="support-wrapper"
        className="support-wrapper"
        title={'How We Can Help?'}
        subtitle="We are here to help! If you have any questions or concerns, please let us know and we will get back to you as soon as possible"
        showCard={showSupportCard}
        onClose={() => setShowSupportCard(false)}>
        <div className="support-wrapper">
          <div id="support-container" className={`${theme} `}>
            <InputField
              inputType={InputTypes.textarea}
              placeholder={'Concerns/Questions Here...'}
              required={true}
              onChange={(e) => setSupportNotes(e.target.value)}
            />
          </div>
        </div>
      </Form>

      {/* CONTACT US */}
      <div id="help-container" className={`${theme} page-container`}>
        <ScreenHeader
          title={'How can we Help?'}
          wrapperClass="no-Add-new-button"
          screenDescription={'We genuinely care about your experience with our app. Because of that, we are here to help in any way we can!'}
        />
        <div className="screen-content">
          {/* SECTIONS */}
          <div className="sections">
            <p className="section" onClick={() => setShowFeatureRequestCard(true)}>
              <PiVideoFill />
              Tutorial
            </p>
            <p className="section" onClick={() => setShowFeatureRequestCard(true)}>
              <MdFiberNew />
              Feature Request
            </p>
            <p className="section" onClick={() => setShowFeedbackCard(true)}>
              <MdThumbsUpDown />
              Share Feedback
            </p>
            <p className="section" onClick={() => setShowSupportCard(true)}>
              <MdEmail />
              Contact Support
            </p>
          </div>
        </div>
      </div>
      {!showFeatureRequestCard && !showFeedbackCard && !showSupportCard && <NavBar navbarClass={'no-Add-new-button'}></NavBar>}
    </Screen>
  )
}