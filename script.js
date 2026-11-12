/* =========================================================
   KONFIGURASI - EDIT BAGIAN INI
   ========================================================= */
const CONFIG = {
  // Nomor WhatsApp kamu, format internasional TANPA tanda + atau 0 di depan
  // Contoh: 0881-0273-6253  ->  6288102736253
  waNumber: "62881027362553",
  storeName: "Penerbang Risol", // Nama toko / brand kamu
};

// Daftar produk. Tambah / ubah / hapus sesuai kebutuhan.
// "image" = path foto produk. Taruh foto di folder "img" (sejajar index.html).
// Kalau foto belum ada, otomatis tampil kotak "Foto belum tersedia".
const PRODUCTS = [
  { id: 1, name: "Risol Mayo",      category: "Risol",   price: 5000, image: "img/risol-mayo.jpg",       desc: "Risol renyah dengan isian mayo yang creamy." },
  { id: 2, name: "Risol Ayam Pedas", category: "Risol",   price: 6000, image: "img/risol-ayam-pedas.jpg", desc: "Risol isi ayam suwir berbumbu pedas yang nendang." },
  { id: 3, name: "Es Teh Manis",    category: "Minuman", price: 4000, image: "img/es-teh-manis.jpg",     desc: "Es teh manis segar, pas ditemani risol." },
];

// Menghasilkan <img> produk, dengan cadangan kalau file foto tidak ditemukan
function productImage(p) {
  if (!p.image) return '<span class="no-photo-text">Foto belum tersedia</span>';
  return `<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" loading="lazy"
    onerror="this.parentElement.classList.add('no-photo'); this.outerHTML='<span class=&quot;no-photo-text&quot;>Foto belum tersedia</span>'">`;
}

/* =========================================================
   STATE & UTIL
   ========================================================= */
const STORAGE_KEY = "risol_cart_v1";
let cart = loadCart();
let activeFilter = "Semua";

const $ = (sel) => document.querySelector(sel);

const rupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}
function saveCart() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) {}
}
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* =========================================================
   ELEMEN
   ========================================================= */
const grid = $("#product-grid");
const filtersEl = $("#filters");
const cartDrawer = $("#cart-drawer");
const overlay = $("#overlay");
const cartItemsEl = $("#cart-items");
const cartCountEl = $("#cart-count");
const cartTotalEl = $("#cart-total");
const checkoutModal = $("#checkout-modal");
const checkoutForm = $("#checkout-form");
const toastEl = $("#toast");

/* =========================================================
   KATALOG
   ========================================================= */
function renderFilters() {
  const cats = ["Semua", ...new Set(PRODUCTS.map((p) => p.category))];
  filtersEl.innerHTML = cats
    .map((c) => `<button class="filter-btn ${c === activeFilter ? "active" : ""}" data-cat="${escapeHTML(c)}">${escapeHTML(c)}</button>`)
    .join("");
}

function renderProducts() {
  const list = activeFilter === "Semua" ? PRODUCTS : PRODUCTS.filter((p) => p.category === activeFilter);
  grid.innerHTML = list
    .map((p) => {
      const visual = productImage(p);
      return `
        <article class="product-card">
          <div class="product-img">${visual}</div>
          <div class="product-body">
            <span class="product-tag">${escapeHTML(p.category)}</span>
            <h3>${escapeHTML(p.name)}</h3>
            <p class="product-desc">${escapeHTML(p.desc)}</p>
            <div class="product-bottom">
              <span class="product-price">${rupiah(p.price)}</span>
              <button class="add-btn" data-add="${p.id}">+ Keranjang</button>
            </div>
          </div>
        </article>`;
    })
    .join("");
}

filtersEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  activeFilter = btn.dataset.cat;
  renderFilters();
  renderProducts();
});

grid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (!btn) return;
  addToCart(Number(btn.dataset.add));
});

/* =========================================================
   KERANJANG
   ========================================================= */
function addToCart(id) {
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) return;
  const item = cart.find((i) => i.id === id);
  if (item) item.qty += 1;
  else cart.push({ id, qty: 1 });
  saveCart();
  renderCart();
  showToast(`${product.name} ditambahkan ✔`);
}

function changeQty(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((i) => i.id !== id);
  saveCart();
  renderCart();
}

function removeItem(id) {
  cart = cart.filter((i) => i.id !== id);
  saveCart();
  renderCart();
}

function getCartDetails() {
  return cart
    .map((i) => {
      const p = PRODUCTS.find((x) => x.id === i.id);
      return p ? { ...p, qty: i.qty, subtotal: p.price * i.qty } : null;
    })
    .filter(Boolean);
}

function getTotal() {
  return getCartDetails().reduce((sum, i) => sum + i.subtotal, 0);
}

function renderCart() {
  const items = getCartDetails();
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  cartCountEl.textContent = totalQty;
  cartTotalEl.textContent = rupiah(getTotal());

  if (items.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="empty-cart">
        <span class="big">🛒</span>
        Keranjang masih kosong.<br>Yuk pilih risol favoritmu!
      </div>`;
    return;
  }

  cartItemsEl.innerHTML = items
    .map(
      (i) => `
      <div class="cart-item">
        <div class="cart-item-icon">${productImage(i)}</div>
        <div class="cart-item-info">
          <h4>${escapeHTML(i.name)}</h4>
          <p>${rupiah(i.price)} x ${i.qty} = <strong>${rupiah(i.subtotal)}</strong></p>
          <div class="qty">
            <button data-dec="${i.id}" aria-label="Kurangi">-</button>
            <span>${i.qty}</span>
            <button data-inc="${i.id}" aria-label="Tambah">+</button>
          </div>
        </div>
        <button class="remove-btn" data-remove="${i.id}" aria-label="Hapus">🗑</button>
      </div>`
    )
    .join("");
}

cartItemsEl.addEventListener("click", (e) => {
  const inc = e.target.closest("[data-inc]");
  const dec = e.target.closest("[data-dec]");
  const rem = e.target.closest("[data-remove]");
  if (inc) changeQty(Number(inc.dataset.inc), 1);
  else if (dec) changeQty(Number(dec.dataset.dec), -1);
  else if (rem) removeItem(Number(rem.dataset.remove));
});

$("#clear-cart").addEventListener("click", () => {
  if (cart.length === 0) return;
  if (confirm("Kosongkan semua isi keranjang?")) {
    cart = [];
    saveCart();
    renderCart();
  }
});

/* ---- buka / tutup drawer ---- */
function openCart() {
  cartDrawer.classList.add("open");
  overlay.classList.add("show");
  document.body.classList.add("no-scroll");
}
function closeCart() {
  cartDrawer.classList.remove("open");
  if (!checkoutModal.classList.contains("show")) {
    overlay.classList.remove("show");
    document.body.classList.remove("no-scroll");
  }
}
$("#open-cart").addEventListener("click", openCart);
$("#close-cart").addEventListener("click", closeCart);
overlay.addEventListener("click", () => {
  closeCart();
  closeCheckout();
});

/* =========================================================
   CHECKOUT -> WHATSAPP
   ========================================================= */
function openCheckout() {
  if (cart.length === 0) {
    showToast("Keranjang masih kosong");
    return;
  }
  renderSummary();
  $("#form-error").hidden = true;
  closeCart();
  checkoutModal.classList.add("show");
  overlay.classList.remove("show");
  document.body.classList.add("no-scroll");
}
function closeCheckout() {
  checkoutModal.classList.remove("show");
  if (!cartDrawer.classList.contains("open")) {
    document.body.classList.remove("no-scroll");
  }
}

function renderSummary() {
  const items = getCartDetails();
  $("#checkout-summary").innerHTML =
    items
      .map((i) => `<div class="line"><span>${escapeHTML(i.name)} x${i.qty}</span><span>${rupiah(i.subtotal)}</span></div>`)
      .join("") +
    `<div class="line total"><span>Total</span><span>${rupiah(getTotal())}</span></div>`;
}

$("#checkout-btn").addEventListener("click", openCheckout);
$("#close-checkout").addEventListener("click", closeCheckout);
checkoutModal.addEventListener("click", (e) => {
  if (e.target === checkoutModal) closeCheckout();
});

// tampilkan / sembunyikan alamat sesuai metode
$("#metode").addEventListener("change", (e) => {
  $("#alamat-wrap").style.display = e.target.value === "Diantar" ? "block" : "none";
});

// keterangan singkat sesuai metode pembayaran
const BAYAR_INFO = {
  Cash: "Bayar tunai saat pesanan diterima atau diambil.",
  QRIS: "Admin akan mengirim kode QRIS lewat WhatsApp setelah pesananmu masuk.",
};
function updatePaymentInfo() {
  $("#bayar-info").textContent = BAYAR_INFO[$("#pembayaran").value] || "";
}
$("#pembayaran").addEventListener("change", updatePaymentInfo);
updatePaymentInfo();

function buildWhatsAppMessage(data) {
  const items = getCartDetails();
  const lines = [];
  lines.push(`*PESANAN BARU - ${CONFIG.storeName}*`);
  lines.push("");
  lines.push("*Data Pemesan*");
  lines.push(`Nama: ${data.nama}`);
  lines.push(`No. WA: ${data.telp}`);
  lines.push(`Metode: ${data.metode}`);
  if (data.metode === "Diantar") lines.push(`Alamat: ${data.alamat}`);
  lines.push(`Pembayaran: ${data.pembayaran}`);
  lines.push("");
  lines.push("*Daftar Pesanan*");
  items.forEach((i, idx) => {
    lines.push(`${idx + 1}. ${i.name} x${i.qty} = ${rupiah(i.subtotal)}`);
  });
  lines.push("");
  lines.push(`*Total: ${rupiah(getTotal())}*`);
  if (data.catatan) {
    lines.push("");
    lines.push(`Catatan: ${data.catatan}`);
  }
  lines.push("");
  lines.push("Terima kasih, mohon konfirmasi pesanan ini ya 🙏");
  return lines.join("\n");
}

checkoutForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const errorEl = $("#form-error");
  const data = {
    nama: $("#nama").value.trim(),
    telp: $("#telp").value.trim(),
    metode: $("#metode").value,
    pembayaran: $("#pembayaran").value,
    alamat: $("#alamat").value.trim(),
    catatan: $("#catatan").value.trim(),
  };

  // validasi
  let msg = "";
  if (cart.length === 0) msg = "Keranjang masih kosong.";
  else if (data.nama.length < 2) msg = "Nama wajib diisi.";
  else if (!/^[0-9+\-\s]{9,16}$/.test(data.telp)) msg = "Nomor WhatsApp tidak valid.";
  else if (data.metode === "Diantar" && data.alamat.length < 8) msg = "Alamat lengkap wajib diisi untuk pengantaran.";

  if (msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    return;
  }
  errorEl.hidden = true;

  const text = buildWhatsAppMessage(data);
  const url = `https://wa.me/${CONFIG.waNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener");

  // reset setelah pesanan dikirim
  cart = [];
  saveCart();
  renderCart();
  checkoutForm.reset();
  updatePaymentInfo();
  $("#alamat-wrap").style.display = "block";
  closeCheckout();
  overlay.classList.remove("show");
  document.body.classList.remove("no-scroll");
  showToast("Pesanan dikirim ke WhatsApp ✔");
});

/* =========================================================
   NAVBAR MOBILE, KONTAK, TOAST
   ========================================================= */
$("#hamburger").addEventListener("click", () => $("#nav-menu").classList.toggle("open"));
document.querySelectorAll("#nav-menu a").forEach((a) =>
  a.addEventListener("click", () => $("#nav-menu").classList.remove("open"))
);

function setupContact() {
  const link = $("#contact-wa-link");
  const text = encodeURIComponent(`Halo ${CONFIG.storeName}, saya mau tanya-tanya dulu ya.`);
  link.href = `https://wa.me/${CONFIG.waNumber}?text=${text}`;
  // tampilkan nomor dalam format lokal (0812...)
  const local = "0" + CONFIG.waNumber.replace(/^62/, "");
  $("#contact-wa").textContent = local;
}

let toastTimer;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2000);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeCart();
    closeCheckout();
    overlay.classList.remove("show");
  }
});

/* =========================================================
   INIT
   ========================================================= */
$("#year").textContent = new Date().getFullYear();
renderFilters();
renderProducts();
renderCart();
setupContact();