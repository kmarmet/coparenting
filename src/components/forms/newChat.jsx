import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context'
import useChats from '../../hooks/useChats'
import useCoParents from '../../hooks/useCoParents'
import useCurrentUser from '../../hooks/useCurrentUser'
import ChatManager from '../../managers/chatManager'
import DatasetManager from '../../managers/datasetManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'
import Form from '../shared/form'

const NewChatSelector = ({show, hide, onClick}) => {
  const {state, setState} = useContext(globalState)
  const {creationFormToShow} = state
  const [chattableUserKeys, setChattableUserKeys] = useState([])
  const {currentUser} = useCurrentUser()
  const {chats} = useChats()
  const {coParents} = useCoParents()

  const DefineInactiveChatKeys = async () => {
    const inactiveKeys = await ChatManager.GetInactiveChatKeys(currentUser, chats).then((r) => r)
    setChattableUserKeys(DatasetManager.GetValidArray(inactiveKeys, true))
  }

  const OpenChat = async (coParent) => {
    const _recipient = {
      name: coParent?.name,
      key: coParent?.userKey,
    }
    setTimeout(() => {
      setState({...state, showCreationMenu: false, creationFormToShow: null})
    }, 300)
    onClick(_recipient)
  }

  useEffect(() => {
    if (Manager.IsValid(currentUser)) {
      DefineInactiveChatKeys().then((r) => r)
    }
  }, [creationFormToShow, chats, currentUser])

  return (
    <Form
      hasSubmitButton={false}
      className="new-chat"
      wrapperClass="new-chat"
      subtitle="Who would you like to chat with?"
      onClose={hide}
      showCard={show}
      title={`Start Chatting!`}>
      {/* CO-PARENTS */}
      <div id="coParent-names" className={chattableUserKeys.length === 0 ? 'active' : ''}>
        {Manager.IsValid(chattableUserKeys) &&
          Manager.IsValid(coParents) &&
          coParents?.map((coParent, index) => {
            return (
              <>
                {chattableUserKeys.includes(coParent?.userKey) && (
                  <div
                    key={index}
                    className="coParent-name"
                    onClick={() => {
                      OpenChat(coParent).then((r) => r)
                    }}>
                    {StringManager.GetFirstNameOnly(coParent?.name)}
                  </div>
                )}
              </>
            )
          })}
      </div>
    </Form>
  )
}

export default NewChatSelector