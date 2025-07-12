// Path: src\components\shared\checkbox.jsx
import React, {useContext} from 'react'
import {GiCheckMark} from 'react-icons/gi'
import globalState from '../../context.js'
import DomManager from '../../managers/domManager'

export default function Checkbox({isActive, text, onCheck, wrapperClass = '', dataKey, dataDate, dataLabel}) {
    const {state, setState} = useContext(globalState)
    const {theme, currentUser, refreshKey} = state

    const ToggleActive = (e) => {
        const checkboxWrapper = e.currentTarget
        const icon = checkboxWrapper.querySelector('.checkbox-text svg')
        DomManager.ToggleActive(checkboxWrapper)

        if (onCheck) {
            onCheck(e.currentTarget)
        }
        DomManager.ToggleActive(icon)
    }

    return (
        <div
            key={refreshKey}
            data-key={dataKey}
            data-label={dataLabel}
            data-date={dataDate}
            className={`checkbox-wrapper ${wrapperClass} ${isActive ? 'active' : ''}`}
            onClick={ToggleActive}>
            <p className="checkbox-text">
                {text}
                <GiCheckMark className={`${isActive ? 'active' : ''} checkmark`} />
            </p>
        </div>
    )
}