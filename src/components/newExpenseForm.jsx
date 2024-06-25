import React, { useEffect, useState, useContext, useRef } from "react";
import db from "../db";
import tables from "../constants/screenNames";
import util from "../util";
import globalState from "../context";
import Error from "./shared/error";
import { DatePicker, SelectPicker } from "rsuite";
import moment from "moment";
import CheckboxGroup from "./shared/checkboxGroup";
import Expense from "../models/expense";
import SmsUtil from "../smsUtil";
import FirebaseStorage from "../firebaseStorage";

function NewExpenseForm() {
  const { state, setState } = useContext(globalState);
  const { viewExpenseForm, currentUser } = state;
  const [expenseName, setExpenseName] = useState("");
  const [expenseChildren, setExpenseChildren] = useState([]);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDueDate, setExpenseDueDate] = useState(null);
  const [expenseNotes, setExpenseNotes] = useState("");
  const [expenseImage, setExpenseImage] = useState("");
  const [expensePayee, setExpensePayee] = useState(null);
  const [forCoparent, setForCoparent] = useState(null);
  const imgRef = useRef();
  const [error, setError] = useState("");

  const hideExpenseForm = () => {
    document.getElementById("add-expense-form").classList.remove("show");
    resetNewExpense();
    setState({
      ...state,
      viewExpenseForm: false,
      currentScreenTitle: "Expense Tracker",
    });
  };

  const submitNewExpense = () => {
    setError("");
    if (util.validation([forCoparent, expenseName, expenseAmount]) === 0) {
      const uid = util.getUid();
      const newExpense = new Expense();
      newExpense.id = uid;
      newExpense.name = expenseName;
      newExpense.children = expenseChildren;
      newExpense.amount = expenseAmount;
      newExpense.payee = currentUser.name;
      newExpense.phone = currentUser.phone;
      newExpense.dueDate = expenseDueDate;
      newExpense.forCoparent = forCoparent;
      newExpense.dateAdded = util.getCurrentDate();
      newExpense.notes = expenseNotes;
      newExpense.paidStatus = "unpaid";
      newExpense.createdBy = currentUser.name;

      // Add to db
      db.add(tables.expenseTracker, newExpense).finally(() => {
        db.getCoparent(forCoparent).then((user) => {
          SmsUtil.send(user.phone, SmsUtil.getNewExpenseTemplate(expenseName, expenseAmount, currentUser.name));
        });
      });

      FirebaseStorage.upload(FirebaseStorage.directories.expenseImages, uid, expenseImage);
      resetNewExpense();
      hideExpenseForm();
      setState({ ...state, viewExpenseForm: false });
    } else {
      setError("Please fill out all required fields");
      setState({ ...state, showError: true });
      document.getElementById("add-expense-form").scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  };

  const resetNewExpense = () => {
    setExpenseAmount("");
    setExpenseName("");
    setExpenseChildren("");
    setExpensePayee("");
    setExpenseNotes("");
    setExpenseDueDate("");
    setExpenseImage("");
    setError("");
  };

  const handleChildSelection = (e) => {
    const clickedEl = e.currentTarget;
    const checkbox = clickedEl.querySelector(".box");
    const selectedValue = clickedEl.getAttribute("data-label");
    if (checkbox.classList.contains("active")) {
      checkbox.classList.remove("active");
      if (expenseChildren.length > 0) {
        setExpenseChildren(expenseChildren.filter((x) => x !== selectedValue));
      }
    } else {
      checkbox.classList.add("active");
      setExpenseChildren([...expenseChildren, selectedValue]);
    }
  };

  const chooseImage = (e) => {
    const img = document.querySelector("#upload-input").files[0];
    const blobText = FirebaseStorage.imageToBlob(img);
    if (blobText && img) {
      blobText.then((base64Image) => {
        setExpenseImage(img);
      });
    }
  };

  useEffect(() => {
    if (viewExpenseForm === true) {
      document.querySelector("#expenses-container").style.display = "none";
    } else {
      document.querySelector("#expenses-container").style.display = "block";
    }
  }, [state]);

  return (
    <div id="add-expense-form">
      <Error errorMessage={error} />
      <input
        name="expense-name"
        type="text"
        placeholder="Name (e.g. baseball bat) - required"
        value={expenseName}
        onChange={(e) => {
          setExpenseName(e.target.value);
        }}
      />

      <input
        name="expense-amount"
        value={expenseAmount}
        type="number"
        pattern="[0-9]*"
        inputMode="numeric"
        placeholder="Amount (e.g. 100) - required"
        onChange={(e) => {
          setExpenseAmount(e.target.value);
        }}
      />

      <DatePicker hideHours={(hour, date) => false} hideMinutes={(minute, date) => false} hideSeconds={(second, date) => false} format="MM/dd/yyyy" dateformat="MM/dd/yyyy" placeholder="Due Date - optional" cleanable={false} placement="auto" onOk={(e) => setExpenseDueDate(e)} />

      {currentUser && <CheckboxGroup labels={currentUser.children} onCheck={handleChildSelection} />}

      {currentUser && (
        <SelectPicker
          cleanable={false}
          placeholder={"Select Paying Co-Parent"}
          searchable={false}
          data={currentUser.coparents.map((x) => ({
            label: x.name,
            value: x.name,
          }))}
          onChange={(e) => setForCoparent(e)}
          block
        />
      )}

      <textarea name="expense-notes" placeholder="Notes - optional" onChange={(e) => setExpenseNotes(e.target.value)}></textarea>
      <label>
        <b>Upload Image</b> (such as a receipt - optional)
      </label>
      <input ref={imgRef} type="file" id="upload-input" onChange={(e) => chooseImage(e)} />
      <div className="button-group flex">
        <button className="green" onClick={() => submitNewExpense()}>
          Submit <ion-icon name="arrow-forward"></ion-icon>
        </button>
        <button className="red" onClick={() => hideExpenseForm()}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default NewExpenseForm;
