import React, { useContext, useEffect, useState } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../../context.js'
import Manager from '@manager'
import {
  confirmAlert,
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  inputAlert,
  isAllUppercase,
  oneButtonAlert,
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
} from '../../../globalFunctions'
import BottomCard from '../../shared/bottomCard'
import UpdateContactInfo from './updateContactInfo'
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, signOut, updateEmail } from 'firebase/auth'
import validator from 'validator'

// ICONS
import { MdOutlineContactMail, MdOutlineContactPhone } from 'react-icons/md'
import { PiChatsCircleDuotone, PiHandWavingDuotone } from 'react-icons/pi'

import DB_UserScoped from '@userScoped'
import firebaseConfig from '../../../firebaseConfig'
import { initializeApp } from 'firebase/app'
import DB from '@db'

export default function Account() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [updateType, setUpdateType] = useState('email')
  const [showUpdateEmailCard, setShowUpdateEmailCard] = useState(false)
  const [showPhoneUpdateCard, setShowPhoneUpdateCard] = useState(false)

  // Firebase init
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

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
    setShowUpdateEmailCard(false)
    successAlert('Email has been updated!')
    if (!Manager.isValid(newEmail, false, false, true)) {
      throwError(`Please enter your new ${uppercaseFirstLetterOfAllWords(updateType)} ${updateType === 'phone' ? 'Number' : 'Address'}`)
      return false
    }
    if (!validator.isEmail(newEmail)) {
      throwError('Email is not valid')
      return false
    }
    inputAlert('Enter Your Password', 'To update your email, we need to re-authenticate your account for security purpose', (e) => {
      const user = auth.currentUser
      const credential = EmailAuthProvider.credential(user.email, e.value)
      reauthenticateWithCredential(auth.currentUser, credential)
        .then(async () => {
          // User re-authenticated.
          await updateEmail(auth.currentUser, newEmail, {
            email: newEmail,
          })
          await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser.phone}/email`, newEmail)
          await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser.phone}/emailVerified`, false)
          localStorage.removeItem('rememberKey')
          logout()
        })
        .catch((error) => {
          // An error ocurred
          console.log(error.message)
          // ...
        })
    })
  }

  const updateUserPhone = async (newPhone) => {
    console.log(newPhone)
    if (!Manager.isValid(newPhone, false, false, true)) {
      throwError(`Please enter your new ${uppercaseFirstLetterOfAllWords(updateType)} ${updateType === 'phone' ? 'Number' : 'Address'}`)
      return false
    }
    if (!validator.isMobilePhone(newPhone)) {
      throwError('Phone number is not valid')
      return false
    }

    // Update Phone
    if (updateType === 'phone') {
      await DB_UserScoped.updateUserContactInfo(currentUser, currentUser.phone, newPhone, 'phone')
      successAlert('Phone number has been updated')
      setShowPhoneUpdateCard(false)
      localStorage.removeItem('rememberKey')
      logout()
    }
  }

  useEffect(() => {
    Manager.showPageContainer('show')
  }, [])
  return (
    <>
      {/* UPDATE EMAIL */}
      <BottomCard
        onClose={() => setShowUpdateEmailCard(false)}
        showCard={showUpdateEmailCard}
        title={`Update your ${uppercaseFirstLetterOfAllWords(updateType)}`}>
        <UpdateContactInfo updatePhone={() => {}} updateType={updateType} updateEmail={(e) => updateUserEmail(e)} />
      </BottomCard>

      {/* UPDATE PHONE */}
      <BottomCard
        onClose={() => setShowPhoneUpdateCard(false)}
        showCard={showPhoneUpdateCard}
        title={`Update your ${uppercaseFirstLetterOfAllWords(updateType)}`}>
        <UpdateContactInfo
          updateEmail={() => {
            console.log('here')
          }}
          updatePhone={(e) => updateUserPhone(e)}
        />
      </BottomCard>

      {/* PAGE CONTAINER */}
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
