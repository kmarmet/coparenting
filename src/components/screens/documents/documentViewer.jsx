import debounce from "debounce"
import moment from "moment"
import React, {useContext, useEffect, useState} from "react"
import {FaShare} from "react-icons/fa"
import {FaLightbulb} from "react-icons/fa6"
import {HiDotsHorizontal} from "react-icons/hi"
import {IoIosArrowUp} from "react-icons/io"
import {IoListOutline} from "react-icons/io5"
import {MdDriveFileRenameOutline} from "react-icons/md"
import {TbFileSearch} from "react-icons/tb"
import searchTextHL from "search-text-highlight"
import AppImages from "../../../constants/appImages"
import ButtonThemes from "../../../constants/buttonThemes"
import DatetimeFormats from "../../../constants/datetimeFormats"
import InputTypes from "../../../constants/inputTypes"
import ScreenNames from "../../../constants/screenNames"
import globalState from "../../../context"
import DB from "../../../database/DB"
import useCurrentUser from "../../../hooks/useCurrentUser"
import useDocuments from "../../../hooks/useDocuments"
import useUserDocumentHeaders from "../../../hooks/useUserDocumentHeaders"
import AlertManager from "../../../managers/alertManager"
import DocumentConversionManager from "../../../managers/documentConversionManager"
import DomManager from "../../../managers/domManager"
import EmailManager from "../../../managers/emailManager"
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

export default function DocumentViewer() {
    const predefinedHeaders = DocumentConversionManager.tocHeaders
    const {state, setState} = useContext(globalState)
    const {theme, docToView, docViewerUrl, currentScreen, refreshKey} = state

    // STATE
    const [tocHeaders, setTocHeaders] = useState([])
    const [showToc, setShowToc] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [showTips, setShowTips] = useState(false)
    const [showRenameFile, setShowRenameFile] = useState(false)
    const [newFileName, setNewFileName] = useState(docToView?.documentName)
    const [searchValue, setSearchValue] = useState("")
    const [showShareCard, setShowShareCard] = useState(false)
    const [shareEmail, setShareEmail] = useState("")
    const [processedHTML, setProcessedHTML] = useState("")

    // HOOKS
    const {currentUser, currentUserIsLoading} = useCurrentUser()
    const {documents, documentsAreLoading} = useDocuments()
    const {userDocumentHeaders, userDocumentHeadersAreLoading} = useUserDocumentHeaders()

    // HELPER OBJECTS
    const Util = {
        ThrowError: (message) => {
            AlertManager.throwError(message)
            setState({...state, isLoading: false, currentScreen: ScreenNames.docsList})
            return false
        },
        ScrollToHeader: (headerId) => {
            const domHeader = document.querySelector(`#doc-text [data-header-id="${headerId}"]`)
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
        },
        SetTableOfContentsHeaders: () => {
            if (!Manager.IsValid(userDocumentHeaders)) return false
            let mappedHeaders = []

            // Add Delete Click Listener
            const domHeaders = document.querySelectorAll(".header")
            if (Manager.IsValid(domHeaders)) {
                for (let domHeader of domHeaders) {
                    domHeader.addEventListener("click", Crud.DeleteHeader)
                }
            }

            // Add mapped user headers
            if (Manager.IsValid(userDocumentHeaders)) {
                // Loop through user headers
                for (let header of userDocumentHeaders) {
                    // Add header to headersInDocument
                    if (!mappedHeaders.includes(header.headerText)) {
                        mappedHeaders.push({
                            headerText: StringManager.FormatTitle(header?.headerText, true),
                            id: header?.id,
                        })
                    }
                }
            }
            setTocHeaders(mappedHeaders)
        },
        NormalizeText: (str) => {
            return str
                .toLowerCase() // case-insensitive
                .normalize("NFD") // handle accented chars
                .replace(/[\u0300-\u036f]/g, "") // remove diacritics
                .replace(/[^a-z0-9]+/g, " ") // remove special chars
                .trim() // trim extra spaces
        },
        ScrollToTop: () => {
            const header = document.querySelector(".screen-title")
            header.scrollIntoView({behavior: "smooth", block: "end"})
        },
        FormatAndCleanupText: () => {
            const docText = document.getElementById("doc-text")
            const linksOnPage = docText?.querySelectorAll("a")
            const paragraphsOnPage = docText?.querySelectorAll("p")

            // Correct Links
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

            // Clear Empty Elements
            if (Manager.IsValid(paragraphsOnPage)) {
                paragraphsOnPage?.forEach((p) => {
                    if (!p.textContent.trim()) {
                        p.style.display = "none"
                    }
                })
            }
        },
    }

    const Crud = {
        DeleteHeader: async (headerElement) => {
            const headerTarget = headerElement?.currentTarget

            if (headerTarget) {
                const headerId = headerTarget.dataset.headerId
                const headerIndex = DB.GetIndexById(userDocumentHeaders, headerId)

                if (headerIndex > -1) {
                    const docText = document.getElementById("doc-text")
                    setProcessedHTML("")
                    await DB.DeleteByPath(`${DB.tables.documentHeaders}/${currentUser?.key}/${headerIndex}`)
                    await Init()
                    // const updatedHeaders = userDocumentHeaders.filter((x) => x.id !== headerId)
                    // setTocHeaders(updatedHeaders)
                }
            }
        },
        AddUserHeaderToDatabase: async () => {
            const text = DomManager.GetSelectionText()
            const alreadyExists = Manager.IsValid(
                userDocumentHeaders.find((x) => Util.NormalizeText(x.headerText).includes(Util.NormalizeText(text)))
            )

            if (!alreadyExists) {
                if (text.length > 5 && currentScreen === ScreenNames.docViewer) {
                    AlertManager.confirmAlert({
                        title: "Would you like to use the selected text as a header?",
                        confirmButtonText: "Yes",
                        showCancelButton: true,
                        onConfirm: async () => {
                            const header = new DocumentHeader()
                            header.headerText = text.trim()
                            header.owner = {
                                key: currentUser?.key,
                                email: currentUser?.email,
                                name: currentUser?.name,
                            }
                            await DB.Add(`${DB.tables.documentHeaders}/${currentUser?.key}`, userDocumentHeaders, header)
                            await Init()
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
        },
        RenameFile: async () => {
            if (Manager.IsValid(newFileName, true)) {
                const newName = `${newFileName}.${StringManager.GetFileExtension(docToView.documentName).toLowerCase()}`
                const recordIndex = DB.GetIndexById(documents, docToView?.id)
                if (recordIndex > -1) {
                    let updatedDocument = documents[recordIndex]
                    updatedDocument.documentName = newName
                    setNewFileName(newName)
                    await DB.ReplaceEntireRecord(`${DB.tables.documents}/${currentUser?.key}/${recordIndex}`, updatedDocument)
                }
                setShowRenameFile(false)
            } else {
                AlertManager.throwError("Please enter a new document name")
                return false
            }
        },
    }

    const UI = {
        FileTypes: {
            Document: {
                AppendHTMLFromDocument: async () => {
                    const failureMessage = `Unable to find or load document. Please try again after awhile.`
                    const docToHTMLResponse = await fetch(docViewerUrl).catch(() => Util.ThrowError(failureMessage))

                    const blob = await docToHTMLResponse.blob()

                    if (blob === null || blob?.size === 0) Util.ThrowError(failureMessage)

                    const htmlResult = await DocumentConversionManager.GetTextFromDocx(blob)

                    // Invalid: htmlResult
                    if (!Manager.IsValid(htmlResult, true)) Util.ThrowError(failureMessage)

                    // Append processed text
                    setProcessedHTML(htmlResult)

                    if (Manager.IsValid(userDocumentHeaders)) {
                        const docTextWrapper = document.getElementById("doc-text")
                        userDocumentHeaders.forEach((header) => {
                            const rawHeaderText = header?.headerText?.trim()
                            if (!rawHeaderText) return

                            // Escape regex special chars
                            const safeHeader = rawHeaderText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

                            // Match header text allowing optional HTML tags/spaces
                            const regex = new RegExp(`(?:\\s*<[^>]+>\\s*)*${safeHeader}(?:\\s*<[^>]+>\\s*)*`, "gi")

                            const docTextContents = docTextWrapper.innerHTML

                            // Text replacement
                            docTextWrapper.innerHTML = docTextContents.replace(regex, (match) => {
                                return `
                                    <div data-header-id="${header?.id}" class="header">
                                      <span class="header-text">${StringManager.UppercaseFirstLetterOfAllWords(header?.headerText.trim())}</span>
                                    </div>`
                            })
                        })
                    }
                },
            },
        },
    }

    // COMPONENT FUNCTIONS
    const FormatImageDocument = async () => {
        try {
            // Insert text
            if (Manager.IsValid(docToView) && Manager.IsValid(docToView.url, true)) {
                const htmlResult = await DocumentConversionManager.ImageToHTML(AppImages.testing.legalDoc.url)
                setProcessedHTML(htmlResult)
                Util.FormatAndCleanupText()
                Util.SetTableOfContentsHeaders()
            } else {
                AlertManager.throwError("No Document Found")
                return false
            }
        } catch (error) {
            AlertManager.throwError("Unable to find or load document")
        }
    }

    const Search = async () => {
        if (Manager.IsValid(searchValue, true)) {
            const docText = document.getElementById("doc-text")
            let textAsHtml = docText.innerHTML
            if (!textAsHtml.includes(searchValue.toLowerCase().trim())) {
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

    const CloseSearch = async () => {
        setShowSearch(false)
        setSearchValue("")
        const searchHighlights = document.querySelectorAll(".text-highlight")
        if (Manager.IsValid(searchHighlights)) {
            for (let highlight of searchHighlights) {
                highlight.classList.remove("text-highlight")
            }
        }
        await Init()
    }

    const Init = async () => {
        const fileType = `.${StringManager.GetFileExtension(docToView.documentName)}`.toLowerCase()
        const nonImageFileTypes = [".docx", ".doc", ".pdf", ".odt", ".txt"]

        // Document Parsing
        if (nonImageFileTypes.includes(fileType)) {
            await UI.FileTypes.Document.AppendHTMLFromDocument()
            await Util.FormatAndCleanupText()

            // Add TOC Headers
            if (Manager.IsValid(userDocumentHeaders)) Util.SetTableOfContentsHeaders()
        }

        // Image Parsing
        else {
            await FormatImageDocument()
        }
    }

    // INIT
    useEffect(() => {
        if (Manager.IsValid(docToView) && Manager.IsValid(docToView?.url)) void Init()
    }, [docToView, userDocumentHeaders?.length])

    // INIT -> Listen for selection change
    useEffect(() => {
        if (currentScreen === ScreenNames.docViewer) {
            document.addEventListener("selectionchange", debounce(Crud.AddUserHeaderToDatabase, 1500))
        }

        return () => {
            document.removeEventListener("selectionchange", Crud.AddUserHeaderToDatabase)
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
            <Form wrapperClass="doc-tips-card" hasSubmitButton={false} showCard={showTips} title={"Learn More"} onClose={() => setShowTips(false)}>
                <>
                    <hr className="mt-5 mb-20" />
                    <Label classes={"always-show"} text={"Searching"} isBold={true} />

                    <p className="tip-text">
                        To begin your search, {DomManager.tapOrClick()} the search button and enter the word or words you want to look for. The
                        results you find will be <span className="text-highlight">highlighted</span> for easy viewing.
                    </p>
                    <hr />
                    <Label classes={"always-show"} text={"Table of Contents"} isBold={true} />
                    <p className="tip-text">
                        {DomManager.tapOrClick(true)} the <IoListOutline id="toc-button-inline" className={`${theme}`} /> icon to view the Table of
                        Contents.
                    </p>
                    <p className="tip-text">
                        When you {DomManager.tapOrClick()} an item, you&#39;ll be directed straight to the corresponding header in the document.
                    </p>
                    <hr />
                    <Label text={"Create Your Own Headers"} classes={"always-show"} isBold={true} />
                    <p className="tip-text">
                        You might notice some predefined headers, which are text on a light grey background. However, it&#39;s a good idea to create
                        your own custom headers to make specific texts stand out to you.
                    </p>
                    <Spacer height={5} />
                    <p className="tip-text">
                        To create a new header, just highlight the text you want to use, and then {DomManager.tapOrClick()} the confirmation button
                        when it appears.
                    </p>
                    <Spacer height={5} />
                    <p className="tip-text">
                        The page will refresh, and you&#39;ll be able to see the new header you&#39;ve just created! Your custom headers will appear
                        each time you open the document.
                    </p>
                </>
            </Form>

            {/* SHARE CARD */}
            <Form
                wrapperClass="doc-share-card"
                hasSubmitButton={Manager.IsValid(shareEmail, true)}
                submitText={"Share"}
                showCard={showShareCard}
                onSubmit={() => {
                    EmailManager.SendDocumentSharingEmail({
                        message: `${StringManager.FormatTitle(currentUser.name, true)} has shared a document with you. View this document here: ${docToView?.url}`,
                        userEmail: shareEmail,
                    })
                    setShowShareCard(false)
                    setState({...state, bannerMessage: `A link to view this document has been sent to ${shareEmail}`})
                }}
                title={"Share Your Document"}
                onClose={() => setShowShareCard(false)}>
                <InputField placeholder="Recipient Email Address" onChange={(e) => setShareEmail(e.target.value)} inputType={InputTypes.email} />
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
                                                    Util.ScrollToHeader(header?.id)
                                                }}
                                                className={`toc-header`}
                                                data-id={header?.id}
                                                dangerouslySetInnerHTML={{__html: header?.headerText}}></p>
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
                onSubmit={Crud.RenameFile}
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
                        Util.ScrollToTop()
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
                            Util.SetTableOfContentsHeaders()
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
            <Screen activeScreen={currentScreen} stopLoadingBool={Manager.IsValid(docToView)}>
                {/* PAGE CONTAINER / TEXT */}
                <div id="documents-container" className={`${theme} page-container  documents`}>
                    <ScreenHeader
                        title={StringManager.removeFileExtension(StringManager.UppercaseFirstLetterOfAllWords(newFileName))
                            .replaceAll("-", " ")
                            .replaceAll("_", " ")}
                        screenDescription={`${docToView?.owner?.key !== currentUser?.key ? `Shared by ${docToView?.owner?.name}` : ""} <br/> ${docToView?.owner?.key === currentUser?.key ? `Uploaded on ${moment(docToView?.creationDate).format(DatetimeFormats.readableMonthAndDayWithYear)}` : ""}`}
                    />

                    {/* SCREEN CONTENT - DOC TEXT */}
                    <div className="screen-content document-viewer">
                        <div id="doc-text" dangerouslySetInnerHTML={{__html: processedHTML}} />
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