// Path: src\components\shared\checkboxGroup.jsx
import React, {useContext} from 'react'
import {IoCloseOutline} from 'react-icons/io5'
import globalState from '../../context'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager.js'
import Checkbox from './checkbox.jsx'
import Label from './label.jsx'

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
            <div className={`checkbox-group${Manager.IsValid(elClass) ? ` ${elClass}` : ''}`}>
                {parentLabel.length > 0 && (
                    <Label classes="standalone-label-wrapper always-show" text={parentLabel} required={required} icon={icon ? icon : ''} />
                )}
                {/*<Spacer height={2} />*/}
                <div className={`${checkboxArray.length > 2 ? 'more-than-two-checkboxes' : 'two-checkboxes'} checkboxes`}>
                    {Manager.IsValid(checkboxArray) &&
                        checkboxArray.map((obj, index) => {
                            let label = obj.label
                            if (Manager.IsValid(label) && !StringManager.stringHasNumbers(label) && !skipNameFormatting) {
                                label = StringManager.GetFirstNameOnly(label.toString())
                            }
                            return (
                                <Checkbox
                                    wrapperClass={elClass}
                                    key={index}
                                    text={label}
                                    dataKey={obj?.key}
                                    dataLabel={label}
                                    isActive={obj.isActive}
                                    onCheck={onCheck}>
                                    <IoCloseOutline />
                                </Checkbox>
                            )
                        })}
                </div>
            </div>
        </>
    )
}