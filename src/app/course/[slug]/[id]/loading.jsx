import React from "react";
import CourseCardSkeleton from "../../../../components/coursebox/CourseCardSkeleton";
import { FiFilter, FiChevronDown } from "react-icons/fi";

const Loading = () => {
    return (
        <div id="CourseDetails" className="skeleton-page">
            <section className='CourseBanner' style={{ background: '#f8f9fb' }}>
                <div className='container'>
                    <div className='HeroSection'>
                        <div className="skeleton" style={{ width: "80px", height: "24px", marginBottom: "16px", background: "#eee" }}></div>
                        <div className="skeleton" style={{ width: "70%", height: "48px", marginBottom: "16px", background: "#eee" }}></div>
                        <div className="skeleton" style={{ width: "90%", height: "24px", marginBottom: "24px", background: "#eee" }}></div>
                        <div className='MetaInfo'>
                            <div className="skeleton" style={{ width: "150px", height: "40px", background: "#eee", borderRadius: "20px" }}></div>
                            <div className="skeleton" style={{ width: "200px", height: "24px", background: "#eee" }}></div>
                        </div>
                    </div>
                </div>
            </section>

            <div className='container'>
                <div className='CourseDetailsMain'>
                    <div className='DetailsLeft'>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className='HighlightBox skeleton-box' style={{ minHeight: "200px", marginBottom: "24px", padding: "24px", background: "#fff", border: "1px solid #eee", borderRadius: "8px" }}>
                                <div className="skeleton" style={{ width: "150px", height: "24px", marginBottom: "20px", background: "#eee" }}></div>
                                <div className="skeleton" style={{ width: "100%", height: "16px", marginBottom: "12px", background: "#eee" }}></div>
                                <div className="skeleton" style={{ width: "100%", height: "16px", marginBottom: "12px", background: "#eee" }}></div>
                                <div className="skeleton" style={{ width: "80%", height: "16px", background: "#eee" }}></div>
                            </div>
                        ))}
                    </div>

                    <aside className='DetailsRight'>
                        <div className='PreviewCard skeleton-card' style={{ background: "#fff", border: "1px solid #eee", borderRadius: "8px", overflow: "hidden" }}>
                            <div className="skeleton" style={{ width: "100%", height: "225px", background: "#eee" }}></div>
                            <div style={{ padding: "24px" }}>
                                <div className="skeleton" style={{ width: "100px", height: "32px", marginBottom: "16px", background: "#eee" }}></div>
                                <div className="skeleton" style={{ width: "100%", height: "48px", marginBottom: "12px", background: "#eee", borderRadius: "8px" }}></div>
                                <div className="skeleton" style={{ width: "100%", height: "48px", background: "#eee", borderRadius: "8px" }}></div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default Loading;
