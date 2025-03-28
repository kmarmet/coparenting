// Path: src\components\screens\documents\docsList.jsx
import React, { useContext, useEffect, useState } from 'react'
import ScreenNames from '../../../constants/screenNames'
import DB from '../../../database/DB'
import Manager from '../../../managers/manager'
import globalState from '../../../context'
import DocumentsManager from '../../../managers/documentsManager'
import { HiDocumentRemove } from 'react-icons/hi'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import { Fade } from 'react-awesome-reveal'
import SecurityManager from '../../../managers/securityManager'
import NavBar from '../../navBar'
import NoDataFallbackText from '../../shared/noDataFallbackText'
import StringManager from '../../../managers/stringManager'
import { HiDocumentText } from 'react-icons/hi2'
import { FaFileImage } from 'react-icons/fa'

export default function DocsList() {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme} = state
  const [docs, setDocs] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)

  const getSecuredDocs = async () => {
    const allDocs = await SecurityManager.getDocuments(currentUser)
    setDocs(allDocs)
  }

  const deleteDoc = async (checkbox) => {
    const id = checkbox.currentTarget?.previousSibling?.getAttribute('data-id')
    DocumentsManager.deleteDocsWithIds([id], currentUser)
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, `${DB.tables.documents}/${currentUser?.key}`), async () => {
      await getSecuredDocs()
    })
  }

  useEffect(() => {
    onTableChange().then((r) => r)
  }, [])

  return (
    <>
      <div id="doc-selection-container" className={`${theme} page-container`}>
        {docs.length === 0 && <NoDataFallbackText text={'There are currently no documents'} />}
        <div className="flex" id="screen-title-wrapper">
          <p className="screen-title">Documents</p>
        </div>
        <p className="screen-intro-text">
          You may upload legal documents, such as a separation agreement or custody agreement, among others. If you wish, these documents can also be
          shared with a co-parent.
        </p>

        {!Manager.isValid(selectedDoc) && (
          <div className="sections">
            <Fade direction={'right'} duration={800} triggerOnce={true} className={'expense-tracker-fade-wrapper'} cascade={true} damping={0.2}>
              {Manager.isValid(docs) &&
                docs.map((doc, index) => {
                  const documentExts = ['doc', 'docx', 'pdf', 'txt', 'odt']
                  const fileType = documentExts.includes(StringManager.getFileExtension(doc.name).toString()) ? 'Document' : 'Image'
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
                        <div className={`checkbox delete`} onClick={deleteDoc}>
                          <HiDocumentRemove className={'delete-icon'} />
                        </div>
                      </div>
                    </div>
                  )
                })}
            </Fade>
          </div>
        )}
      </div>
      <NavBar navbarClass={'documents'} />
    </>
  )
}