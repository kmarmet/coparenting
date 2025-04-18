// Path: src\components\screens\childInfo\general.jsx
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../../context'
import Manager from '/src/managers/manager'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Accordion from '@mui/material/Accordion'
import InputWrapper from '/src/components/shared/inputWrapper'
import {PiIdentificationCardFill, PiTrashSimpleDuotone} from 'react-icons/pi'
import DB from '/src/database/DB'
import StringManager from '/src/managers/stringManager.coffee'
import {FaMinus, FaPlus} from 'react-icons/fa6'
import DB_UserScoped from '../../../database/db_userScoped'
import InputTypes from '../../../constants/inputTypes'
import Spacer from '../../shared/spacer'
import useCurrentUser from '../../hooks/useCurrentUser'

function General({activeChild}) {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const {currentUser} = useCurrentUser()
  const [generalValues, setGeneralValues] = useState(Object.entries(activeChild?.general))
  const [showInputs, setShowInputs] = useState(false)

  const DeleteProp = async (prop) => {
    const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser?.key}`)

    // Delete Shared
    const sharedProps = sharing?.map((x) => x?.prop)
    if (Manager.isValid(sharedProps) && sharedProps.includes(prop.toLowerCase())) {
      const scopedSharingObject = await DB.find(sharing, ['prop', prop.toLowerCase()], false)
      await DB_UserScoped.deleteSharedChildInfoProp(currentUser, sharing, prop.toLowerCase(), scopedSharingObject?.sharedByOwnerKey)
      await SetSelectedChild()
    } else {
      const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeChild, 'general', StringManager.formatDbProp(prop))
      setState({...state, activeChild: updatedChild})
      await SetSelectedChild()
    }
  }

  const SetSelectedChild = async () => {
    const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser?.key}`)
    let sharedValues = []
    if (Manager.isValid(sharing)) {
      for (let obj of sharing) {
        sharedValues.push([obj.prop, obj.value, obj.sharedByName])
      }
    }
    if (Manager.isValid(activeChild?.general)) {
      // Set info
      let values = Object.entries(activeChild?.general)

      if (Manager.isValid(sharedValues)) {
        values = [...values, ...sharedValues]
      }
      const valuesArr = values.filter((x) => x[1].length === 0).map((x) => x[1])
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
    await DB_UserScoped.updateUserChild(currentUser, activeChild, 'general', StringManager.formatDbProp(prop), value)
  }

  useEffect(() => {
    SetSelectedChild().then((r) => r)
  }, [activeChild])

  return (
    <div className="info-section section general form">
      <Accordion className={`${theme} child-info`} expanded={showInputs}>
        <AccordionSummary
          onClick={() => setShowInputs(!showInputs)}
          className={!Manager.isValid(activeChild?.general) ? 'disabled header general' : 'header general'}>
          <PiIdentificationCardFill className={'svg general'} />
          <p id="toggle-button" className={showInputs ? 'active' : ''}>
            General
            {!Manager.isValid(generalValues) ? '- no info' : ''}
            {Manager.isValid(generalValues) && <>{showInputs ? <FaMinus className="plus-minus" /> : <FaPlus className="plus-minus" />}</>}
          </p>
        </AccordionSummary>
        <AccordionDetails>
          {Manager.isValid(generalValues) &&
            generalValues.map((prop, index) => {
              let infoLabel = StringManager.spaceBetweenWords(prop[0])
              const value = prop[1]
              const toSkip = ['profilePic']

              return (
                <div key={index} className={`${infoLabel.toLowerCase().includes('phone') ? 'phone' : ''}`}>
                  {!toSkip.includes(prop[0]) && (
                    <>
                      {Manager.contains(infoLabel.toLowerCase(), 'address') && (
                        <>
                          <div className="flex input">
                            <InputWrapper
                              hasBottomSpacer={false}
                              inputType={InputTypes.address}
                              defaultValue={value}
                              labelText={`Home Address`}
                              onChange={(address) => Update('address', address)}
                            />
                            {infoLabel.toLowerCase() !== 'name' && (
                              <PiTrashSimpleDuotone className={'delete-icon'} onClick={() => DeleteProp(infoLabel)} />
                            )}
                          </div>
                          <Spacer height={5} />
                        </>
                      )}
                      {!Manager.contains(infoLabel.toLowerCase(), 'address') && (
                        <>
                          <div className="flex input">
                            <InputWrapper
                              hasBottomSpacer={false}
                              inputType={InputTypes.text}
                              labelText={`${infoLabel} ${Manager.isValid(prop[2]) ? `(shared by ${StringManager.getFirstNameOnly(prop[2])})` : ''}`}
                              defaultValue={value}
                              onChange={async (e) => {
                                const inputValue = e.target.value
                                await Update(infoLabel, inputValue)
                              }}
                            />
                            {infoLabel.toLowerCase() !== 'name' && (
                              <PiTrashSimpleDuotone className={'delete-icon'} onClick={() => DeleteProp(infoLabel)} />
                            )}
                          </div>
                          <Spacer height={5} />
                        </>
                      )}
                    </>
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