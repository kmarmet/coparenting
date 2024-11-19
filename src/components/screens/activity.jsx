import React, { useContext, useEffect } from 'react'
import globalState from '../../context'
import Manager from '@manager'
import '@prototypes'
import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../globalFunctions'
import {
  PiCalendarDotsDuotone,
  PiCarProfileDuotone,
  PiChatsCircleDuotone,
  PiImagesSquareDuotone,
  PiMoneyWavyDuotone,
  PiSwapDuotone,
} from 'react-icons/pi'
import { HiOutlineDocumentText } from 'react-icons/hi2'
import { IoCheckmarkDoneOutline } from 'react-icons/io5'
import ScreenNames from '@screenNames'

export default function Activity() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, activitySet } = state

  const addCardAnimation = () => {
    document.querySelectorAll('.activity-card').forEach((card, i) => {
      setTimeout(() => {
        setTimeout(() => {
          card.classList.add('active')
        }, 250 * i)
      }, 300)
    })
  }

  useEffect(() => {
    Manager.showPageContainer()
    addCardAnimation()
  }, [])

  return (
    <>
      {/* CONTACT US */}
      <div id="activity-wrapper" className={`${theme} form page-container`}>
        <p className="screen-title">Activity</p>
        <p className="intro-text mb-15">
          New activity from every item that you should always be in the know about. Tap on a row to view the new activity for that item.
        </p>
        <div id="activity-cards" className="flex">
          {/* MESSAGES */}
          <div className="activity-card messages" onClick={() => setState({ ...state, currentScreen: ScreenNames.chats })}>
            <p className="card-title">Messages</p>
            <PiChatsCircleDuotone />
            <p className="count-number">{activitySet?.unreadMessageCount}</p>
          </div>

          {/* EXPENSES */}
          <div className="activity-card expenses">
            <p className="card-title">Expenses</p>
            <PiMoneyWavyDuotone />
            <p className="count-number">{activitySet?.expenseCount}</p>
          </div>

          {/* CAL */}
          <div className="activity-card calendar">
            <p className="card-title">Calendar Events</p>
            <PiCalendarDotsDuotone />
            <p className="count-number">{activitySet?.eventCount}</p>
          </div>

          {/* SWAPS */}
          <div className="activity-card swap-requests">
            <p className="card-title">Swap Requests</p>
            <PiSwapDuotone />
            <p className="count-number">{activitySet?.swapRequestCount}</p>
          </div>

          {/* TRANSFER */}
          <div className="activity-card transfer-requests">
            <p className="card-title">Transfer Requests</p>
            <PiCarProfileDuotone />
            <p className="count-number">{activitySet?.transferRequestCount}</p>
          </div>

          {/* DOCUMENTS */}
          <div className="documents activity-card">
            <p className="card-title">Documents</p>
            <HiOutlineDocumentText />
            <p className="count-number">{activitySet?.documentCount}</p>
          </div>

          {/* MEMORIES */}
          <div className="memories activity-card">
            <p className="card-title">Memories</p>
            <PiImagesSquareDuotone />
            <p className="count-number">{activitySet?.memoryCount}</p>
          </div>
        </div>
        <button className="clear-all button green center default p-5 mt-15">
          Clear All <IoCheckmarkDoneOutline className={'ml-5'} />
        </button>
      </div>
    </>
  )
}