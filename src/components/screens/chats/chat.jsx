// Path: src\components\screens\chats\chat.jsx
import moment from "moment-timezone"
import React, {useContext, useEffect, useMemo, useRef, useState} from "react"
import {BsBookmarkDashFill, BsFillBookmarksFill, BsFillBookmarkStarFill} from "react-icons/bs"
import {IoChevronBack, IoCopy, IoSend} from "react-icons/io5"
import {MdCancel, MdOutlineArrowOutward, MdOutlineSearchOff} from "react-icons/md"
import {PiBookmarksSimpleDuotone} from "react-icons/pi"
import {TbMessageCircleSearch} from "react-icons/tb"
import TextareaAutosize from "react-textarea-autosize"
import {useLongPress} from "use-long-press"
import DatetimeFormats from "../../../constants/datetimeFormats"
import InputTypes from "../../../constants/inputTypes"
import ActivityCategory from "../../../constants/updateCategory"
import globalState from "../../../context.js"
import useChatMessages from "../../../hooks/useChatMessages"
import useChats from "../../../hooks/useChats"
import useCurrentUser from "../../../hooks/useCurrentUser"
import AlertManager from "../../../managers/alertManager"
import AppManager from "../../../managers/appManager"
import ChatManager from "../../../managers/chatManager.js"
import DatasetManager from "../../../managers/datasetManager"
import DateManager from "../../../managers/dateManager"
import DomManager from "../../../managers/domManager"
import Manager from "../../../managers/manager"
import StringManager from "../../../managers/stringManager.coffee"
import UpdateManager from "../../../managers/updateManager"
import ChatMessage from "../../../models/chat/chatMessage"
import Form from "../../shared/form"
import InputField from "../../shared/inputField"

const Chat = ({show, hide, recipient}) => {
    const {state, setState} = useContext(globalState)
    const {theme, refreshKey} = state

    // HOOKS
    const {currentUser} = useCurrentUser()
    const [chatId, setChatId] = useState()
    const {chatMessages} = useChatMessages(chatId)
    const {chats, chatsAreLoading} = useChats()

    // STATE
    const [searchResults, setSearchResults] = useState([])
    const [showSearchInput, setShowSearchInput] = useState(false)
    const [showBookmarks, setShowBookmarks] = useState(false)
    const [showSearchCard, setShowSearchCard] = useState(false)
    const [messageText, setMessageText] = useState("")
    const [searchInputQuery, setSearchInputQuery] = useState("")
    const [toneObject, setToneObject] = useState({})
    const [inSearchMode, setInSearchMode] = useState(false)
    const [inputIsActive, setInputIsActive] = useState()
    const [bookmarkedMessagesToIterate, setBookmarkedMessagesToIterate] = useState([])
    const [bookmarks, setBookmarks] = useState([])
    const [showLongPressMenu, setShowLongPressMenu] = useState(false)
    const [activeMessage, setActiveMessage] = useState()
    const [messagesToLoop, setMessagesToLoop] = useState(chatMessages)

    // Refs
    const messageWrapperRef = useRef(null)

    // Handle long press
    const bind = useLongPress((element) => {
        const message = element.target
        const messageId = message?.getAttribute("data-id")
        const thisMessage = messagesToLoop.find((x) => x.id === messageId)
        if (Manager.IsValid(thisMessage?.message)) {
            setActiveMessage(thisMessage)
            setTimeout(() => {
                setShowLongPressMenu(true)
            }, 500)
        }
    })

    // Get chat
    const chat = useMemo(() => chats.find((c) => c?.members?.some((m) => m?.key === recipient?.key)), [chats, recipient?.key])

    const ToggleBookmark = async () => {
        await ChatManager.ToggleMessageBookmark(currentUser, recipient, activeMessage?.id, chat?.id, bookmarks).finally(async () => {
            await DefineBookmarks()
        })
    }

    const HideKeyboard = () => {
        const messageInputForm = document.querySelector(".message-input-field")
        messageInputForm.classList.remove("active")
        Manager.HideKeyboard("message-input-field")
        const input = document.querySelector(".message-input")
        if (input) {
            input.blur()
        }
    }

    const SendMessage = async () => {
        console.log(toneObject?.tone)
        // Validate message
        if (!Manager.IsValid(messageText, true) || messageText.length <= 1) {
            AlertManager.throwError("Please enter a message longer than one character (letter, number, or symbol)")
            return
        }

        if (toneObject?.tone === "angry") {
            AlertManager.confirmAlert({
                title: "This Message Expresses Anger",
                html: "Are you sure you want to send this message?",
                bg: "#c71436",
                color: "white",
                onConfirm: async () => {
                    // Close Keyboard -> hide message input
                    HideKeyboard()

                    // Clear input field (if using uncontrolled input)
                    const input = document.querySelector(".message-input")
                    if (input) input.value = ""

                    // Extract common sender/recipient data
                    const {name: senderName, key: senderKey, location} = currentUser ?? {}
                    const {name: recipientName, key: recipientKey} = recipient ?? {}

                    const sender = {name: senderName, key: senderKey}

                    // Build ChatMessage
                    const chatMessage = new ChatMessage()
                    chatMessage.sender = {
                        ...sender,
                        timezone: location?.timezone ?? "UTC",
                    }
                    chatMessage.recipient = {
                        name: recipientName,
                        key: recipientKey,
                    }
                    chatMessage.message = StringManager.SanitizeString(messageText)

                    // Insert message into existing or new chat
                    if (Manager.IsValid(chat)) {
                        await ChatManager.InsertChatMessage(chat?.id, chatMessage)
                    } else {
                        const newChatUid = await ChatManager.CreateAndInsertChat(sender, chatMessage.recipient)
                        await ChatManager.InsertChatMessage(newChatUid, chatMessage)
                    }

                    // Send notification if recipient isn't paused
                    if (!chat?.isPausedFor?.includes(recipientKey)) {
                        UpdateManager.SendUpdate(
                            "🗯️ New Message",
                            `${StringManager.GetFirstNameOnly(senderName ?? "Someone")} Messaged You`,
                            recipientKey,
                            currentUser,
                            ActivityCategory.chats
                        )
                    }

                    // Reset message UI state
                    setMessageText("")
                    setTimeout(() => setToneObject(null), 300)
                    ScrollToLatestMessage()
                },
            })
        }
    }

    const ViewBookmarks = () => {
        if (bookmarkedMessagesToIterate.length > 0) {
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
            setBookmarkedMessagesToIterate(bookmarksToLoop)
        } else {
            setShowBookmarks(false)
            setBookmarkedMessagesToIterate([])
        }
    }

    const ScrollToLatestMessage = () => {
        if (!messageWrapperRef.current || !messageWrapperRef.current.scrollHeight) return
        const scrollToBottom = () => {
            if (!messageWrapperRef.current || !messageWrapperRef.current.scrollHeight) return
            messageWrapperRef.current.scrollTo({
                top: messageWrapperRef.current.scrollHeight,
                behavior: "smooth",
            })
        }

        // Let the browser paint, then scroll
        setTimeout(() => {
            requestAnimationFrame(scrollToBottom)
        }, 100)
    }

    const HandleMessageTyping = async () => {
        const messageInput = document.querySelector(".message-input")
        const value = messageInput.value

        if (value.indexOf(" ") > -1) {
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

        // setMessageTimezone(timezone)
    }

    const GetMessageDisplayText = (message, bookmarkedMessages, currentUser) => {
        const userTimezone = currentUser?.location?.timezone
        const senderTimezone = message?.sender?.timezone

        // Quick validation
        if (!message?.timestamp || !userTimezone) {
            return {isBookmarked: false, convertedTimestamp: ""}
        }

        const parsed = moment(message.timestamp, DatetimeFormats.timestamp)
        const isBookmarked = bookmarkedMessages?.some((x) => x.id === message.id) ?? false

        // If sent today, return just the time
        if (parsed.isSame(moment(), "day")) {
            return {
                isBookmarked,
                convertedTimestamp: parsed.format(DatetimeFormats.timeForDb),
            }
        }

        // Convert sender time → recipient time
        const dateForDb = parsed.format(DatetimeFormats.dateForDb)
        const timeForDb = parsed.format(DatetimeFormats.timeForDb)

        const convertedTime = DateManager.convertTime(timeForDb, senderTimezone, userTimezone)

        const convertedTimestamp = moment(`${dateForDb} ${convertedTime}`, DatetimeFormats.timestamp).tz(userTimezone).format("MMMM Do (h:mma)")

        return {isBookmarked, convertedTimestamp}
    }

    // ON CHAT CHANGE
    useEffect(() => {
        // Run on initial load OR when search closes
        const isSearchClosed = !showSearchInput

        if (Manager.IsValid(chat) && isSearchClosed) {
            setChatId(chat?.id)
        }
    }, [chat, showBookmarks, showSearchInput])

    useEffect(() => {
        if (Manager.IsValid(chatId)) {
            void DefineBookmarks()
            ScrollToLatestMessage()
        }
    }, [chatId])

    // ON PAGE LOAD
    useEffect(() => {
        const appContainer = document.querySelector(".App")
        const appContent = document.getElementById("app-content-with-sidebar")
        if (appContent && appContainer) {
            appContent.classList.add("disable-scroll")
            appContainer.classList.add("disable-scroll")
        }

        // FOCUS/BLUR INPUT
        const input = document.querySelector(".message-input")

        if (input) {
            input.focus()
            input.addEventListener("focus", () => {
                setInputIsActive(true)
            })
            input.addEventListener("blur", () => {
                setInputIsActive(false)
            })
        }

        DefineMessageTimezone().then((r) => r)
    }, [])

    // ON SEARCH RESULTS CHANGE
    useEffect(() => {
        const container = document.querySelector(".search-results")

        if (!Manager.IsValid(container)) return

        const hasResults = searchResults.length > 0

        container.classList.toggle("active", hasResults)

        // Only clear if it’s already populated
        if (!hasResults && searchResults.length !== 0) {
            // setSearchResults([])
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
            DomManager.ToggleAnimation("add", "bookmark-message", DomManager.AnimateClasses.names.fadeInUp)
        }
    }, [showBookmarks])

    return (
        <>
            <Form
                title={"Search"}
                className="conversation-search-card"
                wrapperClass="conversation-search"
                submitText={"Search"}
                submitIcon={<TbMessageCircleSearch />}
                showCard={showSearchCard}
                showOverlay={false}
                onSubmit={() => {
                    if (searchInputQuery.length === 0) {
                        AlertManager.throwError("Please enter a search value")
                        return false
                    }
                    const results = messagesToLoop?.filter((x) => x.message.toLowerCase().indexOf(searchInputQuery.toLowerCase()) > -1) || []
                    setBookmarkedMessagesToIterate([])
                    setSearchResults(results)
                    setSearchInputQuery("")
                    setInSearchMode(true)
                    setShowSearchCard(false)
                }}
                onClose={() => {
                    setShowSearchInput(false)
                    setShowSearchCard(false)
                    setInSearchMode(false)
                    setSearchResults([])
                    setSearchInputQuery("")
                    ScrollToLatestMessage()
                }}>
                <InputField
                    defaultValue={searchInputQuery}
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
                <div key={refreshKey} id="chat-wrapper" className={`${theme} conversation`}>
                    {/* LONG PRESS MENU */}
                    {showLongPressMenu && (
                        <div className="long-press-menu">
                            <button
                                id="copy"
                                onClick={() => {
                                    navigator.clipboard.writeText(Manager.IsValid(activeMessage) ? activeMessage?.message : "")
                                    setShowLongPressMenu(false)
                                    setState({...state, successAlertMessage: "Message Copied"})
                                }}>
                                Copy <IoCopy />
                            </button>
                            <button
                                id="bookmark"
                                className={`${Manager.IsValid(bookmarkedMessagesToIterate?.find((x) => x?.id === activeMessage?.id)) ? "remove" : "add"}`}
                                onClick={(e) => {
                                    const isBookmarked = Manager.IsValid(bookmarkedMessagesToIterate?.find((x) => x?.id === activeMessage?.id))
                                    const parentNode = e.currentTarget.parentNode

                                    // eslint-disable-line no-undef
                                    parentNode.classList.remove("active") // eslint-disable-line no-undef
                                    ToggleBookmark(isBookmarked).then((r) => r)
                                    setShowLongPressMenu(false)
                                }}>
                                {Manager.IsValid(bookmarkedMessagesToIterate?.find((x) => x?.id === activeMessage?.id))
                                    ? "Remove Bookmark"
                                    : "Add Bookmark"}
                                {Manager.IsValid(bookmarkedMessagesToIterate?.find((x) => x?.id === activeMessage?.id)) ? (
                                    <BsBookmarkDashFill />
                                ) : (
                                    <BsFillBookmarkStarFill />
                                )}
                            </button>

                            <button
                                id="cancel"
                                onClick={(e) => {
                                    const parentNode = e.currentTarget.parentNode
                                    parentNode.classList.remove("active")
                                    setShowLongPressMenu(false)
                                }}>
                                Cancel <MdCancel className={"cancel-icon"} />
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
                                        id={"close-search-icon"}
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

                                {bookmarkedMessagesToIterate.length > 0 && (
                                    <BsFillBookmarksFill
                                        id="chat-bookmark-icon"
                                        className={showBookmarks ? "material-icons  top-bar-icon" + " active" : "material-icons  top-bar-icon"}
                                        onClick={ViewBookmarks}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* SEARCH RESULTS */}
                    {searchResults.length > 0 && (
                        <div id="messages" className="search-results">
                            {Manager.IsValid(searchResults) &&
                                searchResults.map((messageObj, index) => {
                                    const fromOrTo = messageObj?.sender?.key !== currentUser?.key ? "from" : "to"

                                    return (
                                        <div
                                            key={messageObj?.id}
                                            className={`message-wrapper search-message-wrapper ${DomManager.Animate.FadeInUp(searchResults, ".message-wrapper")}`}
                                            style={DomManager.AnimateDelayStyle(index, 0.002)}>
                                            <p className={fromOrTo === "from" ? "message from" : "to message"}>{messageObj.message}</p>
                                            <span className={fromOrTo === "from" ? "timestamp from" : "to timestamp"}>
                                                {moment(messageObj.timestamp, "MM/DD/yyyy hh:mma").format("ddd, MMM DD (hh:mma)")}
                                                <MdOutlineArrowOutward className={fromOrTo} />
                                            </span>
                                        </div>
                                    )
                                })}
                        </div>
                    )}

                    {/* BOOKMARKED MESSAGES */}
                    {Manager.IsValid(bookmarkedMessagesToIterate) && showBookmarks && (
                        <div id="bookmark-messages" className="bookmark-results">
                            {bookmarkedMessagesToIterate.map((bookmark, index) => {
                                let sender

                                if (bookmark?.sender?.key === currentUser?.key) {
                                    sender = "ME"
                                } else {
                                    sender = StringManager.GetFirstNameOnly(bookmark.sender?.name)
                                }
                                return (
                                    <div {...bind()} key={bookmark?.id} className={"message-wrapper bookmark-message"}>
                                        {/* LONG-PRESS MENU */}
                                        {showLongPressMenu && (
                                            <div className="long-press-menu">
                                                <button
                                                    id="copy"
                                                    onClick={(e) => {
                                                        setState({...state, successAlertMessage: "Message Copied"})
                                                        const parentNode = e.currentTarget.parentNode
                                                        const message = parentNode.parentNode.querySelector(".message")
                                                        navigator.clipboard.writeText(message.textContent)
                                                        parentNode.classList.remove("active")
                                                    }}>
                                                    Copy <IoCopy />
                                                </button>
                                                <button
                                                    id="bookmark"
                                                    onClick={(e) => {
                                                        const parentNode = e.currentTarget.parentNode
                                                        parentNode.classList.remove("active")

                                                        ToggleBookmark(bookmark).then((r) => r)
                                                    }}>
                                                    Remove Bookmark
                                                    <BsBookmarkDashFill className={"active"} />
                                                </button>

                                                <button
                                                    id="cancel"
                                                    onClick={(e) => {
                                                        const parentNode = e.currentTarget.parentNode

                                                        parentNode.classList.remove("active")
                                                    }}>
                                                    Cancel <MdCancel className={"cancel-icon"} />
                                                </button>
                                            </div>
                                        )}
                                        <div className={`flex`}>
                                            <p
                                                style={DomManager.AnimateDelayStyle(index)}
                                                className={`${DomManager.Animate.FadeInUp(bookmark, ".message-wrapper")} ${bookmark?.sender?.key === currentUser?.key ? "message from" : "to message"}`}>
                                                {bookmark.message}
                                            </p>
                                        </div>
                                        <span className={bookmark?.sender?.key === currentUser?.key ? "timestamp from" : "to timestamp"}>
                                            From {sender} on&nbsp; {moment(bookmark.timestamp, "MM/DD/yyyy hh:mma").format("ddd, MMM DD (hh:mma)")}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* ITERATE DEFAULT MESSAGES */}
                    {!showBookmarks && searchResults.length === 0 && (
                        <div id="default-messages" ref={messageWrapperRef}>
                            {Manager.IsValid(messagesToLoop) &&
                                messagesToLoop.map((message, index) => {
                                    const {isBookmarked, convertedTimestamp} = GetMessageDisplayText(
                                        message,
                                        bookmarkedMessagesToIterate,
                                        currentUser
                                    )
                                    const fromOrTo = message?.sender?.key !== currentUser?.key ? "from" : "to"
                                    return (
                                        <div
                                            key={message?.id}
                                            className={`message-wrapper ${DomManager.Animate.FadeInUp(messagesToLoop, ".message-wrapper")}`}
                                            style={DomManager.AnimateDelayStyle(index, 0.002)}>
                                            <div className="flex">
                                                <p
                                                    {...bind(message?.id)}
                                                    data-id={message?.id}
                                                    className={message?.sender?.key !== currentUser?.key ? "from message" : "to message"}>
                                                    {message?.message}
                                                </p>
                                                {isBookmarked && (
                                                    <BsFillBookmarkStarFill
                                                        className={
                                                            message?.sender?.key !== currentUser?.key ? "from bookmarked-icon" : "to bookmarked-icon"
                                                        }
                                                    />
                                                )}
                                            </div>
                                            <span className={message?.sender?.key !== currentUser?.key ? "from timestamp" : "to timestamp"}>
                                                {convertedTimestamp}
                                                <MdOutlineArrowOutward className={fromOrTo} />
                                            </span>
                                        </div>
                                    )
                                })}
                        </div>
                    )}

                    {/* EMOTION METER - MESSAGE INPUT */}
                    {Manager.IsValid(chat) && !chat?.isPausedFor.includes(currentUser?.key) && (
                        <div id="emotion-and-input-field">
                            {/* EMOTION METER */}
                            <div
                                id="tone-wrapper"
                                className={`${toneObject?.color} ${Manager.IsValid(toneObject) && Manager.IsValid(messageText, true) ? "active" : ""}`}>
                                <span className="emotion-text">EMOTION</span>
                                <span className="icon">{toneObject?.icon}</span>
                                <span className="tone">{StringManager.UppercaseFirstLetterOfAllWords(toneObject?.tone)}</span>
                            </div>
                            {/* MESSAGE INPUT & SEND BUTTON */}
                            <div
                                className={`message-input-field ${inputIsActive ? "active" : ""}`}
                                onFocus={(e) => e.target.classList.add("active")}
                                onBlur={(e) => e.target.classList.remove("active")}>
                                <div className={"flex"} id="message-input-container">
                                    <TextareaAutosize
                                        className={`${messageText?.length > 0 ? toneObject?.color : ""} message-input`}
                                        placeholder={"Message..."}
                                        onChange={async (e) => {
                                            if (e.target.value.length > 1) {
                                                await HandleMessageTyping(e)
                                                setMessageText(e.target.value)
                                            }
                                        }}
                                        onKeyUp={(e) => {
                                            // Backspace
                                            if (e.keyCode === 8) {
                                                if (e.target.value === "") {
                                                    setMessageText("")
                                                    setToneObject(null)
                                                }
                                            }
                                        }}
                                    />
                                    {Manager.IsValid(recipient) && (
                                        <IoSend className={`${toneObject?.color ? toneObject?.color : ""}`} onClick={SendMessage} id="send-button" />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {Manager.IsValid(chat) && chat?.isPausedFor.includes(currentUser?.key) && (
                        <p id={"chat-paused-message"}>Chat Paused - Read Only</p>
                    )}

                    {/* DESKTOP SIDEBAR */}
                    {!DomManager.isMobile() && (
                        <div className="top-buttons top">
                            <p id="user-name">{StringManager.GetFirstNameOnly(recipient.name)}</p>
                            <p id="view-bookmarks" className="item menu-item" onClick={(e) => ViewBookmarks(e)}>
                                <PiBookmarksSimpleDuotone
                                    id="chat-bookmark-icon"
                                    className={showBookmarks ? "material-icons  top-bar-icon" + " active" : "material-icons  top-bar-icon"}
                                />
                                {showBookmarks && <p>Hide Bookmarks</p>}
                                {!showBookmarks && bookmarkedMessagesToIterate.length > 0 && <p>View Bookmarks</p>}
                                {bookmarkedMessagesToIterate.length === 0 && !showBookmarks && <p>No Bookmarks</p>}
                            </p>
                            <InputField
                                inputType={InputTypes.text}
                                placeholder={"Find a message..."}
                                onChange={async (e) => {
                                    const inputValue = e.target.value
                                    if (inputValue.length > 2) {
                                        setSearchInputQuery(inputValue)
                                        setBookmarkedMessagesToIterate([])
                                    }
                                }}
                                inputClasses="sidebar-search-input"
                            />
                        </div>
                    )}
                </div>
            )}
        </>
    )
}

export default Chat