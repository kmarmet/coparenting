// Path: src\components\shared\shareWithCheckboxes.jsx
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context'
import useCurrentUser from '../../hooks/useCurrentUser'
import useUsers from '../../hooks/useUsers'
import DatasetManager from '../../managers/datasetManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager.coffee'
import Checkbox from './checkbox.jsx'
import Label from './label'

export default function ShareWithCheckboxes({
  defaultKeys = [],
  onCheck,
  containerClass = '',
  checkboxGroupClass = '',
  required = true,
  labelText = '',
}) {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state
  const [shareWith, setShareWith] = useState([])
  const {currentUser, currentUserIsLoading} = useCurrentUser()
  const {users} = useUsers()

  const SetShareWithUsers = async () => {
    const sharedDataUsers = currentUser?.sharedDataUsers
    const sharedDataUsersAccounts = users?.filter((x) => sharedDataUsers?.includes(x.key))
    // const shared = DatasetManager.GetValidArray(AccountsMapper.GetShareWithNames(currentUser, users, sharedDataUsers))
    // setShareWithNames(shared)
    setShareWith(DatasetManager.GetValidArray(sharedDataUsersAccounts))
  }

  useEffect(() => {
    if (Manager.IsValid(currentUser) && Manager.IsValid(users) && !currentUserIsLoading) {
      SetShareWithUsers().then((r) => r)
    }
  }, [currentUser, users, refreshKey, currentUserIsLoading])

  return (
    <>
      {Manager.IsValid(shareWith) && (
        <div id="share-with-checkbox-group" className={`${theme} ${checkboxGroupClass}`}>
          <Label classes="toggle always-show" text={`${labelText.length === 0 ? 'Contacts to share with' : labelText}`} required={required} />
          <div className="flex" id="checkboxes">
            {Manager.IsValid(shareWith) &&
              shareWith?.map((user, index) => {
                let name = StringManager.GetFirstNameOnly(user?.name)
                let key = user?.key

                if (!Manager.IsValid(key)) {
                  key = user?.userKey
                }

                if (!Manager.IsValid(name)) {
                  name = StringManager.GetFirstNameOnly(user?.general?.name)
                }

                return (
                  <div
                    key={index}
                    id="share-with-checkbox-container"
                    data-key={key ? key : ''}
                    className={`flex ${containerClass} ${defaultKeys.includes(key) ? 'active' : ''}`}
                    onClick={onCheck}>
                    <Checkbox isActive={defaultKeys.includes(key)} dataKey={key} text={name} onClick={() => console.log(name)} />
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </>
  )
}