import Manager from '@manager'
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import { formatNameFirstNameOnly, stringHasNumbers } from '../../globalFunctions'
import { FaCheck } from 'react-icons/fa6'
import DB_UserScoped from '@userScoped'

export default function CheckboxGroup({
  checkboxLabels,
  onCheck,
  containerClass = '',
  elClass = '',
  dataPhone,
  dataDate,
  skipNameFormatting = false,
  defaultLabels,
  labelText = '',
  required = false,
  parentLabel = '',
}) {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser } = state
  const [validAccounts, setValidAccounts] = useState(0)

  const getValidAccounts = async () => {
    const accounts = await DB_UserScoped.getValidAccountsForUser(currentUser)
    setValidAccounts(accounts)
  }
  useEffect(() => {
    getValidAccounts().then((r) => r)
  }, [])

  return (
    <>
      {validAccounts > 0 && (
        <div id="checkbox-group" className={`${theme} ${elClass}`}>
          {parentLabel.length > 0 && (
            <div id="parent-label-wrapper">
              <label id="parent-label">{parentLabel}</label>
              {required && <span className="asterisk">*</span>}
            </div>
          )}
          <div id="checkboxes">
            {Manager.isValid(checkboxLabels, true) &&
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
                  <div
                    key={index}
                    id="checkbox-container"
                    data-phone={thisPhone ? thisPhone : ''}
                    data-label={label ? label : ''}
                    data-date={thisDate ? thisDate : ''}
                    className={`flex ${containerClass} ${Manager.isValid(defaultLabels, true) && defaultLabels.includes(label) ? 'active' : ''}`}
                    onClick={(e) => onCheck(e)}>
                    <span className="pill">
                      {label}
                      <FaCheck />
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </>
  )
}