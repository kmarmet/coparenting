// Path: src\components\shared\numpad.jsx
import React, {useContext} from 'react'
import {IoCheckmark} from 'react-icons/io5'
import {MdBackspace} from 'react-icons/md'
import globalState from '../../context'

export default function Numpad({onNumClick, onSubmit, onBackspace, className}) {
    const {state, setState} = useContext(globalState)

    return (
        <div id="numpad-wrapper" className={className}>
            <div className="flex row">
                <div className="flex num-wrapper">
                    <p onClick={onNumClick} className="num-box radius-left">
                        1
                    </p>
                    <p onClick={onNumClick} className="num-box">
                        2
                    </p>
                    <p onClick={onNumClick} className="num-box radius-right">
                        3
                    </p>
                </div>
            </div>
            <div className="flex row">
                <div className="flex num-wrapper">
                    <p onClick={onNumClick} className="num-box">
                        4
                    </p>
                    <p onClick={onNumClick} className="num-box">
                        5
                    </p>
                    <p onClick={onNumClick} className="num-box">
                        6
                    </p>
                </div>
            </div>
            <div className="flex row">
                <div className="flex num-wrapper">
                    <p onClick={onNumClick} className="num-box">
                        7
                    </p>
                    <p onClick={onNumClick} className="num-box">
                        8
                    </p>
                    <p onClick={onNumClick} className="num-box">
                        9
                    </p>
                </div>
            </div>
            <div className="flex row">
                <div className="flex num-wrapper">
                    <p onClick={onNumClick} className="num-box">
                        0
                    </p>
                    <div className="num-box" id="submit-button" onClick={onSubmit}>
                        <IoCheckmark className={'green'} />
                    </div>
                    <p onClick={onBackspace} className="num-box radius-right-bottom">
                        <MdBackspace className={'fs-24'} />
                    </p>
                </div>
            </div>
        </div>
    )
}