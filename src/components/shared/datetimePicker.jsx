import React, { useState, useContext, useEffect } from 'react'
import globalState from '../../context'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import moment from 'moment'
import Manager from '@manager'
function DatetimePicker({ onAccept, defaultValue, placeholder, label, format, views = ['day', 'month', 'year'], hasAmPm = true, className = '' }) {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state
  const [time, setTime] = useState('')

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <DateTimePicker
        defaultValue={moment(defaultValue)}
        className={className}
        label={label}
        minutesStep={5}
        ampm={hasAmPm}
        format={format}
        views={views}
        disablePast={true}
        onAccept={onAccept}
      />
    </LocalizationProvider>
  )
}

export default DatetimePicker
