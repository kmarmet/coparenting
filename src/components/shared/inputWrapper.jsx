// Path: src\components\shared\inputWrapper.jsx
import {MobileDatePicker, MobileDateRangePicker, MobileTimePicker, SingleInputDateRangeField} from '@mui/x-date-pickers-pro'
import moment from 'moment'
import React, {useContext, useEffect} from 'react'
import {DebounceInput} from 'react-debounce-input'
import DatetimeFormats from '../../constants/datetimeFormats'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context.js'
import useCurrentUser from '../../hooks/useCurrentUser'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import Label from './label'
import Spacer from './spacer'

function InputWrapper({
  wrapperClasses = '',
  labelText = '',
  inputType = InputTypes.text,
  required,
  onChange,
  defaultValue = null,
  inputClasses = '',
  hasBottomSpacer = true,
  onKeyUp = (e) => {},
  onDateOrTimeSelection = (e) => {},
  timeViews = ['hours', 'minutes'],
  dateViews = ['month', 'day'],
  placeholder = '',
  dateFormat = DatetimeFormats.readableMonthAndDay,
  inputName = '',
  customDebounceDelay = 1000,
}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey, theme} = state
  const {currentUser} = useCurrentUser()
  useEffect(() => {
    DomManager.AddThemeToDatePickers(currentUser)
  }, [refreshKey])

  return (
    <>
      <div
        onClick={(e) => {
          const wrapper = e.currentTarget
          if (wrapper) {
            wrapper.classList.add('active')
          }
        }}
        onBlur={(e) => {
          const wrapper = e.currentTarget
          wrapper.classList.remove('active')
        }}
        id="input-wrapper"
        className={`${wrapperClasses} ${inputType} ${Manager.IsValid(defaultValue) ? 'show-label' : ''}`}>
        {/* LABEL */}
        {Manager.IsValid(labelText, true) && (
          <Label classes={Manager.IsValid(defaultValue) ? 'active' : ''} text={`${labelText}`} required={required} />
        )}

        {/* TEXT */}
        {inputType === InputTypes.text && (
          <DebounceInput
            value={Manager.IsValid(defaultValue) ? defaultValue : ''}
            placeholder={placeholder}
            className={`${inputClasses}`}
            onChange={onChange}
            name={inputName}
            debounceTimeout={customDebounceDelay !== 1000 ? customDebounceDelay : 1000}
            key={refreshKey}
          />
        )}

        {/* NUMBER */}
        {inputType === InputTypes.number && (
          <input
            type="tel"
            id="number"
            name={inputName}
            placeholder={placeholder}
            key={refreshKey}
            pattern="[0-9]"
            defaultValue={defaultValue}
            required={required}
            onChange={onChange}
          />
        )}

        {/* PHONE */}
        {inputType === InputTypes.phone && (
          <input
            type="tel"
            id="phone"
            name={inputName}
            maxLength={16}
            placeholder={placeholder}
            key={refreshKey}
            pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
            defaultValue={defaultValue}
            required={required}
            onChange={onChange}
          />
        )}

        {/* DATE */}
        {inputType === InputTypes.date && (
          <MobileDatePicker
            showDaysOutsideCurrentMonth={true}
            label={labelText}
            onOpen={() => DomManager.AddThemeToDatePickers(currentUser)}
            views={dateViews}
            name={inputName}
            class={`${theme} ${inputClasses}`}
            value={Manager.IsValid(defaultValue) ? moment(defaultValue) : null}
            key={refreshKey}
            format={dateFormat}
            onAccept={onDateOrTimeSelection}
          />
        )}

        {/* DATE RANGE */}
        {inputType === InputTypes.dateRange && (
          <MobileDateRangePicker
            onAccept={onDateOrTimeSelection}
            defaultValue={Manager.IsValid(defaultValue) ? moment(defaultValue) : null}
            slots={{field: SingleInputDateRangeField}}
            key={refreshKey}
            onOpen={() => DomManager.AddThemeToDatePickers(currentUser)}
            label={labelText}
            name="allowedRange"
          />
        )}

        {/* TIME */}
        {inputType === InputTypes.time && (
          <MobileTimePicker
            slotProps={{
              actionBar: {
                actions: ['clear', 'accept'],
              },
            }}
            name={inputName}
            views={timeViews}
            value={Manager.IsValid(defaultValue) ? moment(defaultValue, DatetimeFormats.timeForDb) : null}
            label={labelText}
            minutesStep={5}
            onOpen={() => DomManager.AddThemeToDatePickers(currentUser)}
            key={refreshKey}
            format={DatetimeFormats.timeForDb}
            onAccept={onDateOrTimeSelection}
          />
        )}

        {/* URL */}
        {inputType === InputTypes.url && (
          <input
            type="url"
            id="url"
            placeholder={placeholder}
            onChange={(e) => {
              onChange(e)
            }}
            name={inputName}
            className={inputClasses}
            defaultValue={defaultValue}
            key={refreshKey}
          />
        )}

        {/* EMAIL */}
        {inputType === InputTypes.email && (
          <input
            type="email"
            id="email"
            placeholder={placeholder}
            onChange={(e) => {
              onChange(e)
            }}
            name={inputName}
            className={inputClasses}
            defaultValue={defaultValue}
            key={refreshKey}
          />
        )}

        {/* PASSWORD */}
        {inputType === InputTypes.password && (
          <input
            type="password"
            id="password"
            placeholder={placeholder}
            onChange={(e) => {
              onChange(e)
            }}
            className={inputClasses}
            defaultValue={defaultValue}
            key={refreshKey}
          />
        )}

        {/* TEXTAREA */}
        {inputType === InputTypes.textarea && (
          <textarea
            id="textarea"
            placeholder={placeholder}
            onChange={(e) => {
              onChange(e)
            }}
            onKeyUp={onKeyUp}
            className={inputClasses}
            name={inputName}
            defaultValue={defaultValue}
            key={refreshKey}
          />
        )}
      </div>
      {hasBottomSpacer && <Spacer height={5} />}
    </>
  )
}

export default InputWrapper