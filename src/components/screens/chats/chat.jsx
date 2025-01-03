import React, { useContext, useEffect, useState } from 'react'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import moment from 'moment'
import 'rsuite/dist/rsuite.min.css'
import ScreenNames from '@screenNames'
import globalState from '../../../context.js'
import DB from '@db'
import ChatMessage from '../../../models/chat/chatMessage'
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
import { IoChevronBack } from 'react-icons/io5'
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
import { TbMessageCircleSearch } from 'react-icons/tb'
import ContentEditable from '../../shared/contentEditable'
import { useLongPress } from 'use-long-press'
import ObjectManager from '../../../managers/objectManager'
import AlertManager from '../../../managers/alertManager'
import InputWrapper from '../../shared/inputWrapper'
import DomManager from '../../../managers/domManager'
import ActivityCategory from '../../../models/activityCategory'
import ChatThread from '../../../models/chat/chatThread'

const Chat = () => {
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
  const [readonly, setReadonly] = useState(false)
  const [shouldCreateNewChat, setShouldCreateNewChat] = useState(false)
  const bind = useLongPress((element) => {
    navigator.clipboard.writeText(element.target.textContent)
    AlertManager.successAlert('Message Copied!', false)
  })

  const toggleMessageBookmark = async (messageObject, isBookmarked) => {
    await ChatManager.toggleMessageBookmark(currentUser, messageRecipient, messageObject.id, existingChat?.id).finally(async () => {
      await getExistingMessages()
    })
  }

  const sendMessage = async () => {
    // Clear input
    let messageInputValue = document.querySelector('.message-input')

    if (messageInputValue.textContent.length === 0) {
      AlertManager.throwError('Please enter a message')
      return false
    }

    const chat = new ChatThread()
    const chatMessage = new ChatMessage()
    //messages should get pushed to chatMessages/primaryKey
    const uid = Manager.getUid()

    // Chat
    const memberTwo = {
      name: currentUser.name,
      phone: currentUser.phone,
      id: currentUser.id,
    }
    const memberOne = {
      name: messageRecipient.name,
      id: messageRecipient.id,
      phone: messageRecipient.phone,
    }
    chat.id = uid
    chat.members = [memberOne, memberTwo]
    chat.creationTimestamp = moment().format(DateFormats.fullDatetime)
    chat.isMuted = false
    chat.ownerPhone = currentUser?.phone

    const cleanedChat = ObjectManager.cleanObject(chat, ModelNames.chatThread)
    let cleanedRecipientChat = { ...cleanedChat }
    cleanedRecipientChat.ownerPhone = messageRecipient.phone

    // Message
    chatMessage.id = Manager.getUid()
    chatMessage.timestamp = moment().format(DateFormats.fullDatetime)
    chatMessage.sender = currentUser?.name
    chatMessage.recipient = messageRecipient.name
    chatMessage.message = messageText
    chatMessage.readState = 'delivered'
    chatMessage.notificationSent = false

    const cleanMessage = ObjectManager.cleanObject(chatMessage, ModelNames.chatMessage)

    // ADD TO DATABASE
    // Existing chat
    if (Manager.isValid(existingChat)) {
      // If other member has archived their chat -> create a new chat for them
      if (shouldCreateNewChat) {
        cleanedRecipientChat.id = existingChat.id
        await ChatManager.addChat(`${DB.tables.chats}/${messageRecipient.phone}`, cleanedRecipientChat)
      }
      await ChatManager.addChatMessage(`${DB.tables.chatMessages}/${existingChat.id}`, cleanMessage)
    }
    // Create new chat (for each member, if one doesn't exist between members)
    else {
      await ChatManager.addChat(`${DB.tables.chats}/${currentUser.phone}`, cleanedChat)
      await ChatManager.addChat(`${DB.tables.chats}/${messageRecipient.phone}`, cleanedRecipientChat)
      await ChatManager.addChatMessage(`${DB.tables.chatMessages}/${uid}`, cleanMessage)
    }

    // Only send notification if co-parent has chat UN-muted
    let secondMemberChat = await ChatManager.getScopedChat(messageRecipient, currentUser?.phone)

    if (!secondMemberChat.isMuted) {
      NotificationManager.sendNotification(
        'New Message',
        `You have an unread conversation message 💬 from ${uppercaseFirstLetterOfAllWords(currentUser.name)}`,
        messageRecipient?.phone,
        currentUser,
        ActivityCategory.chats
      )
    }

    await getExistingMessages()
    AppManager.setAppBadge(1)
    messageInputValue.innerHTML = ''
    setMessageText('')
    // TODO MOBILE ONLY?
    // setRefreshKey(Manager.getUid())
  }

  const viewBookmarks = (e) => {
    if (bookmarks.length > 0) {
      setShowBookmarks(!showBookmarks)
      scrollToLatestMessage()
    }
  }

  const getExistingMessages = async () => {
    let chat = await ChatManager.getScopedChat(currentUser, messageRecipient?.phone)
    let secondMemberChat = await ChatManager.getScopedChat(messageRecipient, currentUser?.phone)

    if (!Manager.isValid(secondMemberChat)) {
      setShouldCreateNewChat(true)
    }

    let bookmarkRecords = await ChatManager.getBookmarks(chat?.id)
    let bookmarkedRecordIds = bookmarkRecords.map((x) => x.messageId)
    let messages = []

    // Co-parent account closed
    if (!Manager.isValid(messageRecipient)) {
      setReadonly(true)
    }

    // Set chat/messages
    if (Manager.isValid(chat)) {
      setExistingChat(chat)
      messages = await ChatManager.getMessages(chat.id)
      if (Manager.isValid(messages)) {
        setMessagesToLoop(messages)
      }
    }

    // Set bookmarks
    if (Manager.isValid(bookmarkRecords)) {
      let bookmarksToLoop = messages.filter((x) => bookmarkedRecordIds.includes(x.id))

      setBookmarks(bookmarksToLoop)
    } else {
      setShowBookmarks(false)
      setBookmarks([])
    }
    setState({ ...state, isLoading: false })
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
    onValue(child(dbRef, `${DB.tables.chats}/${currentUser?.phone}`), async (snapshot) => {
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
    setState({ ...state, isLoading: true })
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
        wrapperClass="conversation-search"
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
          placeholder="Find a message..."
          inputType={'input'}
          onChange={(e) => {
            if (e.target.value.length > 2) {
              setSearchInputQuery(e.target.value)
            }
          }}
          inputClasses="search-input"
        />
      </BottomCard>
      <div key={refreshKey} id="message-thread-container" className={`${theme} conversation`}>
        {/* TOP BAR */}
        {!showSearchInput && DomManager.isMobile() && (
          <div className="flex top-buttons">
            <div
              className="flex"
              id="user-info"
              onClick={() => {
                setState({ ...state, currentScreen: ScreenNames.chats })
                Manager.showPageContainer('show')
              }}>
              <IoChevronBack />
              <p id="user-name">{formatNameFirstNameOnly(messageRecipient?.name)}</p>
            </div>
            <div id="right-side" className="flex">
              <TbMessageCircleSearch id="search-icon" onClick={() => setShowSearchCard(true)} />
              {bookmarks.length > 0 && (
                <PiBookmarksSimpleDuotone
                  id="conversation-bookmark-icon"
                  className={showBookmarks ? 'material-icons  top-bar-icon' + ' active' : 'material-icons  top-bar-icon'}
                  onClick={viewBookmarks}
                />
              )}
            </div>
          </div>
        )}

        {/* SEARCH RESULTS */}
        {bookmarks.length === 0 && searchResults.length > 0 && (
          <div id="messages" className="search-results">
            {Manager.isValid(searchResults) &&
              searchResults.map((messageObj, index) => {
                let sender
                if (formatNameFirstNameOnly(messageObj.sender) === formatNameFirstNameOnly(currentUser?.name)) {
                  sender = 'ME'
                } else {
                  sender = formatNameFirstNameOnly(messageObj.sender)
                }
                return (
                  <div key={index}>
                    <p className={messageObj.sender === currentUser?.name ? 'message from' : 'to message'}>{messageObj.message}</p>
                    <span className={messageObj.sender === currentUser?.name ? 'timestamp from' : 'to timestamp'}>
                      From {sender} on&nbsp;{moment(messageObj.timestamp, 'MM/DD/yyyy hh:mma').format('ddd, MMM DD @ hh:mma')}
                    </span>
                  </div>
                )
              })}
          </div>
        )}

        {/* BOOKMARKED MESSAGES */}
        {Manager.isValid(bookmarks) && showBookmarks && (
          <div id="bookmark-messages" className="bookmark-results">
            {bookmarks.map((bookmark, index) => {
              let sender
              if (formatNameFirstNameOnly(bookmark.sender) === formatNameFirstNameOnly(currentUser?.name)) {
                sender = 'ME'
              } else {
                sender = formatNameFirstNameOnly(bookmark.sender)
              }
              return (
                <div key={index}>
                  <p className={bookmark.sender === currentUser?.name ? 'message from' : 'to message'}>
                    {bookmark.message}
                    <FaBookmark className={'bookmarked'} onClick={(e) => toggleMessageBookmark(bookmark)} />
                  </p>
                  <span className={bookmark.sender === currentUser?.name ? 'timestamp from' : 'to timestamp'}>
                    From {sender} on&nbsp; {moment(bookmark.timestamp, 'MM/DD/yyyy hh:mma').format('ddd, MMM DD @ hh:mma')}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* LOOP MESSAGES */}
        {!showBookmarks && searchResults.length === 0 && (
          <Fade direction={'up'} duration={1000} className={'conversation-fade-wrapper'} triggerOnce={true}>
            <>
              <div id="default-messages">
                {Manager.isValid(messagesToLoop) &&
                  messagesToLoop.map((message, index) => {
                    // Determine bookmark class
                    let isBookmarked = false
                    if (bookmarks?.filter((x) => x.id === message.id).length > 0) {
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
                          {!readonly && (
                            <>
                              {isBookmarked && <FaBookmark className={'bookmarked'} onClick={() => toggleMessageBookmark(message, true)} />}
                              {!isBookmarked && <PiBookmarkSimpleDuotone onClick={(e) => toggleMessageBookmark(message, false)} />}
                            </>
                          )}
                        </p>
                        <span className={message?.sender === currentUser?.name ? 'from timestamp' : 'to timestamp'}>{timestamp}</span>
                      </div>
                    )
                  })}
                <div id="last-message-anchor"></div>
              </div>

              {/* MESSAGE INPUT */}
              {!readonly && (
                <div className="form message-input-form">
                  {/* SEND BUTTON */}
                  <div
                    className={messageText.length > 1 ? 'flex has-value' : 'flex'}
                    id="message-input-container"
                    onClick={(e) => e.target.classList.add('has-value')}>
                    <ContentEditable classNames={'message-input'} onChange={handleMessageTyping} />
                    <button className={messageText.length > 1 ? 'filled' : 'outline'} onClick={async () => await sendMessage()} id="send-button">
                      Send
                    </button>
                  </div>
                </div>
              )}
            </>
          </Fade>
        )}

        {/* DESKTOP SIDEBAR */}
        {!DomManager.isMobile() && (
          <Fade direction={'up'} duration={1000} className={'conversation-sidebar-fade-wrapper'} triggerOnce={true}>
            <div className="top-buttons">
              <p id="user-name">{formatNameFirstNameOnly(messageRecipient.name)}</p>
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
                placeholder="Find a message..."
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

export default Chat