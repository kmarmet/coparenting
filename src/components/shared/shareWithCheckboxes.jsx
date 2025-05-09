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
import Spacer from './spacer'

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
          <Label text={`${labelText.length === 0 ? 'Share with' : labelText}`} required={required} />
          <Spacer height={2} />
          <div className="flex" id="checkboxes">
            {Manager.IsValid(shareWith) &&
              shareWith?.map((user, index) => {
                let name = StringManager.getFirstNameOnly(user?.name)
                let key = user?.key

                if (!Manager.IsValid(key)) {
                  key = user?.userKey
                }

                if (!Manager.IsValid(name)) {
                  name = StringManager.getFirstNameOnly(user?.general?.name)
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