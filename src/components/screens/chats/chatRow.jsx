// Path: src\components\screens\chats\chatRow.jsx
import ScreenNames from '/src/constants/screenNames.coffee'
import globalState from '/src/context.js'
import AlertManager from '/src/managers/alertManager.coffee'
import ChatManager from '/src/managers/chatManager.js'
import Manager from '/src/managers/manager.js'
import StringManager from '/src/managers/stringManager.coffee'
import React, {useContext, useEffect, useState} from 'react'
import {FaPlay} from 'react-icons/fa'
import {FaCirclePause} from 'react-icons/fa6'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useUsers from '../../../hooks/useUsers'
import DomManager from '../../../managers/domManager'

export default function ChatRow({chat, index}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey} = state
  const [otherMember, setOtherMember] = useState(null)
  const [lastMessage, setLastMessage] = useState('')
  const {currentUser} = useCurrentUser()
  const {users} = useUsers()

  const OpenChat = async () => {
    // Check if thread member (coparent) profile exists in DB
    let userCoparent = users?.find((user) => user?.key === otherMember?.key)
    if (!Manager.IsValid(userCoparent)) {
      AlertManager.oneButtonAlert(
        'Co-Parent Profile not Found',
        'This co-parent may have deactivated their profile, but you can still view the messages',
        null,
        () => {
          setState({...state, currentScreen: ScreenNames.chat, messageRecipient: otherMember})
        }
      )
    } else {
      setState({...state, currentScreen: ScreenNames.chat, messageRecipient: userCoparent})
    }
  }

  const PauseChat = async () => {
    if (Manager.IsValid(otherMember)) {
      await ChatManager.pauseChat(currentUser, otherMember?.key)
      setState({...state, currentScreen: ScreenNames.chats, successAlertMessage: 'Chat Paused'})
    }
  }

  const UnpauseChat = async () => {
    if (Manager.IsValid(otherMember)) {
      await ChatManager.unpauseChat(currentUser, otherMember?.key)
      setState({...state, currentScreen: ScreenNames.chats, successAlertMessage: 'Chat Resumed'})
    }
  }

  const SetDefaultOtherMember = async () => {
    const coparent = chat?.members?.find((member) => member?.key !== currentUser?.key)
    setOtherMember(coparent)
  }

  const GetLastMessage = async () => {
    const chatMessages = await ChatManager.getMessages(chat?.id)
    const otherMemberMessages = chatMessages.filter((x) => x?.senderKey === otherMember?.key)
    let lastMessage = ''
    if (Manager.IsValid(chatMessages)) {
      if (Manager.IsValid(otherMemberMessages)) {
        lastMessage = otherMemberMessages[otherMemberMessages.length - 1]['message']
      }
    }
    setLastMessage(lastMessage)
  }

  useEffect(() => {
    SetDefaultOtherMember().then((r) => r)
    GetLastMessage().then((r) => r)
  }, [otherMember, chat])

  useEffect(() => {
    setTimeout(() => {
      // DomManager.ToggleAnimation('add', 'thread-item', DomManager.AnimateClasses.names.fadeInRight, 90)
      // DomManager.ToggleAnimation('add', 'row', DomManager.AnimateClasses.names.fadeInRight, 90)
    }, 300)
  }, [])

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        if (e.target.tagName === 'path' || e.target.tagName === 'svg') return false
        if (e.currentTarget.classList.contains('row')) {
          OpenChat().then((r) => r)
        }
        if (e.target !== e.currentTarget) return false
      }}
      data-thread-id={chat?.id}
      style={DomManager.AnimateDelayStyle(index)}
      className={`chats row chats-animation-row ${DomManager.Animate.FadeInRight(['.'], '.chats-animation-row')}`}>
      {/* THREAD ITEM */}
      <div className={`flex thread-item wrap`}>
        {/* COPARENT NAME */}
        <div className="flex">
          <div className="column left">
            <p className="coparent-name">{StringManager.getFirstNameOnly(otherMember?.name)}</p>
            <p className="last-message">{lastMessage}</p>
          </div>
          <div className="column right">
            {/* PAUSE CHAT BUTTON */}
            {!chat?.isPausedFor?.includes(currentUser?.key) && (
              <div id="pause-wrapper">
                <FaCirclePause
                  onClick={(e) => {
                    e.stopPropagation()
                    AlertManager.confirmAlert(
                      'When you pause the chat, it will remain accessible for your reference. However, you will not receive notifications related to this particular chat until you decide to unpause it. \n\n You can resume the chat at any time. \n\n Are you sure? ',
                      "I'm Sure",
                      true,
                      async () => {
                        await PauseChat()
                      }
                    )
                  }}
                  className={`pause-icon`}
                />
              </div>
            )}
            {/* PLAY CHAT BUTTON */}
            {chat?.isPausedFor?.includes(currentUser?.key) && (
              <div id="play-wrapper">
                <FaPlay className={'play-icon'} onClick={() => UnpauseChat()} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}