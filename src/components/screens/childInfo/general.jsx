import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import Manager from '/src/managers/manager'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import { IoCloseOutline } from 'react-icons/io5'
import DB_UserScoped from '/src/database/db_userScoped'
import Accordion from '@mui/material/Accordion'
import Autocomplete from 'react-google-autocomplete'
import { FaChevronDown } from 'react-icons/fa6'
import InputWrapper from '/src/components/shared/inputWrapper'
import AlertManager from '/src/managers/alertManager'
import { MdContactEmergency } from 'react-icons/md'
import DB from '/src/database/DB'
import StringManager from '../../../managers/stringManager.coffee'

function General({ activeChild, setActiveChild }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [generalValues, setGeneralValues] = useState([])

  const deleteProp = async (prop) => {
    const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser.phone}`)

    // Delete Shared
    const sharedProps = sharing?.map((x) => x?.prop)
    if (Manager.isValid(sharedProps) && sharedProps.includes(prop.toLowerCase())) {
      const scopedSharingObject = await DB.find(sharing, ['prop', prop.toLowerCase()], false)
      await DB_UserScoped.deleteSharedChildInfoProp(currentUser, sharing, prop.toLowerCase(), scopedSharingObject?.sharedByPhone)
      await setSelectedChild()
    } else {
      const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeChild, 'general', formatDbProp(prop))
      setActiveChild(updatedChild)
      await setSelectedChild()
    }
  }

  const setSelectedChild = async () => {
    const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser.phone}`)
    let sharedValues = []
    for (let obj of sharing) {
      sharedValues.push([obj.prop, obj.value, obj.sharedByName])
    }
    if (Manager.isValid(activeChild.general)) {
      // Set info
      let values = Object.entries(activeChild.general)

      if (Manager.isValid(sharedValues)) {
        values = [...values, ...sharedValues]
      }
      setGeneralValues(values)
    } else {
      if (sharedValues.length > 0) {
        setGeneralValues(sharedValues)
      } else {
        setGeneralValues([])
      }
    }
  }

  const update = async (section, prop, value, isArray) => {
    AlertManager.successAlert('Updated!')
    const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeChild, 'general', formatDbProp(prop), value)
    setActiveChild(updatedChild)
  }

  const formatInfoLabel = (infoLabel) => StringManager.lowercaseShouldBeLowercase(StringManager.uppercaseFirstLetterOfAllWords(infoLabel))

  useEffect(() => {
    setSelectedChild().then((r) => r)
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
          {Manager.isValid(generalValues) &&
            generalValues.map((prop, index) => {
              const infoLabel = formatInfoLabel(prop[0])
              const value = prop[1]
              return (
                <div key={index}>
                  {prop[0] !== 'profilePic' && (
                    <div className="flex input">
                      {Manager.contains(infoLabel.toLowerCase(), 'address') && (
                        <InputWrapper
                          inputType={'location'}
                          defaultValue={value}
                          labelText={`${infoLabel} ${Manager.isValid(prop[2]) ? `(shared by ${formatNameFirstNameOnly(prop[2])})` : ''}`}>
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
                      {!Manager.contains(infoLabel.toLowerCase(), 'address') && (
                        <InputWrapper
                          inputType={'input'}
                          labelText={`${infoLabel} ${Manager.isValid(prop[2]) ? `(shared by ${formatNameFirstNameOnly(prop[2])})` : ''}`}
                          defaultValue={value}
                          onChange={async (e) => {
                            const inputValue = e.target.value
                            await update('general', infoLabel, inputValue)
                          }}
                        />
                      )}
                      {infoLabel.toLowerCase() !== 'name' && <IoCloseOutline className={'delete-icon'} onClick={() => deleteProp(infoLabel)} />}
                    </div>
                  )}
                </div>
              )
            })}
        </AccordionDetails>
      </Accordion>
    </div>
  )
}

export default General