import Manager from '../../managers/manager'
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import Label from './label'
import DB from '../../database/DB'
import { FaCheck } from 'react-icons/fa6'
import StringManager from '../../managers/stringManager.coffee'

export default function ShareWithCheckboxes({
  defaultActiveShareWith = [],
  onCheck,
  containerClass = '',
  checkboxGroupClass = '',
  required = true,
  labelText = '',
  icon = '',
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

    if (Manager.isValid(currentUser?.parents)) {
      people = [...people, [...currentUser.parents]].filter((x) => x)
    }
    // CHILDREN
    if (Manager.isValid(currentUser?.children) > 0) {
      let childrenAccounts = []
      for (let child of currentUser?.children) {
        if (child?.phone) {
          const childAccount = await DB.find(DB.tables.users, ['phone', child?.phone], true)
          if (Manager.isValid(childAccount)) {
            childrenAccounts.push(child)
          }
        }
      }
      people = [...people, [...childrenAccounts]].filter((x) => x)
    }
    let peopleWithAccounts = []
    if (Manager.isValid(people)) {
      for (let person of people.flat()) {
        const account = await DB.find(DB.tables.users, ['phone', person?.phone], true)
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
                let phone = user.phone
                if (!Manager.isValid(phone)) {
                  phone = user?.general?.phone
                }
                if (!Manager.isValid(name)) {
                  name = user?.general?.name
                }

                return (
                  <div
                    key={index}
                    id="share-with-checkbox-container"
                    data-phone={phone ? phone : ''}
                    className={`flex ${containerClass} ${defaultActiveShareWith.includes(phone) ? 'active' : ''}`}
                    onClick={onCheck}>
                    <span className="pill">
                      {StringManager.formatNameFirstNameOnly(name)} <FaCheck />
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