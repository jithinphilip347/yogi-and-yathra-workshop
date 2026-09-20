import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * The Cart page's shell is styled in style.css (compiled) with style.scss as its
 * source, while the commerce-specific control surface (quantity control, badges,
 * domain tags, banners) lives in unifiedCart.scss.
 *
 * These are source assertions rather than DOM assertions because this suite runs
 * without jsdom. They pin the invariants that the previous revision violated:
 * an unstyled card shell, a Remove button styled only inside a container it never
 * renders in, and rules left behind for elements the markup does not contain.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (...segments) =>
  fs.readFileSync(path.resolve(__dirname, ...segments), "utf8");

const cartMarkup = read("../../app/cart/Cart.jsx");
const styleCss = read("../../assets/css/style.css");
const styleScss = read("../../assets/css/style.scss");
const unifiedCartScss = read("../../assets/css/unifiedCart.scss");

/** The `#Cart { ... }` block of a stylesheet, up to the next top-level rule. */
const cartBlock = (source, terminator) => {
  const start = source.indexOf("#Cart {");
  const end = source.indexOf(terminator, start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
};

const cssCart = cartBlock(styleCss, "#Wishlist {");
const scssCart = cartBlock(styleScss, "#Wishlist {");

describe("Cart page stylesheet contract", () => {
  it("renders each item as a self-contained card instead of stacked borders", () => {
    const itemRule = cssCart.slice(cssCart.indexOf("#Cart .CartItem {"));

    expect(itemRule).toMatch(/background:\s*#fff/);
    expect(itemRule).toMatch(/border:\s*1px solid #e8edf3/);
    expect(itemRule).toMatch(/border-radius:\s*12px/);
    expect(itemRule).toMatch(/padding:\s*18px/);

    // The old shell drew a top AND a bottom border on every row, doubling the
    // separator between neighbours.
    expect(cssCart).not.toMatch(/border-top:\s*1px solid #eee/);
    expect(cssCart).not.toMatch(/border-bottom:\s*1px solid #eee/);
  });

  it("styles the Remove button where it actually renders", () => {
    // Remove lives in .ItemActionRow (details column) for both domains; the old
    // rule scoped it to .CoursePriceBox, where nothing renders it.
    expect(cartMarkup).toContain('className="removeBtn"');
    expect(cartMarkup).toContain('className="ItemActionRow"');
    expect(cssCart).toMatch(/#Cart \.removeBtn \{/);
    expect(cssCart).not.toMatch(/#Cart \.CoursePriceBox \.removeBtn/);
    expect(cssCart).toMatch(/border-radius:\s*8px/);
  });

  it("keeps the order summary a fixed bar on mobile that still shows the amount", () => {
    const mobile = cssCart.slice(cssCart.indexOf("@media (max-width: 768px)"));

    // The bar is pinned, and the breakdown rows collapse away...
    expect(cssCart).toMatch(
      /@media \(max-width: 768px\) \{\s*#Cart \.CartRight \{[^}]*position:\s*fixed/
    );
    expect(cssCart).toMatch(
      /#Cart \.CartSummary \.PriceRow \{\s*display:\s*none/
    );
    expect(cssCart).toMatch(
      /#Cart \.CartSummary \.SummaryDomainRow \{\s*display:\s*none/
    );
    // ...but the payable subtotal must never be hidden, or the customer would
    // see a checkout button with no amount on it.
    expect(cssCart).not.toMatch(
      /#Cart \.CartSummary \.TotalPrice \{\s*display:\s*none/
    );
    expect(mobile).toMatch(/checkoutBtn \{[^}]*width:\s*auto/);

    // The fixed bar would cover the last item without this scroll room.
    expect(cssCart).toMatch(/@media \(max-width: 768px\) \{\s*#Cart \{[^}]*padding:\s*\d+px 0 \d+px/);
  });

  it("orders the mobile price row as original-then-current, right aligned", () => {
    expect(cssCart).toMatch(/flex-direction:\s*row-reverse/);
    expect(cssCart).toMatch(/justify-content:\s*flex-end/);
    expect(cssCart).toMatch(/border-top:\s*1px dashed #e8edf3/);
  });

  it("keeps the item card's hover shadow animated by the stylesheet that wins", () => {
    // unifiedCart.scss loads after style.css, so the transition must list
    // box-shadow there or the hover has no easing.
    expect(cssCart).toMatch(/#Cart \.CartItem:hover \{[^}]*box-shadow/);
    expect(unifiedCartScss).toMatch(/transition:[^;]*box-shadow/);
  });

  it("styles the empty cart as a card rather than a bare centred paragraph", () => {
    expect(cssCart).toMatch(/#Cart \.EmptyCart \{[^}]*border:\s*1px dashed/);
    expect(cssCart).toMatch(/#Cart \.EmptyCart \{[^}]*border-radius:\s*14px/);
    expect(cssCart).toMatch(/#Cart \.EmptyCart \.browseBtn \{/);
  });

  it("does not style elements the cart never renders", () => {
    // Guards both directions: these names appear in neither the markup nor the
    // stylesheet now, so adding one to either side alone fails here.
    const neverRendered = [
      "EmptyIcon",
      "SavingsChip",
      "UnitPrice",
      "MobileTotalDetails",
      "CourseRatingBox",
    ];
    for (const name of neverRendered) {
      expect(cssCart).not.toContain(name);
      expect(cartMarkup).not.toContain(name);
    }
  });

  it("keeps the compiled stylesheet and its scss source on the same selectors", () => {
    const selectors = cssCart.match(/^#Cart[^{]*\{/gm) || [];
    expect(selectors.length).toBeGreaterThan(40);

    const classes = new Set();
    for (const selector of selectors) {
      for (const [, name] of selector.matchAll(/\.([A-Za-z][\w-]*)/g)) {
        classes.add(name);
      }
    }

    // Every class the shipped CSS styles must exist in the source too, so the
    // next person editing one file cannot silently desync the other.
    const missing = [...classes].filter((name) => !scssCart.includes(`.${name}`));
    expect(missing).toEqual([]);
  });
});
