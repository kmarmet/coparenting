import moment from "moment";
import React, { useState, useEffect, useContext } from "react";
import CalendarEventForm from "../calendarEventForm";
import { getDatabase, ref, set, get, child, onValue } from "firebase/database";
import db from "../../db";
import globalState from "../../context";
import util from "../../util";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export default function EventCalendar() {
  const [allEvents, setAllEvents] = useState([]);
  const { state, setState } = useContext(globalState);
  const { currentScreenTitle, currentUser } = state;
  const [showEventForm, setShowEventForm] = useState(false);
  const [existingEvents, setExistingEvents] = useState([]);

  function formatEvents(events) {
    let dateArr = [];
    events.forEach((event, index) => {
      if (dateArr.findIndex((x) => x.some((d) => d.date === event.date)) === -1) {
        dateArr.push([event]);
      } else {
        const arrIndex = dateArr.findIndex((x) => x.some((d) => d.date === event.date));
        dateArr[arrIndex].push(event);
      }
    });
    return dateArr;
  }

  const updateLogFromDb = async (selectedDay, selectedMonth, eventsFromDB) => {
    let allEvents = await db.getFilteredRecords(eventsFromDB, currentUser).then((x) => x);
    console.log(currentUser);
    allEvents = util.getUniqueArrayOfObjects(allEvents, "id");
    const eventsToAddDotsTo = allEvents;
    if (selectedDay !== null) {
      allEvents = allEvents.filter((x) => {
        if (x.date === selectedDay) {
          return x;
        }
      });
    }

    addEventDot(selectedMonth, eventsToAddDotsTo);

    const formattedDateArr = formatEvents(allEvents);
    setAllEvents(formattedDateArr);
    setState({
      ...state,
      menuIsOpen: false,
    });
  };

  const addEventDot = (selectedMonth, events) => {
    if (selectedMonth) {
      selectedMonth = moment().add(1, "M").format("MM");
    }

    // Loop through all calendar UI days
    document.querySelectorAll("[data-timestamp]").forEach((dayWithTimestamp) => {
      let timestampAsDate = moment(Number(dayWithTimestamp.dataset["timestamp"])).format("L");
      if (selectedMonth) {
        timestampAsDate = moment(timestampAsDate).format("MM/DD/yyyy");
      }

      if (events.filter((x) => x.date == timestampAsDate).length > 0) {
        const dot = document.createElement("span");
        dot.classList.add("dot");
        dayWithTimestamp.append(dot);
      }
    });
  };

  const deleteEvent = (e) => db.delete(db.tables.calendarEvents, e.id);

  useEffect(() => {
    util.scrollToTopOfPage();
    const dbRef = ref(getDatabase());

    onValue(child(dbRef, db.tables.calendarEvents), async (snapshot) => {
      const tableData = snapshot.val();
      setExistingEvents(await db.getFilteredRecords(tableData, currentUser).then((x) => x));
      updateLogFromDb(moment().format("MM/DD/yyyy"), null, tableData);
    });

    setState({ ...state, currentScreenTitle: "Shared Calendar" });
  }, []);

  return (
    <div id="calendar-container" className="page-container">
      {!showEventForm && (
        <div className="action-pills">
          <div className="flex" onClick={() => setShowEventForm(true)}>
            <p>New Event</p>
            <ion-icon name="add-outline"></ion-icon>
          </div>
        </div>
      )}
      {showEventForm && (
        <CalendarEventForm
          onSubmit={() => {
            setShowEventForm(false);
          }}
        />
      )}
      {!showEventForm && (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateCalendar
            onMonthChange={(e) => {
              const update = () => {
                updateLogFromDb(moment(e["$d"]).format("MM/DD/yyyy"), e["$M"], existingEvents);
              };
              setTimeout(update, 1000);
            }}
            onChange={(e) => {
              updateLogFromDb(moment(e["$d"]).format("MM/DD/yyyy"), e["$M"], existingEvents);
              const eventsContainer = document.querySelector(".events").offsetTop;
              if (existingEvents.filter((x) => x.date === moment(e["$d"]).format("MM/DD/yyyy")).length > 0) {
                window.scroll({
                  top: eventsContainer,
                  behavior: "smooth",
                });
              }
            }}
          />
        </LocalizationProvider>
      )}
      {showEventForm === false && (
        <div className="events">
          {allEvents &&
            allEvents.length > 0 &&
            allEvents.map((eventArr, index) => {
              return (
                <div key={index}>
                  <p id="events-title">Events</p>
                  <div className="event">
                    <div className="details-container">
                      {eventArr.map((event, index) => {
                        return (
                          <div key={index} className="event-details">
                            <div className="left">
                              <p className="title">
                                <b> {event.title} </b>
                              </p>
                              {event.location && event.location.length > 0 && (
                                <p>
                                  <b>Location: </b>
                                  {event.location}
                                </p>
                              )}
                              {event.children && event.children.length > 0 && (
                                <p>
                                  <b>Children: </b>
                                  {event.children.join(", ")}
                                </p>
                              )}
                            </div>
                            <div className="right">
                              <p className="time"> {event.time}</p>
                              <ion-icon onClick={() => deleteEvent(event)} name="trash" class="delete-icon"></ion-icon>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
