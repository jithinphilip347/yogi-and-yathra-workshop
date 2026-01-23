import { API_BASE_URL } from "@/utils/constants"


const fetchLiveSections = async () => {
    const res = await fetch(API_BASE_URL + "home/live-section", {
        method: "GET",
        next: {
            revalidate: 600,
        }
    })
    const data = await res.json();
    return data;
}

const fetchDailyClasses = async () => {
    const res = await fetch(API_BASE_URL + "home/daily-class", {
        method: "GET",
        next: {
            revalidate: 600,
        }
    })
    const data = await res.json();
    return data;
}

const fetchCategories = async () => {
    const res = await fetch(API_BASE_URL + "home/categories", {
        method: "GET",
        next: {
            revalidate: 600,
        }
    })
    const data = await res.json();
    return data;
}

const fetchCourseDetails = async (id) => {
    const res = await fetch(API_BASE_URL + "home/course-details/" + id, {
        method: "GET",
        next: {
            revalidate: 600,
        }
    })
    const data = await res.json();
    return data;
}


export { fetchLiveSections, fetchDailyClasses, fetchCategories, fetchCourseDetails } 