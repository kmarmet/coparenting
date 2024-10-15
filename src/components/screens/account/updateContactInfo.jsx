import moment from 'moment'
import React, { useState, useEffect, useContext } from 'react'
import { getDatabase, ref, set, get, child, onValue } from 'firebase/database'
import DB from '@db'
import globalState from '../../../context'
import Manager from '@manager'
import ScreenNames from '@screenNames'
import { useSwipeable } from 'react-swipeable'
import BottomButton from '../../shared/bottomButton'

export default function UpdateContactInfo() {
  const { state, setState } = useContext(globalState)
  const { contactInfoToUpdateType, currentUser } = state

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      console.log('User Swiped!', eventData)
      setState({ ...state, currentScreen: ScreenNames.account })
    },
  })

  const submit = async () => {
    if (contactInfoToUpdateType === 'phone' && Manager.validation([phone]) > 0) {
      setState({
        ...state,
        alertMessage: `Phone is required`,
        showAlert: true,
        alertType: 'error',
      })
      return false
    }
    if (contactInfoToUpdateType === 'email' && Manager.validation([email]) > 0) {
      setState({
        ...state,
        alertMessage: `Email is required`,
        showAlert: true,
        alertType: 'error',
      })
      return false
    }
    await DB.updatePhoneOrEmail(currentUser, theme, contactInfoToUpdateType, contactInfoToUpdateType === 'phone' ? phone : email)
    setState({ ...state, showAlert: true })
    setTimeout(() => {
      setState({ ...state, currentScreen: ScreenNames.settings })
    }, 2000)
  }

  useEffect(() => {
    setState({ ...state, previousScreen: ScreenNames.account, showBackButton: true, showMenuButton: false })
    Manager.toggleForModalOrNewForm('show')
  }, [])

  return (
    <>
      <p className="screen-title ">Update Your Info</p>
      <div {...handlers} id="update-contact-info-container" className={`${theme} page-container form`}>
        <div className="form">
          {contactInfoToUpdateType === 'email' && (
            <>
              <label>
                Email Address <span className="asterisk">*</span>
              </label>
              <input className="mb-15" type="email" onChange={(e) => setEmail(e.currentTarget.value)} />
            </>
          )}
          {contactInfoToUpdateType === 'phone' && (
            <>
              <label>
                Phone Number <span className="asterisk">*</span>
              </label>
              <input className="mb-15" type="phone" onChange={(e) => setPhone(e.currentTarget.value)} />
            </>
          )}
          <BottomButton onClick={submit} />
        </div>
      </div>
    </>
  )
}
