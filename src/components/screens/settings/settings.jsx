import React, { useContext, useEffect, useState } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../../context'
import Manager from '@manager'
import CheckboxGroup from '@shared/checkboxGroup'
import { Accordion, DatePicker } from 'rsuite'
import moment from 'moment'
import DB_UserScoped from '@userScoped'
import ReminderTimes from 'constants/reminderTimes'
import DB from '@db'
import AllMenuItems from '../../../constants/allMenuItems'
import '@prototypes'
import Shortcut from '../../../models/shortcut.js'
import MenuMapper from '../../../mappers/menuMapper.js'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import { MobileTimePicker } from '@mui/x-date-pickers'
import DateFormats from '../../../constants/dateFormats'

export default function Settings() {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state
  const [defaultReminderTimes, setDefaultReminderTimes] = useState([])
  const [menuItemsList, setMenuItemsList] = useState([])
  const [shortcutsToSendToDb, setShortcutsToSendToDb] = useState([])
  const [shortcutAccIsOpen, setShortcutAccIsOpen] = useState(false)
  const [calendarAccIsOpen, setCalendarAccIsOpen] = useState(false)
  const [morningSummaryTime, setMorningSummaryTime] = useState('')
  const [eveningSummaryTime, setEveningSummaryTime] = useState('')

  const submitShortcuts = async () => {
    if (shortcutsToSendToDb.length < 4 || shortcutsToSendToDb.length > 4) {
      setState({ ...state, showAlert: true, alertMessage: 'Please choose at least four (only four) shortcuts' })
      return false
    }
    const toSendToDb = createShortcutArray(shortcutsToSendToDb)
    await DB_UserScoped.updateUserRecord(currentUser.phone, 'settings/shortcuts', toSendToDb)

    setState({ ...state, alertMessage: 'Shortcuts have been updated!', alertType: 'success', showAlert: true })
    setShortcutAccIsOpen(false)
  }

  const submitCalendarSettings = async () => {
    await DB_UserScoped.updateUserRecord(
      currentUser.phone,
      'settings/eveningReminderSummaryHour',
      moment(eveningSummaryTime).format(DateFormats.summaryHour)
    )
    await DB_UserScoped.updateUserRecord(
      currentUser.phone,
      'settings/morningReminderSummaryHour',
      moment(morningSummaryTime).format(DateFormats.summaryHour)
    )
    await DB_UserScoped.updateUserRecord(currentUser.phone, 'settings/defaultReminderTimes', defaultReminderTimes)
    setState({ ...state, alertMessage: 'Calendar settings have been updated!', alertType: 'success', showAlert: true })
    setCalendarAccIsOpen(false)
  }

  const createShortcutArray = (inputArray) => {
    const returnArray = []
    inputArray.forEach((item) => {
      const shortcut = new Shortcut()
      shortcut.iconName = MenuMapper.stringToIconName(item)
      shortcut.accessType = 'parent'
      shortcut.screenName = item.toCamelCase()
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
    Manager.toggleForModalOrNewForm('show')
    setState({ ...state, showBackButton: false, showMenuButton: true })
    setMenuItemsList(AllMenuItems.map((x) => x.Name.spaceBetweenWords().uppercaseFirstLetterOfAllWords()))
  }, [])

  return (
    <>
      <p className="screen-title ">Settings</p>
      <div id="settings-container" className={`${currentUser?.settings?.theme} page-container form`}>
        {/* CALENDAR SETTINGS */}
        <div className="calendar-settings mb-10 form">
          <Accordion className=" w-100">
            <p onClick={() => setCalendarAccIsOpen(!calendarAccIsOpen)} className="accordion-header">
              Calendar
            </p>
            <Accordion.Panel expanded={calendarAccIsOpen}>
              <div className="section summary mb-10 ">
                <span className="material-icons mr-10">calendar_month</span>

                <div className="input-container">
                  {/* MORNING SUMMARY */}
                  <label>Morning Summary Hour</label>
                  <MobileTimePicker
                    className={`${currentUser?.settings?.theme} mt-0 w-100`}
                    views={['hours']}
                    onAccept={(e) => setMorningSummaryTime(e)}
                  />
                  {/* EVENING SUMMARY */}
                  <div className="input-container">
                    <label>Evening Summary Hour</label>
                    <MobileTimePicker
                      className={`${currentUser?.settings?.theme} mt-0 w-100`}
                      views={['hours']}
                      onAccept={(e) => setEveningSummaryTime(e)}
                    />
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
            </Accordion.Panel>
          </Accordion>
        </div>

        {/* SHORTCUTS */}
        <div className="shortcuts-settings mb-20">
          <Accordion className="pl-0 pr-0 w-100">
            <p onClick={() => setShortcutAccIsOpen(!shortcutAccIsOpen)} className="accordion-header">
              Customize Shortcuts
            </p>
            <Accordion.Panel expanded={shortcutAccIsOpen} className={'pl-0 pr-0'}>
              <img className="shortcuts-example center mt-5" src={require('img/shortcutsExample.png')} alt="" />
              <p className="center-text mt-5 caption">shortcuts</p>
              <p className="mt-10 mb-10 ">
                Select the shortcuts (only four) you would like to use in the menu (example above). Select them in the order you would like them
                displayed. <br /> <br /> The middle button is the menu button and cannot be modified.
              </p>
              <CheckboxGroup
                boxWidth={50}
                onLightBackground={true}
                skipNameFormatting={true}
                onCheck={handleShortcutSelection}
                labels={menuItemsList}
              />
              {shortcutsToSendToDb.length === 4 && (
                <button
                  id="submit-button"
                  onClick={(e) => {
                    Manager.toggleSparkleAnimation(e.target)
                    submitShortcuts()
                  }}
                  className="button green default center mb-10 mt-10">
                  Set Shortcuts <span className="material-icons-round">check</span>
                </button>
              )}
            </Accordion.Panel>
          </Accordion>
        </div>

        {/* SECTIONS */}
        <div className="sections">
          <p
            className="section"
            onClick={() =>
              setState({
                ...state,
                currentScreen: ScreenNames.featureRequests,
                currentScreenTitle: 'Feature Request',
              })
            }>
            <span className="material-icons accent">add_task</span>Feature Request{' '}
            <span className="material-icons-round go-arrow">arrow_forward_ios</span>
          </p>
          <p
            className="section"
            onClick={() =>
              setState({
                ...state,
                currentScreen: ScreenNames.feedback,
                currentScreenTitle: 'App Feedback',
              })
            }>
            <span className="material-icons-round accent">speaker_notes</span>Send App Feedback{' '}
            <span className="material-icons-round go-arrow">arrow_forward_ios</span>
          </p>
          <p
            className="section"
            onClick={() =>
              setState({
                ...state,
                currentScreen: ScreenNames.contactSupport,
                currentScreenTitle: 'Support Request',
              })
            }>
            <span className="material-icons-round accent">email</span>Contact Support{' '}
            <span className="material-icons-round go-arrow">arrow_forward_ios</span>
          </p>
        </div>
      </div>
    </>
  )
}
