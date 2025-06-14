// Path: src\components\shared\shareWithCheckboxes.jsx
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context'
import useCurrentUser from '../../hooks/useCurrentUser'
import useUsers from '../../hooks/useUsers'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'
import SelectDropdown from './selectDropdown'

export default function ShareWithDropdown({defaultValues = [], onCheck}) {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state
  const {currentUser, currentUserIsLoading} = useCurrentUser()
  const {users} = useUsers()
  const [contactKeys, setContactKeys] = useState([])
  const [defaults, setDefaults] = useState([])
  const SetShareWithUsers = async () => {
    const sharedDataUsers = currentUser?.sharedDataUsers
    const sharedDataUsersAccounts = users?.filter((x) => sharedDataUsers?.includes(x.key))
    let keys = []

    if (Manager.IsValid(sharedDataUsersAccounts)) {
      for (let user of sharedDataUsersAccounts) {
        if (Manager.IsValid(user)) {
          keys.push({
            value: user?.key,
            label: StringManager.GetFirstNameAndLastInitial(user?.name),
          })
        }
      }
    }

    setContactKeys(keys)
  }

  useEffect(() => {
    if (Manager.IsValid(currentUser) && Manager.IsValid(users) && !currentUserIsLoading) {
      SetShareWithUsers().then((r) => r)
    }
  }, [currentUser, users, refreshKey, currentUserIsLoading])

  useEffect(() => {
    if (Manager.IsValid(defaultValues)) {
      const sharedDataUsers = currentUser?.sharedDataUsers
      const sharedDataUsersAccounts = users?.filter((x) => sharedDataUsers?.includes(x.key))

      let defaultShareWith = []
      for (let userKey of defaultValues) {
        let name = sharedDataUsersAccounts?.find((x) => x?.key === userKey)?.name
        defaultShareWith.push({
          value: userKey,
          label: StringManager.GetFirstNameAndLastInitial(name),
        })
      }
      setDefaults(defaultShareWith)
    }
  }, [defaultValues])

  return (
    <SelectDropdown
      labelText="Select Contacts to Share With"
      wrapperClasses="share-with-select-dropdown"
      isMultiple={true}
      onChange={onCheck}
      defaultValues={defaults}
      options={contactKeys}
    />
  )
}