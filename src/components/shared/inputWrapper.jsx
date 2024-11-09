import Label from './label'
import React from 'react'
import { DebounceInput } from 'react-debounce-input'

function InputWrapper({ wrapperClasses = '', children, labelText, inputType, required, onChange, defaultValue = '', inputClasses = '', refreshKey }) {
  const noInputTypes = ['location', 'textarea', 'date']

  const showLabel = (element) => {
    element.classList.add('active')
    element.parentNode.classList.add('active')
  }

  const hideLabel = (element) => {
    element.parentNode.classList.remove('active')
    document.getElementById('blur').classList.remove('active')
  }

  return (
    <div
      key={refreshKey}
      id="input-wrapper"
      className={`${wrapperClasses} ${inputType} input-container`}
      onClick={(e) => e.currentTarget.classList.add('active')}>
      <div id="blur">
        <Label text={labelText} classes="floating-label" required={required}></Label>
      </div>
      {!noInputTypes.includes(inputType) && (
        <DebounceInput
          element={inputType}
          minLength={2}
          className={inputClasses}
          placeholder={defaultValue.length > 0 ? defaultValue : labelText}
          onChange={onChange}
          // onBlur={(e) => hideLabel(e.currentTarget)}
          debounceTimeout={500}
          onClick={(e) => showLabel(e.currentTarget)}
        />
      )}
      {noInputTypes.includes(inputType) && (
        <div className="w-100" onClick={(e) => showLabel(e.currentTarget)}>
          {children}
        </div>
      )}
      {inputType === 'textarea' && (
        <textarea
          onChange={onChange}
          className={inputClasses}
          onClick={(e) => showLabel(e.currentTarget)}
          placeholder={defaultValue.length > 0 ? defaultValue : labelText}
          cols="30"
          rows="10"></textarea>
      )}
    </div>
  )
}

export default InputWrapper
