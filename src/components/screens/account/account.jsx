import React, { useContext, useEffect, useState } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../../context.js'
import Manager from '@manager'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  displayAlert,
  throwError,
  successAlert,
  uniqueArray,
  confirmAlert,
  getFileExtension,
  oneButtonAlert,
} from '../../../globalFunctions'
import BottomCard from '../../shared/bottomCard'
import UpdateContactInfo from './updateContactInfo'
import { getAuth, signOut, updateEmail, sendEmailVerification } from 'firebase/auth'
import validator from 'validator'

// ICONS
import { MdOutlineContactMail, MdOutlineContactPhone } from 'react-icons/md'
import { PiChatsCircleDuotone } from 'react-icons/pi'
import { PiHandWavingDuotone } from 'react-icons/pi'

import DB_UserScoped from '@userScoped'
import firebaseConfig from '../../../firebaseConfig'
import { initializeApp } from 'firebase/app'

export default function Account() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [updateType, setUpdateType] = useState('email')
  const [showUpdateEmailCard, setShowUpdateEmailCard] = useState(false)
  const [showPhoneUpdateCard, setShowPhoneUpdateCard] = useState(false)
  const [updatedEmail, setUpdatedEmail] = useState('')
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)
  // Firebase init
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

  const actionCodeSettings = {
    handleCodeInApp: true,
    // URL you want to redirect back to. The domain (www.example.com) for this
    // URL must be in the authorized domains list in the Firebase Console.
    url: 'https://peaceful-coparenting.app',
  }

  useEffect(() => {
    Manager.showPageContainer('show')
  }, [])

  const logout = () => {
    localStorage.removeItem('rememberKey')

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

  const updateUserEmail = async (newEmail) => {
    updateEmail(auth.currentUser, newEmail, {
      email: newEmail,
    })
    await DB_UserScoped.updateUserContactInfo(currentUser, currentUser.email, newEmail, 'email')

    successAlert('Email has been updated!')
    logout()
  }

  const update = async (updatedValue) => {
    if (!Manager.isValid(updatedValue, false, false, true)) {
      throwError(`Please enter your new ${uppercaseFirstLetterOfAllWords(updateType)} ${updateType === 'phone' ? 'Number' : 'Address'}`)
      return false
    }

    // Update Phone
    if (updateType === 'phone') {
      if (!validator.isMobilePhone(updatedValue)) {
        throwError('Phone number is not valid')
        return false
      }
      await DB_UserScoped.updateUserContactInfo(currentUser, currentUser.phone, updatedValue, 'phone')
      successAlert('Phone number has been updated')
      localStorage.removeItem('rememberKey')
      setTimeout(() => {
        logout()
      }, 1000)
    }
  }
  return (
    <>
      <BottomCard
        onClose={() => setShowUpdateEmailCard(false)}
        showCard={showUpdateEmailCard}
        title={`Update your ${uppercaseFirstLetterOfAllWords(updateType)}`}>
        <UpdateContactInfo emailVerificationSent={emailVerificationSent} updateType={updateType} updateEmail={(e) => updateUserEmail(e)} />
      </BottomCard>
      <BottomCard
        onClose={() => setShowPhoneUpdateCard(false)}
        showCard={showPhoneUpdateCard}
        title={`Update your ${uppercaseFirstLetterOfAllWords(updateType)}`}>
        <UpdateContactInfo emailVerified={false} updateType={updateType} update={(e) => update(e)} />
      </BottomCard>
      <div id="account-container" className={`${theme} page-container`}>
        <p id="user-name">
          Hello {formatNameFirstNameOnly(currentUser?.name)}! <PiHandWavingDuotone className={'fs-24'} />
        </p>
        <div className="sections">
          <p className="section" onClick={() => setState({ ...state, currentScreen: ScreenNames.forgotPassword })}>
            <span className="material-icons-round">password</span>Reset Password
          </p>
          <p
            onClick={() => {
              setUpdateType('phone')
              setShowUpdateEmailCard(true)
            }}
            className="section">
            <MdOutlineContactPhone className={'mr-10'} />
            Update Phone Number
          </p>
          <p
            className="section"
            onClick={() => {
              setUpdateType('email')
              setShowUpdateEmailCard(true)
            }}>
            <MdOutlineContactMail className={'mr-10'} />
            Update Email Address
          </p>
          <p className="section" onClick={() => setState({ ...state, currentScreen: ScreenNames.chatRecovery })}>
            <PiChatsCircleDuotone className={'mr-10'} />
            Chat Recovery
          </p>
        </div>
      </div>
    </>
  )
}
