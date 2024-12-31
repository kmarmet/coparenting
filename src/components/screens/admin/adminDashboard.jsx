import React, { useContext, useState } from 'react'
import globalState from '../../../context'
import moment from 'moment'
import { child, getDatabase, ref, set, update } from 'firebase/database'

import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  formatPhone,
  getFileExtension,
  getFirstWord,
  hasClass,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import AppManager from '../../../managers/appManager'
import DB from '@db'
import Manager from '@manager'
import DateFormats from '../../../constants/dateFormats'
import CheckboxGroup from '../../shared/checkboxGroup'
import DateManager from '../../../managers/dateManager'
import NavBar from '../../navBar'
import AlertManager from '../../../managers/alertManager'

export default function AdminDashboard() {
  const { state, setState, currentUser } = useContext(globalState)
  const [chatRecoveryRequestEmail, setChatRecoveryRequestEmail] = useState('')
  const [chatRequests, setChatRequests] = useState([])
  const [getUserEmail, setGetUserEmail] = useState('')
  const [userToDisplayPhone, setUserToDisplayPhone] = useState(null)
  const [getRecordsEvents, setGetRecordsEvents] = useState([])
  const [getRecordsTable, setGetRecordsTable] = useState('')
  const [getRecordsSearchValue, setGetRecordsSearchValue] = useState('')
  const [tableName, setTableName] = useState(DB.tables.calendarEvents)
  const [dbTables, setDbTables] = useState(Object.values(DB.tables).sort())
  const [remainingTextBeltTexts, setRemainingTextBeltTexts] = useState(0)
  // eslint-disable-next-line no-undef
  new ClipboardJS('.chat-recovery-clipboard-button')

  const deletedExpiredCalEvents = async () => AppManager.deleteExpiredCalendarEvents().then((r) => r)
  const deleteExpiredMemories = async () => AppManager.deleteExpiredMemories().then((r) => r)
  const setHolidays = async () => DateManager.setHolidays()

  // CHAT RECOVERY REQUESTS
  const getChatRecoveryRequest = async () => {
    if (chatRecoveryRequestEmail.length === 0) {
      AlertManager.throwError("Enter the user's email")
    }
    const allRequests = Manager.convertToArray(await DB.getTable(DB.tables.chatRecoveryRequests))

    if (allRequests.length == 0) {
      AlertManager.throwError('No requests for that email currently')
      return false
    }
    const userRequests = allRequests.filter((x) => x.createdBy === chatRecoveryRequestEmail)
    setChatRequests(userRequests)
  }
  const deleteChatRecoveryRequest = async (request) => {
    await DB.delete(DB.tables.chatRecoveryRequests, request.id)
    await getChatRecoveryRequest()
    AlertManager.successAlert('Request Deleted')
  }

  const getUser = async () => {
    if (getUserEmail.length === 0) {
      AlertManager.throwError('Enter email')
      return false
    }
    const users = Manager.convertToArray(await DB.getTable(DB.tables.users))
    const user = users.filter((x) => x.email === getUserEmail)[0]
    if (!user) {
      AlertManager.throwError('No user found')
    }
    if (user) {
      setUserToDisplayPhone(user.phone)
    }
  }

  const appendGetRecordsCode = async () => {
    if (getRecordsTable === 'Calendar') {
      const events = await DB.getTable(DB.tables.calendarEvents)
      const scoped = events.filter((x) => x.title.toLowerCase().contains(getRecordsSearchValue.toLowerCase()))
      console.log(scoped)
      scoped.forEach((event) => {
        Object.entries(event).forEach(([key, value], index) => {
          const el = document.createElement('p')
          if (value.length === 0) {
            el.innerHTML = `<span class='key empty'>${key}</span>:<span class="value">${value}</span>`.replace(':', ': ')
          } else {
            el.innerHTML = `<span class='key'}>${key}</span>:<span class="value">${value}</span>`.replace(':', ': ')
          }

          document.querySelector('#code-block').appendChild(el)

          if (index === scoped.length - 1) {
            el.innerHTML += `<hr/>`
          }
        })
      })
    }
    if (getRecordsTable === 'Users') {
      const users = await DB.getTable(DB.tables.users)
      let scoped = users.filter((x) => x.name.toLowerCase().contains(getRecordsSearchValue.toLowerCase()))[0]
      scoped = flattenObject(scoped)
      Object.entries(scoped).forEach(([key, value], index) => {
        const el = document.createElement('p')
        if (value.length === 0) {
          el.innerHTML = `<span class='key empty'>${key}</span>:<span class="value">${value}</span>`.replace(':', ': ')
        } else {
          if (value.toString().contains('http')) {
            console.log(value)
            el.innerHTML = `<span class='key'}>${key}</span>:<a href=${value} target="_blank" class="value link">${value}</a>`.replace(':', ': ')
          } else {
            el.innerHTML = `<span class='key'}>${key}</span>:<span class="value">${value}</span>`.replace(':', ': ')
          }
        }
        document.querySelector('#code-block').appendChild(el)
      })
    }

    document.querySelectorAll('.key').forEach((key) => {
      key.addEventListener('click', (e) => {
        const parent = e.target.parentNode
        if (parent.querySelector('.value').classList.contains('active')) {
          parent.querySelector('.value').classList.remove('active')
        } else {
          parent.querySelector('.value').classList.add('active')
        }
      })
    })
  }

  const addDailySummariesToAllUsers = async (prop, value) => {
    const dbRef = getDatabase()

    const allUsers = await DB.getTable(DB.tables.users)
    for (let user of allUsers) {
      let updatedUser = user
      updatedUser[prop] = value
      console.log(updatedUser)
      update(ref(dbRef, `${DB.tables.users}/${user.phone}`), updatedUser)
    }
  }

  const flattenObject = (obj, prefix = '') => {
    const result = {}

    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        Object.assign(result, flattenObject(obj[key], prefix + key + '_'))
      } else {
        result[prefix + key] = obj[key]
      }
    }

    return result
  }

  const handleGetRecordTypeSelection = (e) => {
    Manager.handleCheckboxSelection(
      e,
      async (e) => {
        setGetRecordsTable(e)
      },
      () => {},
      false
    )
  }

  const removeNullAndUndefined = async () => {
    const dbRef = ref(getDatabase())
    const rows = await DB.getTable(DB.tables[tableName])
    const validRows = rows.filter((x) => x)
    console.log(DB.tables[tableName])
    set(child(dbRef, DB.tables[tableName]), validRows)
  }

  const getTextBeltCount = async () => {
    return fetch('https://textbelt.com/text', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '3307494534',
        message: 'Message',
        key: process.env.REACT_APP_SMS_API_KEY,
      }),
    })
      .then((response) => {
        return response.json()
      })
      .then((data) => {
        const { quotaRemaining } = data
        setRemainingTextBeltTexts(quotaRemaining)
      })
  }

  return (
    <div id="admin-dashboard-wrapper" className="page-container form">
      <p className="screen-title">Admin</p>
      <div className="flex grid gap-10">
        {/* Get Database Record */}
        <div className="tool-box">
          <p className="box-title">Get Records</p>
          <CheckboxGroup checkboxLabels={['Calendar', 'Expenses', 'Users']} onCheck={handleGetRecordTypeSelection} />
          <input type="text" className="mb-10" onChange={(e) => setGetRecordsSearchValue(e.target.value)} />
          <div className="buttons flex">
            <button className="button center" onClick={appendGetRecordsCode}>
              Return Records
            </button>
            <button className="button center" onClick={() => (document.getElementById('code-block').innerHTML = '')}>
              Clear
            </button>
          </div>
          {/* CODE BLOCK */}
          <div id="code-block"></div>
        </div>

        {/* ADD PROP TO ALL USERS */}
        <div className="tool-box">
          <p className="box-title">Add Daily Summaries to All Users</p>
          <div className="buttons">
            <button
              className="button center"
              onClick={() =>
                addDailySummariesToAllUsers('dailySummaries', {
                  morningSentDate: '',
                  eveningSentDate: '',
                  morningReminderSummaryHour: '10am',
                  eveningReminderSummaryHour: '8pm',
                })
              }>
              Add
            </button>
          </div>
        </div>

        {/* TEXTBELT */}
        <div className="tool-box">
          <p className="box-title">TextBelt</p>
          <p className="center-text">{remainingTextBeltTexts}</p>
          <div className="buttons">
            <button className="button center" onClick={getTextBeltCount}>
              Get Remaining Texts Count
            </button>
          </div>
        </div>

        {/* DELETE EXPIRED STUFF */}
        <div className="tool-box">
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

        {/* HOLIDAYS */}
        <div className="tool-box">
          <p className="box-title">Set Holidays</p>
          <div className="buttons flex">
            <button className="button center" onClick={setHolidays}>
              Add to Cal
            </button>
            <button onClick={() => DateManager.deleteAllHolidays()}>Delete All</button>
          </div>
        </div>

        {/* DELETE NULL ROWS */}
        <div className="tool-box">
          <p className="box-title">Remove NULL Rows</p>
          <div className="buttons flex wrap">
            {/* EXPENSE TYPE */}
            <FormControl fullWidth className={'mt-10 mb-15'}>
              <InputLabel className={'w-100'}>Table</InputLabel>
              <Select value={tableName} label="Expense Type" onChange={(e) => setTableName(e.target.value)}>
                {dbTables.map((table, index) => {
                  return (
                    <MenuItem key={index} value={table}>
                      {table}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
            <button className="button center w-100" onClick={removeNullAndUndefined}>
              Remove
            </button>
          </div>
        </div>

        {/* CHAT RECOVERY SIGNATURE IMAGE/TIMESTAMP */}
        <div className="tool-box">
          <p className="box-title">Chat Recovery</p>
          <input type="email" placeholder="User's Email Address" onChange={(e) => setChatRecoveryRequestEmail(e.target.value)} />
          <div className="buttons flex mt-10">
            <button className="button  center" onClick={getChatRecoveryRequest}>
              Get Chat Requests
            </button>
          </div>
          {Manager.isValid(chatRequests) &&
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
                    {Manager.isValid(request.members) &&
                      request.members.map((member, memberIndex) => {
                        return (
                          <div key={memberIndex}>
                            <div className="chat-recovery-request-member">
                              <p>
                                <b className="subset-prop">User:</b> {member.name}
                              </p>
                              <p>
                                <b className="subset-prop">User Phone:</b> {member.phone}
                              </p>
                            </div>
                          </div>
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
      <NavBar navbarClass={'visitation no-add-new-button'}></NavBar>
    </div>
  )
}