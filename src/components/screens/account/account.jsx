import React, { useContext, useEffect } from 'react'
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
} from '../../../globalFunctions'
export default function Account() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

  useEffect(() => {
    setState({ ...state, currentScreen: ScreenNames.account, showMenuButton: true, showBackButton: false })
    Manager.showPageContainer('show')
  }, [])

  return (
    <>
      <p className="screen-title ">Account</p>
      <div id="account-container" className={`${theme} page-container`}>
        <p id="user-name">
          Hello {formatNameFirstNameOnly(currentUser?.name)}! <span className="material-icons-outlined">sentiment_very_satisfied</span>
        </p>
        <div className="sections">
          <p className="section" onClick={() => setState({ ...state, currentScreen: ScreenNames.forgotPassword })}>
            <span className="material-icons-round">password</span>Reset Password
          </p>
          <p
            className="section"
            onClick={() => setState({ ...state, currentScreen: ScreenNames.updateContactInfo, contactInfoToUpdateType: 'phone' })}>
            <span className="material-icons-round">contact_phone</span>Update Phone Number
          </p>
          <p
            className="section"
            onClick={() => setState({ ...state, currentScreen: ScreenNames.updateContactInfo, contactInfoToUpdateType: 'email' })}>
            <span className="material-icons-round">contact_mail</span>Update Email Address
          </p>
          <p className="section" onClick={() => setState({ ...state, currentScreen: ScreenNames.chatRecovery })}>
            <span className="material-icons">question_answer</span>Chat Recovery
          </p>
        </div>
      </div>
    </>
  )
}
