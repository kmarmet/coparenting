// Path: src\components\shared\shareWithCheckboxes.jsx
import Manager from '../../managers/manager'
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context'
import Label from './label'
import DB from '../../database/DB'
import StringManager from '../../managers/stringManager.coffee'
import Checkbox from './checkbox.jsx'

export default function ShareWithCheckboxes({
  defaultKeys = [],
  onCheck,
  containerClass = '',
  checkboxGroupClass = '',
  required = true,
  labelText = '',
}) {
  const {state, setState} = useContext(globalState)
  const {theme, currentUser, creationFormToShow} = state
  const [shareWith, setShareWith] = useState([])

  const setShareWithUsers = async () => {
    let accounts = []
    const childAccounts = currentUser?.children?.filter((x) => x.linkedKey)
    const parentAccounts = currentUser?.parents?.filter((x) => x.linkedKey)

    if (Manager.isValid(currentUser)) {
      // COPARENTS
      if (Manager.isValid(currentUser?.coparents)) {
        accounts = [...accounts, ...currentUser.coparents].filter((x) => x)
      }

      // PARENTS
      if (Manager.isValid(currentUser?.parents)) {
        let parentsAccounts = []
        for (let parent of parentAccounts) {
          const parentAccount = await DB.find(DB.tables.users, ['key', parent?.linkedKey], true)
          if (Manager.isValid(parentAccount)) {
            parentsAccounts.push(parentAccount)
          }
        }
        accounts = [...accounts, ...parentsAccounts].filter((x) => x)
      }

      // CHILD ACCOUNTS
      if (Manager.isValid(childAccounts)) {
        let childrenAccounts = []
        for (let child of childAccounts) {
          const childAccount = await DB.find(DB.tables.users, ['key', child?.linkedKey], true)
          if (Manager.isValid(childAccount)) {
            childrenAccounts.push(childAccount)
          }
        }
        accounts = [...accounts, ...childrenAccounts]
      }

      setShareWith(Manager.convertToArray(accounts).flat())
    }
  }

  useEffect(() => {
    setShareWithUsers().then((r) => r)
  }, [creationFormToShow])

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