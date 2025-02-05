import Manager from '../../managers/manager'
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import { formatNameFirstNameOnly, stringHasNumbers } from '../../globalFunctions'
import { IoCloseOutline } from 'react-icons/io5'
import DB_UserScoped from '../../database/db_userScoped'
import ScreenNames from '../../constants/screenNames'
import Label from './label.jsx'
import Checkbox from './checkbox.jsx'

export default function CheckboxGroup({
  checkboxLabels,
  onCheck,
  elClass = '',
  dataPhone,
  dataDate,
  skipNameFormatting = false,
  defaultLabels,
  required = false,
  parentLabel = '',
}) {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser, currentScreen } = state
  const [showCheckboxes, setShowCheckboxes] = useState(false)

  const setCheckboxVisibility = async () => {
    const numberOfValidAccounts = await DB_UserScoped.getValidAccountsForUser(currentUser)
    if (numberOfValidAccounts > 0) {
      setShowCheckboxes(true)
    } else {
      if (currentScreen === ScreenNames.login || currentScreen === ScreenNames.registration) {
        setShowCheckboxes(true)
      }
    }
  }
  useEffect(() => {
    setCheckboxVisibility().then((r) => r)
    console.log(defaultLabels)
  }, [])

  return (
    <>
      {showCheckboxes > 0 && (
        <div id="checkbox-group" className={`${theme} ${elClass}`}>
          {parentLabel.length > 0 && (
            <div id="parent-label-wrapper">
              <Label text={parentLabel} required={required} />
            </div>
          )}
          <div id="checkboxes">
            {Manager.isValid(checkboxLabels) &&
              checkboxLabels.map((label, index) => {
                let thisPhone = checkboxLabels[index]
                let thisDate = null
                if (Manager.isValid(dataPhone)) {
                  if (Manager.isValid(dataPhone[index])) {
                    thisPhone = dataPhone[index]
                  }
                }
                if (Manager.isValid(dataDate)) {
                  thisDate = dataDate[index]
                  if (thisDate !== undefined) {
                    thisDate = dataDate[index]
                  }
                }
                if (Manager.isValid(label) && !stringHasNumbers(label) && !skipNameFormatting) {
                  label = formatNameFirstNameOnly(label.toString())
                }
                return (
                  <Checkbox
                    key={index}
                    text={label}
                    dataPhone={thisPhone ? thisPhone : ''}
                    dataLabel={label ? label : ''}
                    dataDate={thisDate ? thisDate : ''}
                    defaultLabels={defaultLabels}
                    onClick={(e) => {
                      onCheck(e)
                    }}>
                    <IoCloseOutline />
                  </Checkbox>
                )
              })}
          </div>
        </div>
      )}
    </>
  )
}