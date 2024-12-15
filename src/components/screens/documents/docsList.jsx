import { useContext, useEffect, useState } from 'react'

import ScreenNames from '@screenNames'
import DB from '@db'
import Manager from '@manager'
import globalState from '../../../context'
import DocumentsManager from '../../../managers/documentsManager'
import { child, getDatabase, onValue, ref } from 'firebase/database'
import { GrDocumentImage, GrDocumentText, GrDocumentUpload } from 'react-icons/gr'
import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  hasClass,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import SecurityManager from '../../../managers/securityManager'
import UploadDocuments from './uploadDocuments'
import NavBar from '../../navBar'
import NoDataFallbackText from '../../shared/noDataFallbackText'

export default function DocsList() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [docs, setDocs] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [toDelete, setToDelete] = useState([])
  const [showCard, setShowCard] = useState(false)

  const getSecuredDocs = async () => {
    const allDocs = await SecurityManager.getDocuments(currentUser)
    setDocs(allDocs)
    setState({ ...state, isLoading: false })
  }

  const handleDeleteCheckbox = (checkbox) => {
    const id = checkbox?.previousSibling?.getAttribute('data-id')
    if (checkbox.classList.contains('active')) {
      checkbox.classList.remove('active')
      setToDelete(toDelete.filter((x) => x !== id))
    } else {
      checkbox.classList.add('active')
      setToDelete([...toDelete, id])
    }
  }

  const deleteDocs = async () => {
    DocumentsManager.deleteDocsWithIds(toDelete, currentUser, (docId) => {
      setToDelete([])
      // setDocs(docs.filter((x) => x.id !== docId))
    })
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, DB.tables.documents), async (snapshot) => {
      await getSecuredDocs()
    })
  }

  useEffect(() => {
    onTableChange().then((r) => r)
    Manager.showPageContainer()
  }, [])

  return (
    <>
      <UploadDocuments showCard={showCard} hideCard={() => setShowCard(false)} />
      <div id="doc-selection-container" className={`${theme} page-container`}>
        <p className="screen-title ">Documents</p>
        <p className="mb-10">Upload documents, which are legal (separation agreement, custody agreement, .etc) or otherwise.</p>
        <p className="mb-10">If the document type you tap is an image, the loading time may be a bit longer.</p>
        {docs.length === 0 && <NoDataFallbackText text={'There are currently no documents'} />}

        {!Manager.isValid(selectedDoc, false, true) && (
          <div className="sections">
            {Manager.isValid(docs, true) &&
              docs.map((doc, index) => {
                const fileType = getFileExtension(doc.name).contains('docx') ? 'Document' : 'Image'
                return (
                  <div key={Manager.getUid()} className="row" key={index}>
                    <div className="flex section">
                      <p
                        data-id={doc.id}
                        onClick={() => {
                          setSelectedDoc(doc)
                          setState({ ...state, docToView: doc, currentScreen: ScreenNames.docViewer })
                        }}>
                        {removeFileExtension(doc.name)}
                      </p>
                      <div className={`checkbox delete`} onClick={(e) => handleDeleteCheckbox(e.currentTarget)}>
                        <span className="checkmark-icon material-icons-round">check</span>
                      </div>
                      {fileType === 'Document' && (
                        <div className="flex doc-type">
                          <GrDocumentText />
                          <p>Document</p>
                        </div>
                      )}
                      {fileType === 'Image' && (
                        <div className="flex doc-type">
                          <GrDocumentImage />
                          <p>Image</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
        {toDelete.length > 0 && (
          <button onClick={deleteDocs} className="mt-20 button default red center">
            Delete {toDelete.length} Documents
          </button>
        )}
      </div>
      {!showCard && (
        <NavBar navbarClass={'documents'}>
          <GrDocumentUpload id={'add-new-button'} onClick={() => setShowCard(true)} />
        </NavBar>
      )}
    </>
  )
}