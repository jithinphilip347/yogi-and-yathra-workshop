

const useFormatDate = () => {
    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        return `${year}-${month}-${day}`;
    }

    const getHowLongAgo = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diffInSeconds = Math.floor((now - d) / 1000);

        if (diffInSeconds < 60) return 'just now';

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return diffInMinutes === 1 ? 'a minute ago' : `${diffInMinutes} minutes ago`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return diffInHours === 1 ? 'an hour ago' : `${diffInHours} hours ago`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) {
            return diffInDays === 1 ? 'a day ago' : `${diffInDays} days ago`;
        }

        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) {
            return diffInMonths === 1 ? 'a month ago' : `${diffInMonths} months ago`;
        }

        const diffInYears = Math.floor(diffInDays / 365);
        return diffInYears === 1 ? 'a year ago' : `${diffInYears} years ago`;
    }

    return {
        formatDate,
        getHowLongAgo
    }
}

export default useFormatDate;