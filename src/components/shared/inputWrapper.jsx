import React, { useEffect } from 'react'
import { DebounceInput } from 'react-debounce-input'
import Label from './label'

function InputWrapper({
  wrapperClasses = '',
  children,
  labelText,
  inputType,
  required,
  onChange,
  defaultValue = '',
  inputClasses = '',
  refreshKey,
  inputValueType = 'text',
  inputValue = '',
}) {
  const noInputTypes = ['location', 'textarea', 'date']

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

  useEffect(() => {
    const inputWrapper = document.getElementById('input-wrapper')
    if (inputWrapper) {
      inputWrapper.addEventListener('blur', (el) => {
        el.classList.remove('active')
      })
      inputWrapper.addEventListener('focus', (el) => {
        el.classList.add('active')
      })
    }
  }, [])

  return (
    <div
      key={refreshKey}
      id="input-wrapper"
      className={`${wrapperClasses} ${inputType} ${defaultValue.length > 0 || (noInputTypes.includes(inputType) && inputType !== 'location') ? 'mb-15' : ''} input-container`}>
      {!noInputTypes.includes(inputType) && (
        <>
          {defaultValue.length > 0 && <Label text={labelText} />}
          <DebounceInput
            value={inputValue}
            element={inputType}
            minLength={2}
            className={`${inputClasses} ${defaultValue.length > 0 ? 'mb-0' : ''}`}
            placeholder={getPlaceholder()}
            onChange={onChange}
            debounceTimeout={800}
            type={inputValueType}
            onClick={(e) => e.target.scrollIntoView({ block: 'center' })}
          />
        </>
      )}
      {noInputTypes.includes(inputType) && (
        <div className={`w-100`}>
          {inputType === 'date' && <Label classes={`date-label`} text={getPlaceholder()} />}
          {children}
        </div>
      )}
      {inputType === 'textarea' && (
        <>
          {defaultValue.length > 0 && <Label text={labelText} />}
          <textarea
            onClick={(e) => e.target.scrollIntoView()}
            onChange={onChange}
            className={inputClasses}
            placeholder={getPlaceholder()}
            cols="30"
            rows="10"></textarea>
        </>
      )}
    </div>
  )
}

export default InputWrapper