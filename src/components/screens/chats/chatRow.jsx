import { useContext, useState } from 'react'
import StringManager from '/src/managers/stringManager.coffee'
import AlertManager from '/src/managers/alertManager.coffee'
import Manager from '/src/managers/manager.js'
import { HiMiniBellAlert, HiPause } from 'react-icons/hi2'
import { PiChatCircleTextDuotone } from 'react-icons/pi'
import ChatManager from '/src/managers/chatManager.js'
import globalState from '/src/context.js'
import DB_UserScoped from '/src/database/db_userScoped.js'
import ScreenNames from '/src/constants/screenNames.coffee'
import { FaPlay } from 'react-icons/fa'

export default function ChatRow({ chat, coparent, index, hasIcon = true }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state

  const openChat = async (coparent) => {
    // Check if thread member (coparent) account exists in DB
    let userCoparent = await DB_UserScoped.getCoparentByPhone(coparent?.phone, currentUser)
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
    }
  }

  const unpauseChat = async (coparent) => {
    if (Manager.isValid(coparent)) {
      await ChatManager.unpauseChat(currentUser, coparent)
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
          {hasIcon && (
            <div id="user-initial-wrapper">
              <PiChatCircleTextDuotone />
            </div>
          )}
          <p data-coparent-phone={coparent?.phone} className="coparent-name">
            {StringManager.formatNameFirstNameOnly(coparent?.name)}
          </p>
          {/* PAUSE CHAT BUTTON */}
          {!chat?.isPausedFor?.includes(currentUser?.phone) && (
            <div id="pause-wrapper">
              <HiPause
                onClick={(e) => {
                  e.stopPropagation()
                  AlertManager.confirmAlert(
                    'Once paused, the chat will still be available for your reference. However, you will not receive notifications for this specific chat until you unpause it. Are you sure?',
                    "I'm Sure",
                    true,
                    async (e) => {
                      await pauseChat(coparent)
                    }
                  )
                }}
                className={`pause-icon`}
              />
            </div>
          )}
          {chat?.isPausedFor?.includes(currentUser?.phone) && (
            <div id="play-wrapper">
              <FaPlay className={'play-icon'} onClick={() => unpauseChat(coparent)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}