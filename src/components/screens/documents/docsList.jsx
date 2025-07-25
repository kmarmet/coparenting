// Path: src\components\screens\documents\docsList.jsx
import React, {useContext, useEffect, useState} from "react"
import {FaFileImage, FaMinus} from "react-icons/fa"
import {HiDocumentText} from "react-icons/hi2"
import {IoDocuments} from "react-icons/io5"
import ScreenNames from "../../../constants/screenNames"
import globalState from "../../../context"
import useCurrentUser from "../../../hooks/useCurrentUser"
import useDocuments from "../../../hooks/useDocuments"
import AlertManager from "../../../managers/alertManager"
import DocumentsManager from "../../../managers/documentsManager"
import DomManager from "../../../managers/domManager"
import Manager from "../../../managers/manager"
import StringManager from "../../../managers/stringManager"
import NavBar from "../../navBar"
import Screen from "../../shared/screen"
import ScreenHeader from "../../shared/screenHeader"

export default function DocsList() {
      const {state, setState} = useContext(globalState)
      const {theme} = state
      const [selectedDoc, setSelectedDoc] = useState(null)
      const {currentUser} = useCurrentUser()
      const {documents, documentsAreLoading} = useDocuments()

      const DeleteDoc = async (checkbox) => {
            const id = checkbox.currentTarget?.previousSibling?.getAttribute("data-id")
            AlertManager.confirmAlert({
                  title: "Are you sure you want to Delete this document?",
                  confirmButtonText: "I'm Sure",
                  bg: "#c71436",
                  color: "#fff",
                  onConfirm: async () => {
                        await DocumentsManager.DeleteDocsWithIds([id], currentUser)
                  },
            })
      }

      useEffect(() => {
            setTimeout(() => {
                  DomManager.ToggleAnimation("add", "row", DomManager.AnimateClasses.names.fadeInUp, 80)
            }, 300)
      }, [])

      return (
            <Screen activeScreen={ScreenNames.docsList} loadingByDefault={true} stopLoadingBool={!documentsAreLoading}>
                  <div id="doc-selection-container" className={`${theme} page-container`}>
                        <ScreenHeader
                              titleIcon={<IoDocuments />}
                              title={"Documents"}
                              screenName={ScreenNames.docsList}
                              screenDescription="You may upload legal documents, such as a separation agreement or custody agreement, among others. If you wish, these documents can also be
          shared with a co-parent."
                        />

                        <div className="screen-content">
                              {!Manager.IsValid(selectedDoc) && Manager.IsValid(documents) && (
                                    <div className="sections">
                                          {Manager.IsValid(documents) &&
                                                documents.map((doc, index) => {
                                                      const documentExts = ["doc", "docx", "pdf", "txt", "odt"]
                                                      const fileType = documentExts.includes(
                                                            StringManager.GetFileExtension(doc.documentName).toString()
                                                      )
                                                            ? "Document"
                                                            : "Image"
                                                      return (
                                                            <div
                                                                  className="row"
                                                                  key={index}
                                                                  data-url={doc?.url}
                                                                  onClick={() => {
                                                                        setSelectedDoc(doc)

                                                                        setState({
                                                                              ...state,
                                                                              docToView: doc,
                                                                              docViewerUrl: doc?.url,
                                                                              currentScreen: ScreenNames.docViewer,
                                                                        })
                                                                  }}>
                                                                  <div className="flex section">
                                                                        <p data-id={doc.id}>
                                                                              {fileType === "Document" ? (
                                                                                    <HiDocumentText className={"file-type"} />
                                                                              ) : (
                                                                                    <FaFileImage className={"file-type"} />
                                                                              )}
                                                                              {StringManager.removeFileExtension(
                                                                                    StringManager.UppercaseFirstLetterOfAllWords(doc.documentName)
                                                                              )}
                                                                        </p>
                                                                        <div className="svg-wrapper" onClick={DeleteDoc}>
                                                                              <FaMinus className={"delete-icon"} />
                                                                        </div>
                                                                        {/*<div className={`checkbox delete`}>*/}
                                                                        {/*  <CgClose className={'close-x'} />*/}
                                                                        {/*</div>*/}
                                                                  </div>
                                                            </div>
                                                      )
                                                })}
                                    </div>
                              )}
                        </div>
                  </div>
                  {documents.length === 0 && <p className={"no-data-fallback-text"}>No Documents</p>}
                  <NavBar navbarClass={"documents"} />
            </Screen>
      )
}