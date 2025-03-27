// Path: src\components\shared\inputWrapper.jsx
import React, { useContext, useEffect } from 'react'
import { DebounceInput } from 'react-debounce-input'
import globalState from '../../context.js'
import Manager from '../../managers/manager'
import Label from './label'
import moment from 'moment'

const DebounceLengths = {
  short: 500,
  medium: 1000,
  long: 2000,
}

function InputWrapper({
  wrapperClasses = '',
  children,
  labelText,
  inputType = 'input',
  required,
  onChange,
  defaultValue = '',
  inputClasses = '',
  inputValueType = 'text',
  childrenOnly = false,
  isDebounced = true,
  useNativeDate = false,
  customDebounceDelay = DebounceLengths.medium,
}) {
  const { state, setState } = useContext(globalState)
  const { defaultDate, refreshKey } = state
  const noInputTypes = ['location', 'textarea', 'date']

  // Set the height of the textarea
  useEffect(() => {
    const activeModal = document.querySelector('#modal-wrapper.active')
    if (activeModal) {
      const inputWrapper = activeModal.querySelector('#input-wrapper.textarea')

      if (inputWrapper) {
        const textarea = inputWrapper.querySelector('textarea')

        if (textarea) {
          if (inputWrapper) {
            inputWrapper.style.height = 'auto'
            inputWrapper.style.height = `${textarea.scrollHeight + 25}px`
            textarea.style.height = 'auto'
            textarea.style.height = `${textarea.scrollHeight}px`
          }
        }
      }
    }
  }, [])

  return (
    <div
      onClick={(e) => {
        const wrapper = e.currentTarget
        if (wrapper) {
          wrapper.classList.add('active')
        }
      }}
      id="input-wrapper"
      className={`${wrapperClasses} ${inputType} input-container form`}>
      {Manager.isValid(labelText) && <Label text={`${labelText}`} required={required} />}

      {!noInputTypes.includes(inputType) && (
        <>
          <DebounceInput
            value={defaultValue}
            element={inputType}
            minLength={2}
            autofocus={true}
            className={`${inputClasses} ${defaultValue.length > 0 ? 'mb-0' : ''}`}
            onChange={onChange}
            debounceTimeout={isDebounced ? (customDebounceDelay ? customDebounceDelay : DebounceLengths.long) : 0}
            key={refreshKey}
            onBlur={(e) => {
              const wrapper = e.currentTarget.parentElement
              if (wrapper) {
                wrapper.classList.remove('active')
              }
            }}
            type={inputValueType}
            pattern={
              inputValueType && inputValueType === 'tel' ? (
                <input type="tel" id="phone" name="phone" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" required />
              ) : (
                ''
              )
            }
            maxLength={inputValueType && inputValueType === 'tel' ? 12 : 100}
          />
        </>
      )}

      {/* NATIVE DATE */}
      {noInputTypes.includes(inputType) && useNativeDate && (
        <input
          onBlur={(e) => {
            const wrapper = e.currentTarget.parentElement
            if (wrapper) {
              wrapper.classList.remove('active')
            }
          }}
          className="date-input"
          type="date"
          value={Manager.isValid(defaultValue) ? moment(defaultValue).format("YYYY-MM-DD") : null}
          onChange={onChange}
        />
      )}
      {noInputTypes.includes(inputType) && !useNativeDate && <> {children}</>}
      {childrenOnly && <>{children}</>}

      {/* TEXTAREA */}
      {inputType === 'textarea' && (
        <textarea
          id="textarea"
          onBlur={(e) => {
            const wrapper = e.currentTarget.parentElement
            if (wrapper) {
              wrapper.classList.remove('active')
            }
          }}
          placeholder={labelText}
          onChange={onChange}
          className={inputClasses}
          defaultValue={defaultValue}
          key={refreshKey}
        />
      )}
    </div>
  )
}

export default InputWrapper