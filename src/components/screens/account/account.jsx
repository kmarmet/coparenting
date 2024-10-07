import React, { useContext, useEffect } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../../context.js'
import Manager from '@manager'

export default function Account() {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state

  useEffect(() => {
    setState({ ...state, currentScreen: ScreenNames.account })
    Manager.toggleForModalOrNewForm('show')
  }, [])

  return (
    <>
      <p className="screen-title ">Account</p>
      <div id="account-container" className="page-container">
        <p id="user-name">
          Hello {currentUser?.name?.formatNameFirstNameOnly()}! <span className="material-icons-outlined">sentiment_very_satisfied</span>
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
