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
import { MdOutlineContactMail, MdOutlineContactPhone, MdOutlinePassword } from 'react-icons/md'
import UpdateContactInfo from './updateContactInfo'
import { PiChatsCircleDuotone, PiHandWavingDuotone } from 'react-icons/pi'
import NavBar from '../../navBar'

export default function Account() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [updateType, setUpdateType] = useState('email')
  const [showUpdateCard, setShowUpdateCard] = useState(false)
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
          <p className="section" onClick={() => setState({ ...state, currentScreen: ScreenNames.forgotPassword })}>
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
        </div>
      </div>
      {!showUpdateCard && <NavBar navbarClass={'account no-add-new-button'}></NavBar>}
    </>
  )
}