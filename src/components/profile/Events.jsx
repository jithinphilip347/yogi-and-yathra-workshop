import React from "react";

const Events = ({ upcomingEvents }) => {
  return (
    <div className="UpcomingEventsBox">
      <div className="DashBoardHead">
        <h2>Upcoming Events</h2>
        <p>
          Don&apos;t miss out on these upcoming sessions and announcements.
        </p>
      </div>
      <div className="EventsList">
        {upcomingEvents.map((event, index) => (
          <div className="EventItem" key={index}>
            <div className="EventDate">
              <span className="FullDate">{event.date}</span>
              <span className="Time">{event.time}</span>
            </div>
            <div className="EventContent">
              <span className="EventType">{event.type}</span>
              <h4 className="EventTitle">{event.title}</h4>
            </div>
            <div className="EventAction">
              <button className="EventBtn">{event.buttonText}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Events;
