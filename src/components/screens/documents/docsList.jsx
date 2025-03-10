// Path: src\components\screens\documents\docsList.jsx
import React, { useContext, useEffect, useState } from 'react'
import ScreenNames from '../../../constants/screenNames'
import DB from '../../../database/DB'
import Manager from '../../../managers/manager'
import globalState from '../../../context'
import DocumentsManager from '../../../managers/documentsManager'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import { GrDocumentImage, GrDocumentText, GrDocumentUpload } from 'react-icons/gr'
import { Fade } from 'react-awesome-reveal'
import SecurityManager from '../../../managers/securityManager'
import UploadDocuments from './uploadDocuments'
import NavBar from '../../navBar'
import NoDataFallbackText from '../../shared/noDataFallbackText'
import DomManager from '../../../managers/domManager'
import StringManager from '../../../managers/stringManager'
import { PiTrashSimpleDuotone } from 'react-icons/pi'

export default function DocsList() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [docs, setDocs] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showCard, setShowCard] = useState(false)

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
      <UploadDocuments showCard={showCard} hideCard={() => setShowCard(false)} />

      <div id="doc-selection-container" className={`${theme} page-container`}>
        {docs.length === 0 && <NoDataFallbackText text={'There are currently no documents'} />}
        <Fade direction={'up'} duration={1000} className={'visitation-fade-wrapper'} triggerOnce={true}>
          <div className="flex" id="screen-title-wrapper">
            <p className="screen-title">Documents</p>
            {!DomManager.isMobile() && <GrDocumentUpload id={'add-new-button'} onClick={() => setShowCard(true)} />}
          </div>
          <p className="mb-10">
            You may upload legal documents, such as a separation agreement or custody agreement, among others. If you wish, these documents can also
            be shared with a co-parent.
          </p>

          {!Manager.isValid(selectedDoc) && (
            <div className="sections">
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
                          setState({ ...state, docToView: doc, currentScreen: ScreenNames.docViewer })
                        }
                      }}>
                      <div className="flex section">
                        <p data-id={doc.id}>
                          {fileType === 'Document' ? <GrDocumentText className={'file-type'} /> : <GrDocumentImage className={'file-type'} />}
                          {StringManager.removeFileExtension(StringManager.uppercaseFirstLetterOfAllWords(doc.name))}
                        </p>
                        <div className={`checkbox delete`} onClick={deleteDoc}>
                          <PiTrashSimpleDuotone className={'delete-icon'} />
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </Fade>
      </div>
      {!showCard && (
        <NavBar navbarClass={'documents'}>
          <GrDocumentUpload id={'add-new-button'} onClick={() => setShowCard(true)} />
        </NavBar>
      )}
    </>
  )
}