// Path: src\components\screens\settings\settings.jsx
import NavBar from '/src/components/navBar'
import InputWrapper from '/src/components/shared/inputWrapper'
import Label from '/src/components/shared/label'
import DatetimeFormats from '/src/constants/datetimeFormats'
import DB from '/src/database/DB'
import DB_UserScoped from '/src/database/db_userScoped'
import DateManager from '/src/managers/dateManager'
import NotificationManager from '/src/managers/notificationManager.js'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {Fade} from 'react-awesome-reveal'
import InputTypes from '../../../constants/inputTypes'
import globalState from '../../../context'
import useCurrentUser from '../../../hooks/useCurrentUser'
import Manager from '../../../managers/manager'
import StringManager from '../../../managers/stringManager'
import CheckboxGroup from '../../shared/checkboxGroup'
import Spacer from '../../shared/spacer'
import ToggleButton from '../../shared/toggleButton'

export default function Settings() {
  const {state, setState} = useContext(globalState)
  const {authUser} = state
  const {currentUser} = useCurrentUser()
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

  const ChangeTheme = async () => {
    const newTheme = currentUser?.settings?.theme === 'light' ? 'dark' : 'light'
    if (newTheme === 'dark') {
      document.querySelector("[data-key='Light']").classList.remove('active')
    } else {
      document.querySelector("[data-key='Dark']").classList.remove('active')
    }
    await DB_UserScoped.updateUserRecord(currentUser?.key, `settings/theme`, newTheme)
    window.location.reload()
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
      <div id="settings-container" className={`${currentUser?.settings?.theme} page-container form`}>
        <Fade direction={'up'} duration={1000} className={'visitation-fade-wrapper'} triggerOnce={true}>
          <p className="screen-title">Settings</p>
          <Spacer height={10} />
          {/* CALENDAR SETTINGS */}
          <Label text={'Calendar'} classes="settings-section-title" />
          <div className="calendar-settings form">
            <div className="section summary">
              <p className="screen-intro-text">
                The summaries for the current and following day will be provided during the morning and evening summary hours.
              </p>
              <Spacer height={8} />
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
            <Label text={'Notifications'} classes="settings-section-title" />
            <div className="flex">
              <Label text={'Enabled'} />
              <ToggleButton
                isDefaultChecked={currentUser?.settings?.notificationsEnabled}
                onCheck={toggleNotifications}
                onUncheck={toggleNotifications}
              />
            </div>
            <hr className="hr less-margin" />

            {/* THEME */}
            <Label text={'Theme'} classes="settings-section-title" />
            <CheckboxGroup
              checkboxArray={Manager.buildCheckboxGroup({
                currentUser,
                customLabelArray: ['Light', 'Dark'],
                defaultLabels: [StringManager.uppercaseFirstLetterOfAllWords(currentUser?.settings?.theme)],
              })}
              isDefaultChecked={currentUser?.settings?.theme === 'dark'}
              elClass={`${currentUser?.settings?.theme}`}
              skipNameFormatting={true}
              onCheck={ChangeTheme}
            />
            {/*{currentUser?.settings?.theme === 'dark' && (*/}
            {/*  <div className="menu-item theme">*/}
            {/*    <PiSunDuotone />*/}
            {/*    <p onClick={() => ChangeTheme('light')}>Light Mode</p>*/}
            {/*  </div>*/}
            {/*)}*/}
            {/*{currentUser?.settings?.theme === 'light' && (*/}
            {/*  <div onClick={() => ChangeTheme('dark')} className="menu-item theme">*/}
            {/*    <div className="svg-wrapper">*/}
            {/*      <BsFillMoonStarsFill />*/}
            {/*    </div>*/}
            {/*    <p>Dark Mode</p>*/}
            {/*  </div>*/}
            {/*)}*/}
          </div>
        </Fade>
      </div>
      <NavBar navbarClass={'settings no-Add-new-button'}></NavBar>
    </>
  )
}