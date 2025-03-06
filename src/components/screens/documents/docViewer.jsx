// Path: src\components\screens\documents\docViewer.jsx
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import FirebaseStorage from '/src/database/firebaseStorage'
import searchTextHL from 'search-text-highlight'
import DocumentConversionManager from '/src/managers/documentConversionManager'
import Manager from '/src/managers/manager'
import BottomCard from '/src/components/shared/bottomCard'
import SecurityManager from '/src/managers/securityManager'
import NavBar from '../../navBar'
import DB from '/src/database/DB'
import AlertManager from '/src/managers/alertManager'
import StringManager from '/src/managers/stringManager'
import LightGallery from 'lightgallery/react'
import 'lightgallery/css/lightgallery.css'
import DomManager from '/src/managers/domManager'
import debounce from 'debounce'
import { IoListOutline, IoMenuOutline } from 'react-icons/io5'
import DocumentHeader from '/src/models/documentHeader'
import InputWrapper from '/src/components/shared/inputWrapper'
import { TbFileSearch } from 'react-icons/tb'
import { MdDriveFileRenameOutline, MdSearchOff } from 'react-icons/md'
import ScreenNames from '/src/constants/screenNames'
import { IoIosArrowUp } from 'react-icons/io'
import _ from 'lodash'
import Label from '../../shared/label.jsx'
import DatasetManager from '../../../managers/datasetManager.coffee'
import { FaFileImage, FaLightbulb } from 'react-icons/fa6'
import { IoClose } from 'react-icons/io5'

export default function DocViewer() {
  const predefinedHeaders = DocumentConversionManager.tocHeaders
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, docToView, isLoading, currentScreen, refreshKey } = state
  const [tocHeaders, setTocHeaders] = useState([])
  const [showToc, setShowToc] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [imgUrl, setImgUrl] = useState('')
  const [docType, setDocType] = useState('document')
  const [showTips, setShowTips] = useState(false)
  const [isFormatting, setIsFormatting] = useState(false)
  const [showRenameFile, setShowRenameFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [sideMenuIsOpen, setSideMenuIsOpen] = useState(false)
  const scrollToHeader = (hashedHeader) => {
    const domHeader = document.querySelector(`#doc-text [data-hashed-header="${hashedHeader}"]`)
    if (domHeader) {
      setTimeout(() => {
        if (domHeader) {
          domHeader.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }
      }, 300)
    }
  }

  const onLoad = async () => {
    const fileType = `.${StringManager.getFileExtension(docToView.name)}`.toLowerCase()
    setIsFormatting(true)
    const nonImageFileTypes = ['.docx', '.doc', '.pdf', '.odt', '.txt']
    if (currentUser && nonImageFileTypes.includes(fileType)) {
      setDocType('document')
      const url = docToView.url
      const fileName = FirebaseStorage.getImageNameFromUrl(url)
      const firebaseText = await FirebaseStorage.getSingleFile(FirebaseStorage.directories.documents, currentUser.key, fileName)
      await formatDocument(firebaseText)
    } else {
      setDocType('image')
      await formatImageDocument()
    }
  }

  const setTableOfContentsHeaders = async () => {
    let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser?.key}`)
    userHeaders = userHeaders.map((x) => x.headerText)
    const domHeaders = document.querySelectorAll('.header')
    let headersInDocument = []
    for (let header of domHeaders) {
      const headerText = header.querySelector('.header-text').textContent.trim()
      if (!_.isEmpty(headerText) && StringManager.wordCount(headerText) <= 10) {
        if (!headersInDocument.includes(headerText)) {
          headersInDocument.push(Manager.generateHash(headerText))
        }
      }
    }
    const userHeadersMatchingHeadersInDocument = userHeaders.filter((x) => headersInDocument.includes(x))
    let allHeaders = []

    if (Manager.isValid(userHeadersMatchingHeadersInDocument)) {
      allHeaders = userHeadersMatchingHeadersInDocument
    } else {
      allHeaders = headersInDocument
    }
    setTocHeaders(DatasetManager.getUniqueArray(allHeaders, true))
  }

  const search = async (searchValue) => {
    // setState({ ...state, isLoading: true })
    if (Manager.isValid(searchValue, true)) {
      const docText = document.getElementById('doc-text')
      let textAsHtml = docText.innerHTML
      textAsHtml = searchTextHL.highlight(textAsHtml, searchValue)
      textAsHtml = textAsHtml.replaceAll('<span class=" text-highlight"="', '')
      setTimeout(() => {
        let headers = docText.querySelectorAll('.header')
        for (let header of headers) {
          if (header.textContent.includes(searchValue.toUpperCase())) {
            header.textContent = header.textContent.replace('">', '')
            header.textContent = header.textContent.replace(searchValue, '')
            const childSpan = header.querySelector('span')
            if (childSpan) {
              childSpan.remove()
            }
            const dataHeader = header.dataset.header
            const cleanHeader = dataHeader.replaceAll('<span class=', '')
            header.setAttribute('data-header', cleanHeader.trim())
          }
        }
      }, 500)
      setState({ ...state, isLoading: false })
    }
  }

  const formatImageDocument = async () => {
    try {
      // Insert text
      if (docToView) {
        setImgUrl(docToView.url)

        // Get all headers
        let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser?.key}`)
        userHeaders = userHeaders.map((x) => x.headerText)

        let allHeaders = []
        if (Manager.isValid(userHeaders)) {
          allHeaders = [...predefinedHeaders, ...userHeaders].flat()
        } else {
          allHeaders = predefinedHeaders
        }
        let text = docToView.docText
        if (!text) {
          AlertManager.throwError(
            'Unable to find or convert document, please try again after awhile. In the meantime, you can view the document image while this is being resolved.'
          )
          setState({ ...state, isLoading: false, loadingText: '' })
          return false
        }

        // Remove line breaks after header
        const lineBreaks = document.querySelectorAll('br')
        for (let lineBreak of lineBreaks) {
          const previousSibling = lineBreak.previousElementSibling
          if (previousSibling && previousSibling?.tagName === 'SPAN') {
            lineBreak.remove()
          }
        }

        // Format headers
        for (let header of allHeaders) {
          if (userHeaders.includes(header)) {
            text = text.replaceAll(
              header,
              `<div data-hashed-header=${Manager.generateHash(header).replaceAll(' ', '')} class="header">
                                <span class="header-text">${header}</span>
                              </div>`
            )
          } else {
            text = text.replaceAll(
              header,
              `<span data-hashed-header=${Manager.generateHash(header).replaceAll(' ', '')} class="header">${header}</span>`
            )
          }
        }

        const docText = document.getElementById('doc-text')
        docText.innerHTML = text
        // docText.innerHTML = docText.innerHTML.replaceAll(/([a-z])([A-Z])/g, '$1 $2')
        setState({ ...state, isLoading: false, loadingText: '' })

        // Add header event listeners
        setTimeout(() => {
          const _allHeaders = document.querySelectorAll('.header')
          for (let _header of _allHeaders) {
            _header.addEventListener('click', deleteHeader)
          }
          setTableOfContentsHeaders()
        }, 500)
      } else {
        AlertManager.throwError('No Document Found')
        setState({ ...state, isLoading: false, loadingText: '' })
        return false
      }
    } catch (error) {
      AlertManager.throwError('Unable to find or load document')
      setState({ ...state, isLoading: false, loadingText: '' })
    }
  }

  const formatDocument = async (firebaseText) => {
    const url = docToView.url
    if (!Manager.isValid(url)) {
      setState({ ...state, isLoading: false })
      return false
    }
    const textContainer = document.getElementById('doc-text')
    const allDocuments = await SecurityManager.getDocuments(currentUser)
    const coparents = allDocuments.map((x) => x.coparent)
    const relevantDoc = allDocuments.find((x) => x?.name === docToView?.name)
    const fileExtension = StringManager.getFileExtension(docToView?.name).toString()

    if (!Manager.isValid(relevantDoc)) {
      setState({ ...state, isLoading: false })
      return false
    }
    let docHtml = firebaseText

    //#region VALIDATION
    if (!Manager.isValid(allDocuments)) {
      setState({ ...state, isLoading: false })
      return false
    }

    if (!Manager.isValid(coparents)) {
      setState({ ...state, isLoading: false })
      return false
    }
    if (!Manager.isValid(relevantDoc)) {
      setState({ ...state, isLoading: false })
      return false
    }

    if (!Manager.isValid(docHtml, true)) {
      AlertManager.throwError('Unable to find or load document. Please try again after awhile.')
      setState({ ...state, isLoading: false, currentScreen: ScreenNames.docsList })
      return false
    }

    //#endregion VALIDATION

    // APPEND HTML

    //#region STYLING/FORMATTING
    setTimeout(async () => {
      var x = document.body.getElementsByTagName('style')
      for (var i = x.length - 1; i >= 0; i--) x[i].parentElement.removeChild(x[i])
      let allPars = textContainer?.querySelectorAll('p')

      if (fileExtension === 'pdf') {
        allPars = textContainer?.querySelectorAll('span')
      }
      const allTags = textContainer?.querySelectorAll('h3,h2,p,span,li,p')

      // Remove JS styles
      if (Manager.isValid(allTags)) {
        for (let tag of allTags) {
          tag.style = null
        }
      }

      //#region PDF
      if (fileExtension === 'pdf') {
        const textWrappers = document.querySelectorAll('.stl_01')

        for (let textElement of textWrappers) {
          const spans = textElement.querySelectorAll('span')
          let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser?.key}`)

          for (let span of spans) {
            for (let userHeader of userHeaders) {
              if (span.textContent.includes(userHeader.headerText)) {
                const newHeader = document.createElement('span')
                newHeader.classList.add('header')
                newHeader.setAttribute('data-header', userHeader.headerText)
                span.replaceWith(newHeader)
                newHeader.textContent = userHeader.headerText
                const deleteIcon = document.createElement('p')
                deleteIcon.classList.add('delete-header-button')
                deleteIcon.onclick = async (e) => {
                  await deleteHeader(e)
                }
                newHeader.append(deleteIcon)
              }
            }
          }
        }
      }
      //#endregion PDF

      //#region NOT PDF
      else {
        // Format p/span
        if (Manager.isValid(allPars)) {
          for (let par of allPars) {
            const spans = par.querySelectorAll('span')
            const links = par.querySelectorAll('a')

            // Get all headers
            let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser?.key}`)
            userHeaders = userHeaders.map((x) => x.headerText)

            // Remove unnecessary pars
            if (_.isEmpty(par.innerHTML.trim()) || _.isEmpty(par.innerText.trim()) || _.isEmpty(par.textContent.trim())) {
              par.remove()
            }

            // LINKS (<a>)
            for (let link of links) {
              link.setAttribute('target', '_blank')
            }

            // SPANS
            for (let span of spans) {
              if (span) {
                let elementText = span.textContent
                const textLength = elementText.length
                const spanInlineStyles = span.style.cssText
                const header = span.parentNode
                const onlyDashes = span.innerText.match(/__/g)

                if (StringManager.isAllUppercase(span.innerText)) {
                  span.classList.add('bold')
                }

                // Handle user headers
                for (let userHeader of userHeaders) {
                  if (elementText.includes(userHeader)) {
                    const _span = document.createElement('span')
                    const deleteIcon = document.createElement('p')
                    deleteIcon.classList.add('delete-header-button')
                    deleteIcon.onclick = async (e) => {
                      await deleteHeader(e)
                    }
                    _span.innerText = userHeader
                    _span.classList.add('header')
                    _span.setAttribute('data-header', userHeader)
                    _span.append(deleteIcon)
                    par.append(_span)
                  }
                }
                span.innerHTML = span.innerHTML.replace(/&nbsp;/g, '')
                if (onlyDashes && onlyDashes.length > 1) {
                  span.remove()
                }
                if (span.innerText.length < 5) {
                  span.remove()
                }

                // Add header class
                if (Manager.contains(spanInlineStyles, 'font-weight: bold') && textLength > 3) {
                  header.classList.add('header')
                  header.setAttribute('data-header', header.textContent)
                }
              }
            }

            // Remove unnecessary pars
            if (_.isEmpty(par.innerHTML.trim()) || _.isEmpty(par.innerText.trim()) || _.isEmpty(par.textContent.trim())) {
              par.remove()
            }
          }
        }
      }
      //#endregion NOT PDF

      const docText = document.getElementById('doc-text')
      const elements = docText.querySelectorAll('*')
      for (let element of elements) {
        if (
          !element.hasChildNodes() ||
          element?.innerHTML?.length === 0 ||
          element?.textContent?.length === 0 ||
          element?.value?.length === 0 ||
          element?.textContent === '\n\n'
        ) {
          if (!element.classList.contains('delete-header-button')) {
            element.style.display = 'none'
          }
          // console.log(element)
          element.remove()
        }
      }

      setIsFormatting(false)
      // setState({ ...state, isLoading: false })
    }, 400)
    //#endregion STYLING/FORMATTING

    if (!Manager.isValid(firebaseText)) {
      setState({ ...state, isLoading: false })
    }
  }

  const addMenuItemAnimation = () => {
    document.querySelectorAll('#floating-buttons .svg-wrapper').forEach((menuItem, i) => {
      setTimeout(() => {
        menuItem.classList.add('visible')
      }, 55 * i)
    })
  }

  const deleteHeader = async (headerElement) => {
    const headerTarget = headerElement?.currentTarget
    if (headerTarget) {
      const headerText = headerTarget.querySelector('.header-text')?.textContent
      const header = await DB.find(`${DB.tables.documentHeaders}/${currentUser?.key}`, ['headerText', headerText], true)
      if (header) {
        await DB.deleteById(`${DB.tables.documentHeaders}/${currentUser?.key}`, header.id)
        setTocHeaders([])
        await onLoad()
      }
    }
  }

  const addUserHeaderToDatabase = async () => {
    const text = DomManager.getSelectionText()
    let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser?.key}`)
    const alreadyExists = Manager.isValid(userHeaders.find((x) => x.headerText.includes(text)))
    if (!alreadyExists) {
      if (text.length > 0 && currentScreen === ScreenNames.docViewer) {
        AlertManager.confirmAlert(
          'Would you like to use the selected text as a header?',
          'Yes',
          true,
          async () => {
            const header = new DocumentHeader()
            header.headerText = text
            header.ownerKey = currentUser.key
            await DB.add(`${DB.tables.documentHeaders}/${currentUser?.key}`, header)
            await onLoad()
          },
          () => {
            DomManager.clearTextSelection()
          }
        )
      }
    }
  }

  const closeSearch = async () => {
    setShowSearch(false)
    setState({ ...state, refreshKey: Manager.getUid() })
    const searchHighlights = document.querySelectorAll('.text-highlight')
    if (Manager.isValid(searchHighlights)) {
      for (let highlight of searchHighlights) {
        highlight.classList.remove('text-highlight')
      }
    }
  }

  const scrollToTop = () => {
    const header = document.querySelector('.screen-title')
    header.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }

  const renameFile = async () => {
    if (newFileName.length > 0) {
      const newName = `${newFileName}.${StringManager.getFileExtension(docToView.name).toLowerCase()}`
      const childKey = await DB.getSnapshotKey(`${DB.tables.documents}/${currentUser?.key}`, docToView, 'id')

      if (Manager.isValid(childKey)) {
        await DB.updateByPath(`${DB.tables.documents}/${currentUser?.key}/${childKey}/name`, newName)
        setState({ ...state, refreshKey: Manager.getUid(), docToView: { ...docToView, name: newName } })
      }
      setShowRenameFile(false)
      setNewFileName('')
    }
  }

  useEffect(() => {
    if (sideMenuIsOpen) {
      addMenuItemAnimation()
    } else {
      const allMenuItems = document.querySelectorAll('#floating-buttons .svg-wrapper')
      allMenuItems.forEach((menuItem) => {
        menuItem.classList.remove('visible')
      })
    }
  }, [sideMenuIsOpen])

  useEffect(() => {
    if (showToc || showSearch || showTips || showRenameFile) {
      setSideMenuIsOpen(false)
    }
  }, [showToc, showSearch, showTips])

  useEffect(() => {
    if (isFormatting === false) {
      setTableOfContentsHeaders().then((r) => r)
    }
  }, [isFormatting])

  // PAGE LOAD
  useEffect(() => {
    onLoad().then((r) => r)
    const appContentWithSidebar = document.getElementById('app-content-with-sidebar')
    if (appContentWithSidebar) {
      appContentWithSidebar.classList.add('doc-viewer')
    }

    // Listen for selection change
    if (currentScreen === ScreenNames.docViewer) {
      document.addEventListener('selectionchange', debounce(addUserHeaderToDatabase, 1000))
    }

    return () => {
      document.removeEventListener('selectionchange', addUserHeaderToDatabase)
      if (appContentWithSidebar) {
        appContentWithSidebar.classList.remove('doc-viewer')
      }
    }
  }, [])

  return (
    <div className="doc-viewer-container">
      {/* SEARCH CARD */}
      <BottomCard
        wrapperClass="doc-search-card"
        className="form search-card"
        submitText={'Find Text'}
        showCard={showSearch}
        title={'Search'}
        showOverlay={false}
        onClose={closeSearch}>
        <div className="flex">
          <InputWrapper labelText="Enter text to find..." onChange={(e) => search(e.target.value)} inputValueType="text" />
        </div>
      </BottomCard>

      {/* TIPS CARD */}
      <BottomCard
        wrapperClass="doc-tips-card"
        hasSubmitButton={false}
        showCard={showTips}
        title={'Tips'}
        showOverlay={true}
        onClose={() => setShowTips(false)}>
        <>
          <Label text={'Searching'} isBold={true} />
          <p className="tip-text">
            To begin your search, {DomManager.tapOrClick()} the search button and enter the word or words you want to look for. The results you find
            will be <span className="text-highlight">highlighted</span> for easy viewing.
          </p>
          <Label text={'Table of Contents'} isBold={true} />
          <p className="tip-text">
            {DomManager.tapOrClick(true)} the <IoListOutline id="toc-button-inline" className={`${theme}`} /> icon to view the Table of Contents.
          </p>
          <p className="tip-text">
            When you {DomManager.tapOrClick()} an item, you&#39;ll be directed straight to the corresponding header in the document.
          </p>
          <Label text={'Create Your Own Headers'} isBold={true} />
          <p className="tip-text">
            You might notice some predefined headers, which are dark blue text on a light blue background. However, it&#39;s a good idea to create
            your own custom headers to make specific texts stand out to you.
          </p>
          <p className="tip-text">
            To create a new header, just highlight the text you want to use, and then click the confirmation button when it appears.
          </p>
          <p className="tip-text">
            The page will refresh, and you&#39;ll be able to see the new header you&#39;ve just created! Your custom headers will appear each time you
            open the document.
          </p>
        </>
      </BottomCard>

      {/* TABLE OF CONTENTS */}
      {tocHeaders?.length > 0 && (
        <BottomCard
          wrapperClass="toc-card"
          hasSubmitButton={false}
          showCard={showToc}
          onClose={() => setShowToc(false)}
          className="toc"
          title={'Table of Contents'}>
          <div id="table-of-contents">
            <div id="toc-contents">
              {tocHeaders.length > 0 &&
                tocHeaders.sort().map((header, index) => {
                  return (
                    <div key={index} className="flex" id="toc-header-wrapper">
                      <span>•</span>
                      <p
                        onClick={() => {
                          setShowToc(false)
                          scrollToHeader(header)
                        }}
                        className={`toc-header`}
                        data-hashed-header={header}
                        dangerouslySetInnerHTML={{ __html: Manager.decodeHash(header) }}></p>
                    </div>
                  )
                })}
            </div>
          </div>
        </BottomCard>
      )}

      {/* RENAME FILE */}
      <BottomCard
        showCard={showRenameFile}
        submitText={'Rename'}
        wrapperClass="rename-file-card"
        onClose={() => setShowRenameFile(false)}
        onSubmit={renameFile}
        className="rename-file"
        title={'Rename Document'}>
        <InputWrapper labelText={'Enter new file name...'} onChange={(e) => setNewFileName(e.target.value)} />
      </BottomCard>

      {/* FLOATING BUTTONS */}
      <div id="floating-buttons" className={` ${showToc || showSearch || showTips ? 'hide' : ''} ${sideMenuIsOpen ? 'open' : ''}`}>
        <div id="menu-items">
          {/* SCROLL TO TOP BUTTON */}
          <div className="svg-wrapper">
            <IoIosArrowUp id={'scroll-to-top-icon'} onClick={scrollToTop} />
          </div>
          {/* TOC BUTTON */}
          {tocHeaders.length > 0 && (
            <div className="svg-wrapper">
              <IoListOutline
                onClick={async () => {
                  await setTableOfContentsHeaders()
                  setShowToc(true)
                }}
                id="toc-icon"
                className={`${theme}`}
              />
            </div>
          )}

          {/* SEARCH ICON FOR 800PX > */}
          {!DomManager.isMobile() && (
            <div className="svg-wrapper">
              <TbFileSearch id={'desktop-search-icon'} onClick={() => setShowSearch(true)} />
            </div>
          )}

          {/* RENAME ICON */}
          <div className="svg-wrapper">
            <MdDriveFileRenameOutline onClick={() => setShowRenameFile(true)} />
          </div>

          {/* DOCUMENT IMAGE */}
          {docType === 'image' && (
            <div className="svg-wrapper">
              <LightGallery elementClassNames={`light-gallery ${theme}`} speed={500} selector={'#document-image'}>
                <img data-src={imgUrl} id="document-image" src={imgUrl} alt="" />
                <FaFileImage className={'file-image'} />
              </LightGallery>
            </div>
          )}

          {/* TIPS ICON */}
          <div className="svg-wrapper">
            <FaLightbulb id={'tips-icon'} onClick={() => setShowTips(true)} />
          </div>
        </div>

        {/* MENU ICON */}
        <div className={`${sideMenuIsOpen ? 'close' : ''} svg-wrapper menu-icon`}>
          {sideMenuIsOpen ? (
            <IoClose className={'menu-icon close'} onClick={() => setSideMenuIsOpen(false)} />
          ) : (
            <IoMenuOutline className={'menu-icon'} onClick={() => setSideMenuIsOpen(true)} />
          )}
        </div>
      </div>

      {/* PAGE CONTAINER / TEXT */}
      <div id="documents-container" className={`${theme} page-container form documents`}>
        <p className="screen-title">
          {StringManager.removeFileExtension(StringManager.uppercaseFirstLetterOfAllWords(docToView?.name)).replaceAll('-', ' ')}
        </p>
        <div id="doc-text"></div>
      </div>

      {/* NAVBARS */}
      {DomManager.isMobile() && (
        <>
          {!showSearch && !showToc && !isLoading && (
            <NavBar addOrClose="add">
              <TbFileSearch id={'open-search-button'} onClick={() => setShowSearch(true)} />
            </NavBar>
          )}
          {showSearch && !showToc && !isLoading && (
            <NavBar addOrClose="close">
              <MdSearchOff id={'close-search-button'} onClick={closeSearch} />
            </NavBar>
          )}
        </>
      )}
    </div>
  )
}