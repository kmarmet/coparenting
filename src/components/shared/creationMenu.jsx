import React, {useContext, useEffect, useState} from 'react'
import {BsCalendarWeekFill} from 'react-icons/bs'
import {FaDonate, FaFileUpload} from 'react-icons/fa'
import {IoMdPhotos} from 'react-icons/io'
import {IoChatbubbles, IoClose} from 'react-icons/io5'
import {MdSwapHorizontalCircle} from 'react-icons/md'
import {RiMapPinTimeFill} from 'react-icons/ri'
import CreationForms from '../../constants/creationForms'
import globalState from '../../context'
import DB_UserScoped from '../../database/db_userScoped'
import useChat from '../../hooks/useChat'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import Overlay from './overlay'

const CreationMenu = () => {
  const {state, setState} = useContext(globalState)
  const {dateToEdit, showCreationMenu, userIsLoggedIn, authUser} = state
  const {chats} = useChat()
  const [showChatAction, setShowChatAction] = useState(false)
  const [updatedCurrentUser, setUpdatedCurrentUser] = useState(null)

  const CheckIfChatsShouldBeShown = async () => {
    const activeChatCount = chats?.length
    await DB_UserScoped.getValidAccountsForUser(updatedCurrentUser).then((obj) => {
      const coparentOnlyAccounts = obj.filter((x) => Manager.isValid(x?.accountType) && x?.accountType === 'parent')
      if (activeChatCount < coparentOnlyAccounts.length) {
        setShowChatAction(true)
      }
    })
  }

  const UpdateCurrentUser = async () => {
    const updated = await DB_UserScoped.getCurrentUser(authUser?.email)
    setUpdatedCurrentUser(updated)
  }

  useEffect(() => {
    CheckIfChatsShouldBeShown().then((r) => r)
  }, [chats])

  useEffect(() => {
    const pageContainer = document.querySelector('.page-container')
    if (showCreationMenu) {
      DomManager.ToggleAnimation('add', 'action-item', DomManager.AnimateClasses.names.fadeInRight, 85)
    } else {
      DomManager.ToggleAnimation('remove', 'action-item', DomManager.AnimateClasses.names.fadeInRight, 85)
    }

    if (pageContainer) {
      if (showCreationMenu) {
        pageContainer.classList.add('disable-scroll')
      } else {
        pageContainer.classList.remove('disable-scroll')
      }
    }
  }, [showCreationMenu])

  useEffect(() => {
    if (userIsLoggedIn === true) {
      UpdateCurrentUser().then()
    }
  }, [userIsLoggedIn])

  return (
    <Overlay show={showCreationMenu}>
      <div
        className={`${showCreationMenu ? 'animate__animated animate__fadeInUp' : 'animate__animated animate__fadeOutDown'} bottom-menu-wrapper creation-menu`}>
        <div className="action-items centered">
          <p className="bottom-menu-title">What Would You Like to Create?</p>
          <hr />
          {/* CALENDAR */}
          <div
            className="action-item"
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

          {updatedCurrentUser?.accountType === 'parent' && (
            <>
              {/* EXPENSE */}
              <div
                className="action-item"
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
                className="action-item"
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
                className="action-item"
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
            className="action-item"
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

          {updatedCurrentUser?.accountType === 'parent' && (
            <>
              {/* CHAT */}
              {showChatAction === true && (
                <div
                  className="action-item"
                  onClick={() => {
                    setState({...state, showCreationMenu: false, creationFormToShow: CreationForms.chat})
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
                className="action-item"
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
          <div id="close-icon-wrapper">
            <IoClose className={'close-button'} onClick={() => setState({...state, showCreationMenu: false, creationFormToShow: ''})} />
          </div>
        </div>
      </div>
    </Overlay>
  )
}

export default CreationMenu