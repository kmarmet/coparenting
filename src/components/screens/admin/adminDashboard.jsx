import NavBar from '/src/components/navBar'
import DB from '/src/database/DB'
import AppManager from '/src/managers/appManager'
import DateManager from '/src/managers/dateManager'
import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import React, {useContext, useEffect, useState} from 'react'
import JSONPretty from 'react-json-pretty'
import JSONPrettyMon from 'react-json-pretty/dist/monikai'
import {useLongPress} from 'use-long-press'
import InputTypes from '../../../constants/inputTypes'
import globalState from '../../../context'
import useCalendarEvents from '../../../hooks/useCalendarEvents'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useUsers from '../../../hooks/useUsers'
import SmsManager from '../../../managers/smsManager'
import StringManager from '../../../managers/stringManager'
import InputWrapper from '../../shared/inputWrapper'
import Spacer from '../../shared/spacer'

export default function AdminDashboard() {
  const {state, setState} = useContext(globalState)
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
  const {currentUser} = useCurrentUser()
  const {users} = useUsers()
  const {calendarEvents} = useCalendarEvents()
  const bind = useLongPress((element) => {
    navigator.clipboard.writeText(element.target.textContent)
    setState({...state, successAlertMessage: 'Copied to clipboard'})
  })

  const DeletedExpiredCalEvents = async () => AppManager.deleteExpiredCalendarEvents().then((r) => r)

  const DeleteExpiredMemories = async () => AppManager.deleteExpiredMemories().then((r) => r)

  const SetHolidays = async () => DateManager.setHolidays()

  const AppendGetRecordsCode = async () => {
    if (tableName === 'calendarEvents') {
      const scoped = calendarEvents.filter((x) => x.title.toLowerCase().includes(getRecordsSearchValue.toLowerCase()))
      setRecordsAsJson(scoped)
    } else {
      let scoped = users.find((x) => x.email.toLowerCase().includes(getRecordsSearchValue.toLowerCase()))
      setRecordsAsJson(scoped)
    }
  }

  const GetTextBeltCount = async () => {
    const balance = await SmsManager.GetRemainingBalance()
    console.log(balance)
    setState({...state, successAlertMessage: balance})
  }

  const CopyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(recordsAsJson))
    setState({...state, successAlertMessage: 'Copied to clipboard'})
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
        <div className="tool-box get-records">
          <p className="box-title">Get Records</p>
          <FormControl fullWidth className={'mt-10 mb-15'}>
            <Select
              value={tableName}
              onChange={(e) => {
                setGetRecordsTable(e.target.value)
                setTableName(e.target.value)
              }}>
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
            labelText={`Enter ${recordPropToCheck} or Event Name for Calendar Events`}
            inputType={InputTypes.text}
            onChange={(e) => setGetRecordsSearchValue(e.target.value)}
          />
          <p className="mb-10 center-text">-or-</p>
          <InputWrapper labelText={`Enter Record ID`} inputType={InputTypes.text} onChange={(e) => setGetRecordsSearchValue(e.target.value)} />
          <div className="buttons flex">
            <button className="button" onClick={CopyToClipboard}>
              Copy
            </button>
            <button className="button" onClick={AppendGetRecordsCode}>
              Execute
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
          <JSONPretty theme={JSONPrettyMon} id="code-block" {...bind()} data={recordsAsJson}></JSONPretty>
        </div>

        {/* TEXTBELT */}
        <div className="tool-box">
          <p className="box-title">TextBelt</p>
          <p className="center block  center-text">Balance: {textBalance}</p>
        </div>

        {/* DELETE EXPIRED STUFF */}
        <div className="tool-box">
          <p className="box-title">Delete Expired</p>
          <div className="buttons flex gap-10">
            <button className="button" onClick={DeleteExpiredMemories}>
              Memories
            </button>
            <button className="button" onClick={DeletedExpiredCalEvents}>
              Events
            </button>
          </div>
        </div>

        {/* HOLIDAYS */}
        <div className="tool-box">
          <p className="box-title">Set Holidays</p>
          <div className="buttons flex">
            <button className="button" onClick={SetHolidays}>
              Add to Cal
            </button>
            <button onClick={() => DateManager.deleteAllHolidays()}>Delete All</button>
          </div>
        </div>
      </div>
      <NavBar navbarClass={'visitation no-Add-new-button'}></NavBar>
    </div>
  )
}