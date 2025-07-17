import {initializeApp} from 'firebase/app'
import {EmailAuthProvider, getAuth, reauthenticateWithCredential, signOut} from 'firebase/auth'
import React, {useContext, useState} from 'react'
import {IoIosRemoveCircle} from 'react-icons/io'
import {MdOutlineAppShortcut, MdThumbsUpDown, MdTipsAndUpdates} from 'react-icons/md'
import InputTypes from '../../../constants/inputTypes'
import ScreenNames from '../../../constants/screenNames'
import globalState from '../../../context.js'
import DB from '../../../database/DB'
import DB_UserScoped from '../../../database/db_userScoped'
import Storage from '../../../database/storage'
import firebaseConfig from '../../../firebaseConfig'
import useCurrentUser from '../../../hooks/useCurrentUser'
import AlertManager from '../../../managers/alertManager'
import EmailManager from '../../../managers/emailManager'
import Manager from '../../../managers/manager'
import StringManager from '../../../managers/stringManager'
import UpdateManager from '../../../managers/updateManager'
import NavBar from '../../navBar'
import Form from '../../shared/form'
import InputField from '../../shared/inputField'
import Label from '../../shared/label'
import Screen from '../../shared/screen'
import ScreenHeader from '../../shared/screenHeader'
import Spacer from '../../shared/spacer'
import Profile from './profile'
import Settings from './settings'

export default function MakeItYours() {
    const {state, setState} = useContext(globalState)
    const {theme} = state
    const {currentUser} = useCurrentUser()

    // STATE
    const [featureName, setFeatureName] = useState('')
    const [featureDescription, setFeatureDescription] = useState('')
    const [showFeatureRequestCard, setShowFeatureRequestCard] = useState(false)
    const [feedback, setFeedback] = useState('')
    const [showFeedbackCard, setShowFeedbackCard] = useState(false)

    // Init Firebase
    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)
    const firebaseUser = auth.currentUser

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

    const CloseAccount = async () => {
        AlertManager.inputAlert(
            'Enter Your Password',
            'In order to continue with the profile deletion process, you are required to enter your password for security (verification) purposes',
            (e) => {
                const user = auth.currentUser
                const credential = EmailAuthProvider.credential(user.email, e.value)
                if (!Manager.IsValid(e.value, true)) {
                    AlertManager.throwError('Password is required')
                    return false
                }
                reauthenticateWithCredential(auth.currentUser, credential)
                    .then(async () => {
                        // // Delete from Firebase Storage
                        const allStorageDirectories = Object.keys(Storage.directories)
                        for (let dir of allStorageDirectories) {
                            await Storage.deleteDirectory(dir, currentUser.key)
                        }

                        // Delete from OneSignal
                        const subscriber = await DB.find(DB.tables.updateSubscribers, ['key', currentUser.key], true)

                        if (subscriber) {
                            await UpdateManager.deleteUser(subscriber?.oneSignalId, subscriber?.subscriptionId)
                        }

                        // Delete from Realtime Database
                        await DB_UserScoped.deleteUserData(currentUser)

                        // Delete from Firebase Auth
                        firebaseUser
                            .delete()
                            .then(async () => {
                                // Sign Out
                                signOut(auth)
                                    .then(() => {
                                        window.location.reload()
                                        // Sign-out successful.
                                        console.log('User signed out')
                                    })
                                    .catch((error) => {
                                        // An error happened.
                                        console.log(error.message)
                                    })
                            })
                            .catch((error) => {
                                console.log(error.message)
                            })
                    })
                    .catch((error) => {
                        // An error ocurred
                        console.log(error.message)
                        // ...
                    })
            },
            true,
            true,
            'text',
            'yellow'
        )
    }

    return (
        <Screen activeScreen={ScreenNames.makeItYours}>
            {/* FEATURE REQUEST */}
            <Form
                onSubmit={SubmitFeatureRequest}
                submitText={'Send Request'}
                wrapperClass="feature-request"
                showCard={showFeatureRequestCard}
                subtitle="We encourage you to request a new feature for the app! Whether big or small, we are excited to receive your ideas and may include YOUR feature suggestion in the app!"
                onClose={() => setShowFeatureRequestCard(false)}
                title={'Request New Feature'}>
                <Spacer height={8} />
                <div className="feature-request-wrapper">
                    <div id="feature-request-container" className={`${theme}`}>
                        <InputField
                            placeholder={'Feature Name'}
                            required={true}
                            onChange={(e) => setFeatureName(e.target.value)}
                            inputType={InputTypes.text}
                        />
                        <Spacer height={3} />
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
                <Spacer height={8} />
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

            {/* PAGE CONTAINER */}
            <div id="make-it-yours-wrapper" className={`${theme} page-container`}>
                <ScreenHeader
                    screenDescription={`Hey ${StringManager.GetFirstNameOnly(currentUser?.name)}! This is your space to tailor the app to your needs.`}
                    title={'Make It Yours'}
                    titleIcon={<MdOutlineAppShortcut />}
                />
                <Spacer height={10} />
                <div className="screen-content">
                    {/* SETTINGS */}
                    <div className="section">
                        <Label classes={'always-show section-title'} text={'App Preferences'} />
                        <Spacer height={10} />
                        <Settings />
                    </div>

                    {/* PROFILE */}
                    <div className="section">
                        <Profile />
                    </div>

                    <div className="section">
                        <Label classes={'always-show section-title'} text={'Share Your Thoughts'} />
                        <Spacer height={10} />
                        <p className="action-row feature-request" onClick={() => setShowFeatureRequestCard(true)}>
                            <MdTipsAndUpdates />
                            Feature Request
                        </p>
                        <p className="action-row feedback" onClick={() => setShowFeedbackCard(true)}>
                            <MdThumbsUpDown />
                            Share Feedback
                        </p>
                    </div>

                    <p className="deactivate-account" onClick={CloseAccount}>
                        Deactivate Account
                        <IoIosRemoveCircle />
                    </p>
                </div>
            </div>
            {<NavBar navbarClass={'profile no-Add-new-button'}></NavBar>}
        </Screen>
    )
}