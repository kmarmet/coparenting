import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import Manager from '@manager'
import moment from 'moment'
import DB_UserScoped from '@userScoped'
import '@prototypes'
import { MobileTimePicker } from '@mui/x-date-pickers-pro'
import DateFormats from '../../../constants/dateFormats'
import Toggle from 'react-toggle'

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
  const [morningSummaryTime, setMorningSummaryTime] = useState('')
  const [eveningSummaryTime, setEveningSummaryTime] = useState('')

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
    AlertManager.successAlert('Calendar settings have been updated!')
  }

  useEffect(() => {
    Manager.showPageContainer()
    const pushAlertWidget = document.querySelector('.pa-subscribe-widget-round')
    if (pushAlertWidget) {
      pushAlertWidget.style.display = 'none'
    }
  }, [])

  return (
    <>
      <div id="settings-container" className={`${theme} page-container form`}>
        {/*<button onClick={unsub}>Click</button>*/}
        <p className="screen-title">Settings</p>
        {/* CALENDAR SETTINGS */}
        <Label text={'Calendar'} labelId="medium-title" />
        <div className="calendar-settings mb-10 form">
          <div className="section summary mb-10 gap-10">
            <p className="pb-10">The morning and evening summary hours are when you will receive the event summaries for the day and next day.</p>
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
            <p>Enable</p>
            <Toggle
              icons={{
                unchecked: null,
              }}
              className={'ml-auto visitation-toggle'}
              onChange={(e) => {
                // console.log('here')
                // PushAlertCo.triggerMe(false)
                // PushAlertCo.init()
                // PushAlertApi.showSubscribeAlert()
              }}
            />
          </div>
        </div>
      </div>
      <NavBar navbarClass={'settings no-add-new-button'}></NavBar>
    </>
  )
}