// Path: src\components\screens\chats\chat.jsx
import moment from 'moment-timezone'
import React, {useContext, useEffect, useState} from 'react'
import {BsBookmarkDashFill, BsBookmarkStarFill, BsFillBookmarksFill} from 'react-icons/bs'
import {FaStar} from 'react-icons/fa'

import {IoChevronBack, IoCopy, IoSend} from 'react-icons/io5'
import {MdCancel, MdOutlineArrowOutward, MdOutlineSearchOff} from 'react-icons/md'
import {PiBookmarksSimpleDuotone} from 'react-icons/pi'
import {TbMessageCircleSearch} from 'react-icons/tb'
import TextareaAutosize from 'react-textarea-autosize'
import {useLongPress} from 'use-long-press'
import DatetimeFormats from '../../../constants/datetimeFormats'
import InputTypes from '../../../constants/inputTypes'
import ActivityCategory from '../../../constants/updateCategory'
import globalState from '../../../context.js'
import useChatMessages from '../../../hooks/useChatMessages'
import useChats from '../../../hooks/useChats'
import useCurrentUser from '../../../hooks/useCurrentUser'
import AlertManager from '../../../managers/alertManager'
import AppManager from '../../../managers/appManager'
import ChatManager from '../../../managers/chatManager.js'
import DatasetManager from '../../../managers/datasetManager'
import DateManager from '../../../managers/dateManager'
import DomManager from '../../../managers/domManager'
import Manager from '../../../managers/manager'
import StringManager from '../../../managers/stringManager.coffee'
import UpdateManager from '../../../managers/updateManager'
import ChatMessage from '../../../models/chat/chatMessage'
import Form from '../../shared/form'
import InputField from '../../shared/inputField'

const Chat = ({show, hide, recipient}) => {
    const {state, setState} = useContext(globalState)
    const {theme, refreshKey} = state
    const {currentUser} = useCurrentUser()
    const [searchResults, setSearchResults] = useState([])
    const [showSearchInput, setShowSearchInput] = useState(false)
    const [showBookmarks, setShowBookmarks] = useState(false)
    const [showSearchCard, setShowSearchCard] = useState(false)
    const [messageText, setMessageText] = useState('')
    const [searchInputQuery, setSearchInputQuery] = useState('')
    const [toneObject, setToneObject] = useState()
    const [inSearchMode, setInSearchMode] = useState(false)
    const [inputIsActive, setInputIsActive] = useState()
    const [messageTimezone, setMessageTimezone] = useState(false)
    const [bookmarkedMessages, setBookmarkedMessages] = useState([])
    const [bookmarks, setBookmarks] = useState([])
    const [showLongPressMenu, setShowLongPressMenu] = useState(false)
    const [activeMessage, setActiveMessage] = useState()
    const [chatId, setChatId] = useState()
    const {chatMessages} = useChatMessages(chatId)
    const [chat, setChat] = useState()
    const [messagesToLoop, setMessagesToLoop] = useState(chatMessages)
    const {chats, chatsAreLoading} = useChats()

    // Handle long press
    const bind = useLongPress((element) => {
        const message = element.target
        const messageId = message.getAttribute('data-id')
        const thisMessage = messagesToLoop.find((x) => x.id === messageId)
        if (Manager.IsValid(thisMessage?.message)) {
            setActiveMessage(thisMessage)
            setShowLongPressMenu(true)
        }
    })

    const ToggleBookmark = async () => {
        await ChatManager.ToggleMessageBookmark(currentUser, recipient, activeMessage?.id, chat?.id, bookmarks).finally(async () => {
            await DefineBookmarks()
        })
    }

    const HideKeyboard = () => {
        const messageInputForm = document.querySelector('.message-input-field')
        messageInputForm.classList.remove('active')
        Manager.HideKeyboard('message-input-field')
        const input = document.querySelector('.message-input')
        if (input) {
            input.blur()
        }
    }

    const SendMessage = async () => {
        // Close Keyboard -> hide message input
        HideKeyboard()

        if (!Manager.IsValid(messageText, true) || messageText.length === 1) {
            AlertManager.throwError('Please enter a message longer than one character (letter, number, or symbol)')
            return false
        }

        // Clear input field
        const input = document.querySelector('.message-input')
        if (input) {
            input.value = ''
        }

        const sender = {
            name: currentUser?.name,
            key: currentUser?.key,
        }

        const chatMessage = new ChatMessage()

        // Sender
        chatMessage.sender = {
            name: currentUser?.name,
            key: currentUser?.key,
            timezone: currentUser?.location?.timezone,
        }

        // Recipient
        chatMessage.recipient = {
            name: recipient?.name,
            key: recipient?.key,
        }

        chatMessage.message = messageText

        // Existing chat
        if (Manager.IsValid(chat)) {
            await ChatManager.InsertChatMessage(chat?.id, chatMessage)
        }

        // Create new chat (for each member, if one doesn't exist between members)
        else {
            const newChatUid = await ChatManager.CreateAndInsertChat(sender, chatMessage.recipient)
            await ChatManager.InsertChatMessage(newChatUid, chatMessage)
        }

        // SEND NOTIFICATION - Only Send if it is not paused for the recipient
        if (!chat?.isPausedFor?.includes(recipient?.key)) {
            UpdateManager.SendUpdate(
                '🗯️ New Message',
                `${StringManager.GetFirstNameOnly(currentUser.name)} Messaged You`,
                recipient?.key,
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
        if (bookmarkedMessages.length > 0) {
            setShowBookmarks(!showBookmarks)
            ScrollToLatestMessage()
        }
    }

    const DefineBookmarks = async () => {
        let bookmarkRecords = await ChatManager.GetBookmarks(chat?.id)
        let bookmarkedRecordIds = DatasetManager.GetValidArray(bookmarkRecords.map((x) => x.messageId))
        setBookmarks(bookmarkRecords)
        // Set bookmarks
        if (Manager.IsValid(bookmarkRecords)) {
            let bookmarksToLoop = chatMessages.filter((x) => bookmarkedRecordIds.includes(x.id))
            setBookmarkedMessages(bookmarksToLoop)
        } else {
            setShowBookmarks(false)
            setBookmarkedMessages([])
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

    const HandleMessageTyping = async () => {
        const messageInput = document.querySelector('.message-input')
        const value = messageInput.value

        if (value.indexOf(' ') > -1) {
            setTimeout(async () => {
                await SetTone(value)
            }, 500)
        }
    }

    const SetTone = async (text) => {
        const toneAndSentiment = await ChatManager.GetToneAndSentiment(text)
        setToneObject(toneAndSentiment)
    }

    const DefineMessageTimezone = async () => {
        let timezone = currentUser?.location?.timezone
        if (!Manager.IsValid(timezone, true)) {
            timezone = await AppManager.GetTimezone()
        }
        setMessageTimezone(timezone)
    }

    const GetChat = async () => {
        for (let _chat of chats) {
            const members = _chat?.members
            for (let member of members) {
                if (member?.key === recipient?.key) {
                    setChat(_chat)
                    setChatId(_chat?.id)
                    break
                }
            }
        }
    }

    // ON PAGE LOAD
    useEffect(() => {
        if (Manager.IsValid(chats)) {
            GetChat().then((r) => r)
        }
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

    useEffect(() => {
        if (Manager.IsValid(chats)) {
            GetChat().then((r) => r)
        }
    }, [recipient])

    // ON SEARCH RESULTS CHANGE
    useEffect(() => {
        const searchResultsContainer = document.querySelector('.search-results')
        if (Manager.IsValid(searchResultsContainer)) {
            if (searchResults.length > 0) {
                document.querySelector('.search-results').classList.add('active')
            } else {
                setSearchResults([])
                document.querySelector('.search-results').classList.remove('active')
            }
        }
    }, [searchResults.length])

    // ON CHAT MESSAGES CHANGE
    useEffect(() => {
        if (Manager.IsValid(chatMessages)) {
            DefineBookmarks().then((r) => r)
            setMessagesToLoop(chatMessages)
        }
    }, [chatMessages])

    // ON SHOW BOOKMARKS
    useEffect(() => {
        if (showBookmarks) {
            DomManager.ToggleAnimation('add', 'bookmark-message', DomManager.AnimateClasses.names.fadeInUp)
        }
    }, [showBookmarks])

    return (
        <>
            <Form
                title={'Search'}
                className="conversation-search-card"
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
                    const results = messagesToLoop?.filter((x) => x.message.toLowerCase().indexOf(searchInputQuery.toLowerCase()) > -1) || []
                    setBookmarkedMessages([])
                    setSearchResults(results)
                    setSearchInputQuery('')
                    setInSearchMode(true)
                    setShowSearchCard(false)
                }}
                onClose={() => {
                    setShowSearchInput(false)
                    setShowSearchCard(false)
                    setInSearchMode(false)
                    setSearchResults([])
                    ScrollToLatestMessage()
                }}>
                <InputField
                    placeholder="Find a message..."
                    inputType={InputTypes.text}
                    onChange={(e) => {
                        if (e.target.value.length > 2) {
                            setSearchInputQuery(e.target.value)
                        }
                    }}
                    inputClasses="search-input"
                />
            </Form>

            {/* PAGE CONTAINER */}
            {show && Manager.IsValid(recipient) && (
                <>
                    <div key={refreshKey} id="chat-wrapper" className={`${theme} conversation`}>
                        {/* LONG PRESS MENU */}
                        {showLongPressMenu && (
                            <div className="long-press-menu">
                                <button
                                    id="copy"
                                    onClick={() => {
                                        navigator.clipboard.writeText(Manager.IsValid(activeMessage) ? activeMessage?.message : '')
                                        setShowLongPressMenu(false)
                                        setState({...state, successAlertMessage: 'Message Copied'})
                                    }}>
                                    Copy <IoCopy />
                                </button>
                                <button
                                    id="bookmark"
                                    className={`${Manager.IsValid(bookmarkedMessages?.find((x) => x?.id === activeMessage?.id)) ? 'remove' : 'add'}`}
                                    onClick={(e) => {
                                        const isBookmarked = Manager.IsValid(bookmarkedMessages?.find((x) => x?.id === activeMessage?.id))
                                        e.target.parentNode.classList.remove('active')
                                        ToggleBookmark(isBookmarked).then((r) => r)
                                        setShowLongPressMenu(false)
                                    }}>
                                    {Manager.IsValid(bookmarkedMessages?.find((x) => x?.id === activeMessage?.id))
                                        ? 'Remove Bookmark'
                                        : 'Add Bookmark'}
                                    {Manager.IsValid(bookmarkedMessages?.find((x) => x?.id === activeMessage?.id)) ? (
                                        <BsBookmarkDashFill />
                                    ) : (
                                        <BsBookmarkStarFill />
                                    )}
                                </button>

                                <button
                                    id="cancel"
                                    onClick={(e) => {
                                        e.target.parentNode.classList.remove('active')
                                        setShowLongPressMenu(false)
                                    }}>
                                    Cancel <MdCancel className={'cancel-icon'} />
                                </button>
                            </div>
                        )}

                        {/* TOP BAR */}
                        {!showSearchInput && DomManager.isMobile() && (
                            <div id="header">
                                <IoChevronBack className="back-arrow" onClick={hide} />
                                <p id="user-name">{StringManager.GetFirstNameOnly(recipient?.name)}</p>
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

                                    {bookmarkedMessages.length > 0 && (
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
                        {bookmarkedMessages.length === 0 && searchResults.length > 0 && (
                            <div id="messages" className="search-results">
                                {Manager.IsValid(searchResults) &&
                                    searchResults.map((messageObj, index) => {
                                        let sender
                                        if (messageObj?.sender?.key === currentUser?.key) {
                                            sender = 'ME'
                                        } else {
                                            sender = StringManager.GetFirstNameOnly(messageObj?.sender?.name)
                                        }
                                        return (
                                            <div
                                                key={index}
                                                className={`message-wrapper search-message-wrapper ${DomManager.Animate.FadeInUp(searchResults, '.message-wrapper')}`}
                                                style={DomManager.AnimateDelayStyle(index, 0.002)}>
                                                <p className={messageObj?.sender?.key !== currentUser?.key ? 'message from' : 'to message'}>
                                                    {messageObj.message}
                                                </p>
                                                <span className={messageObj?.sender?.key !== currentUser?.key ? 'timestamp from' : 'to timestamp'}>
                                                    From {sender?.name} on&nbsp;
                                                    {moment(messageObj.timestamp, 'MM/DD/yyyy hh:mma').format('ddd, MMM DD (hh:mma)')}
                                                </span>
                                            </div>
                                        )
                                    })}
                            </div>
                        )}

                        {/* BOOKMARKED MESSAGES */}
                        {Manager.IsValid(bookmarkedMessages) && showBookmarks && (
                            <div id="bookmark-messages" className="bookmark-results">
                                {bookmarkedMessages.map((bookmark, index) => {
                                    let sender

                                    if (bookmark?.sender?.key === currentUser?.key) {
                                        sender = 'ME'
                                    } else {
                                        sender = StringManager.GetFirstNameOnly(bookmark.sender?.name)
                                    }
                                    return (
                                        <div {...bind()} key={bookmark?.id} className={'message-wrapper bookmark-message'}>
                                            {/* LONG-PRESS MENU */}
                                            {showLongPressMenu && (
                                                <div className="long-press-menu">
                                                    <button
                                                        id="copy"
                                                        onClick={(e) => {
                                                            setState({...state, successAlertMessage: 'Message Copied'})
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
                                            )}
                                            <div className={`flex`}>
                                                <p
                                                    style={DomManager.AnimateDelayStyle(index)}
                                                    className={`${DomManager.Animate.FadeInUp(bookmark, '.message-wrapper')} ${bookmark?.sender?.key === currentUser?.key ? 'message from' : 'to message'}`}>
                                                    {bookmark.message}
                                                </p>
                                            </div>
                                            <span className={bookmark?.sender?.key === currentUser?.key ? 'timestamp from' : 'to timestamp'}>
                                                From {sender} on&nbsp;{' '}
                                                {moment(bookmark.timestamp, 'MM/DD/yyyy hh:mma').format('ddd, MMM DD (hh:mma)')}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* MESSAGES */}
                        {!showBookmarks && searchResults.length === 0 && (
                            <>
                                {/* ITERATE DEFAULT MESSAGES */}
                                <div id="default-messages">
                                    {Manager.IsValid(messagesToLoop) &&
                                        messagesToLoop.map((message, index) => {
                                            // Determine bookmark class
                                            let isBookmarked = Manager.IsValid(bookmarkedMessages?.find((x) => x.id === message?.id))
                                            const timestampDateOnly = moment(message?.timestamp, DatetimeFormats.timestamp).format(
                                                DatetimeFormats.dateForDb
                                            )
                                            const timestampTimeOnly = moment(message?.timestamp, DatetimeFormats.timestamp).format(
                                                DatetimeFormats.timeForDb
                                            )
                                            let convertedTime = DateManager.convertTime(
                                                timestampTimeOnly,
                                                message?.sender?.timezone,
                                                currentUser?.location?.timezone
                                            )
                                            let convertedTimestamp = moment(`${timestampDateOnly} ${convertedTime}`, DatetimeFormats.timestamp)
                                                .tz(currentUser?.location?.timezone)
                                                .format('ddd, MMMM Do (h:mma)')

                                            // Message Sent Today
                                            if (moment(message?.timestamp, DatetimeFormats.timestamp).isSame(moment(), 'day')) {
                                                convertedTimestamp = moment(message?.timestamp, DatetimeFormats.timestamp).format(
                                                    DatetimeFormats.timeForDb
                                                )
                                            }

                                            const fromOrTo = message?.sender?.key !== currentUser?.key ? 'from' : 'to'

                                            return (
                                                <div
                                                    key={index}
                                                    className={`message-wrapper ${DomManager.Animate.FadeInUp(messagesToLoop, '.message-wrapper')}`}
                                                    style={DomManager.AnimateDelayStyle(index, 0.002)}>
                                                    <div className="flex">
                                                        <p
                                                            {...bind(message?.id)}
                                                            data-id={message?.id}
                                                            className={message?.sender?.key !== currentUser?.key ? 'from message' : 'to message'}>
                                                            {message?.message}
                                                        </p>
                                                        {isBookmarked && (
                                                            <FaStar
                                                                className={
                                                                    message?.sender?.key !== currentUser?.key
                                                                        ? 'from bookmarked-icon'
                                                                        : 'to bookmarked-icon'
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                    <span className={message?.sender?.key !== currentUser?.key ? 'from timestamp' : 'to timestamp'}>
                                                        {convertedTimestamp} <MdOutlineArrowOutward className={fromOrTo} />
                                                    </span>
                                                </div>
                                            )
                                        })}
                                </div>

                                <div id="emotion-and-input-field">
                                    {/* EMOTION METER */}
                                    <div
                                        id="tone-wrapper"
                                        className={`${toneObject?.color} ${Manager.IsValid(toneObject) && Manager.IsValid(messageText, true) ? 'active' : ''}`}>
                                        <span className="emotion-text">EMOTION</span>
                                        <span className="icon">{toneObject?.icon}</span>
                                        <span className="tone">{StringManager.UppercaseFirstLetterOfAllWords(toneObject?.tone)}</span>
                                    </div>
                                    {/* MESSAGE INPUT & SEND BUTTON */}
                                    <div
                                        className={`message-input-field ${inputIsActive ? 'active' : ''}`}
                                        onFocus={(e) => e.target.classList.add('active')}
                                        onBlur={(e) => e.target.classList.remove('active')}>
                                        <div className={'flex'} id="message-input-container">
                                            <TextareaAutosize
                                                className={`${messageText?.length > 0 ? toneObject?.color : ''} message-input`}
                                                placeholder={'Message...'}
                                                onChange={async (e) => {
                                                    if (e.target.value.length > 1) {
                                                        await HandleMessageTyping(e)
                                                        setMessageText(e.target.value)
                                                    }
                                                }}
                                                onKeyUp={(e) => {
                                                    // Backspace
                                                    if (e.keyCode === 8) {
                                                        if (e.target.value === '') {
                                                            setMessageText('')
                                                            setToneObject(null)
                                                        }
                                                    }
                                                }}
                                            />
                                            {Manager.IsValid(recipient) && (
                                                <IoSend
                                                    className={`${toneObject?.color ? toneObject?.color : ''}`}
                                                    onClick={SendMessage}
                                                    id="send-button"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* DESKTOP SIDEBAR */}
                    {!DomManager.isMobile() && (
                        <div className="top-buttons top">
                            <p id="user-name">{StringManager.GetFirstNameOnly(recipient.name)}</p>
                            <p id="view-bookmarks" className="item menu-item" onClick={(e) => ViewBookmarks(e)}>
                                <PiBookmarksSimpleDuotone
                                    id="chat-bookmark-icon"
                                    className={showBookmarks ? 'material-icons  top-bar-icon' + ' active' : 'material-icons  top-bar-icon'}
                                />
                                {showBookmarks && <p>Hide Bookmarks</p>}
                                {!showBookmarks && bookmarkedMessages.length > 0 && <p>View Bookmarks</p>}
                                {bookmarkedMessages.length === 0 && !showBookmarks && <p>No Bookmarks</p>}
                            </p>
                            <InputField
                                inputType={InputTypes.text}
                                placeholder={'Find a message...'}
                                onChange={async (e) => {
                                    const inputValue = e.target.value
                                    if (inputValue.length === 0) {
                                        setSearchResults([])
                                        await DefineBookmarks()
                                    }
                                    if (inputValue.length > 2) {
                                        setSearchInputQuery(inputValue)
                                        const results = messagesToLoop?.filter(
                                            (x) => x?.message?.toLowerCase()?.indexOf(inputValue?.toLowerCase()) > -1
                                        )
                                        setBookmarkedMessages([])
                                        setSearchResults(results)
                                    }
                                }}
                                inputClasses="sidebar-search-input"
                            />
                        </div>
                    )}
                </>
            )}
        </>
    )
}

export default Chat