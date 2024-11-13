import React, { useContext, useEffect, useState } from 'react'
// import { Accordion } from 'rsuite'
import globalState from '../../../context'
import Manager from '@manager'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import { DebounceInput } from 'react-debounce-input'
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
import DB_UserScoped from '@userScoped'
import Accordion from '@mui/material/Accordion'
import Autocomplete from 'react-google-autocomplete'
import { FaChevronDown } from 'react-icons/fa6'

function General({ activeChild, setActiveChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [expandAccordion, setExpandAccordion] = useState(false)
  const [generalValues, setGeneralValues] = useState([])
  const [arrowDirection, setArrowDirection] = useState('down')

  const deleteProp = async (prop) => {
    const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeChild, 'general', Manager.toCamelCase(prop))
    setActiveChild(updatedChild)
    setSelectedChild()
    setArrowDirection('down')
  }

  const setSelectedChild = () => {
    if (Manager.isValid(activeChild.general)) {
      // Set info
      let values = Object.entries(activeChild.general)
      setGeneralValues(values.filter((x) => x[0] !== 'profilepic'))
    }
  }

  const update = async (section, prop, value, isArray) => {
    // Update DB
    successAlert('Updated!')
    const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeChild, 'general', Manager.toCamelCase(prop), value)
    setActiveChild(updatedChild)
  }

  const formatInfoLabel = (infoLabel) => lowercaseShouldBeLowercase(spaceBetweenWords(uppercaseFirstLetterOfAllWords(infoLabel)))

  useEffect(() => {
    setSelectedChild()
  }, [activeChild])

  return (
    <div className="info-section section general form">
      <Accordion>
        <AccordionSummary
          expandIcon={<FaChevronDown />}
          className={!Manager.isValid(activeChild.general) ? 'disabled header general' : 'header general'}>
          <span className="material-icons-round">perm_contact_calendar</span>
          General
        </AccordionSummary>
        <AccordionDetails>
          {Manager.isValid(generalValues, true) &&
            generalValues.map((prop, index) => {
              const infoLabel = formatInfoLabel(prop[0])
              const value = prop[1]
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
                        placeholder={Manager.isValid(activeChild?.general?.address) ? activeChild?.general?.address : 'Location'}
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
        </AccordionDetails>
      </Accordion>
    </div>
  )
}

export default General
