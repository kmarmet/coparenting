// Path: src\components\shared\shareWithCheckboxes.jsx
import Manager from '../../managers/manager'
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context'
import Label from './label'
import StringManager from '../../managers/stringManager.coffee'
import Checkbox from './checkbox.jsx'
import DB_UserScoped from '../../database/db_userScoped'
import useCurrentUser from '../hooks/useCurrentUser'

export default function ShareWithCheckboxes({
  defaultKeys = [],
  onCheck,
  containerClass = '',
  checkboxGroupClass = '',
  required = true,
  labelText = '',
}) {
  const {state, setState} = useContext(globalState)
  const {theme, creationFormToShow, users} = state
  const [shareWith, setShareWith] = useState([])
  const {currentUser} = useCurrentUser()

  const setShareWithUsers = async () => {
    let accounts = await DB_UserScoped.getValidAccountsForUser(currentUser)
    // const childAccounts = currentUser?.children?.filter((x) => x.userKey)
    // const parentAccounts = currentUser?.parents?.filter((x) => x.userKey)
    // const coparentAccounts = currentUser?.coparents?.filter((x) => x.userKey)
    //
    // if (Manager.isValid(currentUser)) {
    //   // COPARENTS
    //   if (Manager.isValid(currentUser?.coparents)) {
    //     let coparentAccounts = []
    //     for (let coparent of parentAccounts) {
    //       const coparentAccount = await DB.find(DB.tables.users, ['key', coparent?.userKey], true)
    //       if (Manager.isValid(coparentAccount)) {
    //         coparentAccounts.push(coparentAccount)
    //       }
    //     }
    //     accounts = [...accounts, ...coparentAccounts].filter((x) => x)
    //   }
    //
    //   // PARENTS
    //   if (Manager.isValid(currentUser?.parents)) {
    //     let parentsAccounts = []
    //     for (let parent of parentAccounts) {
    //       const parentAccount = await DB.find(DB.tables.users, ['key', parent?.userKey], true)
    //       if (Manager.isValid(parentAccount)) {
    //         parentsAccounts.push(parentAccount)
    //       }
    //     }
    //     accounts = [...accounts, ...parentsAccounts].filter((x) => x)
    //   }
    //
    //   // CHILD ACCOUNTS
    //   if (Manager.isValid(childAccounts)) {
    //     let childrenAccounts = []
    //     for (let child of childAccounts) {
    //       const childAccount = await DB.find(DB.tables.users, ['key', child?.userKey], true)
    //       if (Manager.isValid(childAccount)) {
    //         childrenAccounts.push(childAccount)
    //       }
    //     }
    //     accounts = [...accounts, ...childrenAccounts]
    //   }

    setShareWith(Manager.convertToArray(accounts).flat())
    // }
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

                if (!Manager.isValid(key)) {
                  key = user?.userKey
                }

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