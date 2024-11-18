import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import Manager from '@manager'
import {
  camelCaseToString,
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  hasClass,
  isAllUppercase,
  lowercaseShouldBeLowercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  successAlert,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import { PiTrashSimpleDuotone } from 'react-icons/pi'

import DB_UserScoped from '@userScoped'
import Accordion from '@mui/material/Accordion'
import { FaChevronDown } from 'react-icons/fa6'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import InputWrapper from '../../shared/inputWrapper'

function Behavior({ activeChild, setActiveChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [expandAccordion, setExpandAccordion] = useState(false)
  const [behaviorValues, setBehaviorValues] = useState([])
  const [arrowDirection, setArrowDirection] = useState('down')

  const deleteProp = async (prop) => {
    const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeChild, 'behavior', Manager.toCamelCase(prop))
    setSelectedChild()
    setArrowDirection('down')
    setActiveChild(updatedChild)
  }
  const update = async (section, prop, value, isArray) => {
    const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeChild, 'behavior', Manager.toCamelCase(prop), value)
    setActiveChild(updatedChild)
    successAlert('Updated!')
  }
  const setSelectedChild = () => {
    if (Manager.isValid(activeChild.behavior)) {
      // Set info
      let values = Object.entries(activeChild.behavior)
      setBehaviorValues(values)
    }
  }

  useEffect(() => {
    setSelectedChild()
  }, [activeChild])

  return (
    <div className="info-section section behavior">
      <Accordion>
        <AccordionSummary
          expandIcon={<FaChevronDown />}
          className={!Manager.isValid(activeChild.behavior) ? 'disabled header behavior' : 'header behavior'}>
          <span className="material-icons-round">psychology</span> Behavior {!Manager.isValid(activeChild.behavior) ? '- No Info' : ''}
        </AccordionSummary>
        <AccordionDetails expanded={expandAccordion === true ? true : false}>
          {behaviorValues &&
            behaviorValues.map((prop, index) => {
              const infoLabel = lowercaseShouldBeLowercase(spaceBetweenWords(uppercaseFirstLetterOfAllWords(prop[0])))
              const value = prop[1]
              return (
                <div key={index}>
                  <div className="flex input">
                    <InputWrapper
                      inputType={'input'}
                      defaultValue={value}
                      labelText={infoLabel}
                      onChange={async (e) => {
                        const inputValue = e.target.value
                        await update('behavior', infoLabel, `${inputValue}`)
                      }}
                    />
                    <PiTrashSimpleDuotone className={'delete-icon'} onClick={() => deleteProp(infoLabel)} />
                  </div>
                </div>
              )
            })}
        </AccordionDetails>
      </Accordion>
    </div>
  )
}

export default Behavior