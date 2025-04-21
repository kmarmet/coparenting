// Path: src\components\shared\inputWrapper.jsx
import React, {useContext} from 'react'
import {DebounceInput} from 'react-debounce-input'
import globalState from '../../context.js'
import Manager from '../../managers/manager'
import {MobileDatePicker, MobileDateRangePicker, MobileTimePicker, SingleInputDateRangeField} from '@mui/x-date-pickers-pro'
import Label from './label'
import InputTypes from '../../constants/inputTypes'
import moment from 'moment'
import DatetimeFormats from '../../constants/datetimeFormats'
import AddressInput from './addressInput'
import Spacer from './spacer'

function InputWrapper({
  wrapperClasses = '',
  labelText = '',
  inputType = 'input',
  required,
  onChange,
  defaultValue = null,
  inputClasses = '',
  hasBottomSpacer = true,
  onKeyUp = (e) => {},
  onDateOrTimeSelection = (e) => {},
  isDebounced = true,
  timeViews = ['hours', 'minutes'],
  dateViews = ['month', 'day'],
  placeholder = '',
  dateFormat = DatetimeFormats.readableMonthAndDay,
}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey, theme} = state

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
        className={`${wrapperClasses} ${inputType} ${Manager.isValid(defaultValue) ? 'show-label' : ''}`}>
        {/* LABEL */}
        {Manager.isValid(labelText, true) && (
          <Label classes={Manager.isValid(defaultValue) ? 'active' : ''} text={`${labelText}`} required={required} />
        )}

        {/* TEXT */}
        {inputType === InputTypes.text && (
          <DebounceInput
            value={Manager.isValid(defaultValue) ? defaultValue : ''}
            placeholder={placeholder}
            className={`${inputClasses}`}
            onChange={onChange}
            debounceTimeout={isDebounced ? 1000 : 0}
            key={refreshKey}
          />
        )}

        {/* NUMBER */}
        {inputType === InputTypes.number && (
          <input
            type="tel"
            id="number"
            name="number"
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
            name="phone"
            maxLength={16}
            placeholder={placeholder}
            key={refreshKey}
            pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
            defaultValue={defaultValue}
            required={required}
            onChange={onChange}
          />
        )}

        {/* ADDRESS */}
        {inputType === InputTypes.address && <AddressInput defaultValue={defaultValue} onSelection={onChange} />}

        {/* DATE */}
        {inputType === InputTypes.date && (
          <MobileDatePicker
            showDaysOutsideCurrentMonth={true}
            label={labelText}
            views={dateViews}
            className={`${theme} ${inputClasses}`}
            value={Manager.isValid(defaultValue) ? moment(defaultValue) : null}
            key={refreshKey}
            format={dateFormat}
            onAccept={onDateOrTimeSelection}
          />
        )}

        {/* DATE RANGE */}
        {inputType === InputTypes.dateRange && (
          <MobileDateRangePicker
            onAccept={onDateOrTimeSelection}
            defaultValue={Manager.isValid(defaultValue) ? moment(defaultValue) : null}
            slots={{field: SingleInputDateRangeField}}
            key={refreshKey}
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
            views={timeViews}
            value={Manager.isValid(defaultValue) ? moment(defaultValue, DatetimeFormats.timeForDb) : null}
            label={labelText}
            minutesStep={5}
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