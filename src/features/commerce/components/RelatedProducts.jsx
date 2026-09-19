"use client";

import React, { useState } from "react";
import Image from "next/image";
import ProductDetailPopup from "@/components/popup/ProductDetailPopup";
import {
  isRelatedProductInCart,
  relatedProductCartAction,
} from "../utils/relatedProducts";

/**
 * Shared customer-facing related-products presentation.
 *
 * Renders the already-derived view models produced by
 * `computeRelatedProducts(serverProducts)` — it never fetches, never touches
 * E-commerce, never mutates Redux, and knows nothing about Course / Daily Class /
 * Live Section. Callers supply the content-specific heading and wire the cart
 * actions; everything else (card markup, combo badge, pricing, availability,
 * add/remove state, detail popup) is defined once here so every content type
 * behaves identically.
 *
 * Cart state is resolved through the shared `isRelatedProductInCart()` helper,
 * which matches on the exact `type:id` cart key — so a combo never reports as
 * "added" merely because a normal product shares its numeric id.
 *
 * @param {object}   props
 * @param {Array}    props.products        view models from computeRelatedProducts()
 * @param {string}   props.title           content-specific section heading
 * @param {Array}    props.cartItems       current unified cart items (read-only)
 * @param {Function} props.onAddToCart     called with the view model to add
 * @param {Function} props.onRemoveFromCart called with the view model to remove
 * @param {Array}    props.fallbackImages  local placeholders when a product has no media
 * @param {string}   [props.id]            optional anchor id for the section
 */
export default function RelatedProducts({
  products,
  title,
  cartItems = [],
  onAddToCart,
  onRemoveFromCart,
  fallbackImages = [],
  id,
}) {
  const [selected, setSelected] = useState(null);

  const list = Array.isArray(products) ? products : [];

  // Nothing usable to show (no associations, or every product was omitted because
  // E-commerce could not hydrate it): hide the section rather than render an empty
  // shell or leak an internal failure to the customer.
  if (list.length === 0) return null;

  const isAdded = (product) => isRelatedProductInCart(cartItems, product);

  /**
   * `add` | `remove` | `unavailable` — see relatedProductCartAction().
   *
   * Presentation guard only: the cart's server-side validation stays the final
   * authority on whether an out-of-stock line can actually be ordered. This just
   * stops the UI from offering an action that cannot succeed.
   */
  const actionFor = (product) => relatedProductCartAction(product, isAdded(product));

  const toggleCart = (product) => {
    if (!product) return;
    const action = actionFor(product);
    if (action === "remove") {
      onRemoveFromCart?.(product);
    } else if (action === "add") {
      onAddToCart?.(product);
    }
    // "unavailable" is a deliberate no-op — the popup and the card share it.
  };

  const imageFor = (product, index) => {
    if (product.imageUrl) return product.imageUrl;
    if (fallbackImages.length === 0) return null;
    return fallbackImages[index % fallbackImages.length];
  };

  return (
    <section className="card RelatedProducts" id={id}>
      <h2>{title}</h2>
      <div className="ProductList">
        {list.map((product, index) => {
          const action = actionFor(product);
          const added = action === "remove";
          const image = imageFor(product, index);

          return (
            <div className="ProductItem" key={product.key}>
              <div className="ProdLeft">
                <div className="ProdImage">
                  {image ? (
                    <Image
                      src={image}
                      alt={product.title}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  ) : null}
                </div>
                <div className="ProdInfo">
                  <h4>
                    {product.title}
                    {product.isCombo && <span className="TypeBadge">Combo</span>}
                  </h4>
                  <div className="PriceRow">
                    <span className="Curr">₹{product.price}</span>
                    {product.hasDiscount && (
                      <span className="Old">₹{product.oldPrice}</span>
                    )}
                  </div>
                  {action === "unavailable" && (
                    <span className="StockNote">Out of stock</span>
                  )}
                </div>
              </div>
              <div className="ActionArea">
                <button
                  type="button"
                  className="ViewDetailsBtn"
                  onClick={() => setSelected(product)}
                >
                  View Details
                </button>
                <button
                  type="button"
                  className={`AddToCartBtn ${added ? "added" : ""}`}
                  onClick={() => toggleCart(product)}
                  disabled={action === "unavailable"}
                  aria-disabled={action === "unavailable"}
                >
                  {action === "remove"
                    ? "Remove from Cart"
                    : action === "unavailable"
                      ? "Out of Stock"
                      : "Add to Cart"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Shared product detail popup. Toggling uses the selected view model, so
          identity stays `type:id` even when a product and a combo share an id. */}
      {/* The popup routes through the same guarded toggle and the same
          availability decision, so an out-of-stock product cannot be added from
          the detail view either — while an item already in the cart stays
          removable. */}
      {selected && (
        <ProductDetailPopup
          product={selected}
          onClose={() => setSelected(null)}
          onToggleCart={() => toggleCart(selected)}
          isAdded={isAdded(selected)}
          isAvailable={actionFor(selected) !== "unavailable"}
        />
      )}
    </section>
  );
}
