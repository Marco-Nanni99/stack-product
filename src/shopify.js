/* ─────────────────────────────────────────────
   SHOPIFY STOREFRONT — CART + CHECKOUT
   Config: fill in the three values below
──────────────────────────────────────────────── */

const SHOPIFY_DOMAIN   = 'salty-gecko-2.myshopify.com';
const STOREFRONT_TOKEN = '1d234d3d010616b094a6da0a625d4181';
const PRODUCT_HANDLE   = 'tshort';

const API_URL      = `https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`;
const CART_ID_KEY  = 'stack_cart_id';

/* ── GQL fetch helper ─────────────────────── */
async function gql(query, variables = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Storefront API ${res.status}`);
  return res.json();
}

/* ── Cart fragment ────────────────────────── */
const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  lines(first: 50) {
    edges {
      node {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            price { amount currencyCode }
            product { title featuredImage { url altText } }
          }
        }
      }
    }
  }
  cost {
    subtotalAmount { amount currencyCode }
  }
`;

/* ── Cart API ─────────────────────────────── */
async function cartCreate(variantId, quantity = 1) {
  const { data, errors } = await gql(`
    mutation CartCreate($lines: [CartLineInput!]) {
      cartCreate(input: { lines: $lines }) {
        cart { ${CART_FIELDS} }
        userErrors { field message }
      }
    }
  `, { lines: [{ merchandiseId: variantId, quantity }] });
  if (errors?.length) throw new Error(errors[0].message);
  const errs = data?.cartCreate?.userErrors;
  if (errs?.length) throw new Error(errs[0].message);
  return data.cartCreate.cart;
}

async function cartLinesAdd(cartId, variantId, quantity = 1) {
  const { data, errors } = await gql(`
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ${CART_FIELDS} }
        userErrors { field message }
      }
    }
  `, { cartId, lines: [{ merchandiseId: variantId, quantity }] });
  if (errors?.length) throw new Error(errors[0].message);
  const errs = data?.cartLinesAdd?.userErrors;
  if (errs?.length) throw new Error(errs[0].message);
  return data.cartLinesAdd.cart;
}

async function fetchCart(cartId) {
  const { data } = await gql(`
    query GetCart($id: ID!) {
      cart(id: $id) { ${CART_FIELDS} }
    }
  `, { id: cartId });
  return data?.cart ?? null;
}

/* ── Product ──────────────────────────────── */
async function getFirstAvailableVariant(handle) {
  const { data } = await gql(`
    query GetProduct($handle: String!) {
      product(handle: $handle) {
        availableForSale
        variants(first: 20) {
          edges {
            node {
              id
              availableForSale
              price { amount currencyCode }
            }
          }
        }
      }
    }
  `, { handle });
  const product = data?.product;
  if (!product?.availableForSale) return null;
  const variants = product.variants.edges.map(e => e.node);
  return variants.find(v => v.availableForSale) ?? null;
}

/* ── Utilities ────────────────────────────── */
function formatMoney({ amount, currencyCode }) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode })
    .format(parseFloat(amount));
}

/* ── Cart drawer ──────────────────────────── */
function injectCartDrawer() {
  const html = `
    <div id="cart-overlay" class="cart-overlay"></div>
    <aside id="cart-drawer" class="cart-drawer" aria-hidden="true">
      <div class="cart-drawer-head">
        <span class="section-eyebrow" style="margin:0">Your cart</span>
        <button id="cart-close" class="cart-close" aria-label="Close cart">✕</button>
      </div>
      <div id="cart-drawer-body" class="cart-drawer-body">
        <p class="cart-empty">Your cart is empty.</p>
      </div>
      <div class="cart-drawer-foot">
        <div class="cart-subtotal-row">
          <span>Subtotal</span>
          <strong id="cart-subtotal-amount">—</strong>
        </div>
        <a id="cart-checkout-btn" href="#" class="btn cart-checkout-btn">Checkout</a>
      </div>
    </aside>`;
  document.body.insertAdjacentHTML('beforeend', html);

  document.getElementById('cart-overlay').addEventListener('click', closeCartDrawer);
  document.getElementById('cart-close').addEventListener('click', closeCartDrawer);
}

function openCartDrawer() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
  // builder page has overflow:hidden on body — temporarily allow it
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function renderCartDrawer(cart) {
  const body       = document.getElementById('cart-drawer-body');
  const subtotal   = document.getElementById('cart-subtotal-amount');
  const checkoutBtn = document.getElementById('cart-checkout-btn');

  if (!cart || cart.totalQuantity === 0) {
    body.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    subtotal.textContent = '—';
    checkoutBtn.href = '#';
    return;
  }

  checkoutBtn.href = cart.checkoutUrl;

  subtotal.textContent = formatMoney(cart.cost.subtotalAmount);

  const items = cart.lines.edges.map(({ node }) => {
    const m     = node.merchandise;
    const img   = m.product.featuredImage;
    const price = formatMoney(m.price);
    const variantLabel = m.title !== 'Default Title' ? `<div class="cart-item-variant">${m.title}</div>` : '';
    const imgTag = img
      ? `<img src="${img.url}" alt="${img.altText ?? ''}" class="cart-item-img">`
      : `<div class="cart-item-img cart-item-img--placeholder"></div>`;

    return `
      <div class="cart-item">
        ${imgTag}
        <div class="cart-item-info">
          <div class="cart-item-name">${m.product.title}</div>
          ${variantLabel}
          <div class="cart-item-price">${price} × ${node.quantity}</div>
        </div>
      </div>`;
  });

  body.innerHTML = items.join('');
}

/* ── Add to cart flow ─────────────────────── */
async function addToCart(variantId, btn) {
  const original = btn.textContent;
  btn.textContent = 'Adding…';
  btn.disabled = true;

  try {
    let cart;
    const storedId = localStorage.getItem(CART_ID_KEY);

    if (storedId) {
      // Try to add to existing cart; if it's expired create a new one
      try {
        cart = await cartLinesAdd(storedId, variantId);
      } catch {
        cart = await cartCreate(variantId);
        localStorage.setItem(CART_ID_KEY, cart.id);
      }
    } else {
      cart = await cartCreate(variantId);
      localStorage.setItem(CART_ID_KEY, cart.id);
    }

    renderCartDrawer(cart);
    openCartDrawer();
    btn.textContent = 'Added ✓';
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 2000);
  } catch (err) {
    console.error('[Shopify] addToCart error:', err);
    btn.textContent = 'Error — try again';
    btn.disabled = false;
  }
}

/* ── Init buttons ─────────────────────────── */
async function initButtons() {
  const addBtn  = document.getElementById('add-to-cart-btn');
  if (!addBtn) return;

  if (SHOPIFY_DOMAIN.startsWith('YOUR_')) {
    addBtn.textContent = 'Coming soon';
    return;
  }

  try {
    const variant = await getFirstAvailableVariant(PRODUCT_HANDLE);

    if (!variant) {
      addBtn.textContent = 'Sold out';
      addBtn.disabled = true;
      return;
    }

    const price = formatMoney(variant.price);
    addBtn.textContent = `Add to cart — ${price}`;
    addBtn.disabled = false;

    addBtn.addEventListener('click', () => addToCart(variant.id, addBtn));
  } catch (err) {
    console.error('[Shopify] initButtons error:', err);
  }
}

/* ── Boot ─────────────────────────────────── */
injectCartDrawer();
initButtons();
