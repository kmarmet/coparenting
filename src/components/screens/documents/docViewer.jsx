import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import FirebaseStorage from '../../../database/firebaseStorage'
import TableOfContentsListItem from '../../tableOfContentsListItem'
import DocumentConversionManager from 'managers/documentConversionManager'
import Manager from 'managers/manager'
import BottomCard from '../../shared/bottomCard'
import { DebounceInput } from 'react-debounce-input'
import reactStringReplace from 'react-string-replace'
import SecurityManager from '../../../managers/securityManager'
import { AiOutlineFileSearch } from 'react-icons/ai'
import NavBar from '../../navBar'
import DB from 'database/DB'
import AlertManager from '../../../managers/alertManager'
import StringManager from '../../../managers/stringManager'
import LightGallery from 'lightgallery/react'
import 'lightgallery/css/lightgallery.css'
import DomManager from '../../../managers/domManager'
import debounce from 'debounce'
import { IoClose } from 'react-icons/io5'
import DocumentHeader from 'models/documentHeader.js'
import DocumentsManager from '../../../managers/documentsManager'

export default function DocViewer() {
  const predefinedHeaders = DocumentConversionManager.tocHeaders
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, docToView } = state
  const [tocHeaders, setTocHeaders] = useState([])
  const [showCard, setShowCard] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchResultsIndex, setSearchResultsIndex] = useState(1)
  const [showSearch, setShowSearch] = useState(false)
  const [searchResultsCount, setSearchResultsCount] = useState(0)
  const [textWithHeaders, setTextWithHeaders] = useState('')
  const [imgUrl, setImgUrl] = useState('')
  const [docType, setDocType] = useState('document')

  const scrollToHeader = (header) => {
    closeSearch()
    const firstChar = header.slice(0, 1)
    if (firstChar === '-') {
      header = header.replace('-', '')
    }
    const el = document.querySelector(`.header[data-header-date='${header}']`)
    setTimeout(() => {
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }, 500)
  }

  const convertAndAppendDocOrImage = async () => {
    const fileType = `.${StringManager.getFileExtension(docToView.name)}`
    if (currentUser && fileType === '.docx') {
      setDocType('document')
      await getDoc()
    } else {
      setDocType('image')
      await getImage()
    }
  }

  const search = (searchValue) => {
    let allPars = document.querySelectorAll('#text-container p')
    allPars.forEach((par) => {
      par.classList.add('low-opacity')
    })
    allPars = Array.from(allPars)

    if (searchValue.length === 0) {
      allPars.forEach((par) => par.classList.remove('search-highlight'))
    } else {
      // Allow search
      if (searchValue.length > 3) {
        let resultsFound = allPars.filter((x) => x.textContent.toLowerCase().contains(searchValue.toLowerCase()))
        setSearchResultsCount(resultsFound.length)
        let foundElement = allPars.filter((x) => x.textContent.toLowerCase().contains(searchValue.toLowerCase()))[0]
        console.log(foundElement)
        let allParsNodes = document.querySelectorAll('#text-container p')
        allParsNodes = Array.from(allParsNodes)
        allParsNodes = allParsNodes.filter((x) => x.textContent.toLowerCase().contains(searchValue.toLowerCase()))
        setSearchResults(allParsNodes)
        if (foundElement) {
          foundElement.scrollIntoView({ block: 'start', behavior: 'smooth' })
          foundElement.classList.add('search-highlight')
          foundElement.classList.remove('low-opacity')
        }
      } else {
        allPars.forEach((par) => par.classList.remove('search-highlight'))
      }
    }
  }

  const searchTraverse = (direction) => {
    let allPars = document.querySelectorAll('#text-container p')
    let currentIndex = searchResultsIndex

    // TOGGLE UP/DOWN ARROWS BASED ON EXISTENCE OF FOUND ELEMENT
    const preFoundElement = direction === 'up' ? searchResults[(currentIndex -= 1)] : searchResults[(currentIndex += 1)]
    if (preFoundElement) {
      // Remove highlight class by default
      allPars = Array.from(allPars)
      allPars.forEach((par) => {
        par.classList.remove('search-highlight')
        par.classList.add('low-opacity')
      })

      // Update index state on nav arrow click
      if (direction === 'up') {
        setSearchResultsIndex((searchResultsIndex) => (searchResultsIndex -= 1))
      } else {
        setSearchResultsIndex((searchResultsIndex) => (searchResultsIndex += 1))
      }

      setTimeout(() => {
        const foundElement = searchResults[searchResultsIndex]
        if (foundElement) {
          // Scroll to next index / add class
          setTimeout(() => {
            foundElement.scrollIntoView({ block: 'center', behavior: 'smooth' })
          }, 200)
          foundElement.classList.add('search-highlight')
          foundElement.classList.remove('low-opacity')
        }
      }, 200)
    }
  }

  const closeSearch = () => {
    Manager.resetForm('doc-viewer-container')
    document.getElementById('search-input').value = ''
    let allHeaders = document.querySelectorAll('.header')
    let allPars = document.querySelectorAll('#text-container p')
    allPars = Array.from(allPars)
    allPars.forEach((par) => {
      par.classList.remove('search-highlight')
      par.classList.remove('low-opacity')
    })
    setSearchResults([])
    setSearchResultsIndex(0)
    setShowSearch(false)
    allHeaders = Array.from(allHeaders)
    if (Manager.isValid(allHeaders)) {
      allHeaders[0].scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }

  const shouldAddClass = (el, text) => {
    if (text && text.length > 0) {
      const textToSkip = ['add additional terms']
      const isAllUppercase = StringManager.isAllUppercase(text)
      const classAlreadyAdded = el.classList.contains('header')
      const isMinimumLength = text.replaceAll(' ', '').length > 3
      const isDefinedHeader = predefinedHeaders.includes(text.toLowerCase())
      const dontSkip = !textToSkip.includes(text.toLowerCase())
      return isAllUppercase && !classAlreadyAdded && isMinimumLength && isDefinedHeader && dontSkip
    }
    return false
  }

  // Get/Append Doc
  const getDoc = async () => {
    const url = docToView.url
    const fileName = FirebaseStorage.getImageNameFromUrl(url)
    const textContainer = document.getElementById('text-container')

    const coparentDocsObjects = await SecurityManager.getDocuments(currentUser)
    if (!Manager.isValid(coparentDocsObjects)) {
      setState({ ...state, isLoading: false })
      return false
    }

    const coparentsFromObject = coparentDocsObjects.map((x) => x.coparent)
    if (!Manager.isValid(coparentsFromObject)) {
      setState({ ...state, isLoading: false })
      return false
    }
    const relevantDoc = coparentDocsObjects.filter((x) => x?.name === docToView?.name)[0]
    if (!Manager.isValid(relevantDoc)) {
      setState({ ...state, isLoading: false })
      return false
    }

    // Insert HTML
    const docHtml = await DocumentConversionManager.docToHtml(fileName, currentUser?.id)
    textContainer.innerHTML = docHtml

    // Format HTML
    const pars = textContainer.querySelectorAll('p, li')
    const listItems = textContainer.querySelectorAll('li')
    const containsLettersRegex = /[a-zA-Z]/g

    // List Item formatting
    listItems.forEach((listItem, index) => {
      if (StringManager.stringHasNumbers(listItem.textContent) && listItem.textContent.toLowerCase().indexOf('article') > -1) {
        listItem.classList.add('highlight')
      }

      // ADD HIGHLIGHT
      if (shouldAddClass(listItem, listItem.textContent)) {
        listItem.classList.add('highlight')
      }
      if (listItem.classList.contains('highlight')) {
        const header = listItem.textContent.replace(/ /g, '-').replace(/[0-9]/g, '').replace('.', '').replace(/\s/g, '')
        listItem.setAttribute('data-header-date', header)
      }

      const allStrongs = listItem.querySelectorAll('strong')
      allStrongs.forEach((thisStrong) => {
        if (shouldAddClass(thisStrong, thisStrong.textContent)) {
          thisStrong.classList.add('highlight')
        }
        DocumentConversionManager.addHeaderClass(thisStrong)
      })
      DocumentConversionManager.addHeaderClass(listItem)
      if (StringManager.wordCount(listItem.textContent) > 10) {
        listItem.classList.remove('highlight')
      }
    })

    // Header formatting
    pars.forEach((par, index) => {
      const text = par.textContent
      if (StringManager.stringHasNumbers(text) && text.toLowerCase().indexOf('article') > -1) {
        par.classList.add('header', 'w-100')
      }

      // ADD HIGHLIGHT
      if (shouldAddClass(par, text)) {
        par.classList.add('highlight')
      }

      const allStrongs = par.querySelectorAll('strong')
      allStrongs.forEach((thisStrong) => {
        if (shouldAddClass(thisStrong, thisStrong.textContent)) {
          thisStrong.classList.add('highlight')
        }
        DocumentConversionManager.addHeaderClass(thisStrong)
      })
      DocumentConversionManager.addHeaderClass(par)
    })

    // Cleanup unnecessary header classes
    pars.forEach((par) => {
      const text = par.textContent
      if (!containsLettersRegex.test(text)) {
        par.classList.remove('header', 'highlight')
        par.remove()
      }
      if (Manager.contains(text.toLowerCase(), 'notary public')) {
        par.classList.remove('header', 'highlight')
        // par.remove()
      }
      if (Manager.contains(text, '___')) {
        text.replace(/_/g, '')
      }
      if (StringManager.wordCount(text) > 10) {
        par.classList.remove('header')
      }
      if (par.classList.contains('header')) {
        const header = par.textContent.replace(/ /g, '-').replace(/[0-9]/g, '').replace('.', '').replace(/\s/g, '')
        par.setAttribute('data-header-date', header)
      }
    })

    // Set TOC headers
    const headers = document.querySelectorAll('.header, li.highlight, span.highlight, .toc-header')
    let newHeaderArray = []
    headers.forEach((header) => {
      const text = header.textContent
        .replaceAll(' ', '-')
        .replaceAll('-', ' ')
        .replace(/ /g, '-')
        .replace(/[0-9]/g, '')
        .replace('.', '')
        .replace(/\s/g, '')
        .replaceAll('•', '')
      if (newHeaderArray.indexOf(text) === -1 && StringManager.wordCount(header.textContent) < 10) {
        newHeaderArray.push(text)
      }
    })
    setTocHeaders(newHeaderArray.sort())
  }

  // Get/Append Image
  const getImage = async () => {
    setState({ ...state, isLoading: true })
    const allDocs = await SecurityManager.getDocuments(currentUser)
    let docOwner = await DB.find(DB.tables.users, ['phone', docToView.ownerPhone], true)
    const firebasePathId = docOwner.id

    // Catch errors
    if (!Manager.isValid(allDocs)) {
      setState({ ...state, isLoading: false })
      return false
    }
    if (!Manager.isValid(docOwner)) {
      setState({ ...state, isLoading: false })
      return false
    }

    if (!Manager.isValid(docToView)) {
      setState({ ...state, isLoading: false })
      AlertManager.throwError('No Document Found')
      return false
    }

    // Get image URL
    const imageResult = await FirebaseStorage.getImageAndUrl(FirebaseStorage.directories.documents, firebasePathId, docToView.name)
    setImgUrl(imageResult?.imageUrl)

    // Get all headers
    let userHeaders = await DB.getTable(`${DB.tables.documentHeaders}/${currentUser.phone}`)
    userHeaders = userHeaders.map((x) => x.headerText)
    let allHeaders = []
    if (Manager.isValid(userHeaders)) {
      allHeaders = [...predefinedHeaders, ...userHeaders].flat()
    } else {
      allHeaders = predefinedHeaders
    }

    // Insert text
    if (imageResult.status === 'success') {
      let text = await DocumentConversionManager.getImageText(imageResult?.imageUrl)
      text = DocumentsManager.fixTypos(text)
      const textToView = wrapTextInHeader(text, allHeaders, userHeaders)
      setTextWithHeaders(textToView)
      setState({ ...state, isLoading: false })
    } else {
      AlertManager.throwError('No Document Found')
      setState({ ...state, isLoading: false })
      return false
    }
  }

  const deleteHeader = async (headerText) => {
    const header = await DB.find(`${DB.tables.documentHeaders}/${currentUser.phone}`, ['headerText', headerText])
    await DB.deleteById(`${DB.tables.documentHeaders}/${currentUser.phone}`, header.id)
    await getImage()
  }

  const wrapTextInHeader = (text, allHeaders, userHeaders) => {
    let result = reactStringReplace(text, 'dependents', (match, i) => <p key={match + i}>{match}</p>)
    for (let _string of allHeaders) {
      result = reactStringReplace(result, _string.toLowerCase(), (match, i) => (
        <p className="header" key={match + i}>
          {match} {userHeaders.includes(_string) ? <IoClose onClick={() => deleteHeader(_string)} /> : ''}
        </p>
      ))
    }
    return result
  }

  const addUserHeaderToDatabase = () => {
    const text = DomManager.getSelectionText()

    if (text.length > 0) {
      AlertManager.confirmAlert('Would you like to use the selected text as a header?', 'Yes', true, async () => {
        const header = new DocumentHeader()
        header.headerText = text
        header.ownerPhone = currentUser.phone
        await DB.add(`${DB.tables.documentHeaders}/${currentUser.phone}`, header)
        setTextWithHeaders('')
        await getImage()
      })
    }
  }

  useEffect(() => {
    // setState({ ...state, isLoading: true })
    const textContainer = document.getElementById('text-container')
    if (textContainer) {
      document.getElementById('text-container').innerText = ''
    }
    convertAndAppendDocOrImage().then((r) => r)

    // Listen for selection change
    document.addEventListener('selectionchange', debounce(addUserHeaderToDatabase, 1000))
  }, [])

  return (
    <div className="doc-viewer-container">
      {/* BOTTOM ACTIONS */}
      <div className={`${theme} flex form`} id="bottom-actions">
        {Manager.isValid(document.querySelectorAll('.header'), true) && (
          <div id="toc-button" className={`${theme}`} onClick={() => setShowCard(true)}>
            Table of Contents <span className="pl-10 fs-20 material-icons-round">format_list_bulleted</span>
          </div>
        )}
      </div>
      {/* INPUT */}
      <BottomCard
        wrapperClass="doc-search-card"
        hasSubmitButton={false}
        className="form search-card"
        showCard={showSearch}
        title={'Find Text'}
        onClose={closeSearch}>
        <div className="flex">
          <DebounceInput minLength={3} id="search-input" onChange={(e) => search(e.target.value)} debounceTimeout={500} />
          {/* SEARCH NAV */}
          {searchResults.length > 0 && searchResultsCount > 1 && (
            <div id="input-and-nav">
              {/* NAVIGATION */}
              <div className="flex">
                <span className="material-icons-round" onClick={() => searchTraverse('up')}>
                  arrow_upward
                </span>
                <span className="material-icons-round" onClick={() => searchTraverse('down')}>
                  arrow_downward
                </span>
              </div>
            </div>
          )}
        </div>
      </BottomCard>

      {/* TABLE OF CONTENTS */}
      {Manager.isValid(document.querySelectorAll('.header'), true) && (
        <BottomCard
          wrapperClass="toc-card"
          hasSubmitButton={false}
          showCard={showCard}
          onClose={() => setShowCard(false)}
          className="toc"
          title={'Table of Contents'}>
          <div id="table-of-contents">
            <button
              id="toc-scroll-button"
              className="button default center mt-5"
              onClick={() => {
                setShowCard(false)
                let allHeaders = document.querySelectorAll('.header')
                if (Manager.isValid(allHeaders)) {
                  allHeaders = Array.from(allHeaders)
                  allHeaders[0].scrollIntoView({ block: 'center', behavior: 'smooth' })
                }
              }}>
              Scroll to top
            </button>
            <div id="toc-contents">
              {tocHeaders.length > 0 &&
                tocHeaders.sort().map((header, index) => {
                  header = header.replace(/ /g, '-').replace(/[0-9]/g, '').replace('.', '').replace(/\s/g, '')
                  return (
                    <span key={index}>
                      {!header.contains('___') && (
                        <TableOfContentsListItem
                          agreementText={document.querySelector('#text-container').textContent}
                          text={`• ${header}`}
                          dataHeader={header}
                          onClick={() => {
                            setShowCard(false)
                            scrollToHeader(header)
                          }}
                        />
                      )}
                    </span>
                  )
                })}
            </div>
          </div>
        </BottomCard>
      )}

      {/* TEXT */}
      <div id="documents-container" className={`${theme} page-container form documents`}>
        <p className="screen-title pt-10">Doc Viewer</p>
        {/* IMAGE */}
        {docType === 'image' && (
          <>
            <LightGallery elementClassNames={`light-gallery ${theme}`} speed={500} selector={'#document-image'}>
              <img data-src={imgUrl} id="document-image" src={imgUrl} alt="" />
            </LightGallery>
            {textWithHeaders}
          </>
        )}
        {/* DOCUMENT */}
        {docType === 'document' && <div id="text-container"></div>}
      </div>
      {!showSearch && !showCard && (
        <NavBar>
          <AiOutlineFileSearch id={'add-new-button'} onClick={() => setShowSearch(true)} />
        </NavBar>
      )}
    </div>
  )
}
