// Path: src\components\shared\checkboxGroup.jsx
import Manager from '../../managers/manager'
import React, {useContext} from 'react'
import globalState from '../../context'
import StringManager from '../../managers/stringManager.js'
import {IoCloseOutline} from 'react-icons/io5'
import Label from './label.jsx'
import Checkbox from './checkbox.jsx'
import Spacer from './spacer'

export default function CheckboxGroup({
  onCheck = (e) => {},
  elClass = '',
  skipNameFormatting = false,
  required = false,
  parentLabel = '',
  checkboxArray = [],
  icon = null,
}) {
  const {state, setState} = useContext(globalState)
  const {theme} = state

  return (
    <>
      <div id="checkbox-group" className={`${theme} ${elClass}`}>
        {parentLabel.length > 0 && <Label classes="standalone-label-wrapper" text={parentLabel} required={required} icon={icon ? icon : ''} />}
        <Spacer height={2} />
        <div id="checkboxes" className={checkboxArray.length > 2 ? 'more-than-two-checkboxes' : 'two-checkboxes'}>
          {Manager.isValid(checkboxArray) &&
            checkboxArray.map((obj, index) => {
              let label = obj.label
              if (Manager.isValid(label) && !StringManager.stringHasNumbers(label) && !skipNameFormatting) {
                label = StringManager.getFirstNameOnly(label.toString())
              }
              return (
                <Checkbox key={index} text={label} dataKey={obj?.key} dataLabel={label} isActive={obj.isActive} onCheck={onCheck}>
                  <IoCloseOutline />
                </Checkbox>
              )
            })}
        </div>
      </div>
    </>
  )
}