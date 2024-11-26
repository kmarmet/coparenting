import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import Manager from '@manager'
import moment from 'moment'
import DB_UserScoped from '@userScoped'
import '@prototypes'
import Shortcut from '../../../models/shortcut.js'
import MenuMapper from '../../../mappers/menuMapper.js'
import { MobileTimePicker } from '@mui/x-date-pickers-pro'
import DateFormats from '../../../constants/dateFormats'
import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
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
import DateManager from '../../../managers/dateManager'
import NavBar from '../../navBar'
import AlertManager from '../../../managers/alertManager'
import InputWrapper from '../../shared/inputWrapper'
import Label from '../../shared/label'

export default function Settings() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [defaultReminderTimes, setDefaultReminderTimes] = useState([])
  const [menuItemsList, setMenuItemsList] = useState([])
  const [shortcutsToSendToDb, setShortcutsToSendToDb] = useState([])
  const [shortcutAccIsOpen, setShortcutAccIsOpen] = useState(false)
  const [calendarAccIsOpen, setCalendarAccIsOpen] = useState(false)
  const [morningSummaryTime, setMorningSummaryTime] = useState('')
  const [eveningSummaryTime, setEveningSummaryTime] = useState('')

  const submitShortcuts = async () => {
    if (shortcutsToSendToDb.length < 4 || shortcutsToSendToDb.length > 4) {
      AlertManager.throwError('Please choose at least four (only four) shortcuts')
      return false
    }
    const toSendToDb = createShortcutArray(shortcutsToSendToDb)
    await DB_UserScoped.updateUserRecord(currentUser?.phone, 'settings/shortcuts', toSendToDb)

    AlertManager.throwError('Shortcuts have been updated!')
    setShortcutAccIsOpen(false)
  }

  const submitCalendarSettings = async () => {
    console.log(DateManager.dateIsValid(morningSummaryTime))
    console.log(moment(eveningSummaryTime).format(DateFormats.summaryHour))
    if (DateManager.dateIsValid(morningSummaryTime)) {
      await DB_UserScoped.updateUserRecord(
        currentUser?.phone,
        'settings/morningReminderSummaryHour',
        moment(morningSummaryTime).format(DateFormats.summaryHour)
      )
    }
    if (DateManager.dateIsValid(eveningSummaryTime)) {
      await DB_UserScoped.updateUserRecord(
        currentUser?.phone,
        'settings/eveningReminderSummaryHour',
        moment(eveningSummaryTime).format(DateFormats.summaryHour)
      )
    }
    await DB_UserScoped.updateUserRecord(currentUser?.phone, 'settings/defaultReminderTimes', defaultReminderTimes)
    AlertManager.successAlert('Calendar settings have been updated!')
    setCalendarAccIsOpen(false)
  }

  const createShortcutArray = (inputArray) => {
    const returnArray = []
    inputArray.forEach((item) => {
      const shortcut = new Shortcut()
      shortcut.iconName = MenuMapper.stringToIconName(item)
      shortcut.accessType = 'parent'
      returnArray.push(shortcut)
    })

    return returnArray
  }

  const handleShortcutSelection = async (e) => {
    Manager.handleCheckboxSelection(
      e,
      (e) => {
        let filtered = shortcutsToSendToDb.filter((x) => x !== e)
        setShortcutsToSendToDb(filtered)
      },
      (e) => {
        setShortcutsToSendToDb([...shortcutsToSendToDb, e].unique())
      },
      true
    )
  }

  useEffect(() => {
    Manager.showPageContainer('show')
    // setMenuItemsList(AllMenuItems.map((x) => uppercaseFirstLetterOfAllWords(spaceBetweenWords(x.Name))))
  }, [])

  return (
    <>
      <div id="settings-container" className={`${theme} page-container form`}>
        <p className="screen-title">Settings</p>
        {/* CALENDAR SETTINGS */}
        <Label text={'Calendar'} />
        <div className="calendar-settings mb-10 form">
          <div className="section summary mb-10 ">
            <div className="input-container">
              {/* MORNING SUMMARY */}
              <InputWrapper labelText={'Morning Summary Hour'} inputType={'date'}>
                <MobileTimePicker className={`${theme} w-100`} views={['hours']} onAccept={(e) => setMorningSummaryTime(e)} />
              </InputWrapper>
              {/* EVENING SUMMARY */}
              <div className="input-container">
                <InputWrapper labelText={'Evening Summary Hour'} inputType={'date'}>
                  <MobileTimePicker className={`${theme} mt-0 w-100`} views={['hours']} onAccept={(e) => setEveningSummaryTime(e)} />
                </InputWrapper>
              </div>
            </div>
          </div>

          {currentUser && (
            <div className="mt-30">
              <button onClick={submitCalendarSettings} className="button default submit green center mb-10">
                Update
              </button>
            </div>
          )}
        </div>
      </div>
      <NavBar navbarClass={'settings no-add-new-button'}></NavBar>
    </>
  )
}