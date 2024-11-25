import React, { useContext, useState } from 'react'
import globalState from '../../../context'
import Manager from '@manager'
import ScreenNames from '@screenNames'
import { useSwipeable } from 'react-swipeable'
import firebaseConfig from '../../../firebaseConfig'
import DB_UserScoped from '@userScoped'
import DB from '@db'
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, signOut, updateEmail } from 'firebase/auth'
import validator from 'validator'
import { initializeApp } from 'firebase/app'
import BottomCard from '../../shared/bottomCard'
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
import InputWrapper from '../../shared/inputWrapper'
import AlertManager from '../../../managers/alertManager'

export default function UpdateContactInfo({ updateType, showCard, hideCard }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

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

  const updateUserEmail = async () => {
    AlertManager.successAlert('Email has been updated!')
    if (!Manager.isValid(email, false, false, true)) {
      AlertManager.throwError(`Please enter your new ${uppercaseFirstLetterOfAllWords(updateType)} ${updateType === 'phone' ? 'Number' : 'Address'}`)
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
          await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser?.phone}/emailVerified`, false)
          localStorage.removeItem('rememberKey')
          logout()
          hideCard()
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
      localStorage.removeItem('rememberKey')
      hideCard()
      logout()
    }
  }

  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      console.log('User Swiped!', eventData)
      setState({ ...state, currentScreen: ScreenNames.account })
    },
  })

  return (
    <BottomCard
      onSubmit={async () => {
        if (updateType === 'phone') {
          await updateUserPhone()
        } else {
          await updateUserEmail()
        }
      }}
      submitText={`Update`}
      onClose={hideCard}
      showCard={showCard}
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
  )
}