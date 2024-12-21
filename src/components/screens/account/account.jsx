import React, { useContext, useState } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../../context.js'
import Manager from '@manager'
import {
  contains,
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
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import { Fade } from 'react-awesome-reveal'
// ICONS
import { PiChatsCircleDuotone, PiHandWavingDuotone, PiUserCircleMinusDuotone } from 'react-icons/pi'
import { MdOutlineContactMail, MdOutlineContactPhone, MdOutlinePassword } from 'react-icons/md'
import NavBar from '../../navBar'
import AlertManager from '../../../managers/alertManager'
import firebaseConfig from '../../../firebaseConfig'
import { initializeApp } from 'firebase/app'
import DB_UserScoped from '@userScoped'
import DB from '@db'
import BottomCard from '../../shared/bottomCard'
import InputWrapper from '../../shared/inputWrapper'
import validator from 'validator'
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, signOut, updateEmail } from 'firebase/auth'
import { useSwipeable } from 'react-swipeable'
import NotificationManager from '../../../managers/notificationManager'
import FirebaseStorage from '@firebaseStorage'

export default function Account() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [updateType, setUpdateType] = useState('email')
  const [showUpdateCard, setShowUpdateCard] = useState(false)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [resetKey, setResetKey] = useState(Manager.getUid())
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [reauthPassword, setReauthPassword] = useState('')

  // Init Firebase
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const firebaseUser = auth.currentUser

  const resetForm = async () => {
    setResetKey(Manager.getUid())
    setEmail('')
    setPhone('')
  }

  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      console.log('User Swiped!', eventData)
      setState({ ...state, currentScreen: ScreenNames.account })
    },
  })

  const logout = () => {
    signOut(auth)
      .then(() => {
        setState({
          ...state,
          currentScreen: ScreenNames.login,
          currentUser: null,
          userIsLoggedIn: false,
        })
        // Sign-out successful.
        console.log('User signed out')
      })
      .catch((error) => {
        // An error happened.
      })
  }

  const updateUserEmail = async () => {
    AlertManager.successAlert('Email has been updated!')
    if (!Manager.isValid(email, false, false, true)) {
      AlertManager.throwError(`Please enter your new ${uppercaseFirstLetterOfAllWords(updateType)} ${updateType === 'phone' ? 'number' : 'Address'}`)
      return false
    }
    if (!validator.isEmail(email)) {
      AlertManager.throwError('Email is not valid')
      return false
    }
    AlertManager.inputAlert('Enter Your Password', 'To update your email, we need to re-authenticate your account for security purpose', (e) => {
      const user = auth.currentUser
      const credential = EmailAuthProvider.credential(user.email, e.value)
      reauthenticateWithCredential(auth.currentUser, credential)
        .then(async () => {
          // User re-authenticated.
          await updateEmail(auth.currentUser, email, {
            email: email,
          })
          await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser?.phone}/email`, email)
          logout()
        })
        .catch((error) => {
          // An error ocurred
          console.log(error.message)
          // ...
        })
    })
  }

  const updateUserPhone = async () => {
    if (!Manager.isValid(phone, false, false, true)) {
      AlertManager.throwError(`Please enter your new ${uppercaseFirstLetterOfAllWords(updateType)} Number`)
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
    AlertManager.inputAlert('Enter Your Password', 'Your password is required to confirm account deletion', (e) => {
      const user = auth.currentUser
      const credential = EmailAuthProvider.credential(user.email, e.value)
      reauthenticateWithCredential(auth.currentUser, credential)
        .then(async () => {
          // // Delete from Firebase Storage
          const allStorageDirectories = Object.keys(FirebaseStorage.directories)
          for (let dir of allStorageDirectories) {
            await FirebaseStorage.deleteDirectory(dir, currentUser.id)
          }

          // Delete from OneSignal
          const subscriber = await DB.find(DB.tables.notificationSubscribers, ['phone', currentUser.phone], true)

          if (subscriber) {
            await NotificationManager.deleteUser(subscriber?.oneSignalId, subscriber?.subscriptionId)
          }

          // Delete from Realtime Database
          await DB_UserScoped.deleteUserData(currentUser)

          // // Delete from Firebase Auth
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
    })
  }

  return (
    <>
      {/* UPDATE CARD */}
      <BottomCard
        onSubmit={async () => {
          if (updateType === 'phone') {
            await updateUserPhone()
          } else {
            await updateUserEmail()
          }
        }}
        refreshKey={resetKey}
        submitText={`Update`}
        onClose={() => {
          setResetKey(Manager.getUid())
          setShowUpdateCard(false)
        }}
        showCard={showUpdateCard}
        title={`Update your ${uppercaseFirstLetterOfAllWords(updateType)}`}>
        <div {...handlers} id="update-contact-info-container" className={`${theme}  form`}>
          <div className="form">
            {updateType === 'email' && (
              <InputWrapper onChange={(e) => setEmail(e.currentTarget.value)} labelText={'New Email Address'} required={true}></InputWrapper>
            )}
            {updateType === 'phone' && (
              <InputWrapper onChange={(e) => setPhone(e.currentTarget.value)} labelText={'New Phone Number'} required={true}></InputWrapper>
            )}
          </div>
        </div>
      </BottomCard>

      {/* RE-AUTHENTICATE CARD */}
      <BottomCard
        onSubmit={async () => {
          console.log('here')
        }}
        refreshKey={resetKey}
        onClose={() => {
          setResetKey(Manager.getUid())
          setShowLoginForm(false)
        }}
        submitButtonColor="red with-bg"
        submitText={'Close Account'}
        showCard={showLoginForm}
        title={`Please login to complete account deletion`}>
        <div {...handlers} id="reauthentication-wrapper" className={`${theme} form`}>
          <InputWrapper onChange={(e) => setEmail(e.currentTarget.value)} labelText={'Email Address'} required={true}></InputWrapper>
          <InputWrapper
            onChange={(e) => setPhone(e.currentTarget.value)}
            labelText={'Password'}
            inputValueType="password"
            required={true}></InputWrapper>
        </div>
      </BottomCard>

      {/* PAGE CONTAINER */}
      <div id="account-container" className={`${theme} page-container`}>
        <Fade direction={'up'} duration={1000} className={'visitation-fade-wrapper'} triggerOnce={true}>
          <p className="screen-title">Account</p>
          <p id="user-name">
            Hello {formatNameFirstNameOnly(currentUser?.name)}! <PiHandWavingDuotone className={'fs-24'} />
          </p>
          <div className="sections">
            <p className="section" onClick={() => setState({ ...state, currentScreen: ScreenNames.resetPassword })}>
              <MdOutlinePassword className={'mr-10'} />
              Reset Password
            </p>
            <p
              onClick={() => {
                setUpdateType('phone')
                setShowUpdateCard(true)
              }}
              className="section">
              <MdOutlineContactPhone className={'mr-10'} />
              Update Phone Number
            </p>
            <p
              className="section"
              onClick={() => {
                setUpdateType('email')
                setShowUpdateCard(true)
              }}>
              <MdOutlineContactMail className={'mr-10'} />
              Update Email Address
            </p>
            {currentUser && currentUser?.accountType === 'parent' && (
              <p className="section" onClick={() => setState({ ...state, currentScreen: ScreenNames.chatRecovery })}>
                <PiChatsCircleDuotone className={'mr-10'} />
                Chat Recovery
              </p>
            )}
            <p className="section close-account" onClick={closeAccount}>
              <PiUserCircleMinusDuotone className={'mr-10'} />
              Close Account
            </p>
          </div>
        </Fade>
      </div>
      {!showUpdateCard && !showLoginForm && <NavBar navbarClass={'account no-add-new-button'}></NavBar>}
    </>
  )
}