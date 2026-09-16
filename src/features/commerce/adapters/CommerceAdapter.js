/**
 * Commerce Product Adapters
 *
 * Normalizes heterogeneous backend entity models (Course, LiveSection, DailyClass, FeeCollection, Product, Combo)
 * into a single unified CommerceProduct model with deterministic cart_key and domain tagging.
 */

import { PRODUCT_TYPES } from '../constants';
import { resolveMediaUrl, resolveProductMediaUrl } from '@/utils/mediaUrl';

export class CommerceAdapter {
  /**
   * Normalize Course model into CommerceProduct
   */
  static fromCourse(course) {
    if (!course) return null;
    const priceVal = Number(course.effective_price ?? course.discount_price ?? course.price ?? 0);
    const origPriceVal = Number(course.price ?? course.original_price ?? priceVal);

    return {
      cart_key: `course:${course.id}`,
      id: `course_${course.id}`,
      productable_type: PRODUCT_TYPES.COURSE,
      productable_id: course.id,
      title: course.title || 'Untitled Course',
      subtitle: course.instructor?.name ? `Instructor: ${course.instructor.name}` : '',
      image: course.staticImage || (course.thumbnail ? resolveMediaUrl(course.thumbnail) : null),
      price: priceVal,
      original_price: origPriceVal,
      currency: 'INR',
      domain: 'workshop',
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
      cart_key: `live_section:${liveSection.id}`,
      id: `live_${liveSection.id}`,
      productable_type: PRODUCT_TYPES.LIVE_SECTION,
      productable_id: liveSection.id,
      title: liveSection.title || 'Live Workshop Section',
      subtitle: liveSection.instructor?.name ? `Instructor: ${liveSection.instructor.name}` : '',
      image: liveSection.thumbnail ? resolveMediaUrl(liveSection.thumbnail) : null,
      price: Number(liveSection.price || 0),
      original_price: Number(liveSection.original_price || liveSection.price || 0),
      currency: 'INR',
      domain: 'workshop',
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
      cart_key: `daily_class:${dailyClass.id}`,
      id: `daily_${dailyClass.id}`,
      productable_type: PRODUCT_TYPES.DAILY_CLASS,
      productable_id: dailyClass.id,
      title: dailyClass.title || 'Daily Live Yoga Class',
      subtitle: dailyClass.instructor_name ? `Instructor: ${dailyClass.instructor_name}` : '',
      image: dailyClass.thumbnail ? resolveMediaUrl(dailyClass.thumbnail) : null,
      price: Number(dailyClass.price || 0),
      original_price: Number(dailyClass.original_price || dailyClass.price || 0),
      currency: 'INR',
      domain: 'workshop',
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
      cart_key: `fee_collection:${feeDemand.id}`,
      id: `fee_${feeDemand.id}`,
      productable_type: PRODUCT_TYPES.FEE_COLLECTION,
      productable_id: feeDemand.id,
      title: `Academic Fee Demand #${feeDemand.invoice_number}`,
      subtitle: feeDemand.fee_collectable?.title || 'Academic Tuition',
      image: null,
      price: Number(feeDemand.balance_due || feeDemand.final_amount || 0),
      original_price: Number(feeDemand.final_amount || 0),
      currency: 'INR',
      domain: 'workshop',
      meta: {
        invoice_number: feeDemand.invoice_number,
        due_date: feeDemand.due_date,
      },
    };
  }

  /**
   * Normalize a gear/merchandise product (label + price + value) into CommerceProduct
   */
  static fromProduct(product) {
    if (!product) return null;

    if (product.is_combo || product.type === 'combo') {
      return this.fromCombo(product);
    }

    const rawImage =
      product.image && typeof product.image === 'object' && product.image !== null
        ? product.image.src || product.image.image || product.image.url
        : product.image || product.image_path;

    let image = null;
    if (typeof rawImage === 'string' && rawImage.length > 0) {
      image = resolveProductMediaUrl(rawImage);
    }

    const id = product.value ?? product.id;
    const price = Number(product.sale_price ?? product.price ?? 0);
    const originalPrice = Number(product.original_price ?? product.price ?? price);

    return {
      cart_key: `product:${id}`,
      id: `product_${id}`,
      productable_type: PRODUCT_TYPES.PRODUCT,
      productable_id: id,
      title: product.label || product.title || product.name || 'Yoga Product',
      subtitle: product.subtitle || '',
      image,
      price,
      original_price: originalPrice,
      currency: 'INR',
      domain: 'ecommerce',
      meta: {
        stock: product.stock,
        in_stock: product.in_stock,
      },
    };
  }

  /**
   * Normalize a Combo Bundle package into CommerceProduct
   */
  static fromCombo(combo) {
    if (!combo) return null;

    const rawImage =
      combo.image && typeof combo.image === 'object' && combo.image !== null
        ? combo.image.src || combo.image.image || combo.image.url
        : combo.image || combo.image_path;

    let image = null;
    if (typeof rawImage === 'string' && rawImage.length > 0) {
      image = resolveProductMediaUrl(rawImage);
    }

    const id = combo.id ?? combo.value;
    const price = Number(combo.combo_price ?? combo.sale_price ?? combo.price ?? 0);
    const originalPrice = Number(combo.original_price ?? combo.price ?? price);

    return {
      cart_key: `combo:${id}`,
      id: `combo_${id}`,
      productable_type: PRODUCT_TYPES.COMBO,
      productable_id: id,
      title: combo.title || combo.name || combo.label || 'Combo Offer',
      subtitle: combo.subtitle || 'Bundle Package',
      image,
      price,
      original_price: originalPrice,
      currency: 'INR',
      domain: 'ecommerce',
      meta: {
        is_combo: true,
        combo_items: combo.products || combo.comboItems || [],
      },
    };
  }

  /**
   * Normalize Membership model into CommerceProduct
   */
  static fromMembership(membership) {
    if (!membership) return null;
    return {
      cart_key: `membership:${membership.id}`,
      id: `membership_${membership.id}`,
      productable_type: PRODUCT_TYPES.MEMBERSHIP,
      productable_id: membership.id,
      title: membership.title || membership.name || 'Platform Membership Plan',
      subtitle: membership.description || 'Full Access Pass',
      image: membership.image ? resolveMediaUrl(membership.image) : null,
      price: Number(membership.price || 0),
      original_price: Number(membership.original_price || membership.price || 0),
      currency: 'INR',
      domain: 'workshop',
      meta: {
        billing_interval: membership.billing_interval || 'monthly',
      },
    };
  }

  /**
   * Normalize Workshop model into CommerceProduct
   */
  static fromWorkshop(workshop) {
    if (!workshop) return null;
    return {
      cart_key: `workshop:${workshop.id}`,
      id: `workshop_${workshop.id}`,
      productable_type: PRODUCT_TYPES.WORKSHOP,
      productable_id: workshop.id,
      title: workshop.title || 'Interactive Workshop',
      subtitle: workshop.instructor?.name ? `Instructor: ${workshop.instructor.name}` : '',
      image: workshop.image || (workshop.thumbnail ? resolveMediaUrl(workshop.thumbnail) : null),
      price: Number(workshop.price || 0),
      original_price: Number(workshop.original_price || workshop.price || 0),
      currency: 'INR',
      domain: 'workshop',
      meta: {
        schedule: workshop.schedule,
      },
    };
  }

  /**
   * Generic normalize fallback
   */
  static normalize(item, type = PRODUCT_TYPES.COURSE) {
    if (!item) return null;
    const cleanType = String(type).trim().toLowerCase();

    if (cleanType === 'combo' || cleanType === 'comboproduct' || item.is_combo) {
      return this.fromCombo(item);
    }
    if (cleanType === 'product') {
      return this.fromProduct(item);
    }
    if (cleanType === 'livesection' || cleanType === 'live_section') {
      return this.fromLiveSection(item);
    }
    if (cleanType === 'dailyclass' || cleanType === 'daily_class') {
      return this.fromDailyClass(item);
    }
    if (cleanType === 'feecollection' || cleanType === 'fee_collection') {
      return this.fromFeeDemand(item);
    }
    if (cleanType === 'membership') {
      return this.fromMembership(item);
    }
    if (cleanType === 'workshop') {
      return this.fromWorkshop(item);
    }

    return this.fromCourse(item);
  }
}
