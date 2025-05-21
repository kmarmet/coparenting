// Path: src\components\shared\viewSelector.jsx
import DomManager from '/src/managers/domManager'
import React, {useContext, useEffect} from 'react'
import {CgDetailsMore} from 'react-icons/cg'
import {MdModeEditOutline} from 'react-icons/md'
import globalState from '../../context'
import Manager from '../../managers/manager'

export default function ViewSelector({labels, updateState, wrapperClasses = '', onloadState = ''}) {
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
  }, [onloadState])

  return (
    <div key={refreshKey} className={`${wrapperClasses} views-wrapper`}>
      {Manager.IsValid(labels) &&
        labels.map((label, index) => {
          return (
            <button
              key={index}
              data-label-id={index}
              className={`${index === 0 ? 'active view' : 'view'}`}
              onClick={(el) => {
                updateState(label)
                ToggleActive(el.target)
              }}>
              {label}
              {label === 'edit' && <MdModeEditOutline />}
              {label === 'details' && <CgDetailsMore className="details-icon" />}
            </button>
          )
        })}
    </div>
  )
}