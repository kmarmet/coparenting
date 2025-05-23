// Path: src\components\screens\childInfo\general.jsx
import InputWrapper from '/src/components/shared/inputWrapper'
import DB from '/src/database/DB'
import Manager from '/src/managers/manager'
import StringManager from '/src/managers/stringManager.coffee'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import React, {useContext, useEffect, useState} from 'react'
import {CgClose} from 'react-icons/cg'
import {FaMinus, FaPlus} from 'react-icons/fa6'
import {PiIdentificationCardFill} from 'react-icons/pi'
import InputTypes from '../../../constants/inputTypes'
import globalState from '../../../context'
import DB_UserScoped from '../../../database/db_userScoped'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useSharedChildInfo from '../../../hooks/useSharedChildInfo'
import AddressInput from '../../shared/addressInput'

function General({activeChild}) {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state
  const {currentUser} = useCurrentUser()
  const {sharedChildInfo} = useSharedChildInfo()
  const [generalValues, setGeneralValues] = useState(Manager.IsValid(activeChild?.general) ? Object.entries(activeChild?.general) : [])
  const [showInputs, setShowInputs] = useState(false)

  const DeleteProp = async (prop) => {
    // Delete Shared
    const sharedProps = sharedChildInfo?.map((x) => x?.prop)
    if (Manager.IsValid(sharedProps) && sharedProps.includes(prop.toLowerCase())) {
      const scopedSharingObject = await DB.find(sharedChildInfo, ['prop', prop.toLowerCase()], false)
      await DB_UserScoped.deleteSharedChildInfoProp(currentUser, sharedChildInfo, prop.toLowerCase(), scopedSharingObject?.sharedByOwnerKey)
      await SetSelectedChildData()
    } else {
      const childIndex = DB.GetChildIndex(currentUser?.children, activeChild?.id)
      await DB_UserScoped.DeleteChildInfoProp(currentUser?.key, childIndex, 'general', StringManager.formatDbProp(prop))
      await SetSelectedChildData()
    }
  }

  const SetSelectedChildData = async () => {
    let sharedValues = []
    if (Manager.IsValid(sharedChildInfo)) {
      for (let obj of sharedChildInfo) {
        sharedValues.push([obj.prop, obj.value, obj.sharedByName])
      }
    }
    if (Manager.IsValid(activeChild?.general)) {
      let values = Object.entries(activeChild?.general)

      if (Manager.IsValid(sharedValues)) {
        values = [...values, ...sharedValues]
      }
      const valuesArr = values.filter((x) => x[1]?.length === 0)?.map((x) => x[1])
      if (valuesArr.length === values.length) {
        setGeneralValues([])
      } else {
        setGeneralValues(values)
      }
    } else {
      if (sharedValues.length > 0) {
        setGeneralValues(sharedValues)
      } else {
        setGeneralValues([])
      }
    }
  }

  const Update = async (prop, value) => {
    await DB_UserScoped.UpdateChildInfo(currentUser, activeChild, 'general', StringManager.formatDbProp(prop), value)
    // setState({...state, successAlertMessage: `${StringManager.FormatTitle(prop, true)} has been updated`})
  }

  useEffect(() => {
    SetSelectedChildData().then()
  }, [activeChild, sharedChildInfo])

  return (
    <div className="info-section section general form" key={refreshKey}>
      {Manager.IsValid(currentUser) && Manager.IsValid(currentUser?.key) && Manager.IsValid(activeChild) && (
        <Accordion className={`${theme} child-info`} expanded={showInputs}>
          <AccordionSummary
            onClick={() => setShowInputs(!showInputs)}
            className={!Manager.IsValid(activeChild?.general) ? 'disabled header general' : 'header general'}>
            <PiIdentificationCardFill className={'svg general'} />
            <p id="toggle-button" className={showInputs ? 'active' : ''}>
              General
              {!Manager.IsValid(generalValues) ? '- no info' : ''}
              {Manager.IsValid(generalValues) && <>{showInputs ? <FaMinus className="plus-minus" /> : <FaPlus className="plus-minus" />}</>}
            </p>
          </AccordionSummary>
          <AccordionDetails>
            {Manager.IsValid(generalValues) &&
              generalValues.map((prop, index) => {
                let infoLabel = StringManager.spaceBetweenWords(prop[0])
                const value = prop[1]
                const toSkip = ['profilePic']

                return (
                  <div key={index} className={`${infoLabel.toLowerCase().includes('phone') ? 'phone' : ''}`} id="data-row">
                    {!toSkip.includes(prop[0]) && (
                      <>
                        {Manager.Contains(infoLabel.toLowerCase(), 'address') && (
                          <AddressInput
                            labelText="Home Address"
                            onChange={(address) => Update(infoLabel, address)}
                            defaultValue={activeChild?.general?.address}
                          />
                        )}
                        {!Manager.Contains(infoLabel.toLowerCase(), 'address') && (
                          <>
                            <InputWrapper
                              hasBottomSpacer={false}
                              inputType={InputTypes.text}
                              placeholder={`${infoLabel} ${Manager.IsValid(prop[2]) ? `(shared by ${StringManager.GetFirstNameOnly(prop[2])})` : ''}`}
                              defaultValue={value}
                              onChange={async (e) => {
                                const inputValue = e.target.value
                                await Update(infoLabel, inputValue)
                              }}
                            />
                            {infoLabel.toLowerCase() !== 'name' && <CgClose className={'close-x children'} onClick={() => DeleteProp(infoLabel)} />}
                          </>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
          </AccordionDetails>
        </Accordion>
      )}
    </div>
  )
}

export default General