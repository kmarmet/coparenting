import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import DB from '@db'
import globalState from '../../../context'
import Manager from '@manager'
import Autocomplete from 'react-google-autocomplete'
import General from '@models/child/general'
import Child from '@models/child/child'
import CheckboxGroup from '@shared/checkboxGroup'
import DB_UserScoped from '@userScoped'
import { MobileDatePicker } from '@mui/x-date-pickers-pro'
import {
  contains,
  displayAlert,
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
import ModelNames from '../../../models/modelNames'

const NewChildForm = ({ hideCard }) => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

  // State
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [existingChildren, setExistingChildren] = useState([])
  const [gender, setGender] = useState('male')
  const [dateOfBirth, setDateOfBirth] = useState('')

  const resetForm = () => {
    Manager.resetForm('new-child-wrapper')
    setName('')
    setAddress('')
    setPhoneNumber('')
    setExistingChildren([])
    setGender('male')
    setDateOfBirth('')
    hideCard()
  }

  const submit = async () => {
    if (Manager.validation([name, dateOfBirth]) > 0) {
      displayAlert('error', 'Please fill out required fields')
      return false
    } else {
      const newChild = new Child()
      const general = new General()
      general.address = address !== null ? address : ''
      general.phone = phoneNumber || ''
      general.name = name
      general.gender = gender || ''
      general.dateOfBirth = dateOfBirth
      newChild.general = general || ''

      const cleanChild = Manager.cleanObject(newChild, ModelNames.childUser)
      await DB_UserScoped.addUserChild(currentUser, cleanChild)

      resetForm()
    }
  }

  const getExistingChildren = async () => {
    await DB_UserScoped.getCurrentUserRecords(DB.tables.users, currentUser, theme, 'children').then((children) => {
      setExistingChildren(children)
    })
  }

  const handleGenderSelect = (e) => {
    Manager.handleCheckboxSelection(
      e,
      () => {
        setGender(e.target.value)
      },
      () => {}
    )
  }

  useEffect(() => {
    Manager.showPageContainer('show')
    getExistingChildren().then((r) => r)
  }, [])

  return (
    <div id="new-child-container" className={`${theme}  form`}>
      <div className="form new-child-form">
        {/* NAME */}
        <label>
          Name <span className="asterisk">*</span>
        </label>
        <input className="mb-10" type="text" onChange={(e) => setName(e.target.value)} />
        <label>
          Date of Birth <span className="asterisk">*</span>
        </label>
        <MobileDatePicker className="mb-10 mt-0 w-100 event-from-date mui-input" onAccept={(e) => setDateOfBirth(moment(e).format('MM/DD/YYYY'))} />
        <label>Phone Number</label>
        <input type="tel" className="mb-10" onChange={(e) => setPhoneNumber(e.target.value)} />
        <label>Home Address</label>
        <Autocomplete
          apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
          options={{
            types: ['geocode', 'establishment'],
            componentRestrictions: { country: 'usa' },
          }}
          className="mb-15"
          onPlaceSelected={(place) => {
            setAddress(place.formatted_address)
          }}
        />

        {/* GENDER */}
        <label>Gender</label>
        <CheckboxGroup boxWidth={20} elClass="mb-20" checkboxLabels={['Male', 'Female']} onCheck={(e) => handleGenderSelect(e)} />
      </div>
      <div className="flex buttons gap">
        <button className="button card-button primary" onClick={submit}>
          Add {name.length > 0 ? name : ''} <span className="material-icons-round ml-10 fs-22">check</span>
        </button>
        <button className="button card-button cancel" onClick={hideCard}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default NewChildForm
