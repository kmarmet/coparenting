import React, { useContext, useEffect, useState } from 'react'
import { DebounceInput } from 'react-debounce-input'
import { Accordion } from 'rsuite'
import globalState from '../../../context'
import Manager from '@manager'
import DB from '@db'
import { child, getDatabase, onValue, ref, set, get } from 'firebase/database'
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

function Medical({ activeChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [expandAccordion, setExpandAccordion] = useState(false)
  const [medicalValues, setMedicalValues] = useState([])

  const deleteProp = async (prop) => {
    await DB.deleteChildInfoProp(DB.tables.users, currentUser, theme, prop, 'medical', activeChild)
    setSelectedChild()
  }

  const update = async (section, prop, value, isArray) => {
    const dbRef = ref(getDatabase())
    let key = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/children/`, activeChild, 'id')

    let field = activeChild[section][prop]

    if (field !== undefined) {
      if (isArray) {
        if (field && field !== undefined) {
          value = value.split(',')
        }
      }
    }

    // Update DB
    if (key !== null) {
      setState({ ...state, alertType: 'success', showAlert: true, alertMessage: 'Updated!' })
      await set(child(dbRef, `users/${currentUser.phone}/children/${key}/${section}/${prop}`), value)
    }
  }

  const setSelectedChild = () => {
    if (Manager.isValid(activeChild.medical, false, true)) {
      // Remove Custom Text from Property
      for (let val in activeChild.medical) {
        if (contains(activeChild.medical[val], '_custom')) {
          activeChild.medical[val] = activeChild.medical[val].replace('_custom', '')
        }
      }

      // Set info
      let values = Object.entries(activeChild.medical)
      setMedicalValues(values)
    }
  }

  useEffect(() => {
    setSelectedChild()
  }, [])

  return (
    <div className="info-section section medical">
      <Accordion>
        <p
          className="header medical"
          onClick={(e) => {
            const parent = document.querySelector('.info-section.medical')

            if (parent.classList.contains('active')) {
              parent.classList.remove('active')
            } else {
              parent.classList.add('active')
            }
            setExpandAccordion(!expandAccordion)
          }}>
          <span className="material-icons-round">medical_information</span> Medical
        </p>
        <Accordion.Panel expanded={expandAccordion === true ? true : false}>
          {Manager.isValid(medicalValues) &&
            medicalValues.map((prop, index) => {
              const infoLabel = lowercaseShouldBeLowercase(spaceBetweenWords(uppercaseFirstLetterOfAllWords(prop[0])))
              const value = prop[1].replace('_custom', '')
              return (
                <div key={index}>
                  <label className="w-100">{infoLabel}</label>
                  <div className="flex input mt-10">
                    <DebounceInput
                      className="mb-10"
                      value={value}
                      placeholder={camelCaseToString(infoLabel)}
                      minLength={2}
                      debounceTimeout={1000}
                      onChange={(e) => {
                        const inputValue = e.target.value
                        if (inputValue.length > 0) {
                          update('medical', infoLabel, `${inputValue}_custom`).then((r) => r)
                        } else {
                          update('medical', infoLabel, '_custom').then((r) => r)
                        }
                      }}
                    />
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

export default Medical
