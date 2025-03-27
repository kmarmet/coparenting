// Path: src\components\screens\chats\chat.jsx
import React, { useContext, useEffect, useState } from 'react'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import moment from 'moment'
import ScreenNames from '/src/constants/screenNames'
import globalState from '/src/context.js'
import DB from '/src/database/DB'
import ChatMessage from '/src/models/chat/chatMessage'
import Manager from '/src/managers/manager'
import NotificationManager from '/src/managers/notificationManager'
import { MdOutlineSearchOff } from 'react-icons/md'
import ChatManager from '/src/managers/chatManager.js'
import DateFormats from '/src/constants/dateFormats'
import { PiBookmarksSimpleDuotone } from 'react-icons/pi'
import ModelNames from '/src/models/modelNames'
import { Fade } from 'react-awesome-reveal'
import { IoChevronBack, IoSend } from 'react-icons/io5'
import Modal from '/src/components/shared/modal'
import { TbMessageCircleSearch } from 'react-icons/tb'
import { BsBookmarkPlus, BsFillBookmarksFill, BsFillBookmarkStarFill } from 'react-icons/bs'
import { DebounceInput } from 'react-debounce-input'
import { useLongPress } from 'use-long-press'
import ObjectManager from '/src/managers/objectManager'
import AlertManager from '/src/managers/alertManager'
import InputWrapper from '/src/components/shared/inputWrapper'
import DomManager from '/src/managers/domManager'
import ActivityCategory from '/src/models/activityCategory'
import ChatThread from '/src/models/chat/chatThread'
import StringManager from '/src/managers/stringManager.coffee'

const Chats = () => {
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
  const [toneObject, setToneObject] = useState()
  const [inSearchMode, setInSearchMode] = useState(false)


  const bind = useLongPress((element) => {
    navigator.clipboard.writeText(element.target.textContent)
    AlertManager.successAlert('Message Copied!', false)
  })

  const toggleMessageBookmark = async (messageObject) => {
    await ChatManager.toggleMessageBookmark(currentUser, messageRecipient, messageObject.id, existingChat?.id).finally(async () => {
      await getExistingMessages()
    })
  }

  const sendMessage = async () => {
    let messageInput = document.querySelector('.message-input')
    if (messageInput.value.length === 0) {
      AlertManager.throwError('Please enter a message')
      return false
    }

    //#region FILL MODELS
    const chat = new ChatThread()
    const chatMessage = new ChatMessage()
    const uid = Manager.getUid()

    // Chats
    const memberTwo = {
      name: currentUser.name,
      key: currentUser.key,
      id: currentUser.id,
    }
    const memberOne = {
      name: messageRecipient.name,
      id: messageRecipient.id,
      key: messageRecipient.key,
    }
    chat.id = uid
    chat.members = [memberOne, memberTwo]
    chat.creationTimestamp = moment().format(DateFormats.fullDatetime)
    chat.ownerKey = currentUser?.key
    chat.isPausedFor = []

    const cleanedChat = ObjectManager.cleanObject(chat, ModelNames.chatThread)
    cleanedChat.isPausedFor = []
    let cleanedRecipientChat = { ...cleanedChat }
    cleanedRecipientChat.isPausedFor = []
    cleanedRecipientChat.ownerKey = messageRecipient.key

    // Message
    chatMessage.id = Manager.getUid()
    chatMessage.timestamp = moment().format(DateFormats.fullDatetime)
    chatMessage.sender = currentUser?.name
    chatMessage.recipient = messageRecipient.name
    chatMessage.message = messageText
    chatMessage.readState = 'delivered'
    chatMessage.notificationSent = false

    const cleanMessage = ObjectManager.cleanObject(chatMessage, ModelNames.chatMessage)
    //#endregion FILL MODELS

    //#region ADD TO DB
    // Existing chat
    if (Manager.isValid(existingChat)) {
      await ChatManager.addChatMessage(`${DB.tables.chatMessages}/${existingChat.id}`, cleanMessage)
    }
    // Create new chat (for each member, if one doesn't exist between members)
    else {
      await ChatManager.addChat(`${DB.tables.chats}/${currentUser?.key}`, cleanedChat)
      await ChatManager.addChat(`${DB.tables.chats}/${messageRecipient?.key}`, cleanedRecipientChat)
      await ChatManager.addChatMessage(`${DB.tables.chatMessages}/${uid}`, cleanMessage)
    }
    //#endregion ADD TO DB

    // SEND NOTIFICATION - Only send if it is not paused for the recipient
    if (!existingChat?.isPausedFor?.includes(messageRecipient?.key)) {
      NotificationManager.sendNotification(
        'New Message',
        `You have an unread conversation message 💬 from ${StringManager.uppercaseFirstLetterOfAllWords(currentUser.name)}`,
        messageRecipient?.key,
        currentUser,
        ActivityCategory.chats
      )
    }

    await getExistingMessages()
    setMessageText('')
    setTimeout(() => {
      setToneObject(null)
    }, 300)
  }

  const viewBookmarks = () => {
    if (bookmarks.length > 0) {
      setShowBookmarks(!showBookmarks)
      scrollToLatestMessage()
    }
  }

  const getExistingMessages = async () => {
    let chat = await ChatManager.getScopedChat(currentUser, messageRecipient?.key)

    let bookmarkRecords = await ChatManager.getBookmarks(chat?.id)
    let bookmarkedRecordIds = bookmarkRecords.map((x) => x.messageId)
    let messages = []

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
    const userChats = await DB.getTable(`${DB.tables.chats}/${currentUser?.key}`)
    const thisChat = userChats.filter(
      (x) => x.members.map((x) => x?.key).includes(currentUser.key) && x.members.map((x) => x?.key).includes(messageRecipient.key)
    )[0]

    if (thisChat) {
      const chatId = thisChat.id
      onValue(child(dbRef, `${DB.tables.chatMessages}/${chatId}`), async () => {
        await getExistingMessages().then((r) => r)
      })
    }
  }

  const handleMessageTyping = () => {
    const messageInput = document.querySelector('.message-input')
    const valueLength = messageInput.value?.trim().length
    const text = messageInput.value
    if (messageInput && messageInput.value.trim().length > 1) {
      messageInput.classList.add('has-value')
      setTone(text).then((r) => r)
    } else {
      messageInput.classList.remove('has-value')
      setToneObject(null)
    }
    if (valueLength > 0) {
      setMessageText(messageInput.value)
    }
  }

  const setTone = async (text) => {
    const toneAndSentiment = await ChatManager.getToneAndSentiment(text)
    setToneObject(toneAndSentiment)
  }

  // ON PAGE LOAD
  useEffect(() => {
    const messageInput = document.querySelector('.message-input')

    if (messageInput) {
      // messageInput.focus()
    }
    onTableChange().then((r) => r)

    const appContainer = document.querySelector('.App')
    const appContent = document.getElementById('app-content-with-sidebar')

    if (appContent && appContainer) {
      appContent.classList.add('disable-scroll')
      appContainer.classList.add('disable-scroll')
    }
  }, [])

  // ON SEARCH RESULTS CHANGE
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

  useEffect(() => {
    if (showSearchCard) {
      setInSearchMode(true)
    }
  }, [showSearchCard])

  return (
    <>
      <Modal
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
          setShowSearchCard(false)
        }}
        onClose={() => {
          setShowSearchInput(false)
          setShowSearchCard(false)
          setInSearchMode(false)
          setSearchResults([])
          scrollToLatestMessage()
        }}>
        <InputWrapper
          labelText="Find a message..."
          inputType={'input'}
          onChange={(e) => {
            if (e.target.value.length > 2) {
              setSearchInputQuery(e.target.value)
            }
          }}
          inputClasses="search-input"
        />
      </Modal>

      {/* PAGE CONTAINER */}
      <div key={refreshKey} id="chat-wrapper" className={`${theme} conversation`}>
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
              <p id="user-name">{StringManager.getFirstNameOnly(messageRecipient?.name)}</p>
            </div>
            <div id="right-side" className="flex">
              {inSearchMode ? <MdOutlineSearchOff onClick={() => {
                setShowSearchInput(false)
                setShowSearchCard(false)
                setInSearchMode(false)
                setSearchResults([])
                scrollToLatestMessage()
              }}/> :  <TbMessageCircleSearch id="search-icon" onClick={() => setShowSearchCard(true)} />}

              {bookmarks.length > 0 && (
                <BsFillBookmarksFill
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
                if (StringManager.getFirstNameOnly(messageObj.sender) === StringManager.getFirstNameOnly(currentUser?.name)) {
                  sender = 'ME'
                } else {
                  sender = StringManager.getFirstNameOnly(messageObj.sender)
                }
                return (
                  <div className="message-fade-wrapper search" key={index}>
                    <p className={messageObj.sender === currentUser?.name ? 'message from' : 'to message'}>{messageObj.message}</p>
                    <span className={messageObj.sender === currentUser?.name ? 'timestamp from' : 'to timestamp'}>
                      From {sender} on&nbsp;{moment(messageObj.timestamp, 'MM/DD/yyyy hh:mma').format('ddd, MMM DD (hh:mma)')}
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
              if (StringManager.getFirstNameOnly(bookmark.sender) === StringManager.getFirstNameOnly(currentUser?.name)) {
                sender = 'ME'
              } else {
                sender = StringManager.getFirstNameOnly(bookmark.sender)
              }
              return (
                <div key={index} className={'message-fade-wrapper'}>
                  <div className="flex">
                    <p className={bookmark.sender === currentUser?.name ? 'message from' : 'to message'}>{bookmark.message}</p>
                    <BsFillBookmarkStarFill className={'active'} onClick={() => toggleMessageBookmark(bookmark)} />
                  </div>
                  <span className={bookmark.sender === currentUser?.name ? 'timestamp from' : 'to timestamp'}>
                    From {sender} on&nbsp; {moment(bookmark.timestamp, 'MM/DD/yyyy hh:mma').format('ddd, MMM DD (hh:mma)')}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {!showBookmarks && searchResults.length === 0 && (
          <>
            {/* ITERATE DEFAULT MESSAGES */}
            <div id="default-messages">
              <Fade direction={'up'} duration={300} triggerOnce={true} damping={0.2} cascade={true}>

              {Manager.isValid(messagesToLoop) &&
                messagesToLoop.map((message, index) => {
                  // Determine bookmark class
                  let isBookmarked = false
                  if (bookmarks?.filter((x) => x.id === message.id).length > 0) {
                    isBookmarked = true
                  }
                  let timestamp = moment(message.timestamp, DateFormats.fullDatetime).format('ddd, MMMM Do (h:mma)')
                  // Message Sent Today
                  if (moment(message.timestamp, DateFormats.fullDatetime).isSame(moment(), 'day')) {
                    timestamp = moment(message.timestamp, DateFormats.fullDatetime).format('h:mma')
                  }
                  return (
                    <div key={index} className={'message-fade-wrapper'}>
                      <div className="flex">
                        <p {...bind()} className={message.sender === currentUser?.name ? 'from message' : 'to message'}>
                          {message.message}
                        </p>
                        {isBookmarked && <BsFillBookmarkStarFill className={'active'} onClick={() => toggleMessageBookmark(message)} />}
                        {!isBookmarked && (
                          <BsBookmarkPlus className={isBookmarked ? 'active' : ''} onClick={() => toggleMessageBookmark(message, false)} />
                        )}
                      </div>
                      <span className={message?.sender === currentUser?.name ? 'from timestamp' : 'to timestamp'}>{timestamp}</span>
                    </div>
                  )
                })}
              </Fade>
            </div>

            {/* MESSAGE INPUT */}
            <div className="form message-input-form">
              <div className={messageText.length > 1 ? 'flex has-value' : 'flex'} id="message-input-container">
                {/* EMOTION METER */}
                <div
                  id="tone-wrapper"
                  className={`${toneObject?.color} ${Manager.isValid(toneObject) && Manager.isValid(messageText, true) ? 'active' : ''}`}>
                  <span className="emotion-text">EMOTION</span>
                  <span className="tone">{StringManager.uppercaseFirstLetterOfAllWords(toneObject?.tone)}</span>
                  <span className="icon">{toneObject?.icon}</span>
                </div>

                {/* INPUT / SEND BUTTON */}
                <div id="input-and-send-button" className="flex">
                  <DebounceInput
                    element={'textarea'}
                    minLength={2}
                    placeholder={'Enter message...'}
                    className={`message-input`}
                    onChange={handleMessageTyping}
                    debounceTimeout={200}
                    value={messageText}
                    rows={'1'}
                  />
                  <button className={toneObject?.color} onClick={sendMessage} id="send-button">
                    <IoSend />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* DESKTOP SIDEBAR */}
      {!DomManager.isMobile() && (
        <Fade direction={'up'} duration={1000} className={'conversation-sidebar-fade-wrapper chats-desktop-sidebar'} triggerOnce={true}>
          <div className="top-buttons top">
            <p id="user-name">{StringManager.getFirstNameOnly(messageRecipient.name)}</p>
            <p id="view-bookmarks" className="item menu-item" onClick={(e) => viewBookmarks(e)}>
              <PiBookmarksSimpleDuotone
                id="conversation-bookmark-icon"
                className={showBookmarks ? 'material-icons  top-bar-icon' + ' active' : 'material-icons  top-bar-icon'}
              />
              {showBookmarks && <p>Hide Bookmarks</p>}
              {!showBookmarks && bookmarks.length > 0 && <p>View Bookmarks</p>}
              {bookmarks.length === 0 && !showBookmarks && <p>No Bookmarks</p>}
            </p>
            <InputWrapper
              inputType={'input'}
              labelText={'Find a message...'}
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
    </>
  )
}

export default Chats