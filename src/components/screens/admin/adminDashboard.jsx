import React, { useState, useEffect, useContext, Fragment } from 'react'
import globalState from '../../../context'
import moment from 'moment'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  displayAlert,
  formatPhone,
  uniqueArray,
  getFileExtension,
  throwError,
  successAlert,
} from '../../../globalFunctions'
import AppManager from '../../../managers/appManager'
import DB from '@db'
import Manager from '@manager'
import DateFormats from '../../../constants/dateFormats'
import DB_UserScoped from '@userScoped'

export default function AdminDashboard() {
  const { state, setState } = useContext(globalState)
  const [chatRecoveryRequestEmail, setChatRecoveryRequestEmail] = useState('')
  const [chatRequests, setChatRequests] = useState([])
  const [getUserEmail, setGetUserEmail] = useState('')
  const [userToDisplayPhone, setUserToDisplayPhone] = useState(null)
  // eslint-disable-next-line no-undef
  new ClipboardJS('.chat-recovery-clipboard-button')

  const setNewUpdate = async () => {
    AppManager.setUpdateAvailable()
    successAlert('Updated')
  }
  const deletedExpiredCalEvents = async () => AppManager.deleteExpiredCalendarEvents().then((r) => r)
  const deleteExpiredMemories = async () => AppManager.deleteExpiredMemories().then((r) => r)
  const setHolidays = async () => AppManager.setHolidays()

  // CHAT RECOVERY REQUESTS
  const getChatRecoveryRequest = async () => {
    if (chatRecoveryRequestEmail.length === 0) {
      throwError("Enter the user's email")
    }
    const allRequests = Manager.convertToArray(await DB.getTable(DB.tables.chatRecoveryRequests))

    if (allRequests.length == 0) {
      throwError('No requests for that email currently')
      return false
    }
    const userRequests = allRequests.filter((x) => x.createdBy === chatRecoveryRequestEmail)
    setChatRequests(userRequests)
  }
  const deleteChatRecoveryRequest = async (request) => {
    await DB.delete(DB.tables.chatRecoveryRequests, request.id)
    await getChatRecoveryRequest()
    successAlert('Request Deleted')
  }

  const getUser = async () => {
    if (getUserEmail.length === 0) {
      throwError('Enter email')
      return false
    }
    const users = Manager.convertToArray(await DB.getTable(DB.tables.users))
    const user = users.filter((x) => x.email === getUserEmail)[0]
    if (!user) {
      throwError('No user found')
    }
    if (user) {
      setUserToDisplayPhone(user.phone)
    }
  }

  return (
    <div id="admin-dashboard-wrapper" className="page-container form">
      <div className="flex grid gap-10">
        {/* GET USER */}
        <div className="box">
          <p className="box-title">Get User from Database</p>
          <input type="email" onChange={(e) => setGetUserEmail(e.target.value)} placeholder="User's Email Addresss" className="mb-15" />
          <button className="center button  mb-15" onClick={getUser}>
            Get User
          </button>
          {userToDisplayPhone && (
            <a
              target="_blank"
              href={` https://console.firebase.google.com/project/coparenting-app-aa9f9/database/coparenting-app-aa9f9-default-rtdb/data/~2Fusers~2F${userToDisplayPhone}`}>
              Go to User
            </a>
          )}
        </div>

        {/* SET UPDATE AVAILABLE */}
        <div className="box">
          <p className="box-title">Set Update Available</p>
          <button className="button center" onClick={setNewUpdate}>
            Update
          </button>
        </div>

        {/* DELETE EXPIRED STUFF */}
        <div className="box">
          <p className="box-title">Delete Expired</p>
          <div className="buttons flex gap-10">
            <button className="button" onClick={deleteExpiredMemories}>
              Memories
            </button>
            <button className="button" onClick={deletedExpiredCalEvents}>
              Events
            </button>
          </div>
        </div>

        {/* SET HOLIDAYS */}
        <div className="box">
          <p className="box-title">Set Holidays</p>
          <div className="buttons flex">
            <button className="button center" onClick={setHolidays}>
              Add to Cal
            </button>
          </div>
        </div>

        {/* CHAT RECOVERY SIGNATURE IMAGE/TIMESTAMP */}
        <div className="box">
          <p className="box-title">Chat Recovery</p>
          <input type="email" placeholder="User's Email Address" onChange={(e) => setChatRecoveryRequestEmail(e.target.value)} />
          <div className="buttons flex mt-10">
            <button className="button  center" onClick={getChatRecoveryRequest}>
              Get Chat Requests
            </button>
          </div>
          {Manager.isValid(chatRequests, true) &&
            chatRequests.map((request, index) => {
              return (
                <div key={index} className="data-ui">
                  <p>
                    <b className="prop">Created by:</b> {request.createdBy}
                  </p>
                  <p>
                    <b className="prop">Timestamp:</b> {moment(request.timestamp, DateFormats.fullDatetime).format(DateFormats.readableDatetime)}
                  </p>
                  <a className="mt-15" href={request.signatureImageUrl} target="_blank">
                    Go to Signature Image
                  </a>
                  <p className="mt-15">
                    <b className="prop">Members</b>
                  </p>
                  <div className="data-subset">
                    {Manager.isValid(request.members, true) &&
                      request.members.map((member, memberIndex) => {
                        return (
                          <>
                            <div className="chat-recovery-request-member" key={memberIndex}>
                              <p>
                                <b className="subset-prop">User:</b> {member.name}
                              </p>
                              <p>
                                <b className="subset-prop">User Phone:</b> {member.phone}
                              </p>
                            </div>
                            <hr />
                          </>
                        )
                      })}
                    <buttons className="flex buttons">
                      <button className="red" onClick={() => deleteChatRecoveryRequest(request)}>
                        Delete <span className="material-icons-round">remove</span>
                      </button>
                      <button className="chat-recovery-clipboard-button" data-clipboard-target=".data-ui">
                        <span className="material-icons-round">content_copy</span>
                      </button>
                    </buttons>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
