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
  uniqueArray,
  getFileExtension,
  lowercaseShouldBeLowercase,
} from '../../../globalFunctions'

function General({ activeChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [expandAccordion, setExpandAccordion] = useState(false)
  const [generalValues, setGeneralValues] = useState([])

  const deleteProp = async (prop) => {
    const key = await DB.getNestedSnapshotKey(`/users/${currentUser.phone}/children`, activeChild, 'id')
    // console.log(prop)
    // console.log(key)
    await DB.deleteByPath(`/users/${currentUser.phone}/children/${key}/general/${prop}`)
    // await DB.deleteChildInfoProp(DB.tables.users, currentUser, theme, prop, 'general', activeChild)
  }

  const setSelectedChild = () => {
    if (Manager.isValid(activeChild.general, false, true)) {
      // Remove Custom Text from Property
      for (let val in activeChild.general) {
        if (contains(activeChild.general[val], '_custom')) {
          activeChild.general[val] = activeChild.general[val].replace('_custom', '')
        }
      }

      // Set info
      let values = Object.entries(activeChild.general)
      setGeneralValues(values.filter((x) => x[0] !== 'profilePic'))
    }
  }

  const update = async (section, prop, value, isArray) => {
    const dbRef = ref(getDatabase())
    let key = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/children/`, activeChild, 'id')

    let field = activeChild[section][prop]

    if (field !== undefined) {
      if (isArray) {
        if (field) {
          value = value.split(',')
        }
      }
    }

    // Update DB
    if (key !== null) {
      setState({ ...state, alertType: 'success', showAlert: true, alertMessage: 'Updated!' })
      await set(child(dbRef, `users/${currentUser.phone}/children/${key}/${section}/${removeSpacesAndLowerCase(prop)}`), value)
    }
  }

  useEffect(() => {
    setSelectedChild()
  }, [activeChild])

  useEffect(() => {
    Manager.toggleForModalOrNewForm()
    setSelectedChild()
  }, [])

  return (
    <div className="info-section section general form">
      <Accordion>
        {/* EXPAND ACCORDION */}
        <p
          className="header general asdf"
          onClick={(e) => {
            const parent = document.querySelector('.info-section.general')

            if (parent.classList.contains('active')) {
              parent.classList.remove('active')
            } else {
              parent.classList.add('active')
            }
            setExpandAccordion(!expandAccordion)
          }}>
          <span className="material-icons-round">perm_contact_calendar</span>
          General
        </p>
        <Accordion.Panel expanded={expandAccordion}>
          {/* LOOP INFO */}
          {Manager.isValid(generalValues, true) &&
            generalValues.map((prop, index) => {
              const infoLabel = lowercaseShouldBeLowercase(spaceBetweenWords(uppercaseFirstLetterOfAllWords(prop[0])))
              const value = prop[1]

              return (
                <div key={index}>
                  <label className="w-100">{infoLabel}</label>
                  <div className="flex input">
                    {contains(infoLabel, 'address') && (
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
                        placeholder={Manager.isValid(activeChild.general.address) ? activeChild.general.address : 'Location'}
                      />
                    )}
                    {!contains(infoLabel, 'address') && (
                      <DebounceInput
                        className="mb-15"
                        value={value}
                        placeholder={camelCaseToString(infoLabel)}
                        minLength={2}
                        debounceTimeout={1000}
                        onChange={async (e) => {
                          const inputValue = e.target.value
                          if (inputValue.length > 0) {
                            await update('general', infoLabel, `${inputValue}_custom`)
                          } else {
                            await update('general', infoLabel, '_custom')
                          }
                        }}
                      />
                    )}
                    <span className="material-icons-outlined delete-icon" onClick={() => deleteProp(infoLabel)}>
                      delete
                    </span>
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
