import { useContext, useEffect, useState } from 'react'

import ScreenNames from '@screenNames'
import DB from '@db'
import Manager from '@manager'
import DB_UserScoped from '@userScoped'
import globalState from '../../../context'
import StandardDocs from './standardDocs'
import DB_DocumentScoped from '@documentScoped'
import AddNewButton from '../../shared/addNewButton'
import FirebaseStorage from '@firebaseStorage'
import DocumentsManager from '../../../managers/documentsManager'

export default function DocsList() {
  const { state, setState } = useContext(globalState)
  const { currentUser } = state
  const [docs, setDocs] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [toDelete, setToDelete] = useState([])

  const getDocs = async () => {
    const allDocs = await DocumentsManager.getAllDocs(currentUser)
    console.log(allDocs)
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
    DocumentsManager.deleteDocsWithIds(toDelete, currentUser, (docId) => {
      setToDelete(toDelete.filter((x) => x !== docId))
      setDocs(docs.filter((x) => x.id !== docId))
    })
  }

  useEffect(() => {
    getDocs().then((r) => r)
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
      <div id="doc-selection-container" className="page-container">
        {docs.length === 0 && <p className="caption">there are currently no documents</p>}
        {!Manager.isValid(selectedDoc, false, true) && (
          <div className="sections">
            {Manager.isValid(docs, true) &&
              docs.map((doc, index) => {
                return (
                  <div className="flex" key={index}>
                    <p
                      key={Manager.getUid()}
                      className="section"
                      data-id={doc.id}
                      onClick={() => {
                        setSelectedDoc(doc)
                        setState({ ...state, docToView: doc, currentScreen: ScreenNames.standardDocs })
                      }}>
                      {doc.name.formatFileName()}
                    </p>
                    <div className={`checkbox ml-20 delete`} onClick={(e) => handleDeleteCheckbox(e.currentTarget)}>
                      <span className="checkmark-icon material-icons-round">check</span>
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
    </div>
  )
}
