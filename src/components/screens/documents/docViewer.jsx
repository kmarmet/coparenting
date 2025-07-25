import debounce from "debounce"
import _ from "lodash"
import moment from "moment"
import React, {useContext, useEffect, useMemo, useState} from "react"
import {FaShare} from "react-icons/fa"
import {FaLightbulb} from "react-icons/fa6"
import {HiDotsHorizontal} from "react-icons/hi"
import {IoIosArrowUp} from "react-icons/io"
import {IoListOutline} from "react-icons/io5"
import {MdDriveFileRenameOutline} from "react-icons/md"
import {TbFileSearch} from "react-icons/tb"
import searchTextHL from "search-text-highlight"
import ButtonThemes from "../../../constants/buttonThemes"
import DatetimeFormats from "../../../constants/datetimeFormats"
import InputTypes from "../../../constants/inputTypes"
import ScreenNames from "../../../constants/screenNames"
import globalState from "../../../context"
import DB from "../../../database/DB"
import useCurrentUser from "../../../hooks/useCurrentUser"
import useDocuments from "../../../hooks/useDocuments"
import AlertManager from "../../../managers/alertManager"
import DatasetManager from "../../../managers/datasetManager.coffee"
import DocumentConversionManager from "../../../managers/documentConversionManager"
import DomManager from "../../../managers/domManager"
import Manager from "../../../managers/manager"
import StringManager from "../../../managers/stringManager"
import DocumentHeader from "../../../models/documentHeader"
import NavBar from "../../navBar"
import Button from "../../shared/button"
import Form from "../../shared/form"
import InputField from "../../shared/inputField"
import Label from "../../shared/label.jsx"
import Screen from "../../shared/screen"
import ScreenActionsMenu from "../../shared/screenActionsMenu"
import ScreenHeader from "../../shared/screenHeader"
import Spacer from "../../shared/spacer"

export default function DocViewer() {
      const predefinedHeaders = DocumentConversionManager.tocHeaders
      const {state, setState} = useContext(globalState)
      const {theme, docToView, docViewerUrl, currentScreen, refreshKey} = state

      // STATE
      const [tocHeaders, setTocHeaders] = useState([])
      const [showToc, setShowToc] = useState(false)
      const [showSearch, setShowSearch] = useState(false)
      const [imgUrl, setImgUrl] = useState("")
      const [docType, setDocType] = useState("document")
      const [showTips, setShowTips] = useState(false)
      const [showRenameFile, setShowRenameFile] = useState(false)
      const [newFileName, setNewFileName] = useState(docToView?.documentName)
      const [searchValue, setSearchValue] = useState("")
      const [showShareCard, setShowShareCard] = useState(false)
      const [shareEmail, setShareEmail] = useState("")
      const [headersAdded, setHeadersAdded] = useState(false)

      const docText = document.getElementById("doc-text")

      // HOOKS
      const {currentUser, currentUserIsLoading} = useCurrentUser()
      const {documents, documentsAreLoading} = useDocuments()

      const ScrollToHeader = (hashedHeader) => {
            const domHeader = document.querySelector(`#doc-text [data-hashed-header="${hashedHeader}"]`)
            if (domHeader) {
                  setTimeout(() => {
                        if (domHeader) {
                              domHeader.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                              })
                        }
                  }, 300)
            }
      }

      const userHeaders = useMemo(() => {
            return DB.getTable(`${DB.tables.documentHeaders}/${currentUser?.key}`)
      }, [currentUser])

      const OnLoad = async () => {
            const fileType = `.${StringManager.GetFileExtension(docToView.documentName)}`.toLowerCase()
            const nonImageFileTypes = [".docx", ".doc", ".pdf", ".odt", ".txt"]
            if (currentUser && nonImageFileTypes.includes(fileType)) {
                  setTimeout(async () => {
                        await AppendText()
                  }, 1000)
            } else {
                  setDocType("image")
                  await FormatImageDocument()
            }
            ClearEmptyElements()
      }

      const SetTableOfContentsHeaders = async () => {
            let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser?.key}`)
            let headersInDocument = []
            let mappedHeaders = userHeaders

            if (!mappedHeaders) {
                  mappedHeaders = predefinedHeaders
            } else {
                  mappedHeaders = userHeaders?.map((x) => x.headerText)
            }

            const domHeaders = document.querySelectorAll(".header")
            if (Manager.IsValid(domHeaders)) {
                  // Loop through DOM headers
                  for (let header of domHeaders) {
                        let headerTextElement = header.querySelector(".header-text")
                        // Add header event listeners
                        header.addEventListener("click", DeleteHeader)

                        // Get header text
                        if (!headerTextElement) {
                              headerTextElement = header.textContent.trim()
                        } else {
                              headerTextElement = headerTextElement.textContent.trim()
                              if (!_.isEmpty(headerTextElement) && StringManager.GetWordCount(headerTextElement) <= 10) {
                                    // Add header to headersInDocument
                                    if (!headersInDocument.includes(headerTextElement)) {
                                          headersInDocument.push(Manager.GenerateHash(headerTextElement))
                                    }
                              }
                        }
                  }
            }
            const userHeadersMatchingHeadersInDocument = mappedHeaders.filter((x) => headersInDocument.includes(x))
            let allHeaders = []

            if (Manager.IsValid(userHeadersMatchingHeadersInDocument)) {
                  allHeaders = userHeadersMatchingHeadersInDocument
            } else {
                  allHeaders = headersInDocument
            }
            setTocHeaders(DatasetManager.getUniqueArray(allHeaders, true))
      }

      const Search = async () => {
            if (Manager.IsValid(searchValue, true)) {
                  const docText = document.getElementById("doc-text")
                  let textAsHtml = docText.innerHTML
                  if (!textAsHtml.includes(searchValue)) {
                        AlertManager.throwError(`Unable to find "${searchValue}" in this document`)
                        setShowSearch(false)
                        return false
                  }
                  textAsHtml = searchTextHL.highlight(textAsHtml, searchValue)
                  textAsHtml = textAsHtml.replaceAll('<span class=" text-highlight"="', "")
                  docText.innerHTML = textAsHtml
                  setShowSearch(false)
                  setTimeout(() => {
                        let headers = docText.querySelectorAll(".header")
                        if (Manager.IsValid(headers)) {
                              for (let header of headers) {
                                    if (header.textContent.includes(searchValue.toUpperCase())) {
                                          header.textContent = header.textContent.replace('">', "")
                                          header.textContent = header.textContent.replace(searchValue, "")
                                          const childSpan = header.querySelector("span")
                                          if (childSpan) {
                                                childSpan.remove()
                                          }
                                          const dataHeader = header.dataset.header
                                          if (dataHeader) {
                                                const cleanHeader = dataHeader.replaceAll("<span class=", "")
                                                header.setAttribute("data-header", cleanHeader.trim())
                                          }
                                    }
                              }
                        }
                  }, 500)
            }
      }

      const FormatImageDocument = async () => {
            try {
                  // Insert text
                  if (Manager.IsValid(docToView)) {
                        setImgUrl(docToView.url)

                        let text = docToView.docText
                        // if (!text) {
                        //         //   AlertManager.throwError(
                        //         //     `Unable to find or convert document, please try again after awhile. ${docToView?.type === 'image' ? `In the meantime, you can view the document image while this is being resolved.` : ''}`
                        //         //   )
                        //         //   return false
                        //         // }

                        // Remove line breaks after header
                        const lineBreaks = document.querySelectorAll("br")
                        for (let lineBreak of lineBreaks) {
                              const previousSibling = lineBreak.previousElementSibling
                              if (previousSibling && previousSibling?.tagName === "SPAN") {
                                    lineBreak.remove()
                              }
                        }

                        const docText = document.getElementById("doc-text")
                        docText.innerHTML = text

                        await AddAndFormatHeaders()
                        CorrectTextErrors()
                        await SetTableOfContentsHeaders()
                  } else {
                        AlertManager.throwError("No Document Found")
                        return false
                  }
            } catch (error) {
                  AlertManager.throwError("Unable to find or load document")
            }
      }

      const CleanBrokenHTML = (input) => {
            return input
                  .replaceAll("p>", "")
                  .replaceAll("li>", "")
                  .replaceAll("ul>", "")
                  .replaceAll("a>", "")
                  .replaceAll("ol>", "")
                  .replaceAll("br>", "")
                  .replaceAll("span>", "")
                  .replaceAll("h2>", "")
                  .replaceAll("  ", " ")
                  .replaceAll("Triday", "Friday")
                  .trim()
      }

      const FixLinksWithoutText = () => {
            const linksOnPage = document.querySelectorAll("a")

            if (Manager.IsValid(linksOnPage)) {
                  linksOnPage.forEach((link) => {
                        // Trimmed text content
                        const text = link.textContent.trim()

                        link.classList.add("link")

                        // If the link has no text or only whitespace
                        if (!text) {
                              const href = link.getAttribute("href")

                              // Only set text if href exists
                              if (href) {
                                    link.textContent = href
                              }
                        }
                  })
            }
      }

      const AppendText = async () => {
            let docText = docToView.docText
            const textContainer = document.getElementById("doc-text")
            const docToHTMLResponse = await fetch(docViewerUrl)
            const blob = await docToHTMLResponse.blob()
            if (!Manager.IsValid(blob)) return false
            const htmlResult = await DocumentConversionManager.GetTextFromDocx(blob)

            if (!Manager.IsValid(docToView) || !Manager.IsValid(docText, true)) {
                  AlertManager.throwError("Unable to find or load document. Please try again after awhile.")
                  setState({...state, isLoading: false, currentScreen: ScreenNames.docsList})
                  return false
            }
            // APPEND HTML
            if (Manager.IsValid(textContainer)) {
                  textContainer.innerHTML = htmlResult
            }
      }

      const CorrectTextErrors = () => {
            let docText = document.getElementById("doc-text")

            if (docText && docText.innerHTML) {
                  docText.innerHTML = CleanBrokenHTML(docText.innerHTML)
                  FixLinksWithoutText()
            }
      }

      const AddAndFormatHeaders = async () => {
            if (headersAdded === false) {
                  if (!Manager.IsValid(docText)) return false

                  let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser?.key}`)
                  userHeaders = userHeaders.map((x) => x.headerText)
                  for (let header of userHeaders) {
                        docText.innerHTML = docText.innerHTML.replaceAll(
                              header,
                              `<div data-hashed-header=${Manager.GenerateHash(header).replaceAll(" ", "")} class="header">
                          <span class="header-text">${StringManager.UppercaseFirstLetterOfAllWords(header)}</span>
                        </div>`
                        )
                  }
                  setHeadersAdded(true)
            }
      }

      const DeleteHeader = async (headerElement) => {
            const headerTarget = headerElement?.currentTarget
            if (headerTarget) {
                  const headerText = headerTarget.querySelector(".header-text")?.textContent
                  const header = await DB.find(`${DB.tables.documentHeaders}/${currentUser?.key}`, ["headerText", headerText], true)
                  if (header) {
                        await DB.deleteById(`${DB.tables.documentHeaders}/${currentUser?.key}`, header.id)
                        setTocHeaders([])
                        await OnLoad()
                  }
            }
      }

      const AddUserHeaderToDatabase = async () => {
            const text = DomManager.GetSelectionText()

            let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser?.key}`)
            const alreadyExists = Manager.IsValid(userHeaders.find((x) => x.headerText.includes(text)))

            if (!alreadyExists) {
                  if (text.length > 5 && currentScreen === ScreenNames.docViewer) {
                        AlertManager.confirmAlert({
                              title: "Would you like to use the selected text as a header?",
                              confirmButtonText: "Yes",
                              showCancelButton: true,
                              onConfirm: async () => {
                                    const header = new DocumentHeader()
                                    header.headerText = text
                                    header.owner = {
                                          key: currentUser?.key,
                                          email: currentUser?.email,
                                          name: currentUser?.name,
                                    }
                                    await DB.Add(`${DB.tables.documentHeaders}/${currentUser?.key}`, userHeaders, header)
                                    await OnLoad()
                              },
                              onDeny: () => {
                                    DomManager.ClearTextSelection()
                              },
                        })
                  }
            } else {
                  if (text.length > 5) {
                        AlertManager.throwError("This header already exists")
                        return false
                  }
            }
      }

      const CloseSearch = async () => {
            setShowSearch(false)
            setSearchValue("")
            const searchHighlights = document.querySelectorAll(".text-highlight")
            if (Manager.IsValid(searchHighlights)) {
                  for (let highlight of searchHighlights) {
                        highlight.classList.remove("text-highlight")
                  }
            }
            await OnLoad()
      }

      const ScrollToTop = () => {
            const header = document.querySelector(".screen-title")
            header.scrollIntoView({behavior: "smooth", block: "end"})
      }

      const RenameFile = async () => {
            if (Manager.IsValid(newFileName, true)) {
                  const newName = `${newFileName}.${StringManager.GetFileExtension(docToView.documentName).toLowerCase()}`
                  const recordIndex = DB.GetTableIndexById(documents, docToView?.id)
                  if (recordIndex > -1) {
                        let updatedDocument = documents[recordIndex]
                        updatedDocument.documentName = newName
                        console.log("rname")
                        setNewFileName(newName)
                        await DB.ReplaceEntireRecord(`${DB.tables.documents}/${currentUser?.key}/${recordIndex}`, updatedDocument)
                  }
                  setShowRenameFile(false)
            } else {
                  AlertManager.throwError("Please enter a new document name")
                  return false
            }
      }

      const ClearEmptyElements = () => {
            document.querySelectorAll("p").forEach((p) => {
                  if (!p.textContent.trim()) {
                        p.style.display = "none"
                  }
            })
      }

      // Add and format headers when document text changes
      useEffect(() => {
            if (Manager.IsValid(docText) && Manager.IsValid(docText?.textContent) && Manager.IsValid(currentUser)) {
                  const docTextLength = docText.textContent.length
                  if (docTextLength > 100) {
                        setTimeout(async () => {
                              await AddAndFormatHeaders()
                              await SetTableOfContentsHeaders()
                        }, 2000)
                  }
            }
      }, [docText?.textContent?.length, currentUser])

      // PAGE LOAD -> When document is loaded
      useEffect(() => {
            if (!currentUserIsLoading && !documentsAreLoading && Manager.IsValid(docViewerUrl, true)) {
                  void OnLoad()
            }
      }, [currentUserIsLoading, documentsAreLoading, docViewerUrl])

      // PAGE LOAD
      useEffect(() => {
            const appContentWithSidebar = document.getElementById("app-content-with-sidebar")
            if (appContentWithSidebar) {
                  appContentWithSidebar.classList.add("doc-viewer")
            }

            // Listen for selection change
            if (currentScreen === ScreenNames.docViewer) {
                  document.addEventListener("selectionchange", debounce(AddUserHeaderToDatabase, 1000))
            }

            return () => {
                  document.removeEventListener("selectionchange", AddUserHeaderToDatabase)
                  if (appContentWithSidebar) {
                        appContentWithSidebar.classList.remove("doc-viewer")
                  }
            }
      }, [])

      return (
            <>
                  {/* SEARCH CARD */}
                  <Form
                        wrapperClass="doc-search-card"
                        className="search-card"
                        submitText={"Find Text"}
                        showCard={showSearch}
                        hasSubmitButton={Manager.IsValid(searchValue, true)}
                        title={"Find Text"}
                        showOverlay={false}
                        onSubmit={Search}
                        onOpen={() => {
                              const searchInput = document.querySelector(".search-input")
                              if (searchInput) {
                                    searchInput.value = ""
                                    searchInput.focus()
                              }
                        }}
                        onClose={CloseSearch}>
                        <InputField
                              inputClasses={"search-input"}
                              labelText="Enter word(s) to find..."
                              onChange={(e) => setSearchValue(e.target.value)}
                              inputValueType="text"
                        />
                  </Form>

                  {/* TIPS CARD */}
                  <Form
                        wrapperClass="doc-tips-card"
                        hasSubmitButton={false}
                        showCard={showTips}
                        title={"Learn More"}
                        onClose={() => setShowTips(false)}>
                        <>
                              <hr className="mt-5 mb-20" />
                              <Label classes={"always-show"} text={"Searching"} isBold={true} />

                              <p className="tip-text">
                                    To begin your search, {DomManager.tapOrClick()} the search button and enter the word or words you want to look
                                    for. The results you find will be <span className="text-highlight">highlighted</span> for easy viewing.
                              </p>
                              <hr />
                              <Label classes={"always-show"} text={"Table of Contents"} isBold={true} />
                              <p className="tip-text">
                                    {DomManager.tapOrClick(true)} the <IoListOutline id="toc-button-inline" className={`${theme}`} /> icon to view the
                                    Table of Contents.
                              </p>
                              <p className="tip-text">
                                    When you {DomManager.tapOrClick()} an item, you&#39;ll be directed straight to the corresponding header in the
                                    document.
                              </p>
                              <hr />
                              <Label text={"Create Your Own Headers"} classes={"always-show"} isBold={true} />
                              <p className="tip-text">
                                    You might notice some predefined headers, which are text on a light grey background. However, it&#39;s a good idea
                                    to create your own custom headers to make specific texts stand out to you.
                              </p>
                              <Spacer height={5} />
                              <p className="tip-text">
                                    To create a new header, just highlight the text you want to use, and then {DomManager.tapOrClick()} the
                                    confirmation button when it appears.
                              </p>
                              <Spacer height={5} />
                              <p className="tip-text">
                                    The page will refresh, and you&#39;ll be able to see the new header you&#39;ve just created! Your custom headers
                                    will appear each time you open the document.
                              </p>
                        </>
                  </Form>

                  {/* SHARE CARD */}
                  <Form
                        wrapperClass="doc-share-card"
                        hasSubmitButton={true}
                        submitText={"Share"}
                        showCard={showShareCard}
                        // onSubmit={Share}
                        title={"Share Your Document"}
                        onClose={() => setShowShareCard(false)}>
                        <InputField
                              placeholder="Recipient Email Address"
                              onChange={(e) => setShareEmail(e.target.value)}
                              inputType={InputTypes.email}
                        />
                  </Form>

                  {/* TABLE OF CONTENTS */}
                  {tocHeaders?.length > 0 && (
                        <Form
                              wrapperClass="toc-card"
                              hasSubmitButton={false}
                              showCard={showToc}
                              onClose={() => setShowToc(false)}
                              className="toc"
                              title={"Table of Contents"}>
                              <div id="table-of-contents">
                                    <div id="toc-contents">
                                          {tocHeaders.length > 0 &&
                                                tocHeaders.sort().map((header, index) => {
                                                      return (
                                                            <div key={index} className="flex" id="toc-header-wrapper">
                                                                  <p
                                                                        onClick={() => {
                                                                              setShowToc(false)
                                                                              ScrollToHeader(header)
                                                                        }}
                                                                        className={`toc-header`}
                                                                        data-hashed-header={header}
                                                                        dangerouslySetInnerHTML={{__html: Manager.DecodeHash(header)}}></p>
                                                            </div>
                                                      )
                                                })}
                                    </div>
                              </div>
                        </Form>
                  )}

                  {/* RENAME FILE */}
                  <Form
                        showCard={showRenameFile}
                        submitText={"Rename"}
                        wrapperClass="rename-file-card"
                        onClose={() => setShowRenameFile(false)}
                        onSubmit={RenameFile}
                        onOpen={() => {
                              const renameFileInput = document.querySelector(".rename-file-input")
                              if (renameFileInput) {
                                    renameFileInput.value = ""
                                    renameFileInput.focus()
                              }
                        }}
                        className="rename-file"
                        title={"Rename Document"}>
                        {showRenameFile && (
                              <InputField
                                    placeholder={"New document name"}
                                    required={true}
                                    defaultValue={StringManager.removeFileExtension(newFileName)}
                                    inputClasses={"rename-file-input"}
                                    inputType={InputTypes.text}
                                    onChange={(e) => {
                                          console.log("from form")
                                          setNewFileName(e.target.value)
                                    }}
                              />
                        )}
                  </Form>

                  {/* SCREEN ACTIONS */}
                  <ScreenActionsMenu>
                        {/* SCROLL TO TOP BUTTON */}
                        <div
                              className="action-item scroll-to-top"
                              onClick={() => {
                                    setState({...state, showScreenActions: false})
                                    ScrollToTop()
                              }}>
                              <div className="content">
                                    <p>Scroll to Top</p>
                                    <div className="svg-wrapper ">
                                          <IoIosArrowUp id={"scroll-to-top-icon"} />
                                    </div>
                              </div>
                        </div>

                        {/* TOC BUTTON */}
                        {tocHeaders.length > 0 && (
                              <div
                                    className="action-item toc"
                                    onClick={async () => {
                                          await SetTableOfContentsHeaders()
                                          setShowToc(true)
                                          setState({...state, showScreenActions: false})
                                    }}>
                                    <div className="content">
                                          <p>Table of Contents</p>
                                          <div className="svg-wrapper">
                                                <IoListOutline id="toc-icon" className={`${theme}`} />
                                          </div>
                                    </div>
                              </div>
                        )}

                        {/* SEARCH  */}
                        <div
                              className="action-item"
                              onClick={() => {
                                    setShowSearch(true)
                                    setState({...state, showScreenActions: false})
                              }}>
                              <div className="content">
                                    <p>Find Text</p>
                                    <div className="svg-wrapper">
                                          <TbFileSearch id={"desktop-search-icon"} />
                                    </div>
                              </div>
                        </div>

                        {/* RENAME ICON */}
                        <div
                              className="action-item rename-document"
                              onClick={() => {
                                    setShowRenameFile(true)
                                    setState({...state, showScreenActions: false})
                              }}>
                              <div className="content">
                                    <p>Rename Document</p>
                                    <div className="svg-wrapper">
                                          <MdDriveFileRenameOutline />
                                    </div>
                              </div>
                        </div>

                        {/* SHARE */}
                        <div
                              className="action-item share"
                              onClick={() => {
                                    setShowShareCard(true)
                                    setState({...state, showScreenActions: false})
                              }}>
                              <div className="content">
                                    <p>Share</p>
                                    <div className="svg-wrapper">
                                          <FaShare className={"lightbulb"} />
                                    </div>
                              </div>
                        </div>

                        {/* TIPS ICON */}
                        <div
                              className="action-item tips"
                              onClick={() => {
                                    setShowTips(true)
                                    setState({...state, showScreenActions: false})
                              }}>
                              <div className="content">
                                    <p>Learn More</p>
                                    <div className="svg-wrapper">
                                          <FaLightbulb className={"lightbulb"} />
                                    </div>
                              </div>
                        </div>

                        {/* DOCUMENT IMAGE */}

                        {/*{docType === 'image' && (*/}
                        {/*  <LightGallery elementClassNames={`light-gallery ${theme}`} speed={500} selector={'#document-image'}>*/}
                        {/*    <div data-src={imgUrl} className="action-item document-image">*/}
                        {/*      <img data-src={imgUrl} id="document-image" src={imgUrl} alt="" />*/}
                        {/*    </div>*/}
                        {/*  </LightGallery>*/}
                        {/*)}*/}
                  </ScreenActionsMenu>

                  {/* SCREEN */}
                  <Screen activeScreen={currentScreen}>
                        {/* PAGE CONTAINER / TEXT */}
                        <div id="documents-container" className={`${theme} page-container  documents`}>
                              <ScreenHeader
                                    title={StringManager.removeFileExtension(StringManager.UppercaseFirstLetterOfAllWords(newFileName))
                                          .replaceAll("-", " ")
                                          .replaceAll("_", " ")}
                                    screenDescription={`${docToView?.owner?.key !== currentUser?.key ? `Shared by ${docToView?.owner?.name}` : ""} <br/> ${docToView?.owner?.key === currentUser?.key ? `Uploaded on ${moment(docToView?.creationDate).format(DatetimeFormats.readableMonthAndDayWithYear)}` : ""}`}
                              />

                              {/* SCREEN CONTENT - DOC TEXT */}
                              <div className="screen-content">
                                    <div id="doc-text" key={refreshKey}></div>
                              </div>

                              {/* CLOSE SEARCH BUTTON */}
                              <Button
                                    theme={ButtonThemes.blend}
                                    text={"Close Search"}
                                    onClick={CloseSearch}
                                    classes={`bottom-right${Manager.IsValid(searchValue, true) ? " active" : ""}`}
                              />
                        </div>

                        {/* NAV BAR */}
                        {DomManager.isMobile() && (
                              <NavBar>
                                    <div
                                          style={DomManager.AnimateDelayStyle(1, 0.07)}
                                          onClick={() => setState({...state, showScreenActions: true})}
                                          className={`menu-item ${DomManager.Animate.FadeInUp(true, ".menu-item")}`}>
                                          <HiDotsHorizontal className={"screen-actions-menu-icon"} />
                                          <p>More</p>
                                    </div>
                              </NavBar>
                        )}
                  </Screen>
            </>
      )
}