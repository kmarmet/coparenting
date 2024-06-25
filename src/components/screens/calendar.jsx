import moment from "moment";
import React, { useState, useEffect, useContext } from "react";
import CalendarEventForm from "../calendarEventForm";
import { getDatabase, ref, set, get, child, onValue } from "firebase/database";
import db from "../../db";
import globalState from "../../context";
import util from "../../util";
import flatpickr from "flatpickr";

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
    allEvents = util.getUniqueArrayOfObjects(allEvents, "id");
    const eventsToAddDotsTo = allEvents;

    if (selectedDay !== null) {
      allEvents = allEvents.filter((x) => {
        if (x.date === selectedDay.toString()) {
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
    document.querySelectorAll(".flatpickr-day").forEach((day) => {
      let formattedDay = moment(day.getAttribute("aria-label")).format("MM/DD/yyyy");
      if (selectedMonth) {
        formattedDay = moment(formattedDay).format("MM/DD/yyyy");
      }

      if (events.filter((x) => x.date == formattedDay).length > 0) {
        const dot = document.createElement("span");
        dot.classList.add("dot");
        day.append(dot);
      }
    });
  };

  const deleteEvent = (e) => db.delete(db.tables.calendarEvents, e.id);

  useEffect(() => {
    util.scrollToTopOfPage();
    const dbRef = ref(getDatabase());
    flatpickr("#calendar-ui-container", {
      inline: true,
      onReady: () => {
        // console.log("ready");
      },
      onMonthChange: (selectedDates, dateStr, instance) => {
        onValue(child(dbRef, db.tables.calendarEvents), async (snapshot) => {
          const tableData = snapshot.val();
          await db.getFilteredRecords(tableData, currentUser).then((x) => {
            setExistingEvents(x);
            updateLogFromDb(moment(`${instance.currentMonth + 1}/01/${instance.currentYear}`).format("MM/DD/yyyy"), instance.currentMonth + 1, x);
          });
        });
      },
      onChange: async (e) => {
        const date = moment(e[0]).format("MM/DD/yyyy").toString();
        onValue(child(dbRef, db.tables.calendarEvents), async (snapshot) => {
          const tableData = snapshot.val();
          await db.getFilteredRecords(tableData, currentUser).then((x) => {
            setExistingEvents(x);
            updateLogFromDb(date, moment(e[0]).format("MM"), x);
          });
        });
      },
    });
    onValue(child(dbRef, db.tables.calendarEvents), async (snapshot) => {
      const tableData = snapshot.val();
      await db.getFilteredRecords(tableData, currentUser).then((x) => {
        setExistingEvents(x);
        updateLogFromDb(moment().format("MM/DD/yyyy"), null, x);
      });
    });

    setState({ ...state, currentScreenTitle: "Shared Calendar" });
  }, []);

  return (
    <div id="calendar-container" className="page-container">
      {!showEventForm && (
        <div className="action-pills">
          <div
            className="flex"
            onClick={() => {
              document.querySelector(".flatpickr-calendar").style.display = "none";
              setShowEventForm(true);
            }}>
            <p>New Event</p>
            <ion-icon name="add-outline"></ion-icon>
          </div>
        </div>
      )}
      {showEventForm && (
        <CalendarEventForm
          onSubmit={() => {
            document.querySelector(".flatpickr-calendar").style.display = "block";
            setShowEventForm(false);
          }}
        />
      )}
      <div id="calendar-ui-container"></div>
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
