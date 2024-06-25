import React, { useEffect, useState, useContext, useRef } from "react";
import db from "../db";
import tables from "../constants/screenNames";
import util from "../util";
import globalState from "../context";
import Error from "./shared/error";
import { DatePicker, SelectPicker } from "rsuite";
import moment from "moment";
import CalendarEvent from "../models/calendarEvent";
import CheckboxGroup from "./shared/checkboxGroup";
import SmsUtil from "../smsUtil";

export default function CalendarEventForm({ onSubmit }) {
  const [eventDate, setEventDate] = useState(null);
  const [children, setChildren] = useState([]);
  const [eventLocation, setEventLocation] = useState(null);
  const [eventTitle, setEventTitle] = useState(null);
  const [forCoparent, setForCoparent] = useState("");
  const [eventTime, setEventTime] = useState(null);
  const { state, setState } = useContext(globalState);
  const { currentUser } = state;
  const [error, setError] = useState("");

  const submit = () => {
    const newEvent = new CalendarEvent();
    newEvent.id = util.getUid();
    newEvent.location = eventLocation;
    newEvent.title = eventTitle;
    newEvent.children = children;
    newEvent.phone = currentUser.phone;
    newEvent.date = eventDate;
    newEvent.createdBy = currentUser.name;
    newEvent.forCoparent = forCoparent;
    newEvent.time = eventTime;

    if (util.validation([eventDate, eventTitle, forCoparent]) > 0) {
      setError("Please fill out required fields");
      setState({ ...state, showError: true });
      return false;
    }

    db.add(db.tables.calendarEvents, newEvent).finally(() => {
      onSubmit();
      const newEventMessage = SmsUtil.getNewCalEventTemplate(eventTitle, eventDate, currentUser.name);
      db.getCoparent(forCoparent).then((user) => {
        SmsUtil.send(user.phone, newEventMessage);
      });
    });
  };

  const handleCheckboxSelection = (e) => {
    util.handleCheckboxSelection(
      e,
      ".box",
      () => {},
      () => {},
      true
    );

    let childrenArr = [];
    document.querySelectorAll(".box.active").forEach((el) => {
      if (el.parentNode !== undefined) {
        childrenArr.push(el.parentNode.dataset.label);
      }
    });
    setChildren(childrenArr);
  };

  useEffect(() => {
    setState({ ...state, currentScreenTitle: "New Event" });
  }, []);

  return (
    <div id="calendar-event-form-container">
      <Error errorMessage={error} />

      <DatePicker
        format="MM/dd/yyyy"
        placeholder="Event date - required"
        cleanable={false}
        onChange={(e) => {
          setEventDate(moment(e).format("MM/DD/YYYY"));
        }}
      />
      <DatePicker placeholder="Time" format="hh:mm aa" showMeridian onChange={(e) => setEventTime(moment(e).format("h:mm a"))} />

      <input type="text" placeholder="Event title - required" onChange={(e) => setEventTitle(e.target.value)} />
      <input type="text" placeholder="Event location" onChange={(e) => setEventLocation(e.target.value)} />

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

      {currentUser && <CheckboxGroup labels={currentUser.children} onCheck={handleCheckboxSelection} />}

      <button className="button green submit" onClick={submit}>
        Submit
      </button>
    </div>
  );
}
