// Path: src\components\screens\settings\settings.jsx
import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../../context'
import moment from 'moment'
import DB_UserScoped from '/src/database/db_userScoped'
import DatetimeFormats from '/src/constants/datetimeFormats'
import {Fade} from 'react-awesome-reveal'
import DateManager from '/src/managers/dateManager'
import NavBar from '/src/components/navBar'
import InputWrapper from '/src/components/shared/inputWrapper'
import Label from '/src/components/shared/label'
import DB from '/src/database/DB'
import NotificationManager from '/src/managers/notificationManager.js'
import ToggleButton from '../../shared/toggleButton'
import InputTypes from '../../../constants/inputTypes'

export default function Settings() {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, authUser} = state
  const [morningSummaryHour, setMorningSummaryHour] = useState(currentUser?.dailySummaries?.morningReminderSummaryHour)
  const [eveningSummaryHour, setEveningSummaryHour] = useState(currentUser?.dailySummaries?.eveningReminderSummaryHour)
  const [notificationsToggled, setNotificationsToggled] = useState(0)
  const [showSummaryUpdateButton, setShowSummaryUpdateButton] = useState(false)

  const submitCalendarSettings = async () => {
    if (DateManager.dateIsValid(morningSummaryHour)) {
      await DB_UserScoped.updateUserRecord(
        currentUser?.key,
        'dailySummaries/morningReminderSummaryHour',
        moment(morningSummaryHour).format(DatetimeFormats.summaryHour)
      )
    }
    if (DateManager.dateIsValid(eveningSummaryHour)) {
      await DB_UserScoped.updateUserRecord(
        currentUser?.key,
        'dailySummaries/eveningReminderSummaryHour',
        moment(eveningSummaryHour).format(DatetimeFormats.summaryHour)
      )
    }
    setState({...state, successAlertMessage: 'Summary Times Updated'})
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

  useEffect(() => {
    if (
      morningSummaryHour !== currentUser?.dailySummaries?.morningReminderSummaryHour ||
      eveningSummaryHour !== currentUser?.dailySummaries?.eveningReminderSummaryHour
    ) {
      setShowSummaryUpdateButton(true)
    } else {
      setShowSummaryUpdateButton(false)
    }
  }, [morningSummaryHour, eveningSummaryHour])

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
              <InputWrapper
                defaultValue={moment(currentUser?.dailySummaries?.morningReminderSummaryHour, 'h:mma')}
                labelText={'Morning Hour'}
                timeViews={['hours']}
                inputType={InputTypes.time}
                onDateOrTimeSelection={(e) => setMorningSummaryHour(e)}
              />
              {/* EVENING SUMMARY */}
              <InputWrapper
                defaultValue={moment(currentUser?.dailySummaries?.eveningReminderSummaryHour, 'h:mma')}
                labelText={'Evening Hour'}
                timeViews={['hours']}
                inputType={InputTypes.time}
                onChange={(e) => setEveningSummaryHour(e.target.value)}
                onDateOrTimeSelection={(e) => setEveningSummaryHour(e)}
              />
            </div>
            {currentUser && showSummaryUpdateButton && (
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