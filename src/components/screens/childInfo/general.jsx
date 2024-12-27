import React, { useContext, useEffect, useState } from 'react'
// import { Accordion } from 'rsuite'
import globalState from '../../../context'
import Manager from '@manager'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import { IoCloseOutline } from 'react-icons/io5'
import {
  camelCaseToString,
  contains,
  formatDbProp,
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
import Accordion from '@mui/material/Accordion'
import Autocomplete from 'react-google-autocomplete'
import { FaChevronDown } from 'react-icons/fa6'
import InputWrapper from '../../shared/inputWrapper'
import AlertManager from '../../../managers/alertManager'
import { MdContactEmergency } from 'react-icons/md'

function General({ activeChild, setActiveChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [generalValues, setGeneralValues] = useState([])

  const deleteProp = async (prop) => {
    const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeChild, 'general', formatDbProp(prop))
    setActiveChild(updatedChild)
    setSelectedChild()
  }

  const setSelectedChild = () => {
    if (Manager.isValid(activeChild.general)) {
      // Set info
      let values = Object.entries(activeChild.general)
      setGeneralValues(values.filter((x) => x[0] !== 'profilePic'))
    }
  }

  const update = async (section, prop, value, isArray) => {
    AlertManager.successAlert('Updated!')
    const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeChild, 'general', formatDbProp(prop), value)
    setActiveChild(updatedChild)
  }

  const formatInfoLabel = (infoLabel) => lowercaseShouldBeLowercase(spaceBetweenWords(uppercaseFirstLetterOfAllWords(infoLabel)))

  useEffect(() => {
    setSelectedChild()
  }, [activeChild])

  return (
    <div className="info-section section general form">
      <Accordion className={theme}>
        <AccordionSummary
          expandIcon={<FaChevronDown />}
          className={!Manager.isValid(activeChild.general) ? 'disabled header general' : 'header general'}>
          <MdContactEmergency className={'svg'} />
          General
        </AccordionSummary>
        <AccordionDetails>
          {Manager.isValid(generalValues, true) &&
            generalValues.map((prop, index) => {
              const infoLabel = formatInfoLabel(prop[0])
              const value = prop[1]
              return (
                <div key={index}>
                  <div className="flex input">
                    {contains(infoLabel.toLowerCase(), 'address') && (
                      <InputWrapper inputType={'location'} defaultValue={value} labelText={infoLabel}>
                        <Autocomplete
                          apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
                          options={{
                            types: ['geocode', 'establishment'],
                            componentRestrictions: { country: 'usa' },
                          }}
                          onPlaceSelected={async (place) => {
                            await update('general', 'address', place.formatted_address, false)
                          }}
                          placeholder={Manager.isValid(activeChild?.general?.address) ? activeChild?.general?.address : 'Location'}
                        />
                      </InputWrapper>
                    )}
                    {!contains(infoLabel.toLowerCase(), 'address') && (
                      <InputWrapper
                        inputType={'input'}
                        labelText={infoLabel}
                        defaultValue={value}
                        onChange={async (e) => {
                          const inputValue = e.target.value
                          await update('general', infoLabel, inputValue)
                        }}
                      />
                    )}
                    {infoLabel.toLowerCase() !== 'name' && <IoCloseOutline className={'delete-icon'} onClick={() => deleteProp(infoLabel)} />}
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