// Path: src\components\screens\chats\chatRow.jsx
import React, { useContext } from 'react'
import { FaPlay } from 'react-icons/fa'
import { HiPause } from 'react-icons/hi2'
import { PiChatCircleTextDuotone } from 'react-icons/pi'
import ScreenNames from '/src/constants/screenNames.coffee'
import globalState from '/src/context.js'
import DB_UserScoped from '../../../database/db_userScoped'
import AlertManager from '/src/managers/alertManager.coffee'
import ChatManager from '/src/managers/chatManager.js'
import Manager from '/src/managers/manager.js'
import StringManager from '/src/managers/stringManager.coffee'
import { FaCirclePause } from 'react-icons/fa6'
export default function ChatRow({ chat, coparent, index, hasIcon = true }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

  const openChat = async (coparent) => {
    // Check if thread member (coparent) account exists in DB
    let userCoparent = await DB_UserScoped.getCoparentByKey(coparent?.key, currentUser)
    if (!Manager.isValid(userCoparent)) {
      AlertManager.oneButtonAlert(
        'Co-Parent Account not Found',
        'This co-parent may have closed their account, however, you can still view the messages',
        null,
        () => {
          setState({ ...state, currentScreen: ScreenNames.chat, messageRecipient: coparent })
        }
      )
    } else {
      setState({ ...state, currentScreen: ScreenNames.chat, messageRecipient: userCoparent })
    }
  }

  const pauseChat = async (coparent) => {
    if (Manager.isValid(coparent)) {
      await ChatManager.pauseChat(currentUser, coparent)
      AlertManager.successAlert('Chats Paused')
      setState({ ...state, currentScreen: ScreenNames.chats })
    }
  }

  const unpauseChat = async (coparent) => {
    if (Manager.isValid(coparent)) {
      await ChatManager.unpauseChat(currentUser, coparent)
      setState({ ...state, currentScreen: ScreenNames.chats })
    }
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        if (e.target.tagName === 'path' || e.target.tagName === 'svg') return false
        if (e.currentTarget.classList.contains('row')) {
          openChat(coparent).then((r) => r)
        }
        if (e.target !== e.currentTarget) return
      }}
      data-thread-id={chat?.id}
      className="chats row"
      key={index}>
      {/* THREAD ITEM */}
      <div className={`flex thread-item wrap`}>
        {/* COPARENT NAME */}
        <div className="flex">
          {hasIcon && <PiChatCircleTextDuotone className={'chat-bubble'} />}
          <p data-coparent-phone={coparent?.phone} className="coparent-name">
            {StringManager.getFirstNameOnly(coparent?.name)}
          </p>
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
                      await pauseChat(coparent)
                    }
                  )
                }}
                className={`pause-icon`}
              />
            </div>
          )}
          {chat?.isPausedFor?.includes(currentUser?.key) && (
            <div id="play-wrapper">
              <FaPlay className={'play-icon'} onClick={() => unpauseChat(coparent)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}