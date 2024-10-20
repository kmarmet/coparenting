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

function Medical({ activeChild, refreshUpdateKey }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [expandAccordion, setExpandAccordion] = useState(false)
  const [medicalValues, setMedicalValues] = useState([])

  const deleteProp = async (prop) => {
    const key = await DB.getNestedSnapshotKey(`/users/${currentUser.phone}/children`, activeChild, 'id')
    await DB.deleteByPath(`/users/${currentUser.phone}/children/${key}/medical/${prop.toLowerCase()}`)
    refreshUpdateKey()
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
      refreshUpdateKey()
    }
  }

  const setSelectedChild = () => {
    if (Manager.isValid(activeChild.medical, false, true)) {
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
          className={activeChild.medical === undefined ? 'disabled header medical' : 'header medical'}
          onClick={(e) => {
            const parent = document.querySelector('.info-section.medical')

            if (parent.classList.contains('active')) {
              parent.classList.remove('active')
            } else {
              if (activeChild.medical !== undefined) {
                parent.classList.add('active')
              }
            }
            setExpandAccordion(!expandAccordion)
          }}>
          <span className="material-icons-round">medical_information</span> Medical
        </p>
        <Accordion.Panel expanded={expandAccordion === true ? true : false}>
          {Manager.isValid(medicalValues) &&
            medicalValues.map((prop, index) => {
              const infoLabel = lowercaseShouldBeLowercase(spaceBetweenWords(uppercaseFirstLetterOfAllWords(prop[0])))
              const value = prop[1]
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
                        update('medical', infoLabel, `${inputValue}`).then((r) => r)
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
