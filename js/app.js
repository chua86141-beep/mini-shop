/* ===== 简购商城 交互逻辑 ===== */
(function () {
  'use strict';

  // ---------- 状态 ----------
  const STORAGE_KEY = 'jiango_cart_v1';
  const state = {
    cart: loadCart(),
    category: '全部',
    sort: 'default',
    search: '',
    modalId: null,
    modalQty: 1,
  };

  // ---------- 工具 ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function money(n) { return '¥' + Number(n).toLocaleString('zh-CN'); }

  function stars(rating) {
    const full = Math.floor(rating);
    return '★★★★★'.slice(0, full) + '☆'.repeat(5 - full);
  }

  function findProduct(id) { return PRODUCTS.find((p) => p.id === id); }

  function discount(p) {
    return p.oldPrice && p.oldPrice > p.price
      ? Math.round((1 - p.price / p.oldPrice) * 100)
      : 0;
  }

  // ---------- 购物车持久化 ----------
  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
  }
  function cartCount() {
    return Object.values(state.cart).reduce((a, b) => a + b, 0);
  }
  function cartTotal() {
    return Object.entries(state.cart).reduce((sum, [id, qty]) => {
      const p = findProduct(id);
      return p ? sum + p.price * qty : sum;
    }, 0);
  }

  // ---------- 渲染：分类 ----------
  function renderFilters() {
    const wrap = $('#filters');
    wrap.innerHTML = CATEGORIES.map((cat) => {
      const active = cat === state.category ? ' active' : '';
      return `<button class="filter-chip${active}" data-action="filter" data-cat="${cat}">${cat}</button>`;
    }).join('');
  }

  // ---------- 渲染：商品 ----------
  function getVisibleProducts() {
    let list = PRODUCTS.slice();
    if (state.category !== '全部') {
      list = list.filter((p) => p.category === state.category);
    }
    if (state.search.trim()) {
      const kw = state.search.trim().toLowerCase();
      list = list.filter((p) =>
        (p.name + p.category + p.desc).toLowerCase().includes(kw)
      );
    }
    const sorters = {
      default: (a, b) => b.sales - a.sales,
      sales: (a, b) => b.sales - a.sales,
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
    };
    list.sort(sorters[state.sort] || sorters.default);
    return list;
  }

  function productCard(p) {
    const off = discount(p);
    return `
      <article class="card">
        <div class="card-media" data-action="view" data-id="${p.id}">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          ${off ? `<span class="card-badge">-${off}%</span>` : ''}
        </div>
        <div class="card-body">
          <span class="card-cat">${p.category}</span>
          <h3 class="card-name" data-action="view" data-id="${p.id}">${p.name}</h3>
          <div class="card-rating">
            <span class="stars">${stars(p.rating)}</span>
            <span>${p.rating}</span>
            <span>·</span>
            <span>已售 ${p.sales}</span>
          </div>
          <div class="card-foot">
            <div class="price">
              <span class="price-now">${p.price}</span>
              ${p.oldPrice && p.oldPrice > p.price ? `<span class="price-old">¥${p.oldPrice}</span>` : ''}
            </div>
            <button class="add-btn" data-action="add" data-id="${p.id}">🛒 加入</button>
          </div>
        </div>
      </article>`;
  }

  function renderProducts() {
    const list = getVisibleProducts();
    $('#productGrid').innerHTML = list.map(productCard).join('');
    $('#productTotal').textContent = list.length;
    $('#emptyState').classList.toggle('hidden', list.length > 0);
  }

  // ---------- 渲染：购物车 ----------
  function renderCart() {
    const body = $('#cartItems');
    const entries = Object.entries(state.cart);

    $('#cartCount').textContent = cartCount();
    $('#cartTitleCount').textContent = cartCount() ? `（${cartCount()} 件）` : '';
    $('#cartSubtotal').textContent = money(cartTotal());

    if (entries.length === 0) {
      body.innerHTML = `<div class="cart-empty"><span class="empty-emoji">🛒</span><p>购物车还是空的</p><p class="muted">快去挑选心仪的商品吧～</p></div>`;
      $('#checkoutBtn').disabled = true;
      $('#clearCartBtn').disabled = true;
      return;
    }

    $('#checkoutBtn').disabled = false;
    $('#clearCartBtn').disabled = false;

    body.innerHTML = entries.map(([id, qty]) => {
      const p = findProduct(id);
      if (!p) return '';
      return `
        <div class="cart-item">
          <div class="cart-item-img" data-action="view" data-id="${p.id}">
            <img src="${p.image}" alt="${p.name}">
          </div>
          <div class="cart-item-info">
            <div class="cart-item-name" data-action="view" data-id="${p.id}">${p.name}</div>
            <div class="cart-item-price">${money(p.price)}</div>
            <div class="cart-item-foot">
              <div class="qty">
                <button data-action="cart-qty" data-id="${p.id}" data-delta="-1" aria-label="减少">−</button>
                <span>${qty}</span>
                <button data-action="cart-qty" data-id="${p.id}" data-delta="1" aria-label="增加">+</button>
              </div>
              <button class="icon-btn" data-action="remove" data-id="${p.id}" aria-label="删除" title="删除">🗑</button>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  // ---------- 商品详情弹窗 ----------
  function openProductModal(id) {
    const p = findProduct(id);
    if (!p) return;
    state.modalId = id;
    state.modalQty = 1;
    $('#productModalContent').innerHTML = `
      <div class="pd-grid">
        <div class="pd-media"><img src="${p.image}" alt="${p.name}"></div>
        <div class="pd-info">
          <span class="pd-cat">${p.category}</span>
          <h3 class="pd-name">${p.name}</h3>
          <div class="pd-rating">
            <span class="stars">${stars(p.rating)}</span>
            <span>${p.rating} 分</span>
            <span>·</span>
            <span>${p.reviews} 条评价</span>
            <span>·</span>
            <span>已售 ${p.sales}</span>
          </div>
          <div class="pd-price">
            <span class="price-now">${p.price}</span>
            ${p.oldPrice && p.oldPrice > p.price ? `<span class="price-old">¥${p.oldPrice}</span>` : ''}
          </div>
          <p class="pd-desc">${p.desc}</p>
          <div class="pd-meta">
            <span>📦 库存 ${p.stock} 件</span>
            <span>🚚 满 199 包邮</span>
            <span>↩️ 7 天无理由退换</span>
          </div>
          <div class="pd-actions">
            <div class="qty">
              <button data-action="pd-qty" data-delta="-1" aria-label="减少">−</button>
              <span id="pdQty">${state.modalQty}</span>
              <button data-action="pd-qty" data-delta="1" aria-label="增加">+</button>
            </div>
            <button class="btn btn-primary" data-action="add" data-id="${p.id}" data-qty="modal">加入购物车</button>
          </div>
        </div>
      </div>`;
    $('#productModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function updatePdQty() {
    const el = $('#pdQty');
    if (el) el.textContent = state.modalQty;
  }

  // ---------- 结算 ----------
  function openCheckout() {
    if (cartCount() === 0) return;
    const entries = Object.entries(state.cart);
    $('#checkoutSummary').innerHTML = entries.map(([id, qty]) => {
      const p = findProduct(id);
      return `<div class="checkout-summary-item">
        <span class="name">${p.name} × ${qty}</span>
        <span>${money(p.price * qty)}</span>
      </div>`;
    }).join('');
    $('#checkoutTotal').textContent = money(cartTotal());
    $('#checkoutModal').classList.remove('hidden');
    closeCart();
  }

  // ---------- 弹窗/抽屉开关 ----------
  function openCart() {
    renderCart();
    $('#cartDrawer').classList.remove('hidden');
    $('#cartOverlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    $('#cartDrawer').classList.add('hidden');
    $('#cartOverlay').classList.add('hidden');
    document.body.style.overflow = '';
  }
  function closeModal(id) {
    $('#' + id).classList.add('hidden');
    if (!$('.modal:not(.hidden)')) document.body.style.overflow = '';
  }

  // ---------- Toast ----------
  let toastTimer = null;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2000);
  }

  // ---------- 操作 ----------
  function addToCart(id, qty) {
    const p = findProduct(id);
    if (!p) return;
    const n = qty || 1;
    state.cart[id] = Math.min((state.cart[id] || 0) + n, p.stock);
    saveCart();
    renderCart();
    // 反馈：按钮短暂变色
    const btn = document.querySelector(`.add-btn[data-id="${id}"]`);
    if (btn) {
      btn.textContent = '✓ 已加入';
      btn.classList.add('added');
      setTimeout(() => { btn.textContent = '🛒 加入'; btn.classList.remove('added'); }, 1200);
    }
    toast(`已加入购物车：${p.name}`);
  }

  function changeCartQty(id, delta) {
    const p = findProduct(id);
    if (!p) return;
    const cur = state.cart[id] || 0;
    const next = cur + delta;
    if (next <= 0) {
      delete state.cart[id];
    } else {
      state.cart[id] = Math.min(next, p.stock);
    }
    saveCart();
    renderCart();
  }

  function removeFromCart(id) {
    delete state.cart[id];
    saveCart();
    renderCart();
  }

  function clearCart() {
    state.cart = {};
    saveCart();
    renderCart();
    toast('购物车已清空');
  }

  // ---------- 事件委托 ----------
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.getAttribute('data-action');

    if (action === 'add') {
      const qty = el.getAttribute('data-qty') === 'modal' ? state.modalQty : 1;
      addToCart(el.getAttribute('data-id'), qty);
      if (el.getAttribute('data-qty') === 'modal') closeModal('productModal');
    } else if (action === 'view') {
      openProductModal(el.getAttribute('data-id'));
    } else if (action === 'filter') {
      state.category = el.getAttribute('data-cat');
      renderFilters();
      renderProducts();
    } else if (action === 'cart-qty') {
      changeCartQty(el.getAttribute('data-id'), parseInt(el.getAttribute('data-delta'), 10));
    } else if (action === 'remove') {
      removeFromCart(el.getAttribute('data-id'));
    } else if (action === 'pd-qty') {
      state.modalQty = Math.max(1, state.modalQty + parseInt(el.getAttribute('data-delta'), 10));
      updatePdQty();
    }
  });

  // 关闭类元素
  document.addEventListener('click', function (e) {
    const closer = e.target.closest('[data-close]');
    if (!closer) return;
    const target = closer.getAttribute('data-close');
    if (target === 'cart') closeCart();
    else closeModal(target);
  });

  // ---------- 表单与控件 ----------
  $('#sortSelect').addEventListener('change', function () {
    state.sort = this.value;
    renderProducts();
  });

  $('#searchInput').addEventListener('input', function () {
    state.search = this.value;
    renderProducts();
  });
  $('#searchInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    }
  });
  $('#searchBtn').addEventListener('click', function () {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  });

  $('#cartBtn').addEventListener('click', openCart);
  $('#checkoutBtn').addEventListener('click', openCheckout);
  $('#clearCartBtn').addEventListener('click', clearCart);

  $$('[data-scroll]').forEach((b) =>
    b.addEventListener('click', () =>
      document.getElementById(b.getAttribute('data-scroll')).scrollIntoView({ behavior: 'smooth' })
    )
  );

  // 帮助/关于 占位
  ['helpLink', 'aboutLink'].forEach((id) => {
    const a = document.getElementById(id);
    if (a) a.addEventListener('click', (e) => { e.preventDefault(); toast('演示项目，敬请期待'); });
  });

  $('#checkoutForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = $('#fName').value.trim();
    const phone = $('#fPhone').value.trim();
    const address = $('#fAddress').value.trim();
    if (!name || !phone || !address) {
      toast('请完整填写收货信息');
      return;
    }
    if (!/^1\d{10}$/.test(phone)) {
      toast('请输入正确的 11 位手机号');
      return;
    }
    const orderId = 'JG' + Date.now().toString().slice(-8);
    $('#successOrderId').textContent = '订单号：' + orderId;
    closeModal('checkoutModal');
    state.cart = {};
    saveCart();
    renderCart();
    $('#checkoutForm').reset();
    $('#successModal').classList.remove('hidden');
  });

  // ESC 关闭
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeCart();
      $$('.modal:not(.hidden)').forEach((m) => m.classList.add('hidden'));
      document.body.style.overflow = '';
    }
  });

  // ---------- 初始化 ----------
  renderFilters();
  renderProducts();
  renderCart();
})();