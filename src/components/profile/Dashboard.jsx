import React from "react";
import Image from "next/image";
import CourseCard from "@/components/coursebox/CourseCard";

const Dashboard = ({ courses, continueCourses, upcomingEvents }) => {
  return (
    <div className="DashBoard">
      <div className="EnrolldCourseBox">
        <div className="DashBoardHead">
          <h2>Purchased Courses</h2>
          <p>Manage and continue your learning journey.</p>
        </div>

        <div className="CourseGrid">
          {courses.map((course, i) => (
            <div className="CourseItem" key={i}>
              <CourseCard {...course} />
            </div>
          ))}
        </div>
      </div>
      <div className="ContinueWatchBox">
        <div className="DashBoardHead">
          <h2>Continue Watching</h2>
          <p>Pick up right where you left off.</p>
        </div>
        <div className="ContinueGrid">
          {continueCourses.map((item, index) => (
            <div className="ContinueCard" key={index}>
              <div className="Thumb">
                <Image src={item.image} alt={item.title} />
              </div>
              <div className="Details">
                <h4>{item.title}</h4>

                {/* Progress Bar Area */}
                <div className="ProgressContainer">
                  <div className="Bar">
                    <div
                      className="Fill"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                  <p>{item.progress}% Complete</p>
                </div>

                <div className="CardFooter">
                  <div className="Instructor">
                    <Image
                      src={item.instructorImg}
                      alt={item.instructorName}
                      width={30}
                      height={30}
                    />
                    <span>{item.instructorName}</span>
                  </div>
                  <button className="ContinueBtn">Continue</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="UpcomingEventsBox">
        <div className="DashBoardHead">
          <h2>Upcoming Events</h2>
          <p>
            Don&apos;t miss out on these upcoming sessions and
            announcements.
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
    </div>
  );
};

export default Dashboard;
