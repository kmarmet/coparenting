import { child, getDatabase, ref, set } from 'firebase/database'
import React, { useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import globalState from '../../../context'
import Coparent from '../../../models/coparent'
import Manager from '@manager'
import CheckboxGroup from '@shared/checkboxGroup'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  formatPhone,
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
import ModelNames from '../../../models/modelNames'

const NewCoparentForm = ({ showCard, hideCard }) => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

  // State
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [parentType, setParentType] = useState('')

  const resetForm = () => {
    Manager.resetForm('new-coparent-wrapper')
    setName('')
    setAddress('')
    setPhoneNumber('')
    setParentType('')
    hideCard()
  }

  const submit = async () => {
    const dbRef = ref(getDatabase())
    if (!Manager.phoneNumberIsValid(phoneNumber)) {
      displayAlert('error', 'Phone number is not valid')
      return false
    }
    if (Manager.validation([phoneNumber, address, name, parentType]) > 0) {
      displayAlert('error', 'All fields are required')
    } else {
      const existingCoparents = currentUser?.coparents || []
      const newCoparent = new Coparent()
      newCoparent.id = Manager.getUid()
      newCoparent.address = address !== null ? address : ''
      newCoparent.phone = formatPhone(phoneNumber)
      newCoparent.name = name
      newCoparent.parentType = parentType

      const cleanCoparent = Manager.cleanObject(newCoparent, ModelNames.coparent)

      // Has coparents already
      await set(child(dbRef, `users/${currentUser.phone}/coparents`), [...existingCoparents, cleanCoparent])

      resetForm()
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
    Manager.showPageContainer()
  }, [])

  return (
    <div className="new-coparent-wrapper">
      <div id="new-coparent-container" className={`${theme} form`}>
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
          <CheckboxGroup
            boxWidth={50}
            className="coparent-type"
            checkboxLabels={['Step-Parent', 'Biological Parent', "Spouse's Co-parent"]}
            onCheck={handleCoparentType}
          />
          {/* BUTTONS */}
          <div className="buttons gap">
            {/*{showSubmitButton && (*/}
            {name.length > 0 && phoneNumber.length > 0 && address.length > 0 && parentType.length > 0 && (
              <button className="button card-button" onClick={submit}>
                Add Co-Parent <span className="material-icons-round ml-10 fs-22">person_add</span>
              </button>
            )}
            {/*)}*/}
            <button className="button card-button cancel" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewCoparentForm
