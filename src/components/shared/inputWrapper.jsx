import Label from './label'
import React from 'react'
import { DebounceInput } from 'react-debounce-input'

function InputWrapper({ wrapperClasses = '', children, labelText, inputType, required, onChange, defaultValue = '', inputClasses = '', refreshKey }) {
  const noInputTypes = ['location', 'textarea', 'date']

  const showLabel = (element) => {
    element.classList.add('active')
    element.parentNode.classList.add('active')
  }

  const getPlaceholder = () => {
    let text = defaultValue
    if (defaultValue.length === 0) {
      text = labelText
    }
    if (required) {
      text += '*'
    }

    return text
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
          placeholder={getPlaceholder()}
          onChange={onChange}
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
          placeholder={getPlaceholder()}
          cols="30"
          rows="10"></textarea>
      )}
    </div>
  )
}

export default InputWrapper