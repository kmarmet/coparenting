import moment from 'moment'
import React, { useState, useEffect, useContext } from 'react'
import { getDatabase, ref, set, get, child, onValue } from 'firebase/database'
import DB from '@db'
import globalState from '../../../context'
import Manager from '@manager'
import ScreenNames from '@screenNames'
import { useSwipeable } from 'react-swipeable'
import BottomButton from '../../shared/bottomButton'

export default function UpdateContactInfo({ updateType, update, updateEmail }) {
  const { state, setState } = useContext(globalState)
  const { contactInfoToUpdateType, currentUser, theme } = state

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      console.log('User Swiped!', eventData)
      setState({ ...state, currentScreen: ScreenNames.account })
    },
  })

  useEffect(() => {
    setState({ ...state, previousScreen: ScreenNames.account, showBackButton: true, showMenuButton: false })
    Manager.showPageContainer('show')
  }, [])

  return (
    <>
      <p className="screen-title ">Update Your Info</p>
      <div {...handlers} id="update-contact-info-container" className={`${theme}  form`}>
        <div className="form">
          {updateType === 'email' && (
            <>
              <>
                <label>
                  Email Address <span className="asterisk">*</span>
                </label>
                <input className="mb-15" type="email" onChange={(e) => setEmail(e.currentTarget.value)} />
              </>
              <div className="flex buttons gap">
                <button className="button card-button w-80" onClick={() => updateEmail(email)}>
                  Submit <span className="material-icons-round ml-10 fs-22">check</span>
                </button>
              </div>
            </>
          )}
          {updateType === 'phone' && (
            <>
              <label>
                Phone Number <span className="asterisk">*</span>
              </label>
              <input className="mb-15" type="phone" onChange={(e) => setPhone(e.currentTarget.value)} />
              <div className="flex buttons gap">
                <button className="button card-button" onClick={() => update(phone)}>
                  Submit <span className="material-icons-round ml-10 fs-22">check</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
