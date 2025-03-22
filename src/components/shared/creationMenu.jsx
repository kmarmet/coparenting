import React, { useContext } from 'react'
import BottomMenu from './bottomMenu'
import { IoIosArrowDown, IoMdPhotos } from 'react-icons/io'
import { Fade } from 'react-awesome-reveal'
import globalState from '../../context'
import { BsCalendarWeekFill } from 'react-icons/bs'
import { RiMapPinTimeFill } from 'react-icons/ri'
import { MdSwapHorizontalCircle } from 'react-icons/md'
import { FaDonate, FaFileUpload } from 'react-icons/fa'
import CreationForms from '../../constants/creationForms'

const CreationMenu = () => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  return (
    <BottomMenu>
      <div className="action-items creation">
        <Fade direction={'up'} className={'creation-fade-wrapper'} duration={400} triggerOnce={false} cascade={true} damping={0.2}>
          {/* CALENDAR */}
          <div
            className="action-item"
            onClick={() => {
              setState({ ...state, showBottomMenu: false, creationFormToShow: CreationForms.calendar })
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
              setState({ ...state, showBottomMenu: false, creationFormToShow: CreationForms.expense })
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
              setState({ ...state, showBottomMenu: false, creationFormToShow: CreationForms.transferRequest })
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
              setState({ ...state, showBottomMenu: false, creationFormToShow: CreationForms.memories })
            }}>
            <div className="content">
              <div className="svg-wrapper memory">
                <IoMdPhotos className={'memory'} />
              </div>
              <p className="memory">Memory</p>
            </div>
          </div>

          {/* SWAPS */}
          <div
            className="action-item"
            onClick={() => {
              setState({ ...state, showBottomMenu: false, creationFormToShow: CreationForms.swapRequest })
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
              setState({ ...state, showBottomMenu: false, creationFormToShow: CreationForms.documents })
            }}>
            <div className="content">
              <div className="svg-wrapper document">
                <FaFileUpload className={'document'} />
              </div>
              <p className="document">Document Upload</p>
            </div>
          </div>
        </Fade>
        <IoIosArrowDown className={'close-arrow'} onClick={() => setState({ ...state, showBottomMenu: false, creationFormToShow: '' })} />
      </div>
    </BottomMenu>
  )
}

export default CreationMenu