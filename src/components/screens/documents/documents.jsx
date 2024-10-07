import React, { useContext, useEffect, useState } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../../context'
import AddNewButton from '@shared/addNewButton'
import UploadDocuments from './uploadDocuments'
import Manager from '@manager'

export default function Documents() {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state

  useEffect(() => {
    Manager.toggleForModalOrNewForm('show')
    setState({ ...state, currentScreen: ScreenNames.documents, showMenuButton: true })
  }, [])

  return (
    <>
      <p className="screen-title ">Documents</p>
      <AddNewButton
        onClose={() => setState({ ...state, currentScreen: ScreenNames.uploadDocuments })}
        onClick={() => setState({ ...state, currentScreen: ScreenNames.uploadDocuments })}
      />
      <div id="documents-container" className="page-container">
        <div className="sections">
          <p className="section" onClick={() => setState({ ...state, currentScreen: ScreenNames.docsList })}>
            <span className="material-icons-round accent">description</span>Non-Legal
            <span className="material-icons-round go-arrow">arrow_forward_ios</span>
          </p>
          <p className="section" onClick={() => setState({ ...state, currentScreen: ScreenNames.legalDocs })}>
            <span className="material-icons-round accent">gavel</span>Legal <span className="material-icons-round go-arrow">arrow_forward_ios</span>
          </p>
        </div>
      </div>
    </>
  )
}
