import React, {useContext, useEffect} from 'react'
import {IoMdPhotos} from 'react-icons/io'
import globalState from '../../context'
import {BsCalendarWeekFill} from 'react-icons/bs'
import {RiMapPinTimeFill} from 'react-icons/ri'
import {MdSwapHorizontalCircle} from 'react-icons/md'
import {FaDonate, FaFileUpload} from 'react-icons/fa'
import CreationForms from '../../constants/creationForms'
import {IoChatbubbles, IoClose} from 'react-icons/io5'
import Overlay from './overlay'

const CreationMenu = () => {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, showCreationMenu} = state

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
      <div className={`${showCreationMenu ? 'open' : 'closed'} bottom-menu-wrapper`}>
        <div className="action-items centered">
          <p className="bottom-menu-title">Select a Resource to Create </p>
          {/*<Fade direction={'right'} className={'fade-wrapper'} duration={800} triggerOnce={false} cascade={true} damping={0.2}>*/}
          {/* CALENDAR */}
          <div
            className="action-item"
            onClick={() => {
              setState({...state, showCreationMenu: false, creationFormToShow: CreationForms.calendar})
            }}>
            <div className="content">
              <div className="svg-wrapper calendar">
                <BsCalendarWeekFill className={'calendar'} />
              </div>
              <p className="calendar">Calendar Event</p>
            </div>
          </div>

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

          {/* CHAT */}
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
          {/*</Fade>*/}
          <IoClose className={'close-button'} onClick={() => setState({...state, showCreationMenu: false, creationFormToShow: ''})} />
        </div>
      </div>
    </Overlay>
  )
}

export default CreationMenu