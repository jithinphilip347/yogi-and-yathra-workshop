/**
 * Client-side mirror of `App\Traits\HasRegistrationWindow`.
 *
 * One definition of "may this viewer register?" and, more importantly, of the rule
 * that keeps the two concerns apart:
 *
 *     REGISTRATION CLOSED  ≠  PURCHASED USER HIDDEN
 *
 * A registration window decides whether a NEW registration may start. Entitlement
 * is answered by enrollment/subscription state and outlives the window. Every
 * consumer (LiveSection rail, DailyClass detail, any future live content) should
 * compose the two through `registrationViewerState()` rather than writing its own
 * `registration_status === 'closed'` check — that shorthand is exactly how a
 * closed window ends up hiding content from someone who paid for it.
 *
 * The server stays authoritative: this only decides what to *show*. Purchase and
 * enrollment attempts are re-validated server-side (see
 * EnrollmentValidationService), so a manipulated browser clock cannot buy access
 * it does not have.
 */

/** Registration-window state, from the window alone. */
export const REGISTRATION_WINDOW_STATE = {
  NOT_OPEN: 'not_open',
  OPEN: 'open',
  CLOSED: 'closed',
};

/** Class lifecycle, kept separate from the registration window. */
export const CLASS_STATE = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  ENDED: 'ended',
};

/**
 * Normalize whatever the API reported into a known window state.
 *
 * The API may report the richer backend vocabulary (`unavailable`, `passed`,
 * `full`). Those describe availability rather than the window, so they fold into
 * the window answer that applies to them and the extra meaning is preserved on
 * the serialized `status` field returned by `registrationViewerState()`.
 *
 * @returns {'not_open'|'open'|'closed'}
 */
export function normalizeRegistrationWindowState(raw) {
  switch (String(raw ?? '').toLowerCase()) {
    case 'not_open':
    case 'notopen':
    case 'upcoming':
      return REGISTRATION_WINDOW_STATE.NOT_OPEN;
    case 'closed':
    case 'passed':
    case 'full':
    case 'unavailable':
    case 'ended':
    case 'sold_out':
    case 'soldout':
      return REGISTRATION_WINDOW_STATE.CLOSED;
    // 'open', 'available', '', null, and anything unrecognized: an absent window
    // means unrestricted, matching the backend trait where a null bound simply
    // removes that constraint.
    default:
      return REGISTRATION_WINDOW_STATE.OPEN;
  }
}

/**
 * Evaluate a content payload's own window bounds at `now`.
 *
 * Prefers the server's `registration_status` when present (it already accounts for
 * timezone and capacity), and only falls back to comparing the raw bounds.
 * Boundaries are INCLUSIVE at both ends, as on the server.
 *
 * @param {object} content  Content payload carrying the registration fields.
 * @param {Date}   [now]    Comparison instant (for tests).
 */
export function registrationWindowState(content, now = new Date()) {
  if (content?.registration_status) {
    return normalizeRegistrationWindowState(content.registration_status);
  }

  const openAt = content?.registration_open_at
    ? new Date(content.registration_open_at)
    : null;
  const closeAt = content?.registration_close_at
    ? new Date(content.registration_close_at)
    : null;

  const valid = (d) => d instanceof Date && !Number.isNaN(d.getTime());

  if (valid(openAt) && now.getTime() < openAt.getTime()) {
    return REGISTRATION_WINDOW_STATE.NOT_OPEN;
  }
  if (valid(closeAt) && now.getTime() > closeAt.getTime()) {
    return REGISTRATION_WINDOW_STATE.CLOSED;
  }
  return REGISTRATION_WINDOW_STATE.OPEN;
}

/**
 * Class lifecycle, evaluated independently of the registration window.
 *
 * `now >= class_end` is a different question from `now > registration_close_at`,
 * and must never be collapsed into it: an ended class and a closed registration
 * mean different things to a customer who already paid.
 */
export function classState(content, now = new Date()) {
  const endAt = content?.class_end_date_time ? new Date(content.class_end_date_time) : null;
  if (endAt && !Number.isNaN(endAt.getTime()) && now.getTime() >= endAt.getTime()) {
    return CLASS_STATE.ENDED;
  }
  return CLASS_STATE.ACTIVE;
}

/**
 * The composition every caller should use.
 *
 * @param {object}  content            Content payload (LiveSection / DailyClass).
 * @param {object}  options
 * @param {boolean} options.hasAccess  Viewer already holds an entitlement
 *                                     (active enrollment / subscription / purchased course).
 * @param {boolean} options.isEnded    Content has genuinely ended (see `classState`).
 * @param {boolean} options.isUnavailable  Force-unavailable (e.g. hidden record).
 * @param {Date}    [options.now]      Comparison instant (for tests).
 *
 * @returns {{
 *   state: string,               // window state alone
 *   classState: string,          // lifecycle alone
 *   canRegister: boolean,        // may a NEW registration start?
 *   accessPreserved: boolean,    // entitlement survives the window
 *   showClosedState: boolean,    // should the public closed/not-yet-open state render?
 *   showRegistrationCta: boolean,// should the purchase/register CTA render?
 * }}
 */
export function registrationViewerState(content, options = {}) {
  const {
    hasAccess = false,
    isEnded = false,
    isUnavailable = false,
    now = new Date(),
  } = options;

  const state = isUnavailable
    ? REGISTRATION_WINDOW_STATE.CLOSED
    : registrationWindowState(content, now);
  const lifecycle = isEnded ? CLASS_STATE.ENDED : classState(content, now);

  const canRegister = state === REGISTRATION_WINDOW_STATE.OPEN;

  // Entitlement is evaluated on its own. This line is the whole point of the
  // module: a closed window changes what the *public* sees, and nothing else.
  const accessPreserved = Boolean(hasAccess) && lifecycle !== CLASS_STATE.ENDED;

  return {
    state,
    classState: lifecycle,
    canRegister,
    accessPreserved,
    // Closed messaging is for viewers without an entitlement, and never for an
    // ended class (which has its own copy).
    showClosedState:
      state !== REGISTRATION_WINDOW_STATE.OPEN && !accessPreserved && !isEnded,
    // A new registration CTA is offered only while the window is open. An entitled
    // viewer gets their access action instead, from the caller's own branch.
    showRegistrationCta: canRegister && !isEnded,
  };
}

export default registrationViewerState;
