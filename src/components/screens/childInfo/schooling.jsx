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
  lowercaseShouldBeLowercase,
  successAlert,
} from '../../../globalFunctions'
import DateFormats from '../../../constants/dateFormats'
import DB_UserScoped from '@userScoped'

function Schooling({ activeChild, setActiveChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [expandAccordion, setExpandAccordion] = useState(false)
  const [schoolingValues, setSchoolingValues] = useState([])
  const [arrowDirection, setArrowDirection] = useState('down')

  const deleteProp = async (prop) => {
    const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeChild, 'schooling', Manager.toCamelCase(prop))
    setSelectedChild()
    setArrowDirection('down')
    setActiveChild(updatedChild)
  }

  const update = async (section, prop, value) => {
    const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeChild, 'schooling', Manager.toCamelCase(prop), value)
    successAlert('Updated!')
    setActiveChild(updatedChild)
  }

  const setSelectedChild = () => {
    if (Manager.isValid(activeChild.schooling)) {
      // Set info
      let values = Object.entries(activeChild.schooling)
      setSchoolingValues(values)
    } else {
      setSchoolingValues([])
    }
  }

  useEffect(() => {
    setSelectedChild()
  }, [activeChild])

  return (
    <div className="info-section section schooling">
      <Accordion>
        <p
          className={!Manager.isValid(activeChild.schooling) ? 'disabled header schooling' : 'header schooling'}
          onClick={(e) => {
            const parent = document.querySelector('.info-section.schooling')
            setArrowDirection(arrowDirection === 'up' ? 'down' : 'up')
            if (parent.classList.contains('active')) {
              parent.classList.remove('active')
            } else {
              if (activeChild.schooling !== undefined) {
                parent.classList.add('active')
              }
            }
            setExpandAccordion(!expandAccordion)
          }}>
          <span className="material-icons-round">school</span> Schooling {!Manager.isValid(activeChild.schooling) ? '- No Info' : ''}
          <span className="material-icons-round fs-30">{arrowDirection === 'down' ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}</span>
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
                        update('schooling', infoLabel, `${inputValue}`).then((r) => r)
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
