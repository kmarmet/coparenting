import React, { useContext } from 'react'
import globalState from '../../context'
import '../../prototypes'
import Manager from '@manager'

export default function Numpad({ onNumClick, onSubmit, onBackspace, className }) {
  const { state, setState } = useContext(globalState)

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
            <span className="material-icons">check</span>
          </div>
          <p onClick={onBackspace} className="num-box radius-right-bottom">
            <span className="material-icons submit">backspace</span>
          </p>
        </div>
      </div>
    </div>
  )
}