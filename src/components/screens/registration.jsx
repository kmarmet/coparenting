import React, { useState, useEffect, useContext, Fragment } from "react";
import db from "../../db.js";
import util from "../../util.js";
import globalState from "../../context.js";
import Error from "../shared/error.jsx";
import User from "../../models/user.js";
import screenNames from "../../constants/screenNames.js";
import CoparentInputs from "../coparentInput.jsx";
import ChildrenInput from "../childrenInput.jsx";
import CheckboxGroup from "../shared/checkboxGroup.jsx";
import SmsUtil from "../../smsUtil.js";

export default function Registration() {
  const { state, setState } = useContext(globalState);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [children, setChildren] = useState([]);
  const [parentType, setParentType] = useState("");
  const [childrenInputs, setChildrenInputs] = useState([<ChildrenInput childrenCount={1} onChange={(e) => setChildren([...children, e.target.value])} />]);

  const submit = () => {
    console.log("hey");
    setError("");
    let coparentsArr = [];
    let coparentNamesNl = document.querySelectorAll(".coparent-name");
    let coparentPhonesNl = document.querySelectorAll(".coparent-phone");
    let checkboxesNl = document.querySelectorAll(".coparent-input-container .box.active");
    let checkboxValues = Array.from(checkboxesNl).map((x) => x.parentNode.dataset["label"]);
    const coparentNames = Array.from(coparentNamesNl).map((x) => x.value);
    const coparentPhones = Array.from(coparentPhonesNl).map((x) => x.value);

    coparentNames.forEach((name, nameIndex) => {
      coparentsArr.push({ name: name });
    });
    coparentPhones.forEach((phone, phoneIndex) => {
      coparentsArr[phoneIndex]["phone"] = phone;
    });
    checkboxValues.forEach((checkbox, checkboxIndex) => {
      coparentsArr[checkboxIndex]["parentType"] = checkbox;
    });

    const emptyCoparentProps = coparentsArr.filter((x) => x.name === "" || x.phone === "" || x.parentType === "");

    if (emptyCoparentProps.length > 0) {
      setError("Empty co-parent fields are not allowed");
      setState({ ...state, showError: true });
      return false;
    }

    if (checkboxValues.length === 0) {
      setError("Empty co-parent fields/checkboxes are not allowed");
      setState({ ...state, showError: true });
      return false;
    }

    if (parentType.length === 0) {
      setError("Select your parent type");
      setState({ ...state, showError: true });
      return false;
    }

    if (util.validation([userName, email, password, confirmedPassword, phone, parentType]) > 0) {
      setError("Please fill out all fields");
      setState({ ...state, showError: true });
      return false;
    }

    if (!util.formatPhoneNumber(phone)) {
      setError("Enter a valid phone number");
      setState({ ...state, showError: true });
    }

    if (password !== confirmedPassword) {
      setError("Passwords do not match");
      setState({ ...state, showError: true });
      return false;
    }

    if (children.length === 0) {
      setError("Please enter at least 1 child");
      setState({ ...state, showError: true });
      return false;
    }

    if (coparentsArr.length === 0) {
      setError("Please enter at least 1 coparent");
      setState({ ...state, showError: true });
      return false;
    }

    // if (!util.isValidPassword(password)) {
    //   setError(`Password Requirements: <br>
    //     *Min. 8 characters
    //     *Include lowercase letter
    //     *Include uppercase letter
    //     *Include number
    //     *Include a special character (#.-?!@$%^&*)`);
    //   setState({ ...state, showError: true });
    //   return false;
    // }

    const verificationCode = util.createVerificationCode();
    let newUser = new User();
    newUser.id = util.getUid();
    newUser.email = email;
    newUser.password = password;
    newUser.name = userName;
    newUser.children = children;
    newUser.phone = phone;
    newUser.coparents = coparentsArr;
    newUser.parentType = parentType;
    newUser.verificationCode = verificationCode;
    newUser.isVerified = false;

    // Send verification code to each added coparent
    coparentsArr.forEach((coparent) => {
      SmsUtil.send(coparent.phone, SmsUtil.getVerificationCodeTemplate(verificationCode, newUser.name));
    });

    // Check for existing account
    db.getTable(db.tables.users).then((users) => {
      if (users.findIndex((x) => x.email === newUser.email || x.phone === newUser.phone) > -1) {
        setError("Account already exists, please login");
        setState({ ...state, showError: true });
        return false;
      }
    });

    db.add(db.tables.users, newUser).finally(() => {
      setState({ ...state, currentScreen: screenNames.login });
    });
  };

  const cancel = () => {
    setState({ ...state, currentScreen: screenNames.login });
  };

  const addChild = () => {
    setChildrenInputs([...childrenInputs, <ChildrenInput childrenCount={childrenInputs.length + 1} onChange={(e) => setChildren([...children, e.target.value])} />]);
  };

  const handleParentType = (e) => {
    util.handleCheckboxSelection(e, ".box", setParentType(null), setParentType(e.currentTarget.dataset.label));
  };

  const handleCoparentType = (e) => {
    util.handleCheckboxSelection(e, ".box");
  };

  const addCoparent = () => {
    setCoparentInputs([...coparentInputs, <CoparentInputs coparentsLength={coparentInputs.length + 1} handleCoparentType={handleCoparentType} />]);
  };

  const [coparentInputs, setCoparentInputs] = useState([<CoparentInputs handleCoparentType={handleCoparentType} />]);

  useEffect(() => {
    util.scrollToTopOfPage();
    setState({ ...state, currentScreen: "registration", currentScreenTitle: "Register" });
  }, []);

  return (
    <div id="registration-container" className="page-container">
      <Error errorMessage={error} />
      <div className="form">
        <CheckboxGroup labels={["Biological Parent", "Step-Parent"]} onCheck={handleParentType} />
        <input type="text" placeholder="Name - required" onChange={(e) => setUserName(e.target.value)} />
        <input type="email" placeholder="Email address - required" onChange={(e) => setEmail(e.target.value)} />
        <input type="number" pattern="[0-9]*" inputMode="numeric" placeholder="Phone number - required" onChange={(e) => setPhone(e.target.value)} />
        <input type="password" placeholder="Password - required" onChange={(e) => setPassword(e.target.value)} />
        <input type="password" placeholder="Confirm password - required" onChange={(e) => setConfirmedPassword(e.target.value)} />
        {coparentInputs.map((input, index) => {
          return <span key={index}>{input}</span>;
        })}
        <button id="add-coparent-button" className="button comp-blue" onClick={addCoparent}>
          Add Another Co-Parent
        </button>
        <div className="children">
          {childrenInputs.map((input, index) => {
            return <span key={index}>{input}</span>;
          })}
        </div>
        <button id="add-child-button" className="button comp-blue" onClick={addChild}>
          Add Another Child
        </button>
        <div className="flex button-group">
          <button className="button green" onClick={submit}>
            Register <span className="material-icons-round">person_add</span>
          </button>
          <button className="button red" onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
