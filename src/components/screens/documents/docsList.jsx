import { useContext, useEffect, useState } from 'react'

import ScreenNames from '@screenNames'
import DB from '@db'
import Manager from '@manager'
import DB_UserScoped from '@userScoped'
import globalState from '../../../context'
import DocViewer from './docViewer'
import DB_DocumentScoped from '@documentScoped'
import AddNewButton from '../../shared/addNewButton'
import FirebaseStorage from '@firebaseStorage'
import DocumentsManager from '../../../managers/documentsManager'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  uniqueArray,
  getFileExtension,
} from '../../../globalFunctions'
import SecurityManager from '../../../managers/securityManager'

export default function DocsList() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [docs, setDocs] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [toDelete, setToDelete] = useState([])

  const getSecuredDocs = async () => {
    const allDocs = await SecurityManager.getDocuments(currentUser)
    setDocs(allDocs)
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
    DocumentsManager.deleteDocsWithIds(toDelete, currentUser, theme, (docId) => {
      setToDelete(toDelete.filter((x) => x !== docId))
      setDocs(docs.filter((x) => x.id !== docId))
    })
  }

  useEffect(() => {
    getSecuredDocs().then((r) => r)
    setState({ ...state, previousScreen: ScreenNames.docsList, showBackButton: false, showMenuButton: true })
    Manager.toggleForModalOrNewForm()
  }, [])

  return (
    <div>
      <p className="screen-title ">Documents</p>
      <AddNewButton
        onClose={() => setState({ ...state, currentScreen: ScreenNames.uploadDocuments })}
        onClick={() => setState({ ...state, currentScreen: ScreenNames.uploadDocuments })}
      />
      <div id="doc-selection-container" className={`${theme} page-container`}>
        {docs.length === 0 && <p className={`${theme} caption`}>there are currently no documents</p>}
        <p className="mb-10">If the document type you tap is an Image, the loading time may be a bit longer.</p>
        {!Manager.isValid(selectedDoc, false, true) && (
          <div className="sections">
            {Manager.isValid(docs, true) &&
              docs.map((doc, index) => {
                const fileType = getFileExtension(doc.name).contains('docx') ? 'Document' : 'Image'
                return (
                  <div className="row" key={index}>
                    <div className="flex">
                      <p
                        key={Manager.getUid()}
                        className="section"
                        data-id={doc.id}
                        onClick={() => {
                          setSelectedDoc(doc)
                          setState({ ...state, docToView: doc, currentScreen: ScreenNames.docViewer })
                        }}>
                        {removeFileExtension(doc.name)}
                      </p>
                      <div className={`checkbox ml-20 delete`} onClick={(e) => handleDeleteCheckbox(e.currentTarget)}>
                        <span className="checkmark-icon material-icons-round">check</span>
                      </div>
                    </div>
                    {fileType === 'Document' && (
                      <div className="flex">
                        <span className="material-icons-round fs-22 pr-5">description</span>
                        <p className="italic">From Document</p>
                      </div>
                    )}
                    {fileType === 'Image' && (
                      <div className="flex">
                        <span className="material-icons-round fs-22 pr-5">image</span>
                        <p className="italic">From Image</p>
                      </div>
                    )}
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
    </div>
  )
}
