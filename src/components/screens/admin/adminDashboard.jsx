import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../../context'
import {child, getDatabase, ref, set, update} from 'firebase/database'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import AppManager from '/src/managers/appManager'
import DB from '/src/database/DB'
import Manager from '/src/managers/manager'
import DateManager from '/src/managers/dateManager'
import NavBar from '/src/components/navBar'
import AlertManager from '/src/managers/alertManager'
import Spacer from '../../shared/spacer'
import SmsManager from '../../../managers/smsManager'
import StringManager from '../../../managers/stringManager'
import InputWrapper from '../../shared/inputWrapper'
import InputTypes from '../../../constants/inputTypes'
import JSONPrettyMon from 'react-json-pretty/dist/monikai'
import JSONPretty from 'react-json-pretty'

export default function AdminDashboard() {
  const {state, setState, currentUser} = useContext(globalState)
  const [chatRecoveryRequestEmail, setChatRecoveryRequestEmail] = useState('')
  const [chatRequests, setChatRequests] = useState([])
  const [getUserEmail, setGetUserEmail] = useState('')
  const [userToDisplayPhone, setUserToDisplayPhone] = useState(null)
  const [getRecordsTable, setGetRecordsTable] = useState('')
  const [getRecordsSearchValue, setGetRecordsSearchValue] = useState('')
  const [tableName, setTableName] = useState(DB.tables.calendarEvents)
  const [dbTables, setDbTables] = useState(Object.values(DB.tables).sort())
  const [textBalance, setTextBalance] = useState(0)
  const [recordPropToCheck, setRecordPropToCheck] = useState('User Email')
  const [recordsAsJson, setRecordsAsJson] = useState(false)
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

    if (allRequests.length === 0) {
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
    const users = await DB.getTable(tableName)
    let scoped = users.find((x) => x.email.toLowerCase().includes(getRecordsSearchValue.toLowerCase()))
    setRecordsAsJson(scoped)

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

  const removeNullAndUndefined = async () => {
    const dbRef = ref(getDatabase())
    const rows = await DB.getTable(DB.tables[tableName])
    const validRows = rows.filter((x) => x)
    console.log(DB.tables[tableName])
    set(child(dbRef, DB.tables[tableName]), validRows)
  }

  const getTextBeltCount = async () => {
    const balance = await SmsManager.GetRemainingBalance()
    console.log(balance)
    setState({...state, successAlertMessage: balance})
  }

  useEffect(() => {
    if (tableName === 'users') {
      setRecordPropToCheck("User's Email Address")
    }
  }, [recordPropToCheck])

  useEffect(() => {
    SmsManager.GetRemainingBalance().then((balance) => {
      setTextBalance(balance)
    })
  }, [])

  return (
    <div id="admin-dashboard-wrapper" className="page-container form">
      <p className="screen-title">Admin</p>
      <Spacer height={10} />
      <div className="flex grid gap-10">
        {/* Get Database Record */}
        <div className="tool-box">
          <p className="box-title">Get Records</p>
          <FormControl fullWidth className={'mt-10 mb-15'}>
            <InputLabel className={'w-100'}>Table</InputLabel>
            <Select value={tableName} label="Expense Type" onChange={(e) => setTableName(e.target.value)}>
              {dbTables.map((table, index) => {
                return (
                  <MenuItem key={index} value={table}>
                    {StringManager.uppercaseFirstLetterOfAllWords(table)}
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>
          <InputWrapper
            labelText={`Enter ${recordPropToCheck}`}
            inputType={InputTypes.text}
            onChange={(e) => setGetRecordsSearchValue(e.target.value)}
          />
          <div className="buttons flex">
            <button className="button" onClick={appendGetRecordsCode}>
              Return Records
            </button>
            <button
              className="button"
              onClick={() => {
                document.getElementById('code-block').innerHTML = ''
                setRecordsAsJson({})
              }}>
              Clear
            </button>
          </div>
          {/* CODE BLOCK */}
          <JSONPretty theme={JSONPrettyMon} id="code-block" data={recordsAsJson}></JSONPretty>
        </div>

        {/* ADD PROP TO ALL USERS */}
        {/*<div className="tool-box">*/}
        {/*  <p className="box-title">Add Daily Summaries to All Users</p>*/}
        {/*  <div className="buttons">*/}
        {/*    <button*/}
        {/*      className="button"*/}
        {/*      onClick={() =>*/}
        {/*        addDailySummariesToAllUsers('dailySummaries', {*/}
        {/*          morningSentDate: '',*/}
        {/*          eveningSentDate: '',*/}
        {/*          morningReminderSummaryHour: '10am',*/}
        {/*          eveningReminderSummaryHour: '8pm',*/}
        {/*        })*/}
        {/*      }>*/}
        {/*      Add*/}
        {/*    </button>*/}
        {/*  </div>*/}
        {/*</div>*/}

        {/* TEXTBELT */}
        <div className="tool-box">
          <p className="box-title">TextBelt</p>
          <p className="center block">Balance: {textBalance}</p>
          <div className="buttons">
            <button className="button" onClick={getTextBeltCount}>
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
            <button className="button" onClick={setHolidays}>
              Add to Cal
            </button>
            <button onClick={() => DateManager.deleteAllHolidays()}>Delete All</button>
          </div>
        </div>

        {/* DELETE NULL ROWS */}
        {/*<div className="tool-box">*/}
        {/*  <p className="box-title">Remove NULL Rows</p>*/}
        {/*  <div className="buttons flex wrap">*/}
        {/*    /!* EXPENSE TYPE *!/*/}
        {/*    <FormControl fullWidth className={'mt-10 mb-15'}>*/}
        {/*      <InputLabel className={'w-100'}>Table</InputLabel>*/}
        {/*      <Select value={tableName} label="Expense Type" onChange={(e) => setTableName(e.target.value)}>*/}
        {/*        {dbTables.map((table, index) => {*/}
        {/*          return (*/}
        {/*            <MenuItem key={index} value={table}>*/}
        {/*              {table}*/}
        {/*            </MenuItem>*/}
        {/*          )*/}
        {/*        })}*/}
        {/*      </Select>*/}
        {/*    </FormControl>*/}
        {/*    <button className="button w-100" onClick={removeNullAndUndefined}>*/}
        {/*      Remove*/}
        {/*    </button>*/}
        {/*  </div>*/}
        {/*</div>*/}
      </div>
      <NavBar navbarClass={'visitation no-add-new-button'}></NavBar>
    </div>
  )
}