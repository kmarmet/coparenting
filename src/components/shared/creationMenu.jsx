import React, {useContext, useEffect, useState} from 'react'
import {BsCalendarWeekFill} from 'react-icons/bs'
import {FaDonate, FaFileUpload} from 'react-icons/fa'
import {FaArrowDown} from 'react-icons/fa6'
import {IoMdPhotos} from 'react-icons/io'
import {IoChatbubbles} from 'react-icons/io5'
import {MdSwapHorizontalCircle} from 'react-icons/md'
import {RiMapPinTimeFill} from 'react-icons/ri'
import {useSwipeable} from 'react-swipeable'
import CreationForms from '../../constants/creationForms'
import ScreenNames from '../../constants/screenNames'
import globalState from '../../context'
import useChats from '../../hooks/useChats'
import useCurrentUser from '../../hooks/useCurrentUser'
import ChatManager from '../../managers/chatManager'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'

const CreationMenu = () => {
    const {state, setState} = useContext(globalState)
    const {dateToEdit, showCreationMenu, refreshKey} = state
    const {chats} = useChats()
    const [showChatAction, setShowChatAction] = useState(false)
    const {currentUser} = useCurrentUser()

    const handlers = useSwipeable({
        swipeDuration: 300,
        preventScrollOnSwipe: true,
        onSwipedDown: () => {
            setState({...state, showCreationMenu: false, showOverlay: false})
        },
    })

    const CheckIfChatsShouldBeShown = async () => {
        const chattableKeys = await ChatManager.GetInactiveChatKeys(currentUser, chats).then((r) => r)
        if (Manager.IsValid(chattableKeys)) {
            setShowChatAction(true)
        } else {
            setShowChatAction(false)
        }
    }

    useEffect(() => {
        if (Manager.IsValid(chats)) {
            CheckIfChatsShouldBeShown().then((r) => r)
        }
    }, [chats, showCreationMenu])

    return (
        <div className={`bottom-card-wrapper creation-menu-wrapper${showCreationMenu ? ' active' : ''}`}>
            <div key={refreshKey} {...handlers} style={DomManager.AnimateDelayStyle(1, 0)} className={`creation-card bottom-card`}>
                <div className="action-items centered">
                    <p className="bottom-card-title">Create Resource</p>
                    {/* CALENDAR */}
                    <div
                        style={DomManager.AnimateDelayStyle(1)}
                        className={`action-item ${DomManager.Animate.FadeInUp(showCreationMenu, '.action-item')}`}
                        onClick={() => {
                            setState({
                                ...state,
                                showCreationMenu: false,
                                showOverlay: false,
                                creationFormToShow: CreationForms.calendar,
                                dateToEdit: dateToEdit,
                            })
                        }}>
                        <div className="content">
                            <p className="calendar">Calendar Event</p>
                            <div className="svg-wrapper calendar">
                                <BsCalendarWeekFill className={'calendar'} />
                            </div>
                        </div>
                    </div>

                    {currentUser?.accountType === 'parent' && (
                        <>
                            {/* EXPENSE */}
                            <div
                                style={DomManager.AnimateDelayStyle(2)}
                                className={`action-item ${DomManager.Animate.FadeInUp(showCreationMenu, '.action-item')}`}
                                onClick={() => {
                                    setState({...state, showCreationMenu: false, showOverlay: false, creationFormToShow: CreationForms.expense})
                                }}>
                                <div className="content">
                                    <p className="expense">Expense</p>
                                    <div className="svg-wrapper expense">
                                        <FaDonate className={'expense'} />
                                    </div>
                                </div>
                            </div>

                            {/* TRANSFER */}
                            <div
                                style={DomManager.AnimateDelayStyle(2.2)}
                                className={`action-item ${DomManager.Animate.FadeInUp(showCreationMenu, '.action-item')}`}
                                onClick={() => {
                                    setState({
                                        ...state,
                                        showCreationMenu: false,
                                        showOverlay: false,
                                        creationFormToShow: CreationForms.transferRequest,
                                    })
                                }}>
                                <div className="content">
                                    <p className="transfer">Transfer Change Request</p>
                                    <div className="svg-wrapper transfer">
                                        <RiMapPinTimeFill className={'transfer'} />
                                    </div>
                                </div>
                            </div>

                            {/* SWAPS */}
                            <div
                                style={DomManager.AnimateDelayStyle(2.4)}
                                className={`action-item ${DomManager.Animate.FadeInUp(showCreationMenu, '.action-item')}`}
                                onClick={() => {
                                    setState({...state, showCreationMenu: false, showOverlay: false, creationFormToShow: CreationForms.swapRequest})
                                }}>
                                <div className="content">
                                    <p className="swap">Swap Request</p>
                                    <div className="svg-wrapper swap">
                                        <MdSwapHorizontalCircle className={'swap'} />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* MEMORY */}
                    <div
                        style={DomManager.AnimateDelayStyle(2.6)}
                        className={`action-item ${DomManager.Animate.FadeInUp(showCreationMenu, '.action-item')}`}
                        onClick={() => {
                            setState({...state, showCreationMenu: false, showOverlay: false, creationFormToShow: CreationForms.memories})
                        }}>
                        <div className="content">
                            <p className="memory-icon">Memory</p>
                            <div className="svg-wrapper memory">
                                <IoMdPhotos className={'memory'} />
                            </div>
                        </div>
                    </div>

                    {currentUser?.accountType === 'parent' && (
                        <>
                            {/* CHAT */}
                            {showChatAction === true && (
                                <div
                                    style={DomManager.AnimateDelayStyle(2.8)}
                                    className={`action-item ${DomManager.Animate.FadeInUp(showCreationMenu, '.action-item')}`}
                                    onClick={() => {
                                        setState({
                                            ...state,
                                            showCreationMenu: false,
                                            showOverlay: false,
                                            currentScreen: ScreenNames.chats,
                                            creationFormToShow: CreationForms.chat,
                                        })
                                    }}>
                                    <div className="content">
                                        <p className="chat">Chat</p>
                                        <div className="svg-wrapper chat">
                                            <IoChatbubbles className={'chat'} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* DOCS */}
                            <div
                                style={DomManager.AnimateDelayStyle(3)}
                                className={`action-item ${DomManager.Animate.FadeInUp(showCreationMenu, '.action-item')}`}
                                onClick={() => {
                                    setState({...state, showCreationMenu: false, showOverlay: false, creationFormToShow: CreationForms.documents})
                                }}>
                                <div className="content">
                                    <p className="document">Document Upload</p>
                                    <div className="svg-wrapper document">
                                        <FaFileUpload className={'document'} />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    <div
                        style={DomManager.AnimateDelayStyle(3.5)}
                        onClick={() => setState({...state, showOverlay: false, showCreationMenu: false})}
                        className={`action-item close ${DomManager.Animate.FadeInUp(showCreationMenu, '.action-item')}`}>
                        <div className="content">
                            <p className="close">Close</p>
                            <div className="svg-wrapper close">
                                <FaArrowDown className={'close'} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CreationMenu