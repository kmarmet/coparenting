import React, { useContext, useEffect, useState } from 'react'
import { child, getDatabase, onValue, ref, set, push } from 'firebase/database'
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

  // Longpress/bookmark
  const bind = useLongPress(async (e, messageObject) => {
    const el = e.target.parentNode
    const messageId = messageObject.context.id
    const isSavedAlready = messageObject.context.saved
    toggleLongpressAnimation(el)
    if (isSavedAlready) {
      ChatManager.toggleMessageBookmark(currentUser, theme, messageToUser, messageId, false).finally(() => {
        setTimeout(() => {
          getExistingMessages()
        }, 500)
        setState({ ...state, alertType: 'success', showAlert: true, alertMessage: 'Bookmark Removed' })
      })
    } else {
      ChatManager.toggleMessageBookmark(currentUser, theme, messageToUser, messageId, true).finally(() => {
        setTimeout(() => {
          getExistingMessages()
        }, 500)
        setState({ ...state, alertType: 'success', showAlert: true, alertMessage: 'Message Bookmarked!' })
      })
    }
  })
  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      //console.log("User Swiped!", eventData);
      setState({ ...state, showMenuButton: true, currentScreen: ScreenNames.chats })
      Manager.toggleForModalOrNewForm('show')
    },
  })

  const submitMessage = async () => {
    // Clear input
    let messageInputValue = document.querySelector('#message-input').value

    if (messageInputValue.length === 0) {
      setState({ ...state, showAlert: true, alertMessage: 'Please enter a message', alertType: 'error' })
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
    conversationMessage.saved = false

    //Thread
    const { name, id, phone } = messageToUser
    const { name: crName, id: crId, phone: crPhone } = currentUser
    const memberTwo = { name: crName, id: crId, phone: crPhone }
    const memberOne = { name, id, phone }
    conversation.id = Manager.getUid()
    conversation.members = [memberOne, memberTwo]
    conversation.timestamp = moment().format('MM/DD/yyyy hh:mma')
    conversation.messages = [conversationMessage]

    const existingChatFromDB = existingChat

    // Existing chat
    if (Manager.isValid(existingChatFromDB)) {
      ChatManager.addMessage(chatKey, conversation.messages[0])
    }
    // Create new chat (if one doesn't exist between members)
    else {
      if (Manager.isValid(conversation.messages)) {
        conversation.firstMessageFrom = currentUser.phone
        let existingChats = await DB.getTable('chats')
        if (Array.isArray(existingChats) && existingChats.length > 0) {
          existingChats = existingChats.filter((x) => x)
          set(child(dbRef, `chats`), [...existingChats, conversation])
        } else {
          await DB.add(DB.tables.chats, conversation)
        }
      }
    }
    // console.log(existingChatFromDB)
    let updatedMessages = existingChatFromDB?.messages

    if (Manager.isValid(updatedMessages, true)) {
      if (!Array.isArray(updatedMessages)) {
        updatedMessages = DB.convertKeyObjectToArray(updatedMessages)
      }
      setMessagesToLoop([...updatedMessages, conversation.messages[0]])
    } else {
      setMessagesToLoop([])
    }
    document.getElementById('message-input').value = ''
    const subId = await NotificationManager.getUserSubId(messageToUser.phone)
    PushAlertApi.sendMessage('New Message', `You have an unread message in a conversation`, subId)
    await getExistingMessages()
    // AppManager.setAppBadge(1)
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
    const scopedChat = await ChatManager.getExistingMessages(currentUser, theme, messageToUser)
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

  useEffect(() => {
    const dbRef = ref(getDatabase())

    onValue(child(dbRef, DB.tables.chats), async (snapshot) => {
      await getExistingMessages()
      setState({ ...state, selectedNewEventDay: moment().format(DateFormats.dateForDb).toString() })
    })
    setTimeout(() => {
      setState({
        ...state,
        navbarButton: {
          ...navbarButton,
          action: () => {
            setShowSearchInput(true)
          },
          icon: 'search',
        },
      })
    }, 300)
    scrollToLatestMessage()
    Manager.toggleForModalOrNewForm('show')
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
      <p className="screen-title ml-auto mr-auto pt-15 center-text conversation">{messageToUser.name.formatNameFirstNameOnly()}</p>
      <div {...handlers} id="message-thread-container" className={`${theme} page-container conversation`}>
        {/* TOP BAR */}
        {!showSearchInput && (
          <div className="flex top-buttons">
            <button
              onClick={() => {
                setState({ ...state, currentScreen: ScreenNames.chats })
                Manager.toggleForModalOrNewForm('show')
              }}
              id="previous-screen-button">
              <span className="material-icons-round">arrow_back_ios</span> BACK
            </button>
            {bookmarks.length > 0 && (
              <span
                id="conversation-bookmark-icon"
                className={showBookmarks ? 'material-icons bookmark-icon' + ' active' : 'material-icons bookmark-icon'}
                onClick={(e) => viewBookmarks(e)}>
                bookmarks
              </span>
            )}
            <Tooltip
              transitionName="rc-tooltip-zoom"
              placement="left"
              trigger={['click', 'hover']}
              overlay={'Longpress on a message to bookmark it for viewing later'}>
              <span className="material-icons bookmark-icon" id="conversation-bookmark-icon">
                bookmark
              </span>
            </Tooltip>
          </div>
        )}

        {/* SEARCH INPUT */}
        {showSearchInput && (
          <div className="flex top-buttons">
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
            <span
              id="conversation-search-icon"
              className="material-icons search-icon ml-10"
              onClick={() => {
                setShowSearchInput(false)
                setSearchResults([])
                scrollToLatestMessage()
              }}>
              close
            </span>
          </div>
        )}

        {/* SEARCH RESULTS */}
        {bookmarks.length === 0 && (
          <div id="messages" className="search-results">
            {Manager.isValid(searchResults, true) &&
              searchResults.map((messageObj, index) => {
                let sender
                if (messageObj.sender.formatNameFirstNameOnly() === currentUser.name.formatNameFirstNameOnly()) {
                  sender = 'ME'
                } else {
                  sender = messageObj.sender.formatNameFirstNameOnly()
                }
                return (
                  <div
                    {...bind(messageObj, messageObj)}
                    className={messageObj.sender === currentUser.name ? 'message from' : 'to message'}
                    key={index}>
                    <p>{messageObj.message}</p>
                    <div className="flex under-message">
                      <span className="from-name">From {sender} on&nbsp;</span>
                      <span className="timestamp">{moment(messageObj.timestamp, 'MM/DD/yyyy hh:mma').format('ddd, MMM DD @ hh:mma')}</span>
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* BOOKMARKED MESSAGES */}
        {Manager.isValid(bookmarks, true) && showBookmarks && (
          <div id="bookmark-messages" className="bookmark-results">
            {bookmarks.map((messageObj, index) => {
              let sender
              if (messageObj.sender.formatNameFirstNameOnly() === currentUser.name.formatNameFirstNameOnly()) {
                sender = 'ME'
              } else {
                sender = messageObj.sender.formatNameFirstNameOnly()
              }
              return (
                messageObj.saved === true && (
                  <div
                    {...bind(messageObj, messageObj)}
                    className={messageObj.sender === currentUser.name ? 'message from' : 'to message'}
                    key={index}>
                    <p>{messageObj.message}</p>
                    <div className="flex under-message">
                      <span className="from-name">From {sender} on&nbsp;</span>
                      <span className="timestamp">{moment(messageObj.timestamp, 'MM/DD/yyyy hh:mma').format('ddd, MMM DD @ hh:mma')}</span>
                    </div>
                  </div>
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
                  return (
                    <div className={messageObj.sender === currentUser.name ? 'from message' : 'to message'} key={index}>
                      <p {...bind(messageObj, messageObj)}>{messageObj.message}</p>
                    </div>
                  )
                })}
              <div id="last-message-anchor"></div>
            </div>

            {/* MESSAGE INPUT */}
            <div className="form">
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
              <span
                className="material-icons-round "
                id="message-icon"
                onClick={() => {
                  submitMessage()
                }}>
                send
              </span>
              <div className="flex" id="message-input-container">
                <textarea placeholder="Enter message..." id="message-input" rows={1}></textarea>
                <span onClick={() => setShowEmojis(!showEmojis)} id="emoji-icon">
                  😀
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default Conversation
