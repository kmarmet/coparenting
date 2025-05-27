// Path: src\components\screens\chats\chatRow.jsx
import ScreenNames from '/src/constants/screenNames.coffee'
import globalState from '/src/context.js'
import AlertManager from '/src/managers/alertManager.coffee'
import ChatManager from '/src/managers/chatManager.js'
import Manager from '/src/managers/manager.js'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {FaPlay, IoMdPause} from 'react-icons/fa'
import {IoMdPause} from 'react-icons/io'
import {MdCallMade, MdCallReceived} from 'react-icons/md'
import DatetimeFormats from '../../../constants/datetimeFormats'
import useCurrentUser from '../../../hooks/useCurrentUser'
import DomManager from '../../../managers/domManager'

export default function ChatRow({chat, index}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey} = state
  const [otherMember, setOtherMember] = useState(null)
  const [lastMessage, setLastMessage] = useState('')
  const {currentUser} = useCurrentUser()

  const OpenChat = async () => {
    if (!Manager.IsValid(otherMember)) {
      AlertManager.oneButtonAlert(
        'Co-Parent Profile not Found',
        'This co-parent may have deactivated their profile, but you can still view the messages',
        null,
        () => {
          setState({...state, currentScreen: ScreenNames.chat, messageRecipient: otherMember})
        }
      )
    } else {
      setState({...state, currentScreen: ScreenNames.chat, messageRecipient: otherMember})
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
    setLastMessage(chatMessages[chatMessages.length - 1])
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
        if (DomManager.CheckIfElementIsTag(e, 'path') || DomManager.CheckIfElementIsTag(e, 'svg')) return false
        if (e.currentTarget.classList.contains('chat-row')) {
          OpenChat().then((r) => r)
        }
        if (e.target !== e.currentTarget) return false
      }}
      data-thread-id={chat?.id}
      style={DomManager.AnimateDelayStyle(index)}
      className={`chat-row chats-animation-row ${DomManager.Animate.FadeInUp(chat?.id)}`}>
      {/* COPARENT NAME */}
      <div className="primary-text">
        <p className="coparent-name">{otherMember?.name}</p>
        <p className="timestamp">{moment(lastMessage?.timestamp, DatetimeFormats.timestamp).format('ddd (hh:mma)')} {lastMessage?.sender?.key === currentUser?.key ? <MdCallMade /> : <MdCallReceived />}</p>
      </div>
      <p className="last-message">
        {lastMessage?.message}

      </p>
      <div className="play-pause-wrapper">
        {/* PLAY CHAT BUTTON */}
        {chat?.isPausedFor?.includes(currentUser?.key) && (
          <div id="play-wrapper">
            <FaPlay className={'play icon'} onClick={UnpauseChat} />
          </div>
        )}
        {/* PAUSE CHAT BUTTON */}
        {!chat?.isPausedFor?.includes(currentUser?.key) && (
          <div id="pause-wrapper">
            <IoMdPause
              onClick={(e) => {
                e.stopPropagation()
                AlertManager.confirmAlert(
                  `When you pause the chat, it will remain accessible for your reference. However, <b>you will not receive notifications related to this particular chat until you decide to unpause it</b>. \n\n You can resume the chat at any time. \n\n Are you sure? `,
                  "I'm Sure",
                  true,
                  async () => {
                    await PauseChat()
                  }
                )
              }}
              className={`pause icon`}
            />
          </div>
        )}
      </div>
    </div>
  )
}