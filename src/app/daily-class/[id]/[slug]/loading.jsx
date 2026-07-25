import React from "react";

const Loading = () => {
  return (
    <div id="DailyLiveClassDetails">
      <div className="container">
        <div className="LiveClassDetailsMain">
          {/* Left Section Skeleton */}
          <div className="DetailsLeft">
            
            {/* Thumbnail Skeleton */}
            <div className="ThumbnailWrapper skeleton" style={{ background: "#eee", height: "400px", borderRadius: "12px", marginBottom: "24px" }}></div>

            {/* Header Skeleton */}
            <div className="ClassHeader">
              <div className="skeleton" style={{ width: "60%", height: "36px", background: "#eee", marginBottom: "20px", borderRadius: "8px" }}></div>

              <div className="ScheduleGrid">
                {[1, 2].map((i) => (
                  <div key={i} className="ScheduleItem" style={{ border: "1px solid #eee" }}>
                    <div className="skeleton" style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#eee" }}></div>
                    <div className="TextWrap" style={{ width: "100%" }}>
                      <div className="skeleton" style={{ width: "60px", height: "12px", background: "#eee", marginBottom: "6px" }}></div>
                      <div className="skeleton" style={{ width: "120px", height: "16px", background: "#eee" }}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ActionFlex">
                <div className="DayGroup">
                  <div className="skeleton" style={{ width: "80px", height: "16px", background: "#eee", marginBottom: "8px" }}></div>
                  <div className="DayList" style={{ gap: "8px", display: "flex" }}>
                    {[1, 2, 3, 4].map((d) => (
                      <div key={d} className="skeleton" style={{ width: "40px", height: "30px", background: "#eee", borderRadius: "6px" }}></div>
                    ))}
                  </div>
                </div>
                <div className="skeleton" style={{ width: "150px", height: "48px", background: "#eee", borderRadius: "8px" }}></div>
              </div>
            </div>

            {/* Instructor Skeleton */}
            <div className="InstructorSection" style={{ marginTop: "30px" }}>
              <div className="AuthCard" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div className="skeleton" style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#eee" }}></div>
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: "150px", height: "20px", background: "#eee", marginBottom: "8px" }}></div>
                  <div className="skeleton" style={{ width: "200px", height: "14px", background: "#eee" }}></div>
                </div>
              </div>
            </div>

            {/* Description Skeleton */}
            <div className="DescriptionBox" style={{ marginTop: "30px" }}>
              <div className="skeleton" style={{ width: "200px", height: "24px", background: "#eee", marginBottom: "16px" }}></div>
              <div className="skeleton" style={{ width: "100%", height: "16px", background: "#eee", marginBottom: "8px" }}></div>
              <div className="skeleton" style={{ width: "100%", height: "16px", background: "#eee", marginBottom: "8px" }}></div>
              <div className="skeleton" style={{ width: "80%", height: "16px", background: "#eee" }}></div>
            </div>

            {/* Requirements & Gear Skeleton */}
             <div className='HighlightBox RequirementsSection' style={{ marginTop: "30px" }}>
                <div className="skeleton" style={{ width: "250px", height: "24px", background: "#eee", marginBottom: "16px" }}></div>
                <div className="skeleton" style={{ width: "100%", height: "16px", background: "#eee", marginBottom: "20px" }}></div>
                
                <div className='ProductList'>
                    {[1, 2].map(i => (
                      <div className='ProductItem' key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", padding: "10px", border: "1px solid #eee", borderRadius: "8px" }}>
                        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                            <div className="skeleton" style={{ width: "60px", height: "60px", background: "#eee", borderRadius: "4px" }}></div>
                            <div>
                                <div className="skeleton" style={{ width: "120px", height: "16px", background: "#eee", marginBottom: "8px" }}></div>
                                <div className="skeleton" style={{ width: "80px", height: "16px", background: "#eee" }}></div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <div className="skeleton" style={{ width: "100px", height: "35px", background: "#eee", borderRadius: "4px" }}></div>
                            <div className="skeleton" style={{ width: "100px", height: "35px", background: "#eee", borderRadius: "4px" }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
            </div>

          </div>

          {/* Right Section - Chat Skeleton */}
          <aside className="ChatSidebar">
            <div className="ChatHeader" style={{ padding: "20px", borderBottom: "1px solid #eee" }}>
               <div className="skeleton" style={{ width: "100px", height: "24px", background: "#eee" }}></div>
            </div>

            <div className="ChatBody" style={{ padding: "20px" }}>
              {[1, 2, 3, 4, 5].map((msg) => (
                <div key={msg} style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "flex-start" }}>
                  <div className="skeleton" style={{ width: "35px", height: "35px", borderRadius: "50%", background: "#eee", flexShrink: 0 }}></div>
                  <div style={{ flex: 1 }}>
                     <div className="skeleton" style={{ width: "80px", height: "12px", background: "#eee", marginBottom: "6px" }}></div>
                     <div className="skeleton" style={{ width: "100%", height: "40px", background: "#eee", borderRadius: "0 12px 12px 12px" }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ChatFooter" style={{ padding: "20px", borderTop: "1px solid #eee" }}>
               <div className="skeleton" style={{ width: "100%", height: "45px", background: "#eee", borderRadius: "8px" }}></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Loading;
