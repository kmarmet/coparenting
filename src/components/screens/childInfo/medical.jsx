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
  displayAlert,
  uniqueArray,
  getFileExtension,
  successAlert,
  lowercaseShouldBeLowercase,
} from '../../../globalFunctions'
import DB_UserScoped from '@userScoped'

function Medical({ activeChild, setActiveChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [expandAccordion, setExpandAccordion] = useState(false)
  const [medicalValues, setMedicalValues] = useState([])
  const [arrowDirection, setArrowDirection] = useState('down')

  const deleteProp = async (prop) => {
    const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeChild, 'medical', Manager.toCamelCase(prop))
    setArrowDirection('down')
    setActiveChild(updatedChild)
    setSelectedChild()
  }

  const update = async (section, prop, value) => {
    const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeChild, 'medical', Manager.toCamelCase(prop), value)
    setActiveChild(updatedChild)
    successAlert('Updated!')
  }

  const setSelectedChild = () => {
    if (Manager.isValid(activeChild.medical)) {
      // Set info
      let values = Object.entries(activeChild.medical)
      setMedicalValues(values)
    } else {
      setMedicalValues([])
    }
  }

  useEffect(() => {
    setSelectedChild()
  }, [activeChild])

  return (
    <div className="info-section section medical">
      <Accordion>
        <p
          className={!Manager.isValid(activeChild.medical) ? 'disabled header medical' : 'header medical'}
          onClick={(e) => {
            const parent = document.querySelector('.info-section.medical')
            setArrowDirection(arrowDirection === 'up' ? 'down' : 'up')

            if (parent.classList.contains('active')) {
              parent.classList.remove('active')
            } else {
              if (activeChild.medical !== undefined) {
                parent.classList.add('active')
              }
            }
            setExpandAccordion(!expandAccordion)
          }}>
          <span className="material-icons-round">medical_information</span> Medical {!Manager.isValid(activeChild.medical) ? '- No Info' : ''}
          <span className="material-icons-round fs-30">{arrowDirection === 'down' ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}</span>
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
