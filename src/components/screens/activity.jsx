import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import Manager from '@manager'
import '@prototypes'
import {
  confirmAlert,
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  successAlert,
  throwError,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../globalFunctions'
import { IoCheckmarkDoneOutline } from 'react-icons/io5'
import { PiChatsCircleDuotone, PiCheckFatDuotone } from 'react-icons/pi'
import { HiOutlineArrowRight } from 'react-icons/hi2'
import ScreenNames from '@screenNames'

export default function Activity() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, activitySet } = state
  const [chatSenders, setChatSenders] = useState([])

  useEffect(() => {
    Manager.showPageContainer()
  }, [])

  return (
    <>
      {/* CONTACT US */}
      <div id="activity-wrapper" className={`${theme} form page-container`}>
        <div className="flex" id="top-of-screen-bar">
          <p className="screen-title">Activity</p>
          <button className="clear-all">
            Clear All <IoCheckmarkDoneOutline />
          </button>
        </div>
        <div id="activity-cards" className="flex">
          {/* MESSAGES */}
          <div className="activity-card messages">
            <div id="top-of-card" className="flex">
              <div className="card-title">Messages</div>
              <div className="svg-wrapper">
                <PiCheckFatDuotone />
              </div>
            </div>
            <div className="flex count">
              <PiChatsCircleDuotone />
              <p className="count-number">{activitySet?.chat?.unreadMessageCount}</p>
            </div>
            <div className="flex view-button-wrapper">
              <button className="view-button" onClick={() => setState({ ...state, currentScreen: ScreenNames.chats })}>
                VIEW
                <HiOutlineArrowRight />
              </button>
            </div>
          </div>

          {/* EXPENSES */}
          <div className="activity-card expenses">
            <div id="top-of-card" className="flex">
              <div className="card-title">Expenses</div>
              <div className="svg-wrapper">
                <PiCheckFatDuotone />
              </div>
            </div>
          </div>

          {/* CAL */}
          <div className="activity-card calendar">
            <div id="top-of-card" className="flex">
              <div className="card-title">Calendar Events</div>
              <div className="svg-wrapper">
                <PiCheckFatDuotone />
              </div>
            </div>
          </div>

          {/* SWAPS */}
          <div className="activity-card swap-requests">
            <div id="top-of-card" className="flex">
              <div className="card-title">Swap Requests</div>
              <div className="svg-wrapper">
                <PiCheckFatDuotone />
              </div>
            </div>
          </div>

          {/* TRANSFER */}
          <div className="activity-card transfer-requests">
            <div id="top-of-card" className="flex">
              <div className="card-title">Transfer Requests</div>
              <div className="svg-wrapper">
                <PiCheckFatDuotone />
              </div>
            </div>
          </div>

          {/* DOCUMENTS */}
          <div className="documents activity-card">
            <div id="top-of-card" className="flex">
              <div className="card-title">Documents</div>
              <div className="svg-wrapper">
                <PiCheckFatDuotone />
              </div>
            </div>
          </div>

          {/* MEMORIES */}
          <div className="memories activity-card">
            <div id="top-of-card" className="flex">
              <div className="card-title">Memories</div>
              <div className="svg-wrapper">
                <PiCheckFatDuotone />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
