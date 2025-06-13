import React, {useContext, useEffect, useState} from 'react'
import {BsCalendarWeekFill} from 'react-icons/bs'
import {FaDonate, FaFileUpload} from 'react-icons/fa'
import {IoMdPhotos} from 'react-icons/io'
import {IoChatbubbles} from 'react-icons/io5'
import {MdSwapHorizontalCircle} from 'react-icons/md'
import {RiMapPinTimeFill} from 'react-icons/ri'
import {useSwipeable} from 'react-swipeable'
import CreationForms from '../../constants/creationForms'
import globalState from '../../context'
import useChat from '../../hooks/useChat'
import useCurrentUser from '../../hooks/useCurrentUser'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import Overlay from './overlay'
import ScreenNames from '../../constants/screenNames'
import ChatManager from '../../managers/chatManager'

const CreationMenu = () => {
  const {state, setState} = useContext(globalState)
  const {dateToEdit, showCreationMenu, refreshKey} = state
  const {chats} = useChat()
  const [showChatAction, setShowChatAction] = useState(false)
  const {currentUser} = useCurrentUser()

  const handlers = useSwipeable({
    swipeDuration: 300,
    preventScrollOnSwipe: true,
    onSwipedDown: () => {
      setState({...state, showCreationMenu: false})
    },
  })

  const CheckIfChatsShouldBeShown = async () => {
    const chattableKeys = await ChatManager.GetInactiveChatKeys(currentUser, chats)
    if (Manager.IsValid(chattableKeys)) {
      setShowChatAction(true)
    } else {
      setShowChatAction(false)
    }
  }

  useEffect(() => {
    CheckIfChatsShouldBeShown().then((r) => r)
  }, [chats])

  useEffect(() => {
    const pageContainer = document.querySelector('.page-container')

    if (pageContainer) {
      if (showCreationMenu) {
        pageContainer.classList.add('disable-scroll')
      } else {
        pageContainer.classList.remove('disable-scroll')
      }
    }
  }, [showCreationMenu])

  return (
    <Overlay show={showCreationMenu}>
      <div className="slide-up-card-wrapper creation">
        <div className="swipe-bar"></div>
        <div
          key={refreshKey}
          {...handlers}
          style={DomManager.AnimateDelayStyle(1, 0)}
          className={`${DomManager.Animate.FadeInUp(showCreationMenu, 'faster')} bottom-menu-wrapper creation-menu fade-up-wrapper`}>
          <div className="action-items centered">
            <p className="slide-up-header">Create Resource</p>
            {/* CALENDAR */}
            <div
              key={Manager.GetUid()}
              style={DomManager.AnimateDelayStyle(1)}
              className={`action-item ${DomManager.Animate.FadeInUp(showCreationMenu, '.action-item')}`}
              onClick={() => {
                setState({...state, showCreationMenu: false, creationFormToShow: CreationForms.calendar, dateToEdit: dateToEdit})
              }}>
              <div className="content">
                <div className="svg-wrapper calendar">
                  <BsCalendarWeekFill className={'calendar'} />
                </div>
                <p className="calendar">Calendar Event</p>
              </div>
            </div>

            {currentUser?.accountType === 'parent' && (
              <>
                {/* EXPENSE */}
                <div
                  key={Manager.GetUid()}
                  style={DomManager.AnimateDelayStyle(2)}
                  className={`action-item ${DomManager.Animate.FadeInUp(showCreationMenu, '.action-item')}`}
                  onClick={() => {
                    setState({...state, showCreationMenu: false, creationFormToShow: CreationForms.expense})
                  }}>
                  <div className="content">
                    <div className="svg-wrapper expense">
                      <FaDonate className={'expense'} />
                    </div>
                    <p className="expense">Expense</p>
                  </div>
                </div>

                {/* TRANSFER */}
                <div
                  key={Manager.GetUid()}
                  style={DomManager.AnimateDelayStyle(2.2)}
                  className={`action-item ${DomManager.Animate.FadeInUp(showCreationMenu, '.action-item')}`}
                  onClick={() => {
                    setState({...state, showCreationMenu: false, creationFormToShow: CreationForms.transferRequest})
                  }}>
                  <div className="content">
                    <div className="svg-wrapper transfer">
                      <RiMapPinTimeFill className={'transfer'} />
                    </div>
                    <p className="transfer">Transfer Change Request</p>
                  </div>
                </div>

                {/* SWAPS */}
                <div
                  key={Manager.GetUid()}
                  style={DomManager.AnimateDelayStyle(2.4)}
                  className={`action-item ${DomManager.Animate.FadeInUp(showCreationMenu, '.action-item')}`}
                  onClick={() => {
                    setState({...state, showCreationMenu: false, creationFormToShow: CreationForms.swapRequest})
                  }}>
                  <div className="content">
                    <div className="svg-wrapper swap">
                      <MdSwapHorizontalCircle className={'swap'} />
                    </div>
                    <p className="swap">Swap Request</p>
                  </div>
                </div>
              </>
            )}

            {/* MEMORY */}
            <div
              key={Manager.GetUid()}
              style={DomManager.AnimateDelayStyle(2.6)}
              className={`action-item ${DomManager.Animate.FadeInUp(showCreationMenu, '.action-item')}`}
              onClick={() => {
                setState({...state, showCreationMenu: false, creationFormToShow: CreationForms.memories})
              }}>
              <div className="content">
                <div className="svg-wrapper memory">
                  <IoMdPhotos className={'memory'} />
                </div>
                <p className="memory">Memory</p>
              </div>
            </div>

            {currentUser?.accountType === 'parent' && (
              <>
                {/* CHAT */}
                {showChatAction === true && (
                  <div
                    key={Manager.GetUid()}
                    style={DomManager.AnimateDelayStyle(2.8)}
                    className={`action-item ${DomManager.Animate.FadeInUp(showCreationMenu, '.action-item')}`}
                    onClick={() => {
                      setState({...state, showCreationMenu: false, currentScreen: ScreenNames.chats, creationFormToShow: CreationForms.chat})
                    }}>
                    <div className="content">
                      <div className="svg-wrapper chat">
                        <IoChatbubbles className={'chat'} />
                      </div>
                      <p className="chat">Chat</p>
                    </div>
                  </div>
                )}

                {/* DOCS */}
                <div
                  key={Manager.GetUid()}
                  style={DomManager.AnimateDelayStyle(3)}
                  className={`action-item ${DomManager.Animate.FadeInUp(showCreationMenu, '.action-item')}`}
                  onClick={() => {
                    setState({...state, showCreationMenu: false, creationFormToShow: CreationForms.documents})
                  }}>
                  <div className="content">
                    <div className="svg-wrapper document">
                      <FaFileUpload className={'document'} />
                    </div>
                    <p className="document">Document Upload</p>
                  </div>
                </div>
              </>
            )}
            {/*<div id="close-icon-wrapper">*/}
            {/*  <IoClose className={'close-button'} onClick={() => setState({...state, showCreationMenu: false, creationFormToShow: ''})} />*/}
            {/*</div>*/}
          </div>
        </div>
      </div>
    </Overlay>
  )
}

export default CreationMenu