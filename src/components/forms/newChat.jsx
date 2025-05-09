import React, {useContext, useEffect, useState} from 'react'
import CreationForms from '../../constants/creationForms'
import ScreenNames from '../../constants/screenNames'
import globalState from '../../context'
import useChat from '../../hooks/useChat'
import useCoparents from '../../hooks/useCoparents'
import useCurrentUser from '../../hooks/useCurrentUser'
import AlertManager from '../../managers/alertManager'
import DatasetManager from '../../managers/datasetManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'
import Modal from '../shared/modal'
import Spacer from '../shared/spacer'

const NewChatSelector = () => {
  const {state, setState} = useContext(globalState)
  const {creationFormToShow} = state
  const [activeChatKeys, setActiveChatKeys] = useState([])
  const {currentUser} = useCurrentUser()
  const {chats} = useChat()
  const {coparents} = useCoparents()

  const GetSecuredChats = async () => {
    const members = DatasetManager.getUniqueArray(
      chats.map((x) => x.members),
      true
    )
    const memberKeys = DatasetManager.getUniqueArray(
      members.map((x) => x?.key),
      true
    )
    setActiveChatKeys(memberKeys)
  }

  const OpenMessageThread = async (coparent) => {
    // Check if thread member (coparent) profile exists in DB
    let userCoparent = coparents?.find((x) => x.userKey === coparent?.key)
    if (!Manager.IsValid(userCoparent)) {
      AlertManager.oneButtonAlert(
        'Co-Parent Profile not Found',
        'This co-parent may have deactivated their profile, however, you can still view the messages',
        null,
        () => {
          setState({...state, currentScreen: ScreenNames.chats, messageRecipient: coparent})
        }
      )
    } else {
      setState({...state, currentScreen: ScreenNames.chat, messageRecipient: userCoparent, showCreationMenu: false, creationFormToShow: null})
    }
  }

  useEffect(() => {
    if (Manager.IsValid(currentUser) && creationFormToShow === CreationForms.chat && Manager.IsValid(chats)) {
      GetSecuredChats().then((r) => r)
    }
  }, [creationFormToShow, chats])

  return (
    <Modal
      hasSubmitButton={false}
      className="new-chat"
      wrapperClass="new-chat"
      onClose={() => setState({...state, showCreationMenu: false, creationFormToShow: null, refreshKey: Manager.GetUid()})}
      showCard={creationFormToShow === CreationForms.chat}
      title={`${activeChatKeys.length === currentUser?.coparents?.length ? 'Unable to Create Chat' : 'Create Chat'}`}>
      <Spacer height={5} />
      {activeChatKeys.length === currentUser?.coparents?.length && (
        <>
          <p id="max-chats-text">You already have an existing chat with all children and/or co-parents</p>
          <Spacer height={5} />
        </>
      )}
      {/* COPARENTS */}
      {Manager.IsValid(activeChatKeys) &&
        Manager.IsValid(currentUser?.coparents) &&
        currentUser?.coparents?.map((coparent, index) => {
          return (
            <div key={index} id="coparent-names">
              {!activeChatKeys.includes(coparent?.userKey) && (
                <div
                  className="coparent-name"
                  onClick={() => {
                    OpenMessageThread(coparent).then((r) => r)
                  }}>
                  {StringManager.getFirstNameOnly(coparent?.name)}
                </div>
              )}
            </div>
          )
        })}
    </Modal>
  )
}

export default NewChatSelector