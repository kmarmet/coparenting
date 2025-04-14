// Path: src\components\screens\childInfo\behavior.jsx
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../../context'
import Manager from '/src/managers/manager'
import DB_UserScoped from '/src/database/db_userScoped'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import InputWrapper from '/src/components/shared/inputWrapper'
import AlertManager from '/src/managers/alertManager'
import DB from '/src/database/DB'
import StringManager from '../../../managers/stringManager'
import {FaBrain, FaMinus, FaPlus} from 'react-icons/fa6'
import {PiTrashSimpleDuotone} from 'react-icons/pi'
import InputTypes from '../../../constants/inputTypes'
import Spacer from '../../shared/spacer'

export default function Behavior({activeChild}) {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme} = state
  const [behaviorValues, setBehaviorValues] = useState([])
  const [showInputs, setShowInputs] = useState(false)

  const deleteProp = async (prop) => {
    const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser?.key}`)

    const existingPropCount = Object.keys(activeChild?.behavior).length

    if (existingPropCount <= 1) {
      const accordion = document.querySelector('.behavior.info-section')
      if (accordion) {
        accordion.querySelector('.MuiCollapse-root').remove()
      }
      setShowInputs(false)
    }

    // Delete Shared
    const sharedProps = sharing?.map((x) => x?.prop)
    if (Manager.isValid(sharedProps) && sharedProps.includes(prop.toLowerCase())) {
      const scopedSharingObject = await DB.find(sharing, ['prop', prop.toLowerCase()], false)
      await DB_UserScoped.deleteSharedChildInfoProp(currentUser, sharing, prop.toLowerCase(), scopedSharingObject?.sharedByOwnerKey)
      await setSelectedChild()
    } else {
      const updatedChild = await DB_UserScoped.deleteUserChildPropByPath(currentUser, activeChild, 'behavior', StringManager.formatDbProp(prop))
      await setSelectedChild()
      setState({...state, activeChild: updatedChild})
    }
  }

  const update = async (prop, value) => {
    const updatedChild = await DB_UserScoped.updateUserChild(currentUser, activeChild, 'behavior', StringManager.formatDbProp(prop), value)
    setState({...state, activeChild: updatedChild})
    AlertManager.successAlert('Updated!')
  }

  const setSelectedChild = async () => {
    const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser?.key}`)
    let sharedValues = []
    for (let obj of sharing) {
      sharedValues.push([obj.prop, obj.value, obj.sharedByName])
    }
    if (Manager.isValid(activeChild.behavior)) {
      // Set info
      let values = Object.entries(activeChild.behavior)

      if (Manager.isValid(sharedValues)) {
        values = [...values, ...sharedValues]
      }
      if (values[0][1].length === 0) {
        setBehaviorValues([])
      } else {
        setBehaviorValues(values)
      }
    } else {
      if (sharedValues.length > 0) {
        setBehaviorValues(sharedValues)
      } else {
        setBehaviorValues([])
      }
    }
  }

  useEffect(() => {
    setSelectedChild().then((r) => r)
  }, [activeChild])

  return (
    <div className="info-section section behavior">
      <Accordion className={`${theme} child-info`} disabled={!Manager.isValid(activeChild?.behavior)}>
        <AccordionSummary
          onClick={() => setShowInputs(!showInputs)}
          className={!Manager.isValid(activeChild.behavior) ? 'disabled header behavior' : 'header behavior'}>
          <FaBrain className={'svg behavior'} />
          <p id="toggle-button" className={showInputs ? 'active' : ''}>
            Behavior {!Manager.isValid(behaviorValues) ? '- no info' : ''}
            {Manager.isValid(behaviorValues) && <>{showInputs ? <FaMinus className="plus-minus" /> : <FaPlus className="plus-minus" />}</>}
          </p>
        </AccordionSummary>
        <AccordionDetails>
          {behaviorValues &&
            behaviorValues.map((prop, index) => {
              let infoLabel = StringManager.spaceBetweenWords(prop[0])
              infoLabel = StringManager.uppercaseFirstLetterOfAllWords(infoLabel).replaceAll('OF', ' of ')
              const value = prop[1]
              return (
                <div key={index}>
                  <div className="flex input">
                    {infoLabel.toLowerCase().includes('phone') && (
                      <>
                        <div className="flex input">
                          <a href={`tel:${StringManager.formatPhone(value).toString()}`}>
                            {infoLabel}: {value}
                          </a>
                        </div>
                        <Spacer height={5} />
                        <PiTrashSimpleDuotone className={'delete-icon'} onClick={() => deleteProp(infoLabel)} />
                      </>
                    )}
                    {!infoLabel.toLowerCase().includes('phone') && (
                      <>
                        <div className="flex input">
                          <InputWrapper
                            customDebounceDelay={1200}
                            isDebounced={true}
                            inputType={InputTypes.text}
                            defaultValue={value}
                            labelText={`${infoLabel} ${Manager.isValid(prop[2]) ? `(shared by ${StringManager.getFirstNameOnly(prop[2])})` : ''}`}
                            onChange={async (e) => {
                              const inputValue = e.target.value
                              await update(infoLabel, `${inputValue}`)
                            }}
                          />
                          <Spacer height={5} />
                        </div>
                        <PiTrashSimpleDuotone className={'delete-icon'} onClick={() => deleteProp(infoLabel)} />
                      </>
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