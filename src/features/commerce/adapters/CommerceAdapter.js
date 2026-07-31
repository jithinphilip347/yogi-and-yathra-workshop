/**
 * Commerce Product Adapters
 *
 * Normalizes heterogeneous backend entity models (Course, LiveSection, DailyClass, FeeCollection)
 * into a single unified CommerceProduct model.
 */

import { PRODUCT_TYPES } from '../constants';
import { MEDIA_BASE_URL } from '@/utils/constants';

export class CommerceAdapter {
  /**
   * Normalize Course model into CommerceProduct
   */
  static fromCourse(course) {
    if (!course) return null;
    return {
      id: `course_${course.id}`,
      productable_type: PRODUCT_TYPES.COURSE,
      productable_id: course.id,
      title: course.title || 'Untitled Course',
      subtitle: course.instructor?.name ? `Instructor: ${course.instructor.name}` : '',
      image: course.staticImage || (course.thumbnail ? `${MEDIA_BASE_URL}${course.thumbnail}` : null),
      price: Number(course.price || 0),
      original_price: Number(course.discount_price || course.price || 0),
      currency: 'INR',
      meta: {
        slug: course.slug,
        lessons_count: course.lessons_count || 0,
        duration: course.duration || 0,
      },
    };
  }

  /**
   * Normalize LiveSection model into CommerceProduct
   */
  static fromLiveSection(liveSection) {
    if (!liveSection) return null;
    return {
      id: `live_${liveSection.id}`,
      productable_type: PRODUCT_TYPES.LIVE_SECTION,
      productable_id: liveSection.id,
      title: liveSection.title || 'Live Workshop Section',
      subtitle: liveSection.instructor?.name ? `Instructor: ${liveSection.instructor.name}` : '',
      image: liveSection.thumbnail ? `${MEDIA_BASE_URL}${liveSection.thumbnail}` : null,
      price: Number(liveSection.price || 0),
      original_price: Number(liveSection.original_price || liveSection.price || 0),
      currency: 'INR',
      meta: {
        start_date: liveSection.start_date,
        schedule_time: liveSection.schedule_time,
      },
    };
  }

  /**
   * Normalize DailyClass model into CommerceProduct
   */
  static fromDailyClass(dailyClass) {
    if (!dailyClass) return null;
    return {
      id: `daily_${dailyClass.id}`,
      productable_type: PRODUCT_TYPES.DAILY_CLASS,
      productable_id: dailyClass.id,
      title: dailyClass.title || 'Daily Live Yoga Class',
      subtitle: dailyClass.instructor_name ? `Instructor: ${dailyClass.instructor_name}` : '',
      image: dailyClass.thumbnail ? `${MEDIA_BASE_URL}${dailyClass.thumbnail}` : null,
      price: Number(dailyClass.price || 0),
      original_price: Number(dailyClass.original_price || dailyClass.price || 0),
      currency: 'INR',
      meta: {
        schedule: dailyClass.schedule,
      },
    };
  }

  /**
   * Normalize FeeCollection demand model into CommerceProduct
   */
  static fromFeeDemand(feeDemand) {
    if (!feeDemand) return null;
    return {
      id: `fee_${feeDemand.id}`,
      productable_type: PRODUCT_TYPES.FEE_COLLECTION,
      productable_id: feeDemand.id,
      title: `Academic Fee Demand #${feeDemand.invoice_number}`,
      subtitle: feeDemand.fee_collectable?.title || 'Academic Tuition',
      image: null,
      price: Number(feeDemand.balance_due || feeDemand.final_amount || 0),
      original_price: Number(feeDemand.final_amount || 0),
      currency: 'INR',
      meta: {
        invoice_number: feeDemand.invoice_number,
        due_date: feeDemand.due_date,
      },
    };
  }

  /**
   * Generic normalize fallback
   */
  static normalize(item, type = PRODUCT_TYPES.COURSE) {
    switch (type) {
      case PRODUCT_TYPES.COURSE:
        return this.fromCourse(item);
      case PRODUCT_TYPES.LIVE_SECTION:
        return this.fromLiveSection(item);
      case PRODUCT_TYPES.DAILY_CLASS:
        return this.fromDailyClass(item);
      case PRODUCT_TYPES.FEE_COLLECTION:
        return this.fromFeeDemand(item);
      default:
        return this.fromCourse(item);
    }
  }
}
