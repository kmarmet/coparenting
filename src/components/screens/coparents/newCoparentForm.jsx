import { child, getDatabase, ref, set } from 'firebase/database'
import React, { useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import ScreenNames from '@screenNames'
import globalState from '../../../context'
import Coparent from '../../../models/coparent'
import Manager from '@manager'
import CheckboxGroup from '@shared/checkboxGroup'
import BottomButton from 'components/shared/bottomButton'

const NewCoparentForm = () => {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state

  // State
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [parentType, setParentType] = useState('')

  const submit = async () => {
    const dbRef = ref(getDatabase())
    if (!Manager.phoneNumberIsValid(phoneNumber)) {
      setState({ ...state, showAlert: true, alertMessage: 'Phone number is not valid' })
      return false
    }
    if (Manager.validation([phoneNumber, address, name, parentType]) > 0) {
      setState({ ...state, showAlert: true, alertMessage: 'All fields are required' })
    } else {
      const existingCoparents = currentUser.coparents
      const newCoparent = new Coparent()
      newCoparent.id = Manager.getUid()
      newCoparent.address = address !== null ? address : ''
      newCoparent.phone = phoneNumber
      newCoparent.name = name
      newCoparent.parentType = parentType
      // Has coparents already
      if (existingCoparents.length > 0) {
        await set(child(dbRef, `users/${currentUser.phone}/coparents`), [...existingCoparents, newCoparent])
        setState({ ...state, currentScreen: ScreenNames.coparents })
      }
      // Add new coparent
      else {
        await set(child(dbRef, `users/${currentUser.phone}/coparents`), [newCoparent])
        setState({ ...state, currentScreen: ScreenNames.coparents })
      }
    }
  }

  const handleCoparentType = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setParentType(e)
      },
      (e) => {
        setParentType('')
      }
    )
  }

  useEffect(() => {
    Manager.toggleForModalOrNewForm()
    setState({ ...state, previousScreen: ScreenNames.coparents, showBackButton: true, showMenuButton: false })
  }, [])

  return (
    <>
      <p className="screen-title ">Add Coparent</p>
      <div id="new-coparent-container" className={`${currentUser?.settings?.theme} page-container form`}>
        <div className="form new-coparent-form">
          <label>
            Name <span className="asterisk">*</span>
          </label>
          <input className="mb-15" type="text" onChange={(e) => setName(e.target.value)} />
          <label>
            Phone Number <span className="asterisk">*</span>
          </label>
          <input className="mb-15" type="tel" onChange={(e) => setPhoneNumber(e.target.value)} />
          <label>
            Home Address <span className="asterisk">*</span>
          </label>
          <Autocomplete
            className="mb-15"
            placeholder=""
            apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
            options={{
              types: ['geocode', 'establishment'],
              componentRestrictions: { country: 'usa' },
            }}
            onPlaceSelected={(place) => {
              setAddress(place.formatted_address)
            }}
          />

          {/* PARENT TYPE */}
          <label>
            Parent Type <span className="asterisk">*</span>
          </label>
          <CheckboxGroup className="coparent-type" labels={['Step-Parent', 'Biological Parent', "Spouse's Coparent"]} onCheck={handleCoparentType} />
          {name.length > 0 && phoneNumber.length > 0 && address.length > 0 && parentType.length > 0 && (
            <BottomButton text="Add Coparent" onClick={submit} elClass={'visible'} />
          )}
        </div>
      </div>
    </>
  )
}

export default NewCoparentForm