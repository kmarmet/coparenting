// Path: src\components\shared\shareWithCheckboxes.jsx
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context'
import useCurrentUser from '../../hooks/useCurrentUser'
import useUsers from '../../hooks/useUsers'
import DropdownManager from '../../managers/dropdownManager'
import Manager from '../../managers/manager'
import SelectDropdown from './selectDropdown'

export default function ShareWithDropdown({selectedValues = [], onSelect = (e) => {}}) {
    const {state, setState} = useContext(globalState)
    const {theme, refreshKey} = state
    const {currentUser, currentUserIsLoading} = useCurrentUser()
    const {users} = useUsers()
    const [dropdownOptions, setDropdownOptions] = useState([])
    const [selected, setSelected] = useState([])

    const SetShareWithUsers = async () => {
        const sharedDataUsers = currentUser?.sharedDataUsers
        const sharedDataUsersAccounts = users?.filter((x) => sharedDataUsers?.includes(x.key))
        let options = []
        options = DropdownManager.GetDefault.ShareWith(sharedDataUsersAccounts)
        setDropdownOptions(options)
    }

    useEffect(() => {
        if (Manager.IsValid(currentUser)) {
            SetShareWithUsers().then((r) => r)
        }
    }, [currentUser, users])

    useEffect(() => {
        if (Manager.IsValid(selectedValues) && Manager.IsValid(users)) {
            const accountsFromKeys = users?.filter((x) => selectedValues?.includes(x.key))
            const _selected = DropdownManager.GetSelected.ShareWithFromKeys(selectedValues, accountsFromKeys)
            setSelected(_selected)
        }
    }, [selectedValues, users])

    return (
        <SelectDropdown
            placeholder="Select Contacts to Share With"
            wrapperClasses="share-with-select-dropdown"
            isMultiple={true}
            onSelect={(e) => {
                console.log(e)
                setSelected(e)
                onSelect(e)
            }}
            value={selected}
            options={dropdownOptions}
        />
    )
}