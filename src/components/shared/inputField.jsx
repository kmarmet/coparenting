// Path: src\components\shared\inputField.jsx
import {MobileDatePicker, MobileDateRangePicker, MobileTimePicker, SingleInputDateRangeField} from '@mui/x-date-pickers-pro'
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {DebounceInput} from 'react-debounce-input'
import {MdEmail, MdNotes} from 'react-icons/md'
import {PiArrowBendLeftUpFill, PiLinkSimpleHorizontalBold} from 'react-icons/pi'
import {RiPhoneFill} from 'react-icons/ri'
import DatetimeFormats from '../../constants/datetimeFormats'
import InputTypes from '../../constants/inputTypes'
import globalState from '../../context.js'
import useCurrentUser from '../../hooks/useCurrentUser'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'

function InputField({
  wrapperClasses = '',
  labelText = '',
  inputType = InputTypes.text,
  required,
  onChange,
  defaultValue = null,
  inputClasses = '',
  onKeyUp = (e) => {},
  onDateOrTimeSelection = (e) => {},
  timeViews = ['hours', 'minutes'],
  dateViews = ['month', 'day'],
  placeholder = '',
  dateFormat = DatetimeFormats.readableMonthAndDay,
  inputName = '',
  isCurrency = false,
  customDebounceDelay = 1000,
  errorMessage = '',
}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey, theme} = state
  const {currentUser} = useCurrentUser()
  const [error, setError] = useState('')

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
        className={`input-field ${wrapperClasses} ${inputType} ${Manager.IsValid(defaultValue) ? 'show-label' : ''}`}>
        {/* DATE */}
        {inputType === InputTypes.date && (
          <MobileDatePicker
            showDaysOutsideCurrentMonth={true}
            label={labelText}
            onOpen={() => DomManager.AddThemeToDatePickers(currentUser)}
            views={dateViews}
            name={inputName}
            className={`${theme} ${inputClasses}`}
            value={Manager.IsValid(defaultValue) ? moment(defaultValue) : null}
            key={refreshKey}
            multiple={false}
            onMonthChange={(e) => {
              // const newMonth = moment(e).format('MMMM')
              // const activePicker = document.querySelector(`.form-wrapper.active`)
              // const monthElement = activePicker.querySelector(`.MuiDatePickerToolbar-title`)
              // const all = document.querySelectorAll('.MuiPaper-root')
              // console.log(all)

              onDateOrTimeSelection(e)
            }}
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
          <>
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
              format={'h:mma'}
              onAccept={onDateOrTimeSelection}
            />
          </>
        )}

        {/* TEXT */}
        {inputType === InputTypes.text && (
          <DebounceInput
            value={Manager.IsValid(defaultValue) ? defaultValue : ''}
            placeholder={`${placeholder}${required ? ' (required)' : ''}`}
            className={`${inputClasses}`}
            onChange={onChange}
            name={inputName}
            debounceTimeout={0}
            // debounceTimeout={customDebounceDelay !== 1000 ? customDebounceDelay : 1000}
            key={refreshKey}
          />
        )}

        {/* NUMBER */}
        {inputType === InputTypes.number && (
          <>
            {isCurrency && <span className="currency input-icon">$</span>}
            <input
              type="tel"
              id="number"
              name={inputName}
              placeholder={isCurrency ? '0' : placeholder}
              key={refreshKey}
              pattern="[0-9]"
              defaultValue={defaultValue}
              required={required}
              onChange={onChange}
            />
          </>
        )}

        {/* PHONE */}
        {inputType === InputTypes.phone && (
          <>
            <RiPhoneFill className={'input-icon phone'} />
            <input
              type="tel"
              id="phone"
              name={inputName}
              maxLength={16}
              className={`${inputClasses} with-icon`}
              placeholder={`${placeholder}${required ? ' (required)' : ''}`}
              key={refreshKey}
              pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
              defaultValue={defaultValue}
              required={required}
              onChange={(e) => {
                let value = e.target.value
                e.target.value = value.replace(/[^0-9+]/g, '')
                onChange(e)
              }}
            />
          </>
        )}

        {/* URL */}
        {inputType === InputTypes.url && (
          <>
            <PiLinkSimpleHorizontalBold className={'input-icon website'} />
            <input
              type="url"
              id="url"
              placeholder={`${placeholder}${required ? ' (required)' : ''}`}
              onChange={(e) => {
                onChange(e)
              }}
              name={inputName}
              className={`${inputClasses} with-icon`}
              defaultValue={defaultValue}
              key={refreshKey}
            />
          </>
        )}

        {/* EMAIL */}
        {inputType === InputTypes.email && (
          <>
            <MdEmail className={'input-icon'} />
            <input
              type="email"
              id="email"
              placeholder={`${placeholder}${required ? ' (required)' : ''}`}
              onChange={onChange}
              name={inputName}
              className={`${inputClasses} with-icon`}
              defaultValue={defaultValue}
              key={refreshKey}
            />
          </>
        )}

        {/* PASSWORD */}
        {inputType === InputTypes.password && (
          <input
            type="password"
            id="password"
            placeholder={`${placeholder}${required ? ' (required)' : ''}`}
            onChange={onChange}
            className={inputClasses}
            defaultValue={defaultValue}
            key={refreshKey}
          />
        )}

        {/* TEXTAREA */}
        {inputType === InputTypes.textarea && (
          <>
            <MdNotes className={'input-icon notes'} />
            <textarea
              id="textarea"
              placeholder={`${placeholder}${required ? ' (required)' : ''}`}
              onChange={(e) => {
                onChange(e)
              }}
              onKeyUp={onKeyUp}
              className={`${inputClasses} with-icon`}
              name={inputName}
              defaultValue={defaultValue}
              key={refreshKey}
            />
          </>
        )}

        {/* CHAT */}
        {inputType === InputTypes.chat && (
          <textarea
            placeholder={`${placeholder}${required ? ' (required)' : ''}`}
            onChange={(e) => {
              onChange(e)
            }}
            onKeyUp={onKeyUp}
            className={`${inputClasses}`}
            name={'Chat Text'}
            defaultValue={defaultValue}
            key={refreshKey}
          />
        )}
      </div>
      {Manager.IsValid(error, true) && (
        <p className="input-field-error">
          <PiArrowBendLeftUpFill />
          {error}
        </p>
      )}
    </>
  )
}

export default InputField