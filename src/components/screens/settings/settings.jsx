import React, { useContext, useState } from 'react'
import globalState from '../../../context'
import moment from 'moment'
import DB_UserScoped from 'database/db_userScoped'
import 'prototypes'
import { MobileTimePicker } from '@mui/x-date-pickers-pro'
import DateFormats from '../../../constants/dateFormats'
import Toggle from 'react-toggle'
import { Fade } from 'react-awesome-reveal'
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
import DB from 'database/DB'
import NotificationManager from '../../../managers/notificationManager.js'

export default function Settings() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [defaultReminderTimes, setDefaultReminderTimes] = useState([])
  const [morningSummaryTime, setMorningSummaryTime] = useState('')
  const [eveningSummaryTime, setEveningSummaryTime] = useState('')
  const [notificationsToggled, setNotificationsToggled] = useState(0)

  const submitCalendarSettings = async () => {
    if (DateManager.dateIsValid(morningSummaryTime)) {
      await DB_UserScoped.updateUserRecord(
        currentUser?.phone,
        'dailySummaries/morningReminderSummaryHour',
        moment(morningSummaryTime).format(DateFormats.summaryHour)
      )
    }
    if (DateManager.dateIsValid(eveningSummaryTime)) {
      await DB_UserScoped.updateUserRecord(
        currentUser?.phone,
        'dailySummaries/eveningReminderSummaryHour',
        moment(eveningSummaryTime).format(DateFormats.summaryHour)
      )
    }
    AlertManager.successAlert('Calendar settings have been updated!')
  }

  const toggleNotifications = async (e) => {
    setNotificationsToggled(!notificationsToggled)
    const subscriber = await DB.find(DB.tables.notificationSubscribers, ['phone', currentUser.phone], true)
    const { oneSignalId, subscriptionId } = subscriber
    await DB_UserScoped.updateUserRecord(currentUser.phone, 'settings/notificationsEnabled', !currentUser?.settings?.notificationsEnabled)
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(currentUser.phone)
    setState({ ...state, currentUser: updatedCurrentUser })

    if (notificationsToggled === true) {
      await NotificationManager.enableNotifications(subscriptionId)
    } else {
      await NotificationManager.disableNotifications(subscriptionId)
    }
  }

  return (
    <>
      <div id="settings-container" className={`${theme} page-container form`}>
        <Fade direction={'up'} duration={1000} className={'visitation-fade-wrapper'} triggerOnce={true}>
          <p className="screen-title">Settings</p>
          {/* CALENDAR SETTINGS */}
          <Label text={'Calendar'} labelId="medium-title" />
          <div className="calendar-settings mb-10 form">
            <div className="section summary mb-10 gap-10">
              <p className="pb-10">
                The morning and evening summary hours are when you will receive the event summaries for the current day and next day.
              </p>
              {/* MORNING SUMMARY */}
              <InputWrapper labelText={'Morning Hour'} inputType={'date'}>
                <MobileTimePicker className={`${theme} w-100`} views={['hours']} onAccept={(e) => setMorningSummaryTime(e)} />
              </InputWrapper>
              {/* EVENING SUMMARY */}
              <InputWrapper labelText={'Evening Hour'} inputType={'date'}>
                <MobileTimePicker className={`${theme} mt-0 w-100`} views={['hours']} onAccept={(e) => setEveningSummaryTime(e)} />
              </InputWrapper>
            </div>
            {currentUser && (
              <div className="mt-15">
                <button onClick={submitCalendarSettings} className="button default submit green center mb-10">
                  Update Summary Times
                </button>
              </div>
            )}

            {/* IS VISITATION? */}
            <Label text={'Notifications'} labelId="medium-title" classes="mt-30" />
            <div className="flex">
              {currentUser?.settings?.notificationsEnabled && <p>Disable</p>}
              {!currentUser?.settings?.notificationsEnabled && <p>Enable</p>}
              <Toggle
                icons={{
                  unchecked: null,
                }}
                defaultChecked={currentUser?.settings?.notificationsEnabled}
                className={'ml-auto visitation-toggle'}
                onChange={toggleNotifications}
              />
            </div>
          </div>
        </Fade>
      </div>
      <NavBar navbarClass={'settings no-add-new-button'}></NavBar>
    </>
  )
}