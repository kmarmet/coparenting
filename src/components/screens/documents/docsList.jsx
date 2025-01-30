import { useContext, useEffect, useState } from 'react'
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
import { FaCheck } from 'react-icons/fa6'

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
    })
  }

  const onTableChange = async () => {
    const dbRef = ref(getDatabase())
    onValue(child(dbRef, `${DB.tables.documents}/${currentUser?.phone}`), async (snapshot) => {
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
            Upload documents, which are legal (separation agreement, custody agreement, .etc) or otherwise. These documents can be shared with a
            co-parent if you choose to.
          </p>

          {!Manager.isValid(selectedDoc) && (
            <div className="sections">
              {Manager.isValid(docs) &&
                docs.map((doc, index) => {
                  const documentExts = ['doc', 'docx', 'pdf', 'txt', 'odt']
                  const fileType = documentExts.includes(StringManager.getFileExtension(doc.name).toString()) ? 'Document' : 'Image'
                  return (
                    <div className="row" key={index}>
                      <div className="flex section">
                        <p
                          data-id={doc.id}
                          onClick={() => {
                            setSelectedDoc(doc)

                            setState({ ...state, docToView: doc, currentScreen: ScreenNames.docViewer })
                          }}>
                          {fileType === 'Document' ? <GrDocumentText className={'file-type'} /> : <GrDocumentImage className={'file-type'} />}
                          {StringManager.removeFileExtension(StringManager.uppercaseFirstLetterOfAllWords(doc.name))}
                        </p>
                        <div className={`checkbox delete`} onClick={(e) => handleDeleteCheckbox(e.currentTarget)}>
                          <FaCheck className={'checkmark-icon'} />
                        </div>
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