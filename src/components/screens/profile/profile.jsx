// Path: src\components\screens\profile\profile.jsx
import {initializeApp} from 'firebase/app'
import {EmailAuthProvider, getAuth, reauthenticateWithCredential, signOut, updateEmail} from 'firebase/auth'
import React, {useContext, useState} from 'react'
import {Fade} from 'react-awesome-reveal'
import {IoIosRemoveCircle} from 'react-icons/io'
import {MdContactMail, MdOutlinePassword} from 'react-icons/md'
import {PiHandWavingDuotone} from 'react-icons/pi'
import validator from 'validator'
import InputTypes from '../../../constants/inputTypes'
import ScreenNames from '../../../constants/screenNames'
import globalState from '../../../context.js'
import DB from '../../../database/DB'
import DB_UserScoped from '../../../database/db_userScoped'
import FirebaseStorage from '../../../database/firebaseStorage'
import firebaseConfig from '../../../firebaseConfig'
import useCurrentUser from '../../../hooks/useCurrentUser'
import AlertManager from '../../../managers/alertManager'
import Manager from '../../../managers/manager'
import NotificationManager from '../../../managers/notificationManager'
import StringManager from '../../../managers/stringManager.coffee'
import NavBar from '../../navBar'
import AddressInput from '../../shared/addressInput'
import InputWrapper from '../../shared/inputWrapper'
import Modal from '../../shared/modal'
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

  const logout = () => {
    signOut(auth)
      .then(() => {
        const pageOverlay = document.getElementById('page-overlay')
        if (pageOverlay) {
          pageOverlay.classList.remove('active')
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

  const updateUserEmail = async () => {
    AlertManager.successAlert('Email has been updated!')
    if (!Manager.isValid(email)) {
      AlertManager.throwError(
        `Please enter your new ${StringManager.uppercaseFirstLetterOfAllWords(updateType)} ${updateType === 'phone' ? 'number' : 'Address'}`
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
            logout()
          })
          .catch((error) => {
            // An error occurred
            if (Manager.contains(error.message, 'auth/wrong-password')) {
              AlertManager.throwError('Password is incorrect')
            }
            if (Manager.contains(error.message, 'email-already-in-use')) {
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

  const updateUserPhone = async () => {
    if (!Manager.isValid(phone)) {
      AlertManager.throwError(`Please enter your new ${StringManager.uppercaseFirstLetterOfAllWords(updateType)} Number`)
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
      logout()
    }
  }

  const closeAccount = async () => {
    AlertManager.inputAlert(
      'Enter Your Password',
      'In order to continue with the profile deletion process, you are required to enter your password for security (verification) purposes',
      (e) => {
        const user = auth.currentUser
        const credential = EmailAuthProvider.credential(user.email, e.value)
        if (!Manager.isValid(e.value, true)) {
          AlertManager.throwError('Password is required')
          return false
        }
        reauthenticateWithCredential(auth.currentUser, credential)
          .then(async () => {
            // // Delete from Firebase Storage
            const allStorageDirectories = Object.keys(FirebaseStorage.directories)
            for (let dir of allStorageDirectories) {
              await FirebaseStorage.deleteDirectory(dir, currentUser.key)
            }

            // Delete from OneSignal
            const subscriber = await DB.find(DB.tables.notificationSubscribers, ['key', currentUser.key], true)

            if (subscriber) {
              await NotificationManager.deleteUser(subscriber?.oneSignalId, subscriber?.subscriptionId)
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

  return (
    <>
      {/* UPDATE CARD */}
      <Modal
        onSubmit={async () => {
          if (updateType === 'phone') {
            await updateUserPhone()
          } else {
            await updateUserEmail()
          }
        }}
        submitText={`Update`}
        onClose={() => {
          setShowUpdateCard(false)
        }}
        wrapperClass="update-card"
        showCard={showUpdateCard}
        title={`Update your ${StringManager.uppercaseFirstLetterOfAllWords(updateType)}`}>
        <div id="update-contact-info-container" className={`${theme}`}>
          <Spacer height={8} />
          <div className="form">
            {updateType === 'email' && (
              <InputWrapper
                inputType={InputTypes.email}
                onChange={(e) => setEmail(e.target.value)}
                labelText={'New Email Address'}
                required={true}></InputWrapper>
            )}
          </div>
        </div>
      </Modal>

      {/* RE-AUTHENTICATE CARD */}
      <Modal
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
          <InputWrapper
            onChange={(e) => setEmail(e?.currentTarget?.value)}
            labelText={'Email Address'}
            inputType={InputTypes.email}
            required={true}
          />
          <InputWrapper onChange={(e) => setPhone(e?.currentTarget?.value)} labelText={'Password'} inputType={InputTypes.password} required={true} />
        </div>
      </Modal>

      {/* PAGE CONTAINER */}
      <div id="account-container" className={`${theme} page-container`}>
        <p className="screen-title">My Profile</p>
        <Spacer height={10} />
        <p id="user-name">
          Hey {StringManager.getFirstNameOnly(currentUser?.name)}! <PiHandWavingDuotone />
        </p>
        <div className="sections">
          <Fade direction={'right'} duration={800} className={'visitation-fade-wrapper'} triggerOnce={true} damping={0.2} cascade={true}>
            {/* HOME ADDRESS */}
            {Manager.isValid(currentUser) && (
              <AddressInput
                wrapperClasses="on-grey-bg"
                onChange={(address) => {
                  console.log(address)
                  SetHomeAddress(address).then()
                }}
                defaultValue={currentUser?.location?.homeAddress}
                labelText={'Home Address'}
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
            <p className="section close-account" onClick={closeAccount}>
              <IoIosRemoveCircle />
              Deactivate Account
            </p>
          </Fade>
        </div>
      </div>
      {!showUpdateCard && !showLoginForm && <NavBar navbarClass={'profile no-Add-new-button'}></NavBar>}
    </>
  )
}