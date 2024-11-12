import Manager from '@manager'
import { createWorker } from 'tesseract.js'
import FirebaseStorage from '@firebaseStorage'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  getPositionOfWordInText,
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
} from '../globalFunctions'

const DocumentConversionManager = {
  tocHeaders: [
    'child-support',
    'spousal-maintenance',
    'matrimonial-home',
    'assets',
    'debts',
    'equitable-distribution-release',
    'dower-curtesy-and-homestead-release',
    'between',
    'background',
    'living-separate-and-apart',
    'interference',
    'children',
    'child-custody',
    'estate-and-testamentary-disposition',
    'pension-release',
    'general-release',
    'general-provisions',
    'acknowledgement',
    'division-of-property',
    'real-estate',
    'household-goods-and-furnishings',
    'motor-vehicles',
    'financial-accounts',
    'incomes-taxes',
    'definitions',
    'the-distribution',
    'mutual-releases-indemnification-and-litigation',
    'custody-and-visitation',
    'spousal-support',
    'the-family-residence',
    'retirement-benefits',
    'husbands-separate-property',
    'wifes-separate-property',
    'severability-and-enforceability',
    'law-applicable',
    'introductory-provisions',
    'property',
    'purpose-of-agreement',
    'week-one',
    'week-two',
    'holiday-parenting-time',
    'odd-years',
    'even-years',
  ],
  documentApiUrl: () => {
    if (window.location.hostname === 'localhost') {
      return 'https://localhost:5000/document/getdoctext'
    } else {
      return 'https://pcp-node.netlify.app/.netlify/functions/app/'
    }
  },
  docToHtml: async (fileName, currentUserId) => {
    const myHeaders = new Headers()
    myHeaders.append('Access-Control-Allow-Origin', '*')

    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      mode: 'cors',
      crossOrigin: true,
      redirect: 'follow',
    }

    let returnHtml = ''
    const all = await FirebaseStorage.getImageAndUrl(FirebaseStorage.directories.documents, currentUserId, fileName)
    const { status, imageUrl } = all
    if (status === 'success') {
      await fetch(`https://peaceful-coparenting.app:5000/document/getDocText?fileName=${fileName}&currentUserId=${currentUserId}`, requestOptions)
        .then((response) => response.text())
        .then((result) => (returnHtml = result))
        .catch((error) => console.error(error))
    }
    return returnHtml
  },
  hasNumbers: (str) => {
    var regex = /\d/g
    return regex.test(str)
  },
  cleanHeader: (header, uppercaseAll = false, uppercaseFirstWord) => {
    let returnString = header.replaceAll('-', ' ')
    if (uppercaseAll) {
      returnString = returnString.toUpperCase()
    }
    if (uppercaseFirstWord) {
      returnString = uppercaseFirstLetterOfAllWords(returnString)
    }
    return returnString.replaceAll("'", '')
  },
  formatDocHeaders: (text) => {
    DocumentConversionManager.tocHeaders.forEach((header) => {
      text = text.replaceAll(
        DocumentConversionManager.cleanHeader(header, true),
        `<span data-header-name="${header.replaceAll("'", '&apos;')}" class="header">${DocumentConversionManager.cleanHeader(header)}</span>`
      )
    })
    return text
  },
  imageToTextAndAppend: async (imagePath, textContainer) => {
    const worker = await createWorker()
    await worker.recognize(imagePath).then((result) => {
      let confidence = result.confidence
      const { data } = result
      const { symbols, lines, paragraphs } = data

      // for (let line of lines) {
      //   if (line.text.indexOf('Halloween') > -1) {
      //     const wordPosition = getPositionOfWordInText('Halloween', line.text)
      //     const { start, end } = wordPosition
      //     console.log(start, end)
      //     if (start > -1 && start > 0) {
      //       console.log(start, end)
      //       // console.log(line.text.substring(start, end))
      //     }
      //     line.text = `<span className="sub-header">${line.text}</span>`
      //   }
      // }

      paragraphs.forEach((par) => {
        if (DocumentConversionManager.hasNumbers(par.text) && par.text.trim().split(/\s+/).length <= 10) {
          par.text = `<span className="sub-header">${par.text}</span>`
        }

        const parEl = document.createElement('p')
        par.text = DocumentConversionManager.formatDocHeaders(par.text)

        parEl.innerHTML = par.text
        textContainer.appendChild(parEl)
      })
    })
  },
  addHeaderClass: (el) => {
    let strong = el.querySelector('strong')

    if (el.tagName.toLowerCase() === 'strong') {
      if (Manager.isValid(el)) {
        const strongText = el.textContent
        const hasNumbers = strongText.indexOf('.') > -1
        if (hasNumbers && wordCount(strongText) < 6 && strongText.length > 3) {
          el.parentNode.classList.add('header')
        }
        if (wordCount(strongText) <= 6 && strongText.length > 5) {
          if (strongText.toLowerCase().indexOf('state') === -1 && strongText.toLowerCase().indexOf('county') === -1) {
            el.parentNode.classList.add('header')
          } else {
            el.parentNode.classList.remove('header')
          }
        }
      }
    } else {
      if (Manager.isValid(strong)) {
        const strongText = strong.textContent
        const hasNumbers = strongText.indexOf('.') > -1

        if (hasNumbers && wordCount(strongText) < 6 && strongText.length > 3) {
          el.classList.add('header')
        }
        if (wordCount(strongText) <= 6 && strongText.length > 5) {
          if (strongText.toLowerCase().indexOf('state') === -1 && strongText.toLowerCase().indexOf('county') === -1) {
            el.classList.add('header')
          }
        }
      }
    }
  },
}

export default DocumentConversionManager
