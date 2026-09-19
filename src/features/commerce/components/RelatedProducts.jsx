"use client";

import React, { useState } from "react";
import Image from "next/image";
import ProductDetailPopup from "@/components/popup/ProductDetailPopup";
import { isRelatedProductInCart } from "../utils/relatedProducts";

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

  const toggleCart = (product) => {
    if (!product) return;
    if (isAdded(product)) {
      onRemoveFromCart?.(product);
    } else {
      onAddToCart?.(product);
    }
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
          const added = isAdded(product);
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
                  {product.inStock === false && (
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
                >
                  {added ? "Remove from Cart" : "Add to Cart"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Shared product detail popup. Toggling uses the selected view model, so
          identity stays `type:id` even when a product and a combo share an id. */}
      {selected && (
        <ProductDetailPopup
          product={selected}
          onClose={() => setSelected(null)}
          onToggleCart={() => toggleCart(selected)}
          isAdded={isAdded(selected)}
        />
      )}
    </section>
  );
}
