import util from "./util";
import Tesseract from "tesseract.js";
import { createWorker } from "tesseract.js";

const AgreementUtil = {
  tocHeaders: [
    "child-support",
    "spousal-maintenance",
    "matrimonial-home",
    "assets",
    "debts",
    "equitable-distribution-release",
    "dower-curtesy-and-homestead-release",
    "between",
    "background",
    "living-separate-and-apart",
    "interference",
    "children",
    "child-custody",
    "estate-and-testamentary-disposition",
    "pension-release",
    "general-release",
    "general-provisions",
    "acknowledgement",
    "division-of-property",
    "real-estate",
    "household-goods-and-furnishings",
    "motor-vehicles",
    "financial-accounts",
    "incomes-taxes",
    "definitions",
    "the-distribution",
    "mutual-releases-indemnification-and-litigation",
    "custody-and-visitation",
    "spousal-support",
    "the-family-residence",
    "retirement-benefits",
    "husbands-separate-property",
    "wifes-separate-property",
  ],
  hasNumbers: (str) => {
    var regex = /\d/g;
    return regex.test(str);
  },
  cleanHeader: (header, uppercaseAll = false, uppercaseFirstWord) => {
    let returnString = header.replaceAll("-", " ");
    if (uppercaseAll) {
      returnString = returnString.toUpperCase();
    }
    if (uppercaseFirstWord) {
      returnString = util.uppercaseFirstLetterInWord;
    }
    return returnString.replaceAll("'", "");
  },
  formatDocHeaders: (text) => {
    AgreementUtil.tocHeaders.forEach((header) => {
      text = text.replaceAll(AgreementUtil.cleanHeader(header, true), `<span data-header-name="${header.replaceAll("'", "&apos;")}" class="header">${AgreementUtil.cleanHeader(header)}</span>`);
    });
    return text;
  },
  textToImageAndAppend: async (imagePath, textContainer) => {
    const worker = await createWorker();
    await worker.recognize(imagePath).then((result) => {
      let confidence = result.confidence;
      let paragraphs = result.data.paragraphs;
      let lines = result.data.lines;
      let textToDelete = []

      paragraphs.forEach((par) => {
        if (AgreementUtil.hasNumbers(par.text) && par.text.trim().split(/\s+/).length <= 10) {
          par.text = `<span class="sub-header">${par.text}</span>`;
        }
        const parEl = document.createElement("p");
        par.text = AgreementUtil.formatDocHeaders(par.text);

        // par.lines.forEach((line) => {
        //   line.words.forEach((word) => {
        //     if (word.text.length < 5 && word.text.slice(-1) === ".") {
        //       textToDelete.push(word.text)
        //     }
        //   })
        // })

        parEl.innerHTML = par.text;
        textContainer.appendChild(parEl);
      });

      
      // console.log(document.querySelector("#text-container").textContent)
      // textToDelete.forEach((toDel) => {
      //   document.querySelector("#text-container").textContent.replace(toDel, "")
      // })

      // document.querySelectorAll(".sub-header").forEach((header, index) => {
      //   let text = header.textContent;
      //   // console.log(text.substring)
      //   const firstThreeChars = text.slice(0, 3);
      //   // console.log(textToDelete.includes(firstThreeChars))
      //   const charsUntilPeriod = text.slice(0, text.indexOf(".") + 1);
      //   if (textToDelete.includes(charsUntilPeriod)) {
      //     console.log(text)
      //     text = text.replace(charsUntilPeriod, "")
      //   }
        // console.log(text.slice(0, text.indexOf(".") + 1))
        // textToDelete.forEach((toDel) => {
        //   if (text.indexOf(toDel) > -1  && text.slice(-1) === ".") {
        //     console.log(header)
        //     header.textContent = ""
        //   }
        // })
      // })
    });
  },
};

export default AgreementUtil;
