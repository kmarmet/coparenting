import React, { useContext, useEffect, useState } from 'react'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import moment from 'moment'
import 'rsuite/dist/rsuite.min.css'
import ScreenNames from '@screenNames'
import globalState from '../../../context.js'
import DB from '@db'
import ConversationMessage from '../../../models/conversationMessage'
import ConversationThread from '../../../models/conversationThread'
import Manager from '@manager'
import NotificationManager from '@managers/notificationManager.js'
import AppManager from '@managers/appManager.js'
import { DebounceInput } from 'react-debounce-input'
import 'rc-tooltip/assets/bootstrap_white.css'
import ChatManager from '@managers/chatManager.js'
import DateFormats from '../../../constants/dateFormats'
import { PiBookmarkSimpleDuotone, PiBookmarksSimpleDuotone } from 'react-icons/pi'
import ModelNames from '../../../models/modelNames'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  isAllUppercase,
  oneButtonAlert,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  successAlert,
  throwError,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import BottomCard from '../../shared/bottomCard'
import SecurityManager from '../../../managers/securityManager'
import { CgClose } from 'react-icons/cg'
import { TbMessageCircleSearch } from 'react-icons/tb'
import ContentEditable from '../../shared/contentEditable'
import { useLongPress } from 'use-long-press'
import useClipboard from 'react-use-clipboard'

const Conversation = () => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, messageToUser, navbarButton } = state
  const [existingChat, setExistingChat] = useState(null)
  const [messagesToLoop, setMessagesToLoop] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [bookmarks, setBookmarks] = useState([])
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [showSearchCard, setShowSearchCard] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [searchInputQuery, setSearchInputQuery] = useState('')
  const [refreshKey, setRefreshKey] = useState(Manager.getUid())
  const [isCopied, setCopied] = useClipboard()

  const bind = useLongPress((element) => {
    navigator.clipboard.writeText(element.target.textContent)
    successAlert('Message Copied!', false)
  })

  const bookmarkMessage = async (messageObject, bookmarkButton) => {
    bookmarkButton.classList.add('pressed')
    setTimeout(function () {
      bookmarkButton.classList.remove('pressed')
    }, 350)
    const { bookmarked, id } = messageObject
    if (bookmarked) {
      await ChatManager.toggleMessageBookmark(currentUser, messageToUser, id, false)
    } else {
      await ChatManager.toggleMessageBookmark(currentUser, messageToUser, id, true)
    }
  }

  const sendMessage = async () => {
    // Clear input
    let messageInputValue = document.querySelector('.message-input')

    if (messageInputValue.textContent.length === 0) {
      throwError('Please enter a message')
      return false
    }

    // Fill models
    const conversation = new ConversationThread()
    const conversationMessage = new ConversationMessage()

    // Messages
    conversationMessage.id = Manager.getUid()
    conversationMessage.timestamp = moment().format('MM/DD/yyyy hh:mma')
    conversationMessage.sender = currentUser.name
    conversationMessage.recipient = messageToUser.name
    conversationMessage.message = messageText
    conversationMessage.readState = 'delivered'
    conversationMessage.notificationSent = false
    conversationMessage.bookmarked = false
    const cleanMessage = Manager.cleanObject(conversationMessage, ModelNames.conversationMessage)

    //Thread
    const { name, id, phone } = messageToUser
    const { name: crName, id: crId, phone: crPhone } = currentUser
    const memberTwo = { name: crName, id: crId, phone: crPhone }
    const memberOne = { name, id, phone }
    conversation.id = Manager.getUid()
    conversation.members = [memberOne, memberTwo]
    conversation.timestamp = moment().format('MM/DD/yyyy hh:mma')
    conversation.threadVisibilityMembers = [memberOne, memberTwo]
    conversation.messages = [cleanMessage]
    conversation.threadOwner = currentUser.phone
    const cleanThread = Manager.cleanObject(conversation, ModelNames.conversationThread)

    // Existing chat
    if (Manager.isValid(existingChat)) {
      const chatKey = await DB.getSnapshotKey(`${DB.tables.chats}`, existingChat, 'id')
      await ChatManager.addConvoOrMessageByPath(`${DB.tables.chats}/${chatKey}/messages`, cleanThread.messages[0])
    }
    // Create new chat (if one doesn't exist between members)
    else {
      await ChatManager.addConvoOrMessageByPath(`${DB.tables.chats}`, cleanThread)
    }

    let updatedMessages = existingChat?.messages

    if (Manager.isValid(updatedMessages, true)) {
      if (!Array.isArray(updatedMessages)) {
        updatedMessages = Manager.convertToArray(updatedMessages)
      }
      setMessagesToLoop([...updatedMessages, cleanThread.messages[0]])
    } else {
      setMessagesToLoop([])
    }
    const subId = await NotificationManager.getUserSubId(messageToUser.phone)
    // PushAlertApi.sendMessage('New Message', `You have an unread conversation message 💬`, subId)
    await getExistingMessages()
    AppManager.setAppBadge(1)
    scrollToLatestMessage()
    messageInputValue.innerHTML = ''
    setMessageText('')
    setRefreshKey(Manager.getUid())

    // Reset screen height
    const messageThreadContainer = document.getElementById('message-thread-container')
    const screenHeight = window.screen.height
    messageThreadContainer.style.height = `${screenHeight}px`
  }

  const viewBookmarks = async (e) => {
    setShowBookmarks(!showBookmarks)
    scrollToLatestMessage()
  }

  const getExistingMessages = async () => {
    let securedChats = await SecurityManager.getChats(currentUser)
    const securedChat = securedChats.filter(
      (x) => x.members.map((x) => x.phone).includes(currentUser.phone) && x.members.map((x) => x.phone).includes(messageToUser.phone)
    )[0]

    const bookmarkedMessages = securedChat?.messages?.filter((x) => x?.bookmarked)
    const messages = Manager.convertToArray(securedChat?.messages) || []

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
      setExistingChat(securedChat)
      await ChatManager.markMessagesRead(currentUser, messageToUser, securedChat)
    } else {
      setMessagesToLoop([])
      setExistingChat(null)
    }
    setTimeout(() => {
      setState({ ...state, unreadMessageCount: 0, showNavbar: false, currentScreen: ScreenNames.conversation })
    }, 1000)
    // Mark read
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
    onValue(child(dbRef, `${DB.tables.chats}`), async (snapshot) => {
      await getExistingMessages().then((r) => r)
    })
  }

  const handleMessageTyping = (input) => setMessageText(input.target.textContent)

  useEffect(() => {
    onTableChange().then((r) => r)
    scrollToLatestMessage()
    Manager.showPageContainer('show')
    const appContainer = document.querySelector('.App')

    if (appContainer) {
      appContainer.classList.add('disable-scroll')
    }
    const messageInput = document.getElementById('message-input')
    if (messageInput) {
      messageInput.focus()
    }
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
        className="form conversation-search-card"
        submitText={'Search'}
        submitIcon={<TbMessageCircleSearch />}
        showCard={showSearchCard}
        onSubmit={() => {
          if (searchInputQuery.length === 0) {
            throwError('Please enter a search value')
            return false
          }
          const results = messagesToLoop.filter((x) => x.message.toLowerCase().indexOf(searchInputQuery.toLowerCase()) > -1)
          setBookmarks([])
          setSearchResults(results)
          setSearchInputQuery('')
        }}
        refreshKey={refreshKey}
        onClose={() => {
          setShowSearchInput(false)
          setShowSearchCard(false)
          setSearchResults([])
          scrollToLatestMessage()
          setRefreshKey(Manager.getUid())
        }}>
        <DebounceInput
          placeholder="Find a message..."
          minLength={2}
          className="search-input"
          debounceTimeout={500}
          onChange={(e) => {
            if (e.target.value.length > 2) {
              setSearchInputQuery(e.target.value)
            }
          }}
        />
        <div
          className="buttons"
          onClick={() => {
            setShowSearchInput(false)
            setShowSearchCard(false)
            setSearchResults([])
            scrollToLatestMessage()
          }}>
          <button className="card-button cancel">Close</button>
        </div>
      </BottomCard>
      <div key={refreshKey} id="message-thread-container" className={`${theme}  conversation`}>
        {/* TOP BAR */}
        {!showSearchInput && (
          <div className="flex top-buttons">
            <div className="flex" id="user-info">
              <p id="user-name">{formatNameFirstNameOnly(messageToUser.name)}</p>
            </div>
            <div id="right-side" className="flex">
              <TbMessageCircleSearch id="search-icon" onClick={() => setShowSearchCard(true)} />
              {bookmarks.length > 0 && (
                <PiBookmarksSimpleDuotone
                  id="conversation-bookmark-icon"
                  className={showBookmarks ? 'material-icons  top-bar-icon' + ' active' : 'material-icons  top-bar-icon'}
                  onClick={(e) => viewBookmarks(e)}
                />
              )}
              <CgClose
                onClick={() => {
                  setState({ ...state, currentScreen: ScreenNames.chats })
                  Manager.showPageContainer('show')
                }}
                className="material-icons"
                id="close-icon"
              />
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
                    <p key={index} className={messageObj.sender === currentUser.name ? 'message from' : 'to message'}>
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
                    <p key={index} className={messageObj.sender === currentUser.name ? 'message from' : 'to message'}>
                      {messageObj.message}
                      <PiBookmarkSimpleDuotone
                        className={messageObj.bookmarked ? 'bookmarked sparkle' : 'sparkle'}
                        onClick={(e) => bookmarkMessage(messageObj, e.target)}
                      />
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
          <div key={refreshKey}>
            <div id="default-messages">
              {Manager.isValid(messagesToLoop, true) &&
                messagesToLoop.map((messageObj, index) => {
                  let timestamp = moment(messageObj.timestamp, DateFormats.fullDatetime).format('ddd, MMMM Do @ h:mm a')
                  // Message Sent Today
                  if (moment(messageObj.timestamp, DateFormats.fullDatetime).isSame(moment(), 'day')) {
                    timestamp = moment(messageObj.timestamp, DateFormats.fullDatetime).format('h:mm a')
                  }
                  return (
                    <div key={index}>
                      <p
                        {...bind()}
                        className={
                          messageObj.sender === currentUser.name ? 'from message sparkle-on-click-button' : 'to message sparkle-on-click-button'
                        }>
                        {messageObj.message}
                        <PiBookmarkSimpleDuotone
                          className={messageObj.bookmarked ? 'bookmarked pressed' : 'pressed'}
                          onClick={(e) => bookmarkMessage(messageObj, e.target.parentNode)}
                        />
                      </p>
                      <span className={messageObj.sender === currentUser.name ? 'from timestamp' : 'to timestamp'}>{timestamp}</span>
                    </div>
                  )
                })}
              <div id="last-message-anchor"></div>
            </div>

            {/* MESSAGE INPUT */}
            <div className="form message-input-form">
              {/* SEND BUTTON */}
              <div className="flex" id="message-input-container">
                <ContentEditable classNames={'message-input'} onChange={handleMessageTyping} />
                <button
                  onClick={async () => {
                    const messageThreadContainer = document.getElementById('message-thread-container')
                    const vh = window.innerHeight

                    await sendMessage()
                    setTimeout(() => {
                      messageThreadContainer.style.height = `${vh}px`
                      messageThreadContainer.style.maxHeight = `${vh}px`
                    }, 300)
                  }}
                  id="send-button">
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Conversation
