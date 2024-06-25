import React, { useState, useEffect, useContext } from "react";
import Error from "./shared/error";
import { DateRangePicker } from "rsuite";
import { DatePicker, SelectPicker } from "rsuite";
import swapLengths from "../constants/swapLengths";
import globalState from "../context";
import moment from "moment";
import db from "../db";
import util from "../util";
import SwapRequest from "../models/swapRequest";
import CheckboxGroup from "./shared/checkboxGroup";
import SmsUtil from "../smsUtil";

export default function NewSwapRequest() {
  const { state, setState } = useContext(globalState);
  const { currentUser } = state;
  const [requestRange, setRequestRange] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [requestChildren, setRequestChildren] = useState([]);
  const [forCoparent, setForCoparent] = useState(null);
  const [requestFromHour, setRequestFromHour] = useState(null);
  const [requestToHour, setRequestToHour] = useState(null);
  const [swapLength, setSwapLength] = useState("single");
  const [error, setError] = useState("");

  const submit = () => {
    if (requestRange.length === 0 || util.validation([forCoparent]) > 0) {
      setError("Please fill out required fields");
      setState({ ...state, showError: true });
      return;
    } else {
      let newRequest = new SwapRequest();
      newRequest.id = util.getUid();
      if (swapLength.length === swapLengths.multiple || swapLength.length === swapLengths.single) {
        newRequest.fromDate = requestRange[0];
        newRequest.toDate = requestRange.length > 1 ? requestRange[1] : requestRange[0];
      } else {
        newRequest.fromDate = requestRange;
        newRequest.toDate = requestRange;
      }
      newRequest.children = requestChildren;
      newRequest.reason = requestReason;
      newRequest.length = swapLength;
      newRequest.fromHour = requestFromHour;
      newRequest.toHour = requestToHour;
      newRequest.phone = currentUser.phone;
      newRequest.forCoparent = forCoparent;
      newRequest.createdBy = currentUser.name;

      db.add(db.tables.swapRequests, newRequest).finally(() => {
        db.getCoparent(forCoparent)
          .then((user) => {
            if (swapLength === swapLengths.multiple) {
              SmsUtil.send(user.phone, SmsUtil.getNewSwapRequestTemplate(`${newRequest.fromDate}`.replace(",", " to "), currentUser.name));
            } else if (swapLength === swapLengths.intra) {
              SmsUtil.send(user.phone, SmsUtil.getNewSwapRequestTemplate(`${newRequest.fromDate} (${newRequest.fromHour}) to ${newRequest.toDate} (${newRequest.toHour})`, currentUser.name));
            } else {
              SmsUtil.send(user.phone, SmsUtil.getNewSwapRequestTemplate(`${newRequest.fromDate}`, currentUser.name));
            }
          })
          .finally(() => {
            setState({ ...state, viewSwapRequestForm: false });
            setError("");
            setSwapLength(swapLengths.single);
          });
        SmsUtil.send();
      });
    }
  };

  const handleChildSelection = (e) => {
    const clickedEl = e.currentTarget;
    const checkbox = clickedEl.querySelector(".box");
    const selectedValue = clickedEl.getAttribute("data-label");
    if (checkbox.classList.contains("active")) {
      checkbox.classList.remove("active");
      if (requestChildren.length > 0) {
        setRequestChildren(requestChildren.filter((x) => x !== selectedValue));
      }
    } else {
      checkbox.classList.add("active");
      setRequestChildren([...requestChildren, selectedValue]);
    }
  };

  const changeSwapLength = (length) => {
    setError("");
    setSwapLength(length);
  };

  const cancel = () => setState({ ...state, viewSwapRequestForm: false, currentScreenTitle: "Swap Requests" });

  useEffect(() => {
    setState({ ...state, currentScreenTitle: "Add New Request" });
  }, []);

  return (
    <div id="new-swap-request-container">
      <div className="action-pills swap-request">
        <div className={`flex ${swapLength === "single" ? "active" : ""}`} onClick={() => changeSwapLength(swapLengths.single)}>
          <ion-icon name="today-outline"></ion-icon>
          <p>Single Day</p>
        </div>
        <div className={`flex ${swapLength === "multiple" ? "active" : ""}`} onClick={() => changeSwapLength(swapLengths.multiple)}>
          <ion-icon name="calendar-outline"></ion-icon>
          <p>Multiple Days</p>
        </div>
        <div className={`flex ${swapLength === "intraday" ? "active" : ""}`} onClick={() => changeSwapLength(swapLengths.intra)}>
          <ion-icon name="calendar-number-outline"></ion-icon>
          <p>Intraday</p>
        </div>
      </div>
      <Error errorMessage={error} />
      <div id="request-form" className="form single">
        {swapLength === swapLengths.single && (
          <DatePicker
            format="MM/dd/yyyy"
            placeholder="Swap Date - required"
            cleanable={false}
            onChange={(e) => {
              setRequestRange([moment(e).format("MM/DD/YYYY")]);
            }}
          />
        )}
        {swapLength === swapLengths.intra && (
          <>
            <DatePicker placeholder="Day" format="MM/dd/yyyy" showMeridian onChange={(e) => setRequestRange(moment(e).format("MM/DD/YYYY").toString())} />
            <DatePicker placeholder="From Hour" format="hh aa" showMeridian onChange={(e) => setRequestFromHour(moment(e).format("h a"))} />
            <DatePicker placeholder="To Hour" format="hh aa" showMeridian onChange={(e) => setRequestToHour(moment(e).format("h a"))} />
          </>
        )}
        {swapLength === swapLengths.multiple && (
          <DateRangePicker
            placeholder="Swap Date Range - required"
            showOneCalendar
            showHeader={false}
            editable={false}
            placement="auto"
            cleanable={false}
            character=" to "
            format={"MM/dd/yyyy"}
            onChange={(e) => {
              let formattedDates = [];

              e.forEach((date) => {
                formattedDates.push(moment(date).format("MM/DD/YYYY").toString());
              });
              setRequestRange(formattedDates);
            }}
          />
        )}

        {currentUser && <CheckboxGroup labels={currentUser.children} onCheck={handleChildSelection} />}

        {currentUser && (
          <SelectPicker
            cleanable={false}
            placeholder={"Select Co-Parent"}
            searchable={false}
            data={currentUser.coparents.map((x) => ({
              label: x.name,
              value: x.name,
            }))}
            onChange={(e) => setForCoparent(e)}
            block
          />
        )}

        <textarea placeholder="Reason" onChange={(e) => setRequestReason(e.target.value)}></textarea>

        <div className="button-group flex">
          <button className="green" onClick={submit}>
            Send <ion-icon name="send"></ion-icon>
          </button>
          <button className="close" onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
