// Path: src\components\screens\settings\settings.jsx
import React, {useContext, useState} from 'react'
import globalState from '../../../context'
import moment from 'moment'
import DB_UserScoped from '/src/database/db_userScoped'
import {MobileTimePicker} from '@mui/x-date-pickers-pro'
import DatetimeFormats from '/src/constants/datetimeFormats'
import {Fade} from 'react-awesome-reveal'
import DateManager from '/src/managers/dateManager'
import NavBar from '/src/components/navBar'
import AlertManager from '/src/managers/alertManager'
import InputWrapper from '/src/components/shared/inputWrapper'
import Label from '/src/components/shared/label'
import DB from '/src/database/DB'
import NotificationManager from '/src/managers/notificationManager.js'
import ToggleButton from '../../shared/toggleButton'

export default function Settings() {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, authUser} = state
  const [morningSummaryTime, setMorningSummaryTime] = useState('')
  const [eveningSummaryTime, setEveningSummaryTime] = useState('')
  const [notificationsToggled, setNotificationsToggled] = useState(0)

  const submitCalendarSettings = async () => {
    if (DateManager.dateIsValid(morningSummaryTime)) {
      await DB_UserScoped.updateUserRecord(
        currentUser?.key,
        'dailySummaries/morningReminderSummaryHour',
        moment(morningSummaryTime).format(DatetimeFormats.summaryHour)
      )
    }
    if (DateManager.dateIsValid(eveningSummaryTime)) {
      await DB_UserScoped.updateUserRecord(
        currentUser?.key,
        'dailySummaries/eveningReminderSummaryHour',
        moment(eveningSummaryTime).format(DatetimeFormats.summaryHour)
      )
    }
    AlertManager.successAlert('Calendar settings have been updated!')
  }

  const toggleNotifications = async () => {
    setNotificationsToggled(!notificationsToggled)
    const subscriber = await DB.find(DB.tables.notificationSubscribers, ['key', currentUser.key], true)
    const {subscriptionId} = subscriber
    await DB_UserScoped.updateUserRecord(currentUser?.key, 'settings/notificationsEnabled', !currentUser?.settings?.notificationsEnabled)
    const updatedCurrentUser = await DB_UserScoped.getCurrentUser(authUser?.email)
    setState({...state, currentUser: updatedCurrentUser})

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
          <Label text={'Calendar'} />
          <div className="calendar-settings form">
            <div className="section summary">
              <p className="pb-10">The summaries for the current and following day will be provided during the morning and evening summary hours.</p>
              {/* MORNING SUMMARY */}
              <InputWrapper labelText={'Morning Hour'} inputType={'date'}>
                <MobileTimePicker
                  slotProps={{
                    actionBar: {
                      actions: ['clear', 'accept'],
                    },
                  }}
                  className={`${theme}`}
                  views={['hours']}
                  onAccept={(e) => setMorningSummaryTime(e)}
                  defaultValue={moment(currentUser?.dailySummaries?.morningReminderSummaryHour, 'hh:mma')}
                />
              </InputWrapper>
              {/* EVENING SUMMARY */}
              <InputWrapper labelText={'Evening Hour'} inputType={'date'} onChange={(e) => setEveningSummaryTime(e.target.value)}>
                <MobileTimePicker
                  defaultValue={moment(currentUser?.dailySummaries?.eveningReminderSummaryHour, 'hh:mma')}
                  slotProps={{
                    actionBar: {
                      actions: ['clear', 'accept'],
                    },
                  }}
                  className={`${theme}`}
                  views={['hours']}
                  onAccept={(e) => setEveningSummaryTime(e)}
                />
              </InputWrapper>
            </div>
            {currentUser && (
              <div className="mt-15">
                <button onClick={submitCalendarSettings} className="button default submit green center mb-10">
                  Update Summary Times
                </button>
              </div>
            )}
            <hr className="hr less-margin" />
            {/*  NOTIFICATIONS */}
            <Label text={'Notifications'} />
            <div className="flex">
              <p>Enabled</p>
              <ToggleButton
                isDefaultChecked={currentUser?.settings?.notificationsEnabled}
                onCheck={toggleNotifications}
                onUncheck={toggleNotifications}
              />
            </div>
          </div>
        </Fade>
      </div>
      <NavBar navbarClass={'settings no-add-new-button'}></NavBar>
    </>
  )
}