// Path: src\components\screens\chats\chatRow.jsx
import React, {useContext, useEffect, useState} from 'react'
import {FaPlay} from 'react-icons/fa'
import ScreenNames from '/src/constants/screenNames.coffee'
import globalState from '/src/context.js'
import DB_UserScoped from '../../../database/db_userScoped'
import AlertManager from '/src/managers/alertManager.coffee'
import ChatManager from '/src/managers/chatManager.js'
import Manager from '/src/managers/manager.js'
import StringManager from '/src/managers/stringManager.coffee'
import {FaCirclePause} from 'react-icons/fa6'

export default function ChatRow({chat, index}) {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme} = state
  const [otherMember, setOtherMember] = useState(null)

  const openChat = async () => {
    // Check if thread member (coparent) profile exists in DB
    let userCoparent = await DB_UserScoped.getCoparentByKey(otherMember?.key, currentUser)
    if (!Manager.isValid(userCoparent)) {
      AlertManager.oneButtonAlert(
        'Co-Parent Profile not Found',
        'This co-parent may have closed their profile, however, you can still view the messages',
        null,
        () => {
          setState({...state, currentScreen: ScreenNames.chat, messageRecipient: otherMember})
        }
      )
    } else {
      setState({...state, currentScreen: ScreenNames.chat, messageRecipient: userCoparent})
    }
  }

  const pauseChat = async () => {
    if (Manager.isValid(otherMember)) {
      await ChatManager.pauseChat(currentUser, otherMember?.key)
      setState({...state, currentScreen: ScreenNames.chats, successAlertMessage: 'Chat Paused'})
    }
  }

  const unpauseChat = async () => {
    if (Manager.isValid(otherMember)) {
      await ChatManager.unpauseChat(currentUser, otherMember?.key)
      setState({...state, currentScreen: ScreenNames.chats, successAlertMessage: 'Chat Resumed'})
    }
  }

  const setDefaultOtherMember = async () => {
    const coparent = await DB_UserScoped.getCoparentByKey(chat?.member?.key, currentUser)
    setOtherMember(coparent)
  }

  useEffect(() => {
    setDefaultOtherMember().then((r) => r)
  }, [])

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        if (e.target.tagName === 'path' || e.target.tagName === 'svg') return false
        if (e.currentTarget.classList.contains('row')) {
          openChat().then((r) => r)
        }
        if (e.target !== e.currentTarget) return false
      }}
      data-thread-id={chat?.id}
      className="chats row"
      key={index}>
      {/* THREAD ITEM */}
      <div className={`flex thread-item wrap`}>
        {/* COPARENT NAME */}
        <div className="flex">
          <div className="column left">
            <p data-coparent-phone={chat?.member?.phone} className="coparent-name">
              {StringManager.getFirstNameOnly(chat?.member?.name)}
            </p>
            <p className="last-message">{chat?.lastMessage}</p>
          </div>
          <div className="column right">
            {/* PAUSE CHAT BUTTON */}
            {!chat?.isPausedFor?.includes(currentUser?.key) && (
              <div id="pause-wrapper">
                <FaCirclePause
                  onClick={(e) => {
                    e.stopPropagation()
                    AlertManager.confirmAlert(
                      'When you pause the chat, it will remain accessible for your reference. However, you will not receive notifications related to this particular chat until you decide to unpause it. Are you sure?',
                      "I'm Sure",
                      true,
                      async () => {
                        await pauseChat()
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
                <FaPlay className={'play-icon'} onClick={() => unpauseChat()} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}