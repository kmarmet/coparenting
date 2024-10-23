import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import { DebounceInput } from 'react-debounce-input'
import Autocomplete from 'react-google-autocomplete'
import { Accordion } from 'rsuite'
import globalState from '../../../context'
import Manager from '@manager'
import DB from '@db'
import { child, getDatabase, onValue, ref, set, get } from 'firebase/database'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import { MobileTimePicker } from '@mui/x-date-pickers'
import ScreenNames from '@screenNames'
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
  camelCaseToString,
  contains,
  displayAlert,
  uniqueArray,
  getFileExtension,
  lowercaseShouldBeLowercase,
} from '../../../globalFunctions'
import DB_UserScoped from '@userScoped'

function General() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, activeInfoChild } = state
  const [expandAccordion, setExpandAccordion] = useState(false)
  const [generalValues, setGeneralValues] = useState([])
  const [arrowDirection, setArrowDirection] = useState('down')

  const deleteProp = async (prop) => {
    const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeInfoChild, 'general', prop)
    setState({ ...state, activeInfoChild: updatedChild })
    setSelectedChild()
    setArrowDirection('down')
  }

  const setSelectedChild = () => {
    if (Manager.isValid(activeInfoChild.general, false)) {
      // Set info
      let values = Object.entries(activeInfoChild.general)
      setGeneralValues(values.filter((x) => x[0] !== 'profilePic'))
    }
  }

  const update = async (section, prop, value, isArray) => {
    // Update DB
    displayAlert('success', '', 'Updated!')
    const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeInfoChild, 'general', prop, value)
    setState({ ...state, activeInfoChild: updatedChild })
  }

  useEffect(() => {
    setSelectedChild()
  }, [])

  useEffect(() => {
    setSelectedChild()
  }, [activeInfoChild])

  return (
    <div className="info-section section general form">
      <Accordion>
        {/* EXPAND ACCORDION */}
        <p
          className={activeInfoChild.general === undefined ? 'disabled header general' : 'header general'}
          onClick={(e) => {
            const parent = document.querySelector('.info-section.general')
            setArrowDirection(arrowDirection === 'up' ? 'down' : 'up')
            if (parent.classList.contains('active')) {
              parent.classList.remove('active')
            } else {
              parent.classList.add('active')
            }
            setExpandAccordion(!expandAccordion)
          }}>
          <span className="material-icons-round">perm_contact_calendar</span>
          General <span className="material-icons-round fs-30">{arrowDirection === 'down' ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}</span>
        </p>
        <Accordion.Panel expanded={expandAccordion}>
          {/* LOOP INFO */}
          {Manager.isValid(generalValues, true) &&
            generalValues.map((prop, index) => {
              const infoLabel = lowercaseShouldBeLowercase(spaceBetweenWords(uppercaseFirstLetterOfAllWords(prop[0])))
              const value = prop[1]
              // console.log(value)
              return (
                <div key={index}>
                  <label className="w-100">{infoLabel}</label>
                  <div className="flex input">
                    {contains(infoLabel.toLowerCase(), 'address') && (
                      <Autocomplete
                        apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
                        options={{
                          types: ['geocode', 'establishment'],
                          componentRestrictions: { country: 'usa' },
                        }}
                        className="mb-10"
                        onPlaceSelected={async (place) => {
                          await update('general', 'address', place.formatted_address, false)
                        }}
                        placeholder={Manager.isValid(activeInfoChild.general.address) ? activeInfoChild.general.address : 'Location'}
                      />
                    )}
                    {!contains(infoLabel.toLowerCase(), 'address') && (
                      <DebounceInput
                        className="mb-15"
                        value={value}
                        minLength={2}
                        debounceTimeout={1000}
                        onChange={async (e) => {
                          const inputValue = e.target.value
                          await update('general', infoLabel, `${inputValue}`)
                        }}
                      />
                    )}
                    {infoLabel.toLowerCase() !== 'name' && (
                      <span className="material-icons-outlined delete-icon" onClick={() => deleteProp(infoLabel)}>
                        delete
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
        </Accordion.Panel>
      </Accordion>
    </div>
  )
}

export default General
