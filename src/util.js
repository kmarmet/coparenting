import moment from "moment";
import emailjs from "@emailjs/browser";

const util = {
  getUid: () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
  getCurrentDate: () => {
    const date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let currentDate = `${month}/${day}/${year}`;
    return currentDate;
  },
  getArraySortedByDate: (arr) => {
    return arr.sort(function (a, b) {
      return new Date(b.dateAdded) - new Date(a.dateAdded);
    });
  },
  createVerificationCode: () => {
    return Math.floor(100000 + Math.random() * 900000);
  },
  scrollToTopOfPage: () => {
    const eventsContainer = document.querySelector("body").offsetTop;
    window.scroll({
      top: eventsContainer,
      behavior: "smooth",
    });
  },

  sendEmail: (fromName, toEmail, message, emailType) => {
    let templateId = "template_aewjhvs";
    if (emailType === "swap-request") {
      templateId = "template_eso74d8";
    }
    var data = {
      service_id: "default_service",
      template_id: templateId,
      user_id: "khikD1NoIHmBPlckL",
      template_params: {
        from_name: fromName,
        message: message,
        reply_to: toEmail,
      },
    };

    emailjs.send(data.service_id, data.template_id, { ...data.template_params }).then(
      (response) => {
        console.log("SUCCESS!", response.status, response.text);
      },
      (error) => {
        console.log("FAILED...", error);
      }
    );
  },
  formatDate: (inputDate, inputFormat = "M-DD-YYYY", outputFormat = "MMMM DD") => {
    let inputFormatString = inputFormat;
    let inputString = inputDate;
    if (inputFormat.indexOf("-") > -1) {
      inputFormatString = inputFormat.replaceAll("-", "/");
    }
    if (inputDate.indexOf("-") > -1) {
      inputString = inputDate.replaceAll("-", "/");
    }
    return moment(inputDate, inputFormatString).format(outputFormat);
  },
  validation: (inputs) => {
    let errors = [];
    inputs.forEach((input) => {
      if (!input || input.length === 0) errors.push(input);
    });

    return errors.length;
  },
  validateEmail: (email) => {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
  },
  getWordBeforeSpace: (word) => {
    return word.split(" ")[0];
  },
  uppercaseFirstLetterInWord: (wordArray) => {
    let returnArray = [];
    if (Array.isArray(wordArray)) {
      wordArray.forEach((word) => {
        returnArray.push(word.charAt(0).toUpperCase() + word.slice(1));
      });
    }

    return returnArray;
  },
  uppercaseFirstLetterOfAllWords: (mySentence) => {
    let words = mySentence
    if (words.indexOf("-") > -1) {
      words = mySentence.replaceAll("-", " ").split(" ");
    }
    else {
      words = mySentence.split(" ");
    }
    words = words.filter( x => x.length > 0)
    for (let i = 0; i < words.length; i++) {
      words[i] = words[i][0].toUpperCase() + words[i].substr(1);
    }

    words = words.join(" ");

    return words.replaceAll("With", "with").replaceAll("Of", "of").replaceAll("And", "and").replaceAll("The", 'the')
  },
  cleanString: (string) => {
    if (string) {
      return string.replace("  ", " ").toLowerCase();
    } else {
      return string;
    }
  },
  getName: (name) => {
    return util.cleanString(util.getWordBeforeSpace(name));
  },
  formatPhoneNumber(phoneNumberString) {
    let input = phoneNumberString.replace("(", "").replace(")", "").replace(" ", "").substring(0, 10);

    const areaCode = input.substring(0, 3);
    const middle = input.substring(3, 6);
    const last = input.substring(6, 10);

    if (input.length > 6) {
      input = `${areaCode}-${middle}-${last}`;
    } else if (input.length > 3) {
      input = `(${areaCode}) ${middle}`;
    } else if (input.length > 0) {
      input = `(${areaCode}`;
    }

    return input;
  },
  hasNumber: (string) => {
    return /\d/.test(string);
  },
  getUniqueArrayOfObjects: (arr, key) => {
    return [...new Map(arr.map((item) => [item[key], item])).values()];
  },
  handleCheckboxSelection: (element, checkboxClass = ".box", checkCallback, uncheckCallback, canSelectAll = false) => {
    const clickedEl = element.currentTarget;
    const checkbox = clickedEl.querySelector(checkboxClass);

    if (checkbox.classList.contains("active")) {
      checkbox.classList.remove("active");
      if (checkCallback) checkCallback();
    } else {
      clickedEl.querySelector(checkboxClass).classList.add("active");
      const label = clickedEl.dataset["label"];
      const notActiveLabels = clickedEl.parentNode.querySelectorAll(`[data-label]:not([data-label="${label}"])`);
      if (!canSelectAll) {
        notActiveLabels.forEach((labelEl) => {
          labelEl.querySelector(checkboxClass).classList.remove("active");
        });
      }
      if (uncheckCallback) uncheckCallback();
    }
  },
  removeUndefinedFromArray: (arr) => {
    return arr.filter((item) => item);
  },
  isValidPassword: (password) => {
    return password.length >= 6 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[#.?!@$%^&*-]/.test(password);
  },
};

export default util;
