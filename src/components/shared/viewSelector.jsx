// Path: src\components\shared\viewSelector.jsx
import DomManager from '/src/managers/domManager'
import React, {useContext, useEffect} from 'react'
import globalState from '../../context'
import Manager from '../../managers/manager'

export default function ViewSelector({labels, updateState, wrapperClasses = ''}) {
  // APP STATE
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state

  const ToggleActive = (el) => {
    const views = document.querySelectorAll('.view')
    views.forEach((view) => {
      view.classList.remove('active')
    })
    DomManager.toggleActive(el)
  }

  useEffect(() => {
    DomManager.setDefaultView()
  }, [])

  return (
    <div key={refreshKey} className={`${wrapperClasses} views-wrapper`}>
      {Manager.IsValid(labels) &&
        labels.map((label, index) => {
          return (
            <p
              key={index}
              data-label-id={index}
              className={`${index === 0 ? 'active view' : 'view'}`}
              onClick={(el) => {
                updateState(label)
                ToggleActive(el.target)
              }}>
              {label}
            </p>
          )
        })}
    </div>
  )
}