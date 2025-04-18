// Path: src\components\screens\chats\chat.jsx
import React, {useContext, useEffect, useState} from 'react'
import moment from 'moment-timezone'
import ScreenNames from '/src/constants/screenNames'
import {FaStar} from 'react-icons/fa'
import globalState from '/src/context.js'
import {IoChevronBack, IoCopy, IoSend} from 'react-icons/io5'
import ChatMessage from '/src/models/chat/chatMessage'
import {MdCancel, MdOutlineSearchOff} from 'react-icons/md'
import Manager from '/src/managers/manager'
import ChatManager from '/src/managers/chatManager.js'
import {PiBookmarksSimpleDuotone} from 'react-icons/pi'
import ModelNames from '/src/models/modelNames'
import {BsBookmarkDashFill, BsBookmarkStarFill, BsFillBookmarksFill} from 'react-icons/bs'
import {Fade} from 'react-awesome-reveal'
import Modal from '/src/components/shared/modal'
import {TbMessageCircleSearch} from 'react-icons/tb'
import {useLongPress} from 'use-long-press'
import ObjectManager from '/src/managers/objectManager'
import AlertManager from '/src/managers/alertManager'
import InputWrapper from '/src/components/shared/inputWrapper'
import DomManager from '/src/managers/domManager'
import ChatThread from '/src/models/chat/chatThread'
import StringManager from '/src/managers/stringManager.coffee'
import DatetimeFormats from '../../../constants/datetimeFormats'
import AppManager from '../../../managers/appManager'
import DateManager from '../../../managers/dateManager'
import InputTypes from '../../../constants/inputTypes'
import Spacer from '../../shared/spacer'
import useChat from '../../hooks/useChat'
import useCurrentUser from '../../hooks/useCurrentUser'
import DB from '../../../database/DB'
import NotificationManager from '../../../managers/notificationManager'
import ActivityCategory from '../../../models/activityCategory'

const Chats = () => {
  const {state, setState} = useContext(globalState)
  const {theme, messageRecipient, refreshKey} = state
  const {currentUser} = useCurrentUser()
  const {chat, chatMessages} = useChat()
  const [messagesToLoop, setMessagesToLoop] = useState(chatMessages)
  const [searchResults, setSearchResults] = useState([])
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [bookmarks, setBookmarks] = useState([])
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [showSearchCard, setShowSearchCard] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [searchInputQuery, setSearchInputQuery] = useState('')
  const [toneObject, setToneObject] = useState()
  const [inSearchMode, setInSearchMode] = useState(false)
  const [inputIsActive, setInputIsActive] = useState()
  const [messageTimezone, setMessageTimezone] = useState(false)

  useEffect(() => {
    if (Manager.isValid(chatMessages) && Manager.isValid(chat)) {
      setMessagesToLoop(chatMessages)
    }
  }, [chatMessages])

  const bind = useLongPress((element) => {
    navigator.clipboard.writeText(element.target.textContent)
    const longpressMenu = element.target.parentNode.previousSibling
    longpressMenu.classList.add('active')
  })

  const ToggleBookmark = async (messageObject) => {
    await ChatManager.toggleMessageBookmark(currentUser, messageRecipient, messageObject.id, chat?.id).finally(async () => {
      await DefineBookmarks()
    })
  }

  const HideKeyboard = () => {
    const messageInputForm = document.querySelector('.message-input-wrapper')
    messageInputForm.classList.remove('active')
    Manager.hideKeyboard('message-input-wrapper')
    const input = document.querySelector('.message-input')
    if (input) {
      input.blur()
    }
  }

  const SendMessage = async () => {
    if (!Manager.isValid(messageText, true) || messageText.length === 1) {
      AlertManager.throwError('Please enter a message longer than one character')
      return false
    }

    // Clear input field
    const input = document.querySelector('.message-input')
    if (input) {
      input.value = ''
    }

    // Close Keyboard -> hide message input
    HideKeyboard()

    //#region FILL MODELS
    const _chat = new ChatThread()
    const chatMessage = new ChatMessage()
    const uid = Manager.getUid()

    // Chats
    const sender = {
      name: currentUser.name,
      key: currentUser.key,
      id: currentUser.id,
    }
    const recipient = {
      name: messageRecipient.name,
      id: messageRecipient.id,
      key: messageRecipient.key,
    }
    _chat.id = uid
    _chat.members = [recipient, sender]
    _chat.creationTimestamp = moment().format(DatetimeFormats.fullDatetime)
    _chat.ownerKey = currentUser?.key
    _chat.isPausedFor = []

    const cleanedChat = ObjectManager.cleanObject(_chat, ModelNames.chatThread)
    cleanedChat.isPausedFor = []
    let cleanedRecipientChat = {...cleanedChat}
    cleanedRecipientChat.isPausedFor = []
    cleanedRecipientChat.ownerKey = messageRecipient.key

    // Message
    chatMessage.senderKey = currentUser?.key
    chatMessage.senderTimezone = messageTimezone
    chatMessage.id = Manager.getUid()
    chatMessage.timestamp = moment().format(DatetimeFormats.fullDatetime)
    chatMessage.sender = currentUser?.name
    chatMessage.recipient = messageRecipient.name
    chatMessage.recipientKey = messageRecipient.key
    chatMessage.message = messageText
    chatMessage.notificationSent = false

    const cleanMessage = ObjectManager.cleanObject(chatMessage, ModelNames.chatMessage)
    //#endregion FILL MODELS

    //#region ADD TO DB
    // Existing chat
    if (Manager.isValid(chat)) {
      await ChatManager.addChatMessage(`${DB.tables.chatMessages}/${chat.id}`, cleanMessage)
    }
    // Create new chat (for each member, if one doesn't exist between members)
    else {
      await ChatManager.addChat(`${DB.tables.chats}/${currentUser?.key}`, cleanedChat)
      await ChatManager.addChat(`${DB.tables.chats}/${messageRecipient?.key}`, cleanedRecipientChat)
      await ChatManager.addChatMessage(`${DB.tables.chatMessages}/${uid}`, cleanMessage)
    }
    //#endregion ADD TO DB

    // SEND NOTIFICATION - Only send if it is not paused for the recipient
    if (!chat?.isPausedFor?.includes(messageRecipient?.key)) {
      NotificationManager.sendNotification(
        'New Message 🗯️',
        `You have an unread message from ${StringManager.getFirstNameOnly(currentUser.name)}`,
        messageRecipient?.key,
        currentUser,
        ActivityCategory.chats
      )
    }

    setMessageText('')
    setTimeout(() => {
      setToneObject(null)
    }, 300)
  }

  const ViewBookmarks = () => {
    if (bookmarks.length > 0) {
      setShowBookmarks(!showBookmarks)
      ScrollToLatestMessage()
    }
  }

  const DefineBookmarks = async () => {
    let bookmarkRecords = await ChatManager.getBookmarks(chat?.id)
    let bookmarkedRecordIds = bookmarkRecords.map((x) => x.messageId)

    // Set bookmarks
    if (Manager.isValid(bookmarkRecords)) {
      let bookmarksToLoop = chatMessages.filter((x) => bookmarkedRecordIds.includes(x.id))

      setBookmarks(bookmarksToLoop)
    } else {
      setShowBookmarks(false)
      setBookmarks([])
    }
    ScrollToLatestMessage()
  }

  const ScrollToLatestMessage = () => {
    setTimeout(() => {
      const messageWrapper = document.getElementById('default-messages')
      if (messageWrapper) {
        messageWrapper.scrollTop = messageWrapper.scrollHeight
      }
    }, 100)
  }

  const HandleMessageTyping = () => {
    if (StringManager.wordCount(messageText) % 2 === 0) {
      SetTone(messageText).then((r) => r)
    }
  }

  const SetTone = async (text) => {
    const toneAndSentiment = await ChatManager.getToneAndSentiment(text)
    setToneObject(toneAndSentiment)
  }

  const DefineMessageTimezone = async () => {
    let timezone = currentUser?.location?.timezone
    if (!Manager.isValid(timezone, true)) {
      timezone = await AppManager.getTimezone()
    }
    setMessageTimezone(timezone)
  }

  // ON PAGE LOAD
  useEffect(() => {
    const appContainer = document.querySelector('.App')
    const appContent = document.getElementById('app-content-with-sidebar')

    if (appContent && appContainer) {
      appContent.classList.add('disable-scroll')
      appContainer.classList.add('disable-scroll')
    }

    // FOCUS/BLUR INPUT
    const input = document.querySelector('.message-input')
    if (input) {
      input.focus()

      input.addEventListener('focus', () => {
        setInputIsActive(true)
      })
      input.addEventListener('blur', () => {
        setInputIsActive(false)
      })
    }
    DefineMessageTimezone().then((r) => r)
    ScrollToLatestMessage()
  }, [])

  // UNSET DYNAMIC INPUT HEIGHT
  useEffect(() => {
    if (messageText.length === 1 || messageText.length === 0) {
      const input = document.querySelector('.message-input')
      if (input) {
        input.style.height = '40px'
        DomManager.unsetHeight(input)
        setToneObject(null)
        HideKeyboard()
      }
    }
  }, [messageText.length])

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
          const results = messagesToLoop?.filter((x) => x.message.toLowerCase().indexOf(searchInputQuery.toLowerCase()) > -1)
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
          ScrollToLatestMessage()
        }}>
        <Spacer height={8} />
        <InputWrapper
          labelText="Find a message..."
          inputType={InputTypes.text}
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
                setState({...state, currentScreen: ScreenNames.chats})
                Manager.showPageContainer('show')
              }}>
              <IoChevronBack />
              <p id="user-name">{StringManager.getFirstNameOnly(messageRecipient?.name)}</p>
            </div>
            <div id="right-side" className="flex">
              {inSearchMode ? (
                <MdOutlineSearchOff
                  id={'close-search-icon'}
                  onClick={() => {
                    setShowSearchInput(false)
                    setShowSearchCard(false)
                    setInSearchMode(false)
                    setSearchResults([])
                    ScrollToLatestMessage()
                  }}
                />
              ) : (
                <TbMessageCircleSearch id="search-icon" onClick={() => setShowSearchCard(true)} />
              )}

              {bookmarks.length > 0 && (
                <BsFillBookmarksFill
                  id="chat-bookmark-icon"
                  className={showBookmarks ? 'material-icons  top-bar-icon' + ' active' : 'material-icons  top-bar-icon'}
                  onClick={ViewBookmarks}
                />
              )}
            </div>
          </div>
        )}

        {/* SEARCH RESULTS */}
        {bookmarks.length === 0 && searchResults.length > 0 && (
          <div id="chatMessages" className="search-results">
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
                <div {...bind()} key={index} className={'message-fade-wrapper'}>
                  {/* LONGPRESS MENU */}
                  <div className="longpress-menu">
                    <button
                      id="copy"
                      onClick={(e) => {
                        const message = e.target.parentNode.parentNode.querySelector('.message')
                        navigator.clipboard.writeText(message.textContent)
                        e.target.parentNode.classList.remove('active')
                      }}>
                      Copy <IoCopy />
                    </button>
                    <button
                      id="bookmark"
                      onClick={(e) => {
                        e.target.parentNode.classList.remove('active')

                        ToggleBookmark(bookmark).then((r) => r)
                      }}>
                      Remove Bookmark
                      <BsBookmarkDashFill className={'active'} />
                    </button>

                    <button
                      id="cancel"
                      onClick={(e) => {
                        e.target.parentNode.classList.remove('active')
                      }}>
                      Cancel <MdCancel className={'cancel-icon'} />
                    </button>
                  </div>
                  <div className="flex">
                    <p className={bookmark.sender === currentUser?.name ? 'message from' : 'to message'}>{bookmark.message}</p>
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
              {Manager.isValid(messagesToLoop) &&
                messagesToLoop.map((message, index) => {
                  // Determine bookmark class
                  let isBookmarked = Manager.isValid(bookmarks?.find((x) => x.id === message?.id))
                  const timestampDateOnly = moment(message?.timestamp, DatetimeFormats.fullDatetime).format(DatetimeFormats.dateForDb)
                  const timestampTimeOnly = moment(message?.timestamp, DatetimeFormats.fullDatetime).format(DatetimeFormats.timeForDb)
                  let convertedTime = DateManager.convertTime(timestampTimeOnly, message?.senderTimezone, currentUser?.location?.timezone)
                  let convertedTimestamp = moment(`${timestampDateOnly} ${convertedTime}`, DatetimeFormats.fullDatetime)
                    .tz(currentUser?.location?.timezone)
                    .format('ddd, MMMM Do (h:mma)')

                  // Message Sent Today
                  if (moment(message?.timestamp, DatetimeFormats.fullDatetime).isSame(moment(), 'day')) {
                    convertedTimestamp = moment(message?.timestamp, DatetimeFormats.fullDatetime).format(DatetimeFormats.timeForDb)
                  }
                  return (
                    <div {...bind()} key={index} className={'message-fade-wrapper'}>
                      {/* LONGPRESS MENU */}
                      <div className="longpress-menu">
                        <button
                          id="copy"
                          onClick={(e) => {
                            const message = e.target.parentNode.parentNode.querySelector('.message')
                            navigator.clipboard.writeText(message.textContent)
                            e.target.parentNode.classList.remove('active')
                          }}>
                          Copy <IoCopy />
                        </button>
                        {isBookmarked && (
                          <button
                            id="bookmark"
                            onClick={(e) => {
                              e.target.parentNode.classList.remove('active')

                              ToggleBookmark(message).then((r) => r)
                            }}>
                            Remove Bookmark
                            <BsBookmarkDashFill className={'active'} />
                          </button>
                        )}

                        {!isBookmarked && (
                          <button
                            id="bookmark"
                            onClick={(e) => {
                              e.target.parentNode.classList.remove('active')
                              ToggleBookmark(message, false).then((r) => r)
                            }}>
                            Bookmark <BsBookmarkStarFill />
                          </button>
                        )}

                        <button
                          id="cancel"
                          onClick={(e) => {
                            e.target.parentNode.classList.remove('active')
                          }}>
                          Cancel <MdCancel className={'cancel-icon'} />
                        </button>
                      </div>
                      <div className="flex">
                        <p className={message?.senderKey === currentUser?.key ? 'from message' : 'to message'}>{message?.message}</p>
                        {isBookmarked && (
                          <FaStar className={message?.senderKey === currentUser?.key ? 'from bookmarked-icon' : 'to bookmarked-icon'} />
                        )}
                      </div>
                      <span className={message?.sender === currentUser?.name ? 'from timestamp' : 'to timestamp'}>{convertedTimestamp}</span>
                    </div>
                  )
                })}
            </div>

            <div id="emotion-and-input-wrapper">
              {/* EMOTION METER */}
              <div
                id="tone-wrapper"
                className={`${toneObject?.color} ${Manager.isValid(toneObject) && Manager.isValid(messageText, true) ? 'active' : ''}`}>
                <span className="emotion-text">EMOTION</span>
                <span className="icon">{toneObject?.icon}</span>
                <span className="tone">{StringManager.uppercaseFirstLetterOfAllWords(toneObject?.tone)}</span>
              </div>
              {/* MESSAGE INPUT & SEND BUTTON */}
              <div className={`${inputIsActive ? 'active' : ''} message-input-wrapper`}>
                <div className={'flex'} id="message-input-container">
                  <InputWrapper
                    placeholder={'Message...'}
                    inputType={InputTypes.textarea}
                    isDebounced={false}
                    inputClasses="message-input"
                    hasBottomSpacer={false}
                    wrapperClasses="chat-input-wrapper"
                    defaultValue={messageText}
                    onKeyUp={(e) => {
                      // Backspace
                      if (e.keyCode === 8) {
                        DomManager.autoExpandingHeight(e)

                        if (e.target.value === '') {
                          setMessageText('')
                        }
                      }
                    }}
                    onChange={(e) => {
                      if (e.target.value.length > 1) {
                        HandleMessageTyping(e)
                        setMessageText(e.target.value)
                        DomManager.autoExpandingHeight(e)
                      }
                    }}
                  />
                  <IoSend className={toneObject?.color} onClick={SendMessage} id="send-button" />
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
            <p id="view-bookmarks" className="item menu-item" onClick={(e) => ViewBookmarks(e)}>
              <PiBookmarksSimpleDuotone
                id="chat-bookmark-icon"
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
                  await DefineBookmarks()
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