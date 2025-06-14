// Path: src\components\screens\chats\chatRow.jsx
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {FaPause, FaPlay} from 'react-icons/fa6'
import {useSwipeable} from 'react-swipeable'
import useChats from '../../..//hooks/useChats'
import DatetimeFormats from '../../../constants/datetimeFormats'
import ScreenNames from '../../../constants/screenNames.coffee'
import globalState from '../../../context.js'
import useChatMessages from '../../../hooks/useChatMessages'
import useCurrentUser from '../../../hooks/useCurrentUser'
import AlertManager from '../../../managers/alertManager'
import ChatManager from '../../../managers/chatManager.js'
import DomManager from '../../../managers/domManager'
import Manager from '../../../managers/manager.js'
import StringManager from '../../../managers/stringManager'

export default function ChatRow({index, onClick, chat}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey} = state
  const [otherMember, setOtherMember] = useState(null)
  const [lastMessage, setLastMessage] = useState('')
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState('')
  const {currentUser} = useCurrentUser()
  const {chats} = useChats()
  const {chatMessages} = useChatMessages(chat?.id)
  const [activeSwipeRow, setActiveSwipeRow] = useState()
  const handlers = useSwipeable({
    swipeDuration: 300,
    preventScrollOnSwipe: true,
    onSwipedLeft: (e) => {
      const row = e.event.currentTarget
      setActiveSwipeRow(row)
      row.classList.add('active')
    },
    onSwipedRight: (e) => {
      const row = e.event.currentTarget
      setActiveSwipeRow(row)
      row.classList.remove('active')
    },
  })

  const OpenChat = () => onClick(otherMember)

  const PauseChat = async () => {
    if (Manager.IsValid(otherMember)) {
      const playPauseWrapper = activeSwipeRow?.querySelector('.play-pause-wrapper')
      const twoColumnChatRow = document.querySelectorAll('.two-column-chat-row')
      await ChatManager.PauseChat(currentUser, otherMember?.key, chat).finally(() => {
        for (let column of twoColumnChatRow) {
          column.classList.remove('active')
        }
        playPauseWrapper.classList.add('pause')
        playPauseWrapper.classList.remove('resume')
        setState({...state, currentScreen: ScreenNames.chats, successAlertMessage: 'Chat Paused'})
      })
    }
  }

  const UnpauseChat = async () => {
    if (Manager.IsValid(otherMember)) {
      const playPauseWrapper = activeSwipeRow?.querySelector('.play-pause-wrapper')
      const twoColumnChatRow = document.querySelectorAll('.two-column-chat-row')
      await ChatManager.ResumeChat(currentUser, otherMember?.key, chat).finally(() => {
        for (let column of twoColumnChatRow) {
          column.classList.remove('active')
        }
        playPauseWrapper.classList.add('resume')
        playPauseWrapper.classList.remove('pause')
        setState({...state, currentScreen: ScreenNames.chats, successAlertMessage: 'Chat Resumed'})
      })
    }
  }

  const GetLastMessage = async () => {
    const lastMessage = chatMessages[chatMessages.length - 1]?.message
    setLastMessage(lastMessage)
    const timestamp = chatMessages[chatMessages.length - 1]?.timestamp
    const today = moment().format('MM/DD/yyyy')
    const lastMessageTimestampShort = moment(timestamp, DatetimeFormats.timestamp).format('MM/DD/yyyy')
    const yesterday = moment().subtract(1, 'day').format('MM/DD/yyyy')

    if (today !== lastMessageTimestampShort) {
      if (yesterday === lastMessageTimestampShort) {
        setLastMessageTimestamp(`Yesterday`)
      }
      // More than 1 day ago
      else {
        setLastMessageTimestamp(moment(timestamp, DatetimeFormats.timestamp).format('ddd (Do)'))
      }
    } else {
      setLastMessageTimestamp(moment(timestamp, DatetimeFormats.timestamp).format('h:mma'))
    }

    setLastMessage(lastMessage)
  }

  useEffect(() => {
    if (Manager.IsValid(chats)) {
      GetLastMessage().then((r) => r)
    }
  }, [chats, otherMember, chatMessages])

  useEffect(() => {
    setTimeout(() => {
      DomManager.ToggleAnimation('add', 'two-column-chat-row', DomManager.AnimateClasses.names.fadeInUp, 90)
      DomManager.ToggleAnimation('add', 'two-column-chat-row', DomManager.AnimateClasses.names.fadeInUp, 90)
    }, 300)
  }, [])

  useEffect(() => {
    if (Manager.IsValid(chat)) {
      const otherMember = chat?.members?.find((x) => x.key !== currentUser?.key)
      setOtherMember(otherMember)
    }
  }, [chat])

  return (
    <div className={'two-column-chat-row'} {...handlers}>
      <div
        onClick={(e) => {
          e.stopPropagation()
          if (DomManager.CheckIfElementIsTag(e, 'path') || DomManager.CheckIfElementIsTag(e, 'svg')) return false
          if (e.currentTarget.classList.contains('chat-row')) {
            OpenChat()
          }
          if (e.target !== e.currentTarget) return false
        }}
        data-thread-id={chat?.id}
        style={DomManager.AnimateDelayStyle(index)}
        className={`chat-row chats-animation-row ${DomManager.Animate.FadeInUp(Manager.IsValid(chat?.id))}`}>
        {/* CO-PARENT NAME */}
        <div className="row-text">
          <div className={'row-text-content'}>
            <div className={'name-and-timestamp'}>
              <p className="coParent-name">{StringManager.uppercaseFirstLetterOfAllWords(otherMember?.name)}</p>
              <p className="timestamp">{lastMessageTimestamp} </p>
            </div>
            <p className="last-message">{lastMessage}</p>
          </div>
        </div>
      </div>
      <div className="play-pause-wrapper resume">
        {/* PLAY CHAT BUTTON */}
        {chat?.isPausedFor?.includes(currentUser?.key) && (
          <div id="play-wrapper">
            <FaPlay className={'play icon'} onClick={UnpauseChat} />
          </div>
        )}
        {/* PAUSE CHAT BUTTON */}
        {!chat?.isPausedFor?.includes(currentUser?.key) && (
          <div id="pause-wrapper">
            <FaPause
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