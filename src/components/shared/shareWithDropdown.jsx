// Path: src\components\shared\shareWithCheckboxes.jsx
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context'
import useCurrentUser from '../../hooks/useCurrentUser'
import useUsers from '../../hooks/useUsers'
import Manager from '../../managers/manager'
import SelectDropdownManager from '../../managers/selectDropdownManager'
import SelectDropdown from './selectDropdown'

export default function ShareWithDropdown({defaultValues = [], onSelection = (e) => {}}) {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state
  const {currentUser, currentUserIsLoading} = useCurrentUser()
  const {users} = useUsers()
  const [dropdownOptions, setDropdownOptions] = useState([])
  const [defaults, setDefaults] = useState([])

  const SetShareWithUsers = async () => {
    const sharedDataUsers = currentUser?.sharedDataUsers
    const sharedDataUsersAccounts = users?.filter((x) => sharedDataUsers?.includes(x.key))
    let options = []
    options = SelectDropdownManager.GetDefault.ShareWith(sharedDataUsersAccounts)
    setDropdownOptions(options)
  }

  useEffect(() => {
    if (Manager.IsValid(currentUser)) {
      SetShareWithUsers().then((r) => r)
    }
  }, [currentUser, users])

  useEffect(() => {
    if (Manager.IsValid(defaultValues)) {
      const sharedDataUsers = currentUser?.sharedDataUsers
      const sharedDataUsersAccounts = users?.filter((x) => sharedDataUsers?.includes(x.key))
      const defaults = SelectDropdownManager.GetSelected.ShareWith(defaultValues, sharedDataUsersAccounts)
      setDefaults(defaults)
      console.log(defaults)
    }
  }, [defaultValues])

  return (
    <SelectDropdown
      placeholder="Select Contacts to Share With"
      wrapperClasses="share-with-select-dropdown"
      isMultiple={true}
      onSelection={(e) => {
        setDefaults(e)
        onSelection(e)
      }}
      value={defaults}
      options={dropdownOptions}
    />
  )
}