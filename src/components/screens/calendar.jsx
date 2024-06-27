import moment from "moment";
import React, { useState, useEffect, useContext } from "react";
import CalendarEventForm from "../calendarEventForm";
import { getDatabase, ref, set, get, child, onValue } from "firebase/database";
import db from "../../db";
import globalState from "../../context";
import util from "../../util";
import flatpickr from "flatpickr";
import screenNames from "../../constants/screenNames";

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
  const isIos = () => {
    return (
      ["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"].includes(navigator.platform) ||
      // iPad on iOS 13 detection
      (navigator.userAgent.includes("Mac") && "ontouchend" in document)
    );
  };

  const cancel = () => {
    setState({ ...state, currentScreen: screenNames.calendar, currentScreenTitle: "Calendar" });
    setShowEventForm(false);
    document.querySelector(".flatpickr-calendar").style.display = "block";
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
      {showEventForm && (
        <CalendarEventForm
          onCancel={cancel}
          onSubmit={() => {
            document.querySelector(".flatpickr-calendar").style.display = "block";
            setShowEventForm(false);
          }}
        />
      )}
      <div id="calendar-ui-container"></div>
      {!showEventForm && (
        <div className="action-pills add">
          <div
            className="flex"
            onClick={() => {
              document.querySelector(".flatpickr-calendar").style.display = "none";
              setShowEventForm(true);
            }}>
            <span className="material-icons-round">add_circle</span>
          </div>
        </div>
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
                                <b> {util.uppercaseFirstLetterOfAllWords(event.title.toString())} </b>
                              </p>
                              {event.children && event.children.length > 0 && (
                                <p>
                                  <b>with </b>
                                  {event.children.join(", ")}
                                </p>
                              )}
                              {event.location && event.location.length > 0 && (
                                <a href={isIos() ? `http://maps.apple.com/?daddr=${encodeURIComponent(event.location)}` : event.directionsLink}>
                                  <span className="material-icons-round">directions</span>
                                  {event.location}
                                </a>
                              )}
                            </div>
                            <div className="right">
                              <p className="time"> {event.time}</p>
                              <span onClick={() => deleteEvent(event)} className="material-icons delete-icon">
                                remove
                              </span>
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
