// Path: src\components\screens\documents\docsList.jsx
import React, {useContext, useEffect, useState} from 'react'
import {FaFileImage} from 'react-icons/fa'
import {HiDocumentRemove} from 'react-icons/hi'
import {HiDocumentText} from 'react-icons/hi2'
import ScreenNames from '../../../constants/screenNames'
import globalState from '../../../context'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useDocuments from '../../../hooks/useDocuments'
import AlertManager from '../../../managers/alertManager'
import DocumentsManager from '../../../managers/documentsManager'
import DomManager from '../../../managers/domManager'
import Manager from '../../../managers/manager'
import StringManager from '../../../managers/stringManager'
import NavBar from '../../navBar'
import NoDataFallbackText from '../../shared/noDataFallbackText'

export default function DocsList() {
  const {state, setState} = useContext(globalState)
  const {theme} = state
  const [selectedDoc, setSelectedDoc] = useState(null)
  const {currentUser} = useCurrentUser()
  const {documents} = useDocuments()

  const DeleteDoc = async (checkbox) => {
    const id = checkbox.currentTarget?.previousSibling?.getAttribute('data-id')
    AlertManager.confirmAlert('Are you sure you want to delete this document?', "I'm Sure", true, async () => {
      await DocumentsManager.DeleteDocsWithIds([id], currentUser)
    })
  }

  useEffect(() => {
    setTimeout(() => {
      DomManager.ToggleAnimation('add', 'row', DomManager.AnimateClasses.names.fadeInRight, 80)
    }, 300)
  }, [])

  return (
    <>
      <div id="doc-selection-container" className={`${theme} page-container`}>
        <div className="flex" id="screen-title-wrapper">
          <p className="screen-title">Documents</p>
        </div>
        <p className="screen-intro-text">
          You may upload legal documents, such as a separation agreement or custody agreement, among others. If you wish, these documents can also be
          shared with a co-parent.
        </p>

        {!Manager.isValid(selectedDoc) && Manager.isValid(documents) && (
          <div className="sections">
            {Manager.isValid(documents) &&
              documents.map((doc, index) => {
                const documentExts = ['doc', 'docx', 'pdf', 'txt', 'odt']
                const fileType = documentExts.includes(StringManager.GetFileExtension(doc.name).toString()) ? 'Document' : 'Image'
                return (
                  <div
                    className="row"
                    key={index}
                    onClick={(e) => {
                      if (!Manager.contains(e.target.classList, 'delete')) {
                        setSelectedDoc(doc)
                        setState({...state, docToView: doc, currentScreen: ScreenNames.docViewer})
                      }
                    }}>
                    <div className="flex section">
                      <p data-id={doc.id}>
                        {fileType === 'Document' ? <HiDocumentText className={'file-type'} /> : <FaFileImage className={'file-type'} />}
                        {StringManager.removeFileExtension(StringManager.uppercaseFirstLetterOfAllWords(doc.name))}
                      </p>
                      <div className={`checkbox delete`} onClick={DeleteDoc}>
                        <HiDocumentRemove className={'delete-icon'} />
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
      {documents.length === 0 && <NoDataFallbackText text={'There are currently no documents'} />}
      <NavBar navbarClass={'documents'} />
    </>
  )
}