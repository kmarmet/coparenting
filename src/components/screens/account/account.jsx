import React, { useContext, useEffect, useState } from 'react'
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
// ICONS
import { PiChatsCircleDuotone, PiHandWavingDuotone, PiUserCircleMinusDuotone } from 'react-icons/pi'
import { MdOutlineContactMail, MdOutlineContactPhone, MdOutlinePassword } from 'react-icons/md'
import UpdateContactInfo from './updateContactInfo'
import NavBar from '../../navBar'
import AlertManager from '../../../managers/alertManager'
import firebaseConfig from '../../../firebaseConfig'
import { getAuth, signOut } from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import FirebaseStorage from '@firebaseStorage'
import DB_UserScoped from '@userScoped'
import DB from '@db'
import NotificationManager from '../../../managers/notificationManager'

export default function Account() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [updateType, setUpdateType] = useState('email')
  const [showUpdateCard, setShowUpdateCard] = useState(false)

  // Init Firebase
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const firebaseUser = auth.currentUser

  const closeAccount = async () => {
    setState({ ...state, isLoading: true })

    // Delete from Firebase Auth
    firebaseUser.delete().then(async () => {
      // Delete from Firebase Storage
      const allStorageDirectories = Object.keys(FirebaseStorage.directories)
      for (let dir of allStorageDirectories) {
        await FirebaseStorage.deleteDirectory(dir, currentUser.id)
      }

      // Delete from OneSignal
      const subscriber = await DB.find(DB.tables.notificationSubscribers, ['phone', currentUser.phone], true)

      if (subscriber) {
        await NotificationManager.deleteUser(subscriber.oneSignalId, subscriber.subscriptionId)

        // Delete from Realtime Database
        await DB_UserScoped.deleteUserData(currentUser)

        // Delete user from Firebase Realtime/Storage
        await DB.deleteByPath(`${DB.tables.users}/${currentUser.phone}`)
      }

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
  }

  useEffect(() => {
    Manager.showPageContainer('show')
  }, [])

  return (
    <>
      <UpdateContactInfo hideCard={() => setShowUpdateCard(false)} updateType={updateType} showCard={showUpdateCard} />

      {/* PAGE CONTAINER */}
      <div id="account-container" className={`${theme} page-container`}>
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
          <p
            className="section close-account"
            onClick={() => {
              AlertManager.confirmAlert(
                'Are you sure you would like to PERMANENTLY close your account? All of your data will be deleted and this action cannot be reversed.',
                "I'm Sure",
                true,
                async () => {
                  await closeAccount()
                }
              )
            }}>
            <PiUserCircleMinusDuotone className={'mr-10'} />
            Close Account
          </p>
        </div>
      </div>
      {!showUpdateCard && <NavBar navbarClass={'account no-add-new-button'}></NavBar>}
    </>
  )
}