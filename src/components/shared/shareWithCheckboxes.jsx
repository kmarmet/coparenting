// Path: src\components\shared\shareWithCheckboxes.jsx
import Manager from '../../managers/manager'
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context'
import Label from './label'
import StringManager from '../../managers/stringManager.coffee'
import Checkbox from './checkbox.jsx'
import useCurrentUser from '../../hooks/useCurrentUser'
import useUsers from '../../hooks/useUsers'
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
  const {theme} = state
  const [shareWith, setShareWith] = useState([])
  const {currentUser} = useCurrentUser()
  const {users} = useUsers()

  const SetShareWithUsers = async () => {
    const sharedDataUsers = currentUser?.sharedDataUsers
    const sharedDataUsersAccounts = users?.filter((x) => sharedDataUsers?.includes(x.key))
    setShareWith(Manager.convertToArray(sharedDataUsersAccounts).flat())
  }

  useEffect(() => {
    if (Manager.isValid(currentUser) && Manager.isValid(users)) {
      SetShareWithUsers().then((r) => r)
    }
  }, [currentUser, users])

  return (
    <>
      {Manager.isValid(shareWith) && (
        <div id="share-with-checkbox-group" className={`${theme} ${checkboxGroupClass}`}>
          <Label text={`${labelText.length === 0 ? 'Share with' : labelText}`} required={required} />
          <Spacer height={2} />
          <div className="flex" id="checkboxes">
            {Manager.isValid(shareWith) &&
              shareWith?.map((user, index) => {
                let name = user?.name
                let key = user?.key

                if (!Manager.isValid(key)) {
                  key = user?.userKey
                }

                if (!Manager.isValid(name)) {
                  name = user?.general?.name
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