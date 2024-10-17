import moment from 'moment'
import React, { useState, useEffect, useContext } from 'react'
import { getDatabase, ref, set, get, child, onValue } from 'firebase/database'
import DB from '@db'
import globalState from '../../../context'
import Manager from '@manager'
import ScreenNames from '@screenNames'
import Autocomplete from 'react-google-autocomplete'
import General from '@models/child/general'
import Child from '@models/child/child'
import CheckboxGroup from '@shared/checkboxGroup'
import DB_UserScoped from '@userScoped'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import { useSwipeable } from 'react-swipeable'
import BottomButton from '../../shared/bottomButton'
import BottomCard from '../../shared/bottomCard'

const NewChildForm = ({ showCard, setShowCard }) => {
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
  }

  const submit = async () => {
    const dbRef = ref(getDatabase())

    if (Manager.validation([name, dateOfBirth]) > 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please fill out required fields', alertType: 'error' })
      return false
    } else {
      const newChild = new Child()
      const general = new General()
      general.address = address !== null ? address : ''
      general.phone = phoneNumber
      general.name = name
      general.gender = gender
      newChild.general = general

      // Has children already
      if (existingChildren.length > 0) {
        set(child(dbRef, `users/${currentUser.phone}/children`), [...existingChildren, newChild])
      }
      // Add new child
      else {
        set(child(dbRef, `users/${currentUser.phone}/children`), [newChild])
      }
    }
    resetForm()
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
    Manager.toggleForModalOrNewForm('show')
    getExistingChildren().then((r) => r)
  }, [])

  return (
    <BottomCard
      className="new-child-wrapper"
      title={'Add Child'}
      showCard={showCard}
      onClose={() => {
        setShowCard()
        resetForm()
      }}>
      <div id="new-child-container" className={`${theme}  form`}>
        <div className="form new-child-form">
          <p className="screen-title pl-0">Add Child</p>
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
          <CheckboxGroup boxWidth={20} elClass="mb-20" labels={['Male', 'Female']} onCheck={(e) => handleGenderSelect(e)} />
          {name.length > 0 && moment(dateOfBirth).format('MM/DD/YYYY').replace('Invalid date', '').length > 0 && (
            <BottomButton iconName="add_reaction" elClass={'visible'} onClick={submit} />
          )}
        </div>
        <div className="flex buttons gap">
          <button className="button card-button" onClick={submit}>
            Add {name.length > 0 ? name : ''} <span className="material-icons-round ml-10 fs-22">check</span>
          </button>
          <button
            className="button card-button delete"
            onClick={() => {
              setShowCard(false)
            }}>
            Delete <span className="material-icons-round ml-10 fs-22">delete</span>
          </button>
        </div>
      </div>
    </BottomCard>
  )
}

export default NewChildForm
