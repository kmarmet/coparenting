import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context'
import useChats from '../../hooks/useChats'
import useCoParents from '../../hooks/useCoParents'
import useCurrentUser from '../../hooks/useCurrentUser'
import DatasetManager from '../../managers/datasetManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'
import Form from '../shared/form'
import ChatManager from '../../managers/chatManager'

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
    setTimeout(() => {
      setState({...state, showCreationMenu: false, creationFormToShow: null})
    }, 300)
    onClick(coParent)
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
      {Manager.IsValid(chattableUserKeys) &&
        Manager.IsValid(coParents) &&
        coParents?.map((coParent, index) => {
          return (
            <div key={index} id="coParent-names" className={chattableUserKeys.length === 0 ? 'active' : ''}>
              {chattableUserKeys.includes(coParent?.userKey) && (
                <div
                  className="coParent-name"
                  onClick={() => {
                    OpenChat(coParent).then((r) => r)
                  }}>
                  {StringManager.GetFirstNameOnly(coParent?.name)}
                </div>
              )}
            </div>
          )
        })}
    </Form>
  )
}

export default NewChatSelector