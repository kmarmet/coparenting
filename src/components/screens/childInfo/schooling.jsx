import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import Manager from '@manager'
import {
  camelCaseToString,
  contains,
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
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import DB_UserScoped from '@userScoped'
import { FaChevronDown } from 'react-icons/fa6'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Accordion from '@mui/material/Accordion'
import InputWrapper from '../../shared/inputWrapper'
import AlertManager from '../../../managers/alertManager'
import { IoCloseOutline } from 'react-icons/io5'

function Schooling({ activeChild, setActiveChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [expandAccordion, setExpandAccordion] = useState(false)
  const [schoolingValues, setSchoolingValues] = useState([])
  const [arrowDirection, setArrowDirection] = useState('down')

  const deleteProp = async (prop) => {
    const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeChild, 'schooling', toCamelCase(prop))
    setSelectedChild()
    setArrowDirection('down')
    setActiveChild(updatedChild)
  }

  const update = async (section, prop, value) => {
    const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeChild, 'schooling', toCamelCase(prop), value)
    AlertManager.successAlert('Updated!')
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
        <AccordionSummary
          expandIcon={<FaChevronDown />}
          className={!Manager.isValid(activeChild.schooling) ? 'disabled header schooling' : 'header schooling'}>
          <span className="material-icons-round">school</span>
          Schooling
        </AccordionSummary>
        <AccordionDetails expanded={expandAccordion}>
          {Manager.isValid(schoolingValues, true) &&
            schoolingValues.map((prop, index) => {
              const infoLabel = lowercaseShouldBeLowercase(spaceBetweenWords(uppercaseFirstLetterOfAllWords(prop[0])))
              const value = prop.flat()[1]
              return (
                <div key={index} className="flex input">
                  <InputWrapper inputType={'input'} labelText={infoLabel} defaultValue={value} />
                  <IoCloseOutline className={'delete-icon'} onClick={() => deleteProp(infoLabel)} />
                </div>
              )
            })}
        </AccordionDetails>
      </Accordion>
    </div>
  )
}

export default Schooling