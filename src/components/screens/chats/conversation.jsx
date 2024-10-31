import React, { useContext, useEffect, useState } from 'react'
import { child, getDatabase, onValue, ref, set } from 'firebase/database'
import moment from 'moment'
import 'rsuite/dist/rsuite.min.css'
import PushAlertApi from '@api/pushAlert.js'
import ScreenNames from '@screenNames'
import globalState from '../../../context.js'
import DB from '@db'
import ConversationMessage from '../../../models/conversationMessage'
import ConversationThread from '../../../models/conversationThread'
import Manager from '@manager'
import NotificationManager from '@managers/notificationManager.js'
import { useSwipeable } from 'react-swipeable'
import AppManager from '@managers/appManager.js'
import { DebounceInput } from 'react-debounce-input'
import { useLongPress } from 'use-long-press'
import Tooltip from 'rc-tooltip'
import 'rc-tooltip/assets/bootstrap_white.css'
import EmojiPicker from 'emoji-picker-react'
import ChatManager from '@managers/chatManager.js'
import DateFormats from '../../../constants/dateFormats'
import ModelNames from '../../../models/modelNames'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  successAlert,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import BottomCard from '../../shared/bottomCard'

const Conversation = () => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, messageToUser, previousScreen, navbarButton } = state
  const [existingChat, setExistingChat] = useState(null)
  const [messagesToLoop, setMessagesToLoop] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [bookmarks, setBookmarks] = useState([])
  const [showEmojis, setShowEmojis] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [chatKey, setChatKey] = useState(null)
  const [showSearchCard, setShowSearchCard] = useState(false)

  // Longpress/bookmark
  const bind = useLongPress(async (e, messageObject) => {
    const el = e.target.parentNode
    const messageId = messageObject.context.id
    const isSavedAlready = messageObject.context.bookmarked
    toggleLongpressAnimation(el)
    if (isSavedAlready) {
      ChatManager.toggleMessageBookmark(currentUser, messageToUser, messageId, false).finally(() => {
        setTimeout(() => {
          getExistingMessages()
        }, 500)
      })
    } else {
      ChatManager.toggleMessageBookmark(currentUser, messageToUser, messageId, true).finally(() => {
        setTimeout(() => {
          getExistingMessages()
        }, 500)
      })
    }
  })
  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      //console.log("User Swiped!", eventData);
      setState({ ...state, showMenuButton: true, currentScreen: ScreenNames.chats })
      Manager.showPageContainer('show')
    },
  })

  const submitMessage = async () => {
    // Clear input
    let messageInputValue = document.querySelector('#message-input').value

    if (messageInputValue.length === 0) {
      displayAlert('error', 'Please enter a message')
      return false
    }

    // Fill models
    const conversation = new ConversationThread()
    const conversationMessage = new ConversationMessage()
    const dbRef = ref(getDatabase())

    // Messages
    conversationMessage.id = Manager.getUid()
    conversationMessage.timestamp = moment().format('MM/DD/yyyy hh:mma')
    conversationMessage.sender = currentUser.name
    conversationMessage.recipient = messageToUser.name
    conversationMessage.message = messageInputValue
    conversationMessage.readState = 'delivered'
    conversationMessage.notificationSent = false
    conversationMessage.bookmarked = false

    console.log(messageToUser.name)
    const cleanMessages = Manager.cleanObject(conversationMessage, ModelNames.conversationMessage)

    //Thread
    const { name, id, phone } = messageToUser
    const { name: crName, id: crId, phone: crPhone } = currentUser
    const memberTwo = { name: crName, id: crId, phone: crPhone }
    const memberOne = { name, id, phone }
    conversation.id = Manager.getUid()
    conversation.members = [memberOne, memberTwo]
    conversation.timestamp = moment().format('MM/DD/yyyy hh:mma')
    conversation.messages = [cleanMessages]
    const cleanThread = Manager.cleanObject(conversation, ModelNames.conversationThread)

    const existingChatFromDB = existingChat

    // Existing chat
    if (Manager.isValid(existingChatFromDB)) {
      ChatManager.addMessage(chatKey, cleanThread.messages[0])
    }
    // Create new chat (if one doesn't exist between members)
    else {
      if (Manager.isValid(cleanThread.messages)) {
        cleanThread.firstMessageFrom = currentUser.phone
        let existingChats = await DB.getTable('chats')
        if (Array.isArray(existingChats) && existingChats.length > 0) {
          existingChats = existingChats.filter((x) => x)
          set(child(dbRef, `chats`), [...existingChats, cleanThread])
        } else {
          await DB.add(DB.tables.chats, cleanThread)
        }
      }
    }
    // console.log(existingChatFromDB)
    let updatedMessages = existingChatFromDB?.messages

    if (Manager.isValid(updatedMessages, true)) {
      if (!Array.isArray(updatedMessages)) {
        updatedMessages = Manager.convertToArray(updatedMessages)
      }
      setMessagesToLoop([...updatedMessages, cleanThread.messages[0]])
    } else {
      setMessagesToLoop([])
    }
    document.getElementById('message-input').value = ''
    const subId = await NotificationManager.getUserSubId(messageToUser.phone)
    PushAlertApi.sendMessage('New Message', `You have an unread message in a conversation`, subId)
    await getExistingMessages()
    AppManager.setAppBadge(1)
    scrollToLatestMessage()
  }

  const toggleLongpressAnimation = (e) => {
    e.classList.add('longpress')
    setTimeout(() => {
      e.classList.remove('longpress')
    }, 400)
  }

  const viewBookmarks = async (e) => {
    setShowBookmarks(!showBookmarks)
    scrollToLatestMessage()
  }

  const getExistingMessages = async () => {
    const scopedChat = await ChatManager.getExistingMessages(currentUser, messageToUser)
    const { key, messages, bookmarkedMessages, chats } = scopedChat
    setChatKey(key)
    if (messages.length > 0) {
      if (bookmarkedMessages.length === 0) {
        setShowBookmarks(false)
        const bookmarkIcon = document.querySelector('.bookmark-icon')
        if (bookmarkIcon) {
          bookmarkIcon.classList.remove('active')
        }
      }
      setBookmarks(bookmarkedMessages)
      setMessagesToLoop(messages.flat())
      setExistingChat(chats)
    } else {
      setMessagesToLoop([])
      setExistingChat(null)
    }
    scrollToLatestMessage()
  }

  const scrollToLatestMessage = () => {
    setTimeout(() => {
      const messageWrapper = document.getElementById('default-messages')
      if (messageWrapper) {
        messageWrapper.scrollTop = messageWrapper.scrollHeight
      }
    }, 100)
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, DB.tables.chats), async (snapshot) => {
      await getExistingMessages().then((r) => r)
    })
  }
  useEffect(() => {
    onTableChange().then((r) => r)
    setTimeout(() => {
      setState({ ...state, showNavbar: false })
    }, 500)
    scrollToLatestMessage()
    Manager.showPageContainer('show')
  }, [])

  useEffect(() => {
    const searchResultsContainer = document.querySelector('.search-results')
    if (Manager.isValid(searchResultsContainer)) {
      if (searchResults.length > 0) {
        document.querySelector('.search-results').classList.add('active')
      } else {
        setSearchResults([])
        document.querySelector('.search-results').classList.remove('active')
      }
    }
  }, [searchResults.length])

  return (
    <>
      <BottomCard
        title={'Search'}
        className="form"
        showCard={showSearchCard}
        onClose={() => {
          setShowSearchInput(false)
          setShowSearchCard(false)
          setSearchResults([])
          scrollToLatestMessage()
        }}>
        <DebounceInput
          placeholder="Find a message..."
          minLength={2}
          className="search-input"
          debounceTimeout={500}
          onChange={(e) => {
            if (e.target.value.length > 2) {
              const results = messagesToLoop.filter((x) => x.message.toLowerCase().indexOf(e.target.value.toLowerCase()) > -1)
              setBookmarks([])
              setSearchResults(results)
            } else {
              setSearchResults([])
              scrollToLatestMessage()
            }
          }}
        />
      </BottomCard>
      <div {...handlers} id="message-thread-container" className={`${theme}  conversation`}>
        {/* TOP BAR */}
        {!showSearchInput && (
          <div className="flex top-buttons">
            <div className="flex" id="user-info">
              <span id="user-icon" className="material-icons-round">
                account_circle
              </span>
              <p id="user-name">{formatNameFirstNameOnly(messageToUser.name)}</p>
            </div>
            <div id="right-side" className="flex gap-5">
              <span className="material-icons" id="search-icon" onClick={() => setShowSearchCard(true)}>
                search
              </span>
              {bookmarks.length > 0 && (
                <span
                  id="conversation-bookmark-icon"
                  className={showBookmarks ? 'material-icons  top-bar-icon' + ' active' : 'material-icons  top-bar-icon'}
                  onClick={(e) => viewBookmarks(e)}>
                  bookmarks
                </span>
              )}
              <Tooltip
                transitionName="rc-tooltip-zoom"
                placement="left"
                trigger={['click', 'hover']}
                overlay={'Longpress on a message to bookmark it for viewing later'}>
                <span className="material-icons top-bar-icon" id="conversation-bookmark-icon">
                  bookmark
                </span>
              </Tooltip>
              <span
                onClick={() => {
                  setState({ ...state, currentScreen: ScreenNames.chats })
                  Manager.showPageContainer('show')
                }}
                className="material-icons"
                id="close-icon">
                close
              </span>
            </div>
          </div>
        )}

        {/* SEARCH RESULTS */}
        {bookmarks.length === 0 && searchResults.length > 0 && (
          <div id="messages" className="search-results">
            {Manager.isValid(searchResults, true) &&
              searchResults.map((messageObj, index) => {
                let sender
                if (formatNameFirstNameOnly(messageObj.sender) === currentUser.name.formatNameFirstNameOnly()) {
                  sender = 'ME'
                } else {
                  sender = formatNameFirstNameOnly(messageObj.sender)
                }
                return (
                  <>
                    <p
                      key={index}
                      {...bind(messageObj, messageObj)}
                      className={messageObj.sender === currentUser.name ? 'message from' : 'to message'}>
                      {messageObj.message}
                    </p>
                    <span className={messageObj.sender === currentUser.name ? 'timestamp from' : 'to timestamp'}>
                      From {sender} on&nbsp;{moment(messageObj.timestamp, 'MM/DD/yyyy hh:mma').format('ddd, MMM DD @ hh:mma')}
                    </span>
                  </>
                )
              })}
          </div>
        )}

        {/* BOOKMARKED MESSAGES */}
        {Manager.isValid(bookmarks, true) && showBookmarks && (
          <div id="bookmark-messages" className="bookmark-results">
            {bookmarks.map((messageObj, index) => {
              let sender
              if (formatNameFirstNameOnly(messageObj.sender) === formatNameFirstNameOnly(currentUser.name)) {
                sender = 'ME'
              } else {
                sender = formatNameFirstNameOnly(messageObj.sender)
              }
              return (
                messageObj.bookmarked === true && (
                  <>
                    <p
                      key={index}
                      {...bind(messageObj, messageObj)}
                      className={messageObj.sender === currentUser.name ? 'message from' : 'to message'}>
                      {messageObj.message}
                    </p>
                    <span className={messageObj.sender === currentUser.name ? 'timestamp from' : 'to timestamp'}>
                      From {sender} on&nbsp; {moment(messageObj.timestamp, 'MM/DD/yyyy hh:mma').format('ddd, MMM DD @ hh:mma')}
                    </span>
                  </>
                )
              )
            })}
          </div>
        )}

        {/* DEFAULT MESSAGES */}
        {!showBookmarks && searchResults.length === 0 && (
          <>
            <div id="default-messages">
              {Manager.isValid(messagesToLoop, true) &&
                messagesToLoop.map((messageObj, index) => {
                  let timestamp = moment(messageObj.timestamp, DateFormats.fullDatetime).format('ddd, MMMM Do @ hh:mm a')
                  // Message Sent Today
                  if (moment(messageObj.timestamp, DateFormats.fullDatetime).isSame(moment(), 'day')) {
                    timestamp = moment(messageObj.timestamp, DateFormats.fullDatetime).format('hh:mm a')
                  }
                  return (
                    <div key={index}>
                      <p className={messageObj.sender === currentUser.name ? 'from message' : 'to message'} {...bind(messageObj, messageObj)}>
                        {messageObj.message}
                      </p>
                      <span className={messageObj.sender === currentUser.name ? 'from timestamp' : 'to timestamp'}>{timestamp}</span>
                    </div>
                  )
                })}
              <div id="last-message-anchor"></div>
            </div>

            {/* MESSAGE INPUT */}
            <div className="form message-input-form">
              <EmojiPicker
                lazyLoadEmojis={true}
                open={showEmojis}
                emojiStyle="apple"
                theme={theme || 'dark'}
                onEmojiClick={(e) => {
                  setShowEmojis(!showEmojis)
                  document.querySelector('#message-input').value += e.emoji
                }}
              />

              {/* SEND BUTTON */}
              <div className="flex" id="message-input-container">
                <textarea placeholder="Enter message..." id="message-input" rows={1}></textarea>
                <button
                  onClick={async () => {
                    await submitMessage()
                  }}
                  id="send-button">
                  Send
                </button>
              </div>

              {/* UNDER MESSAGE ICONS */}
              <div id="under-message-input">
                <div className="flex" id="icons">
                  <span className="emoji" onClick={() => (document.getElementById('message-input').value += ' 🗓 ️')}>
                    🗓️
                  </span>
                  <span className="emoji" onClick={() => (document.getElementById('message-input').value += ' 💭 ')}>
                    💭
                  </span>
                  <span className="emoji" onClick={() => (document.getElementById('message-input').value += ' 🙂 ')}>
                    🙂
                  </span>
                  <span className="emoji" onClick={() => (document.getElementById('message-input').value += ' 👌 ')}>
                    👌
                  </span>
                  <span className="emoji" onClick={() => (document.getElementById('message-input').value += ' 👍 ')}>
                    👍
                  </span>
                  <span onClick={() => setShowEmojis(!showEmojis)} id="emoji-icon">
                    😀
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default Conversation
