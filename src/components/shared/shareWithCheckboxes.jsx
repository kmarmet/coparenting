// Path: src\components\shared\shareWithCheckboxes.jsx
import Manager from '../../managers/manager'
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import Label from './label'
import DB from '../../database/DB'
import StringManager from '../../managers/stringManager.coffee'
import Checkbox from './checkbox.jsx'
import { PiShareNetworkFill } from 'react-icons/pi'
export default function ShareWithCheckboxes({
  defaultKeys = [],
  onCheck,
  containerClass = '',
  checkboxGroupClass = '',
  required = true,
  labelText = '',
}) {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser } = state
  const [shareWith, setShareWith] = useState([])

  const setShareWithUsers = async () => {
    let people = []

    // COPARENTS
    if (Manager.isValid(currentUser?.coparents)) {
      people = [...people, [...currentUser.coparents]].filter((x) => x)
    }

    // PARENTS
    if (Manager.isValid(currentUser?.parents)) {
      people = [...people, [...currentUser.parents]].filter((x) => x)
    }

    // CHILDREN
    if (Manager.isValid(currentUser?.childAccounts)) {
      let childrenAccounts = []
      for (let child of currentUser.childAccounts) {
        childrenAccounts.push(child)
      }
      people = [...people, [...childrenAccounts]].filter((x) => x)
    }

    let peopleWithAccounts = []
    if (Manager.isValid(people)) {
      for (let person of people.flat()) {
        const account = await DB.find(DB.tables.users, ['key', person?.key], true)
        if (account) {
          peopleWithAccounts.push(account)
        }
      }
      setShareWith(Manager.convertToArray(peopleWithAccounts).flat())
    }
  }

  useEffect(() => {
    if (Manager.isValid(currentUser)) {
      setShareWithUsers().then((r) => r)
    }
  }, [])

  return (
    <>
      {Manager.isValid(shareWith) && (
        <div id="share-with-checkbox-group" className={`${theme} ${checkboxGroupClass}`}>
          <Label text={`${labelText.length === 0 ? 'Share with' : labelText}`} required={required} />
          <div className="flex" id="checkboxes">
            {Manager.isValid(shareWith) &&
              shareWith?.map((user, index) => {
                let name = user?.name
                let key = user?.key

                return (
                  <div
                    key={index}
                    id="share-with-checkbox-container"
                    data-key={key ? key : ''}
                    className={`flex ${containerClass} ${defaultKeys.includes(key) ? 'active' : ''}`}
                    onClick={onCheck}>
                    <Checkbox
                      isActive={defaultKeys.includes(key)}
                      dataKey={key}
                      text={StringManager.getFirstNameOnly(name)}
                      onClick={() => console.log(name)}
                    />
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </>
  )
}