// Path: src\components\shared\viewSelector.jsx
import React, { useContext } from 'react'
import globalState from '../../context'
import DomManager from '/src/managers/domManager'
import Spacer from './spacer'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'

export default function ViewSelector({ labels, updateState, wrapperClasses }) {
  // APP STATE
  const { state, setState } = useContext(globalState)
  const { theme, refreshKey } = state

  const toggleActive = (el) => {
    const views = document.querySelectorAll('.view')
    views.forEach((view) => {
      view.classList.remove('active')
    })
    DomManager.toggleActive(el)
  }

  return (
    <>
      <Spacer height={5} />
      <div key={refreshKey} className={`${wrapperClasses} views-wrapper`}>
        {Manager.isValid(labels) &&
          labels.map((label, index) => {
            return (
              <p
                key={index}
                data-label-id={index}
                className={`${index === 0 ? 'active view' : 'view'}`}
                onClick={(el) => {
                  updateState(label)
                  toggleActive(el.target)
                }}>
                {StringManager.uppercaseFirstLetterOfAllWords(label)}
              </p>
            )
          })}
      </div>
    </>
  )
}