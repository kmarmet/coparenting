import React, { useState, useEffect, useContext } from 'react'
import globalState from '../../context'
import DB from '@db'
import { Dropdown } from 'rsuite'
import Manager from '@manager'
import { getDatabase, ref, set, get, child, onValue } from 'firebase/database'
import DB_UserScoped from '@userScoped'
import { Accordion } from 'rsuite'
import BottomCard from './bottomCard'
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
  uniqueArray,
  getFileExtension,
} from '.././../globalFunctions'
import CheckboxGroup from './checkboxGroup'
import Autocomplete from 'react-google-autocomplete'

export default function CustomChildInfo({ onClose, setActiveChild, activeChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [infoSection, setInfoSection] = useState('general')
  const [infoType, setInfoType] = useState('text')

  const add = async () => {
    const updatedChild = await DB_UserScoped.addUserChildProp(currentUser, activeChild, infoSection, Manager.toCamelCase(title), value)
    resetForm()
    setActiveChild(updatedChild)
  }

  const handleInfoTypeSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        setInfoType(e.toLowerCase())
      },
      () => {},
      false
    )
  }

  const resetForm = () => {
    Manager.resetForm('custom-child-info-wrapper')
    setTitle('')
    setValue('')
    setInfoSection('')
    onClose()
  }

  return (
    <div className="form">
      {/* INFO SECTIONS */}
      <label>
        Info Section <span className="asterisk">*</span>
      </label>
      <div className="flex">
        <p onClick={() => setInfoSection('general')} className={infoSection === 'general' ? 'active item' : 'item'}>
          General
        </p>
        <p onClick={() => setInfoSection('medical')} className={infoSection === 'medical' ? 'active item' : 'item'}>
          Medical
        </p>
        <p onClick={() => setInfoSection('schooling')} className={infoSection === 'schooling' ? 'active item' : 'item'}>
          Schooling
        </p>
        <p onClick={() => setInfoSection('behavior')} className={infoSection === 'behavior' ? 'active item' : 'item'}>
          Behavior
        </p>
      </div>

      {/* INFO TYPE */}
      <label>
        Info Type <span className="asterisk">*</span>
      </label>
      <CheckboxGroup defaultLabel={'text'} labels={['Text', 'Location']} onCheck={handleInfoTypeSelection} />

      {/* INPUTS */}
      {infoType === 'text' && (
        <div className="flex">
          <input className="mb-15" type="text" placeholder="Title/Label*" onChange={(e) => setTitle(e.target.value)} />
          <input className="mb-15" type="text" placeholder="Value*" onChange={(e) => setValue(e.target.value)} />
        </div>
      )}

      {infoType === 'location' && (
        <>
          <input className="mb-15" type="text" placeholder="Title/Label*" onChange={(e) => setTitle(e.target.value)} />
          <Autocomplete
            apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
            options={{
              types: ['geocode', 'establishment'],
              componentRestrictions: { country: 'usa' },
            }}
            className="mb-10"
            onPlaceSelected={async (place) => {
              setTitle('address')
              setValue(place.formatted_address)
            }}
            placeholder={Manager.isValid(activeChild.general.address) ? activeChild.general.address : 'Location'}
          />
        </>
      )}

      {/* BUTTONS */}
      <div className="buttons">
        {Manager.isValid(value) && Manager.isValid(title) && (
          <button className="button card-button" onClick={add}>
            Add<span className="ml-10 material-icons-outlined">auto_fix_high</span>
          </button>
        )}
        <button className="button card-button red" onClick={resetForm}>
          Cancel
        </button>
      </div>
    </div>
  )
}
