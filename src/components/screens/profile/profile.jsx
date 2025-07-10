// Path: src\components\screens\profile\profile.jsx
import {initializeApp} from 'firebase/app'
import {EmailAuthProvider, getAuth, reauthenticateWithCredential, signOut, updateEmail} from 'firebase/auth'
import React, {useContext, useEffect, useState} from 'react'
import {IoIosRemoveCircle} from 'react-icons/io'
import {MdContactMail, MdOutlinePassword} from 'react-icons/md'
import {PiHandWavingDuotone} from 'react-icons/pi'
import validator from 'validator'
import InputTypes from '../../../constants/inputTypes'
import ScreenNames from '../../../constants/screenNames'
import globalState from '../../../context.js'
import DB from '../../../database/DB'
import DB_UserScoped from '../../../database/db_userScoped'
import Storage from '../../../database/storage'
import firebaseConfig from '../../../firebaseConfig'
import useCurrentUser from '../../../hooks/useCurrentUser'
import AlertManager from '../../../managers/alertManager'
import DomManager from '../../../managers/domManager'
import Manager from '../../../managers/manager'
import StringManager from '../../../managers/stringManager'
import UpdateManager from '../../../managers/updateManager'
import NavBar from '../../navBar'
import AddressInput from '../../shared/addressInput'
import Form from '../../shared/form'
import InputField from '../../shared/inputField'
import Screen from '../../shared/screen'
import ScreenHeader from '../../shared/screenHeader'
import Spacer from '../../shared/spacer'

export default function Profile() {
    const {state, setState} = useContext(globalState)
    const {theme} = state
    const [updateType, setUpdateType] = useState('email')
    const [showUpdateCard, setShowUpdateCard] = useState(false)
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [showLoginForm, setShowLoginForm] = useState(false)
    const {currentUser} = useCurrentUser()

    // Init Firebase
    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)
    const firebaseUser = auth.currentUser

    const Logout = () => {
        signOut(auth)
            .then(() => {
                const screenOverlay = document.getElementById('screen-overlay')
                if (screenOverlay) {
                    screenOverlay.classList.remove('active')
                }
                setState({
                    ...state,
                    currentScreen: ScreenNames.login,
                    currentUser: null,
                    userIsLoggedIn: false,
                    isLoading: false,
                })
                // Sign-out successful.
                console.log('User signed out')
            })
            .catch((error) => {
                // An error happened.
                console.log(error)
            })
    }

    const UpdateUserEmail = async () => {
        AlertManager.successAlert('Email has been updated!')
        if (!Manager.IsValid(email)) {
            AlertManager.throwError(
                `Please enter your new ${StringManager.UppercaseFirstLetterOfAllWords(updateType)} ${updateType === 'phone' ? 'number' : 'Address'}`
            )
            return false
        }
        if (!validator.isEmail(email)) {
            AlertManager.throwError('Email is not valid')
            return false
        }
        AlertManager.inputAlert(
            'Enter Your Password',
            'To update your email, we need to re-authenticate your profile for security purposes',
            (e) => {
                const user = auth.currentUser
                const credential = EmailAuthProvider.credential(user.email, e.value)
                reauthenticateWithCredential(auth.currentUser, credential)
                    .then(async () => {
                        // User re-authenticated.
                        await updateEmail(auth.currentUser, email, {
                            email: email,
                        })
                        await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser?.key}/email`, email)
                        setState({...state, isLoading: false})
                        Logout()
                    })
                    .catch((error) => {
                        // An error occurred
                        if (Manager.Contains(error.message, 'auth/wrong-password')) {
                            AlertManager.throwError('Password is incorrect')
                        }
                        if (Manager.Contains(error.message, 'email-already-in-use')) {
                            AlertManager.throwError('Profile already exists with this email')
                        }
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

    const UpdateUserPhone = async () => {
        if (!Manager.IsValid(phone)) {
            AlertManager.throwError(`Please enter your new ${StringManager.UppercaseFirstLetterOfAllWords(updateType)} Number`)
            return false
        }
        if (!validator.isMobilePhone(phone)) {
            AlertManager.throwError('Phone number is not valid')
            return false
        }

        // Update Phone
        if (updateType === 'phone') {
            await DB_UserScoped.updateUserContactInfo(currentUser, currentUser?.phone, phone, 'phone')
            AlertManager.successAlert('Phone number has been updated')
            Logout()
        }
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

    const SetHomeAddress = async (address) => {
        await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser?.key}/location/homeAddress`, address)
        setState({...state, successAlertMessage: 'Home address has been updated'})
    }

    useEffect(() => {
        if (Manager.IsValid(currentUser)) {
            DomManager.ToggleAnimation('add', 'section', DomManager.AnimateClasses.names.fadeInUp)
        }
    }, [currentUser])

    return (
        <Screen activeScreen={ScreenNames.profile}>
            {/* UPDATE CARD */}
            <Form
                onSubmit={async () => {
                    if (updateType === 'phone') {
                        await UpdateUserPhone()
                    } else {
                        await UpdateUserEmail()
                    }
                }}
                submitText={`Update`}
                onClose={() => {
                    setShowUpdateCard(false)
                }}
                wrapperClass="update-card"
                showCard={showUpdateCard}
                title={`Update your ${StringManager.UppercaseFirstLetterOfAllWords(updateType)}`}>
                <div id="update-contact-info-container" className={`${theme}`}>
                    <InputField
                        inputType={InputTypes.email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={'New Email Address'}
                        required={true}></InputField>
                </div>
            </Form>

            {/* RE-AUTHENTICATE CARD */}
            <Form
                onSubmit={async () => {
                    console.log('here')
                }}
                onClose={() => {
                    setShowLoginForm(false)
                }}
                wrapperClass="re-auth-card"
                submitButtonColor="red with-bg"
                submitText={'Close Profile'}
                showCard={showLoginForm}
                title={`Please login to complete account deletion`}>
                <div id="reauthentication-wrapper" className={`${theme}`}>
                    <InputField
                        onChange={(e) => setEmail(e?.currentTarget?.value)}
                        placeholder={'Email Address'}
                        inputType={InputTypes.email}
                        required={true}
                    />
                    <InputField
                        onChange={(e) => setPhone(e?.currentTarget?.value)}
                        placeholder={'Password'}
                        inputType={InputTypes.password}
                        required={true}
                    />
                </div>
            </Form>

            {/* PAGE CONTAINER */}
            <div id="account-container" className={`${theme} page-container`}>
                <ScreenHeader title={'My Profile'} />
                <Spacer height={10} />
                <div className="screen-content">
                    <p id="user-name">
                        Hey {StringManager.GetFirstNameOnly(currentUser?.name)}! <PiHandWavingDuotone />
                    </p>
                    <div className="sections">
                        {/* HOME ADDRESS */}
                        {Manager.IsValid(currentUser) && (
                            <AddressInput
                                wrapperClasses="on-grey-bg white"
                                onChange={(address) => {
                                    console.log(address)
                                    SetHomeAddress(address).then()
                                }}
                                defaultValue={currentUser?.location?.homeAddress}
                                placeholder={'Home Address'}
                                required={true}
                                value={currentUser?.homeAddress}
                            />
                        )}

                        <p className="section" onClick={() => setState({...state, currentScreen: ScreenNames.resetPassword})}>
                            <MdOutlinePassword />
                            Reset Password
                        </p>
                        <p
                            className="section email"
                            onClick={() => {
                                setUpdateType('email')
                                setShowUpdateCard(true)
                            }}>
                            <MdContactMail />
                            Update Email Address
                        </p>
                        <p className="section close-account" onClick={CloseAccount}>
                            <IoIosRemoveCircle />
                            Deactivate Account
                        </p>
                    </div>
                </div>
            </div>
            {!showUpdateCard && !showLoginForm && <NavBar navbarClass={'profile no-Add-new-button'}></NavBar>}
        </Screen>
    )
}