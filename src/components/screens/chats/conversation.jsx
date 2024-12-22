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
import 'rc-tooltip/assets/bootstrap_white.css'
import ChatManager from '@managers/chatManager.js'
import DateFormats from '../../../constants/dateFormats'
import { PiBookmarkSimpleDuotone, PiBookmarksSimpleDuotone } from 'react-icons/pi'
import { FaBookmark } from 'react-icons/fa'
import ModelNames from '../../../models/modelNames'
import { Fade } from 'react-awesome-reveal'

import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  hasClass,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import BottomCard from '../../shared/bottomCard'
import { CgClose } from 'react-icons/cg'
import { TbMessageCircleSearch } from 'react-icons/tb'
import ContentEditable from '../../shared/contentEditable'
import { useLongPress } from 'use-long-press'
import ObjectManager from '../../../managers/objectManager'
import AlertManager from '../../../managers/alertManager'
import InputWrapper from '../../shared/inputWrapper'
import DomManager from '../../../managers/domManager'

const Conversation = () => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, messageRecipient } = state
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

  const bind = useLongPress((element) => {
    navigator.clipboard.writeText(element.target.textContent)
    AlertManager.successAlert('Message Copied!', false)
  })

  const toggleMessageBookmark = async (messageObject, isBookmarked) => {
    const { id } = messageObject
    await ChatManager.toggleMessageBookmark(currentUser, messageRecipient, id)
  }

  const sendMessage = async () => {
    // Clear input
    let messageInputValue = document.querySelector('.message-input')

    if (messageInputValue.textContent.length === 0) {
      AlertManager.throwError('Please enter a message')
      return false
    }

    // Fill models
    const conversation = new ConversationThread()
    const conversationMessage = new ConversationMessage()

    // Messages
    conversationMessage.id = Manager.getUid()
    conversationMessage.timestamp = moment().format('MM/DD/yyyy hh:mma')
    conversationMessage.sender = currentUser?.name
    conversationMessage.recipient = messageRecipient.name
    conversationMessage.message = messageText
    conversationMessage.readState = 'delivered'
    conversationMessage.notificationSent = false
    conversationMessage.bookmarked = false
    const cleanMessage = ObjectManager.cleanObject(conversationMessage, ModelNames.conversationMessage)

    // Thread
    const { name, id, phone } = messageRecipient
    const { name: crName, id: crId, phone: crPhone } = currentUser
    const memberTwo = { name: crName, id: crId, phone: crPhone }
    const memberOne = { name, id, phone }
    conversation.id = Manager.getUid()
    conversation.members = [memberOne, memberTwo]
    conversation.timestamp = moment().format('MM/DD/yyyy hh:mma')
    conversation.muteFor = []
    conversation.hideFrom = []
    conversation.messages = [cleanMessage]
    conversation.threadOwner = currentUser?.phone
    const cleanThread = ObjectManager.cleanObject(conversation, ModelNames.conversationThread)
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

    // Only send notification if coparent has chat UNmuted
    const messageRecipientSubId = await NotificationManager.getUserSubId(messageRecipient.phone, 'phone')
    if (Manager.isValid(existingChat?.mutedFor, true)) {
      const coparentHasChatMuted = existingChat.mutedFor.filter((x) => x.ownerPhone === messageRecipient.phone).length > 0
      if (!coparentHasChatMuted) {
        NotificationManager.sendNotification('New Message', `You have an unread conversation message 💬`, messageRecipientSubId)
      }
    } else {
      NotificationManager.sendNotification('New Message', `You have an unread conversation message 💬`, messageRecipientSubId)
    }

    await getExistingMessages()
    AppManager.setAppBadge(1)
    scrollToLatestMessage()
    messageInputValue.innerHTML = ''
    setMessageText('')
    // TODO MOBILE ONLY?
    // setRefreshKey(Manager.getUid())
  }

  const viewBookmarks = async (e) => {
    if (bookmarks.length > 0) {
      setShowBookmarks(!showBookmarks)
      scrollToLatestMessage()
    }
  }

  const getExistingMessages = async () => {
    let scopedChatObject = await ChatManager.getScopedChat(currentUser, messageRecipient.phone)
    let { chat } = scopedChatObject
    const bookmarkObjects = chat?.bookmarks?.filter((x) => x.ownerPhone === currentUser?.phone) ?? []
    const bookmarkedMessageIds = bookmarkObjects?.map((x) => x.messageId) ?? []
    let bookmarkedMessages = []

    if (Manager.isValid(bookmarkObjects, true)) {
      bookmarkedMessages = chat?.messages?.filter((x) => bookmarkedMessageIds?.includes(x.id))
    }
    const messages = Manager.convertToArray(chat?.messages) || []

    if (messages.length > 0) {
      if (!bookmarkObjects || bookmarkObjects?.length === 0) {
        setShowBookmarks(false)
        const bookmarkIcon = document.querySelector('.bookmark-icon')
        if (bookmarkIcon) {
          bookmarkIcon.classList.remove('active')
        }
      }
      setBookmarks(bookmarkedMessages)
      setMessagesToLoop(messages.flat())
      setExistingChat(chat)
      await ChatManager.markMessagesRead(currentUser, messageRecipient, chat)
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

  const handleMessageTyping = (input) => {
    const valueLength = input.target.textContent.length
    const parent = input.target.parentNode
    if (valueLength === 0) {
      input.target.classList.remove('has-value')
    } else {
      setMessageText(input.target.textContent)
    }
  }

  useEffect(() => {
    onTableChange().then((r) => r)
    // scrollToLatestMessage()
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
        showOverlay={false}
        onSubmit={() => {
          if (searchInputQuery.length === 0) {
            AlertManager.throwError('Please enter a search value')
            return false
          }
          const results = messagesToLoop.filter((x) => x.message.toLowerCase().indexOf(searchInputQuery.toLowerCase()) > -1)
          setBookmarks([])
          setSearchResults(results)
          setSearchInputQuery('')
          setState({ ...state, showOverlay: false })
        }}
        refreshKey={refreshKey}
        onClose={() => {
          setShowSearchInput(false)
          setShowSearchCard(false)
          setSearchResults([])
          scrollToLatestMessage()
          setRefreshKey(Manager.getUid())
        }}>
        <InputWrapper
          defaultValue="Find a message..."
          inputType={'input'}
          onChange={(e) => {
            if (e.target.value.length > 2) {
              setSearchInputQuery(e.target.value)
            }
          }}
          inputClasses="search-input"
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
      <div key={refreshKey} id="message-thread-container" className={`${theme} conversation`}>
        {/* TOP BAR */}
        {!showSearchInput && DomManager.isMobile() && (
          <div className="flex top-buttons">
            <div className="flex" id="user-info">
              <p id="user-name">{formatNameFirstNameOnly(messageRecipient.name)}</p>
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
                if (formatNameFirstNameOnly(messageObj.sender) === currentUser?.name.formatNameFirstNameOnly()) {
                  sender = 'ME'
                } else {
                  sender = formatNameFirstNameOnly(messageObj.sender)
                }
                return (
                  <>
                    <p key={index} className={messageObj.sender === currentUser?.name ? 'message from' : 'to message'}>
                      {messageObj.message}
                    </p>
                    <span className={messageObj.sender === currentUser?.name ? 'timestamp from' : 'to timestamp'}>
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
            {bookmarks.map((bookmark, index) => {
              let sender
              if (formatNameFirstNameOnly(bookmark.sender) === formatNameFirstNameOnly(currentUser?.name)) {
                sender = 'ME'
              } else {
                sender = formatNameFirstNameOnly(bookmark.sender)
              }
              // Determine bookmark class
              const bookmarks = existingChat.bookmarks
              let isBookmarked = false
              if (bookmarks?.filter((x) => x.messageId === bookmark.id).length > 0) {
                isBookmarked = true
              }
              return (
                <div key={index}>
                  <p className={bookmark.sender === currentUser?.name ? 'message from' : 'to message'}>
                    {bookmark.message}
                    <FaBookmark className={isBookmarked ? 'bookmarked' : ''} onClick={(e) => toggleMessageBookmark(bookmark, true)} />
                  </p>
                  <span className={bookmark.sender === currentUser?.name ? 'timestamp from' : 'to timestamp'}>
                    From {sender} on&nbsp; {moment(bookmark.timestamp, 'MM/DD/yyyy hh:mma').format('ddd, MMM DD @ hh:mma')}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {!showBookmarks && searchResults.length === 0 && (
          <Fade direction={'up'} duration={1000} className={'conversation-fade-wrapper'} triggerOnce={true}>
            {/* DEFAULT MESSAGES */}
            <>
              <div id="default-messages">
                {Manager.isValid(messagesToLoop, true) &&
                  messagesToLoop.map((message, index) => {
                    // Determine bookmark class
                    const bookmarks = existingChat.bookmarks
                    let isBookmarked = false
                    if (bookmarks?.filter((x) => x.messageId === message.id).length > 0) {
                      isBookmarked = true
                    }
                    let timestamp = moment(message.timestamp, DateFormats.fullDatetime).format('ddd, MMMM Do @ h:mma')
                    // Message Sent Today
                    if (moment(message.timestamp, DateFormats.fullDatetime).isSame(moment(), 'day')) {
                      timestamp = moment(message.timestamp, DateFormats.fullDatetime).format('h:mma')
                    }
                    return (
                      <div key={index}>
                        <p {...bind()} className={message.sender === currentUser?.name ? 'from message' : 'to message'}>
                          {message.message}
                          {isBookmarked && <FaBookmark className={'bookmarked'} onClick={() => toggleMessageBookmark(message, true)} />}
                          {!isBookmarked && <PiBookmarkSimpleDuotone onClick={(e) => toggleMessageBookmark(message, false)} />}
                        </p>
                        <span className={message.sender === currentUser?.name ? 'from timestamp' : 'to timestamp'}>{timestamp}</span>
                      </div>
                    )
                  })}
                <div id="last-message-anchor"></div>
              </div>

              {/* MESSAGE INPUT */}
              <div className="form message-input-form">
                {/* SEND BUTTON */}
                <div
                  className={messageText.length > 1 ? 'flex has-value' : 'flex'}
                  id="message-input-container"
                  onClick={(e) => e.target.classList.add('has-value')}>
                  <ContentEditable classNames={'message-input'} onChange={handleMessageTyping} />
                  <button
                    className={messageText.length > 1 ? 'filled' : 'outline'}
                    onClick={async () => {
                      if (DomManager.isMobile()) {
                        const messageThreadContainer = document.getElementById('message-thread-container')
                        const vh = window.innerHeight

                        await sendMessage()
                        setTimeout(() => {
                          messageThreadContainer.style.height = `${vh - 200}px`
                          messageThreadContainer.style.maxHeight = `${vh - 200}px`
                        }, 300)
                      } else {
                        await sendMessage()
                      }
                    }}
                    id="send-button">
                    Send
                  </button>
                </div>
              </div>
            </>
          </Fade>
        )}
        {!DomManager.isMobile() && (
          <Fade direction={'up'} duration={1000} className={'conversation-sidebar-fade-wrapper'} triggerOnce={true}>
            {/* DESKTOP SIDEBAR */}
            <div className="top-buttons">
              <p id="user-name">{formatNameFirstNameOnly(messageRecipient.name)}</p>
              <p id="find-messages" className="item" onClick={() => setShowSearchCard(true)}>
                <TbMessageCircleSearch id="search-icon" /> Find Messages
              </p>
              <p id="view-bookmarks" className="item" onClick={(e) => viewBookmarks(e)}>
                <PiBookmarksSimpleDuotone
                  id="conversation-bookmark-icon"
                  className={showBookmarks ? 'material-icons  top-bar-icon' + ' active' : 'material-icons  top-bar-icon'}
                />
                {showBookmarks && <span>Hide Bookmarks</span>}
                {!showBookmarks && bookmarks.length > 0 && <span>View Bookmarks</span>}
                {bookmarks.length === 0 && !showBookmarks && <span>No Bookmarks</span>}
              </p>
              <InputWrapper
                defaultValue="Find a message..."
                inputType={'input'}
                onChange={async (e) => {
                  const inputValue = e.target.value
                  if (inputValue.length === 0) {
                    setSearchResults([])
                    await getExistingMessages()
                  }
                  if (inputValue.length > 2) {
                    setSearchInputQuery(inputValue)
                    const results = messagesToLoop.filter((x) => x.message.toLowerCase().indexOf(inputValue.toLowerCase()) > -1)
                    setBookmarks([])
                    setSearchResults(results)
                  }
                }}
                inputClasses="sidebar-search-input"
              />
            </div>
          </Fade>
        )}
      </div>
    </>
  )
}

export default Conversation