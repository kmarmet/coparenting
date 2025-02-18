// Path: src\components\shared\datetimePicker.jsx
import React, { useContext, useState } from 'react'
import globalState from '../../context'
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers-pro'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import moment from 'moment'

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
        onAccept={onAccept}
      />
    </LocalizationProvider>
  )
}

export default DatetimePicker
