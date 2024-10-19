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

function Schooling({ activeChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [expandAccordion, setExpandAccordion] = useState(false)
  const [schoolingValues, setSchoolingValues] = useState([])

  const deleteProp = async (prop) => await DB.deleteChildInfoProp(DB.tables.users, currentUser, theme, prop, 'schooling', activeChild)

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
      await set(child(dbRef, `users/${currentUser.phone}/children/${key}/${section}/${prop}`), value)
    }
  }

  const setSelectedChild = () => {
    if (Manager.isValid(activeChild.schooling, false, true)) {
      // Remove Custom Text from Property
      for (let val in activeChild.schooling) {
        if (contains(activeChild.schooling[val], '_custom')) {
          activeChild.schooling[val] = activeChild.schooling[val].replace('_custom', '')
        }
      }

      // Set info
      let values = Object.entries(activeChild.schooling)
      setSchoolingValues(values)
    }
  }

  useEffect(() => {
    setSelectedChild()
  }, [])

  return (
    <div className="info-section section schooling">
      <Accordion>
        <p
          className="header schooling"
          onClick={(e) => {
            const parent = document.querySelector('.info-section.schooling')

            if (parent.classList.contains('active')) {
              parent.classList.remove('active')
            } else {
              parent.classList.add('active')
            }
            setExpandAccordion(!expandAccordion)
          }}>
          <span className="material-icons-round">school</span> Schooling <span className="material-icons-round"></span>
        </p>
        <Accordion.Panel expanded={expandAccordion}>
          {Manager.isValid(schoolingValues, true) &&
            schoolingValues.map((prop, index) => {
              const infoLabel = lowercaseShouldBeLowercase(spaceBetweenWords(uppercaseFirstLetterOfAllWords(prop[0])))
              const value = prop.flat()[1]
              return (
                <div key={index}>
                  <label className="w-100">{infoLabel}</label>
                  <div className="flex input">
                    <DebounceInput
                      className="mb-10"
                      value={value}
                      placeholder={camelCaseToString(infoLabel)}
                      minLength={2}
                      debounceTimeout={1000}
                      onChange={(e) => {
                        const inputValue = e.target.value
                        if (inputValue.length > 0) {
                          update('schooling', infoLabel, `${inputValue}_custom`).then((r) => r)
                        } else {
                          update('schooling', infoLabel, '_custom').then((r) => r)
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

export default Schooling
