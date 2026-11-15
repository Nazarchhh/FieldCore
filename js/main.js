/* ==========================================================
   main.js — головна сторінка: каталог, фільтри, пошук, контакти
   Підключається ПІСЛЯ ui.js, products.js і cart.js.
   ========================================================== */

/* ---------- Каталог ---------- */

const catalogGrid = document.querySelector("#products");
const chipsBox = document.querySelector("#category-chips");
const searchInput = document.querySelector("#catalog-search");
const sortSelect = document.querySelector("#catalog-sort");
const resultsCount = document.querySelector("#results-count");
const catalogEmpty = document.querySelector("#catalog-empty");
const resetFiltersButton = document.querySelector("#reset-filters");

// Поточні налаштування фільтрів
const catalogState = {
    category: "all",
    query: "",
    sort: "default"
};

// Повертає список товарів із урахуванням категорії, пошуку та сортування
function getVisibleProducts() {
    const query = catalogState.query.trim().toLowerCase();

    const list = PRODUCTS.filter((product) => {
        const matchesCategory =
            catalogState.category === "all" ||
            product.category === catalogState.category;

        const searchableText = [
            product.name,
            product.short,
            product.sku,
            CATEGORIES[product.category]
        ].join(" ").toLowerCase();

        return matchesCategory && searchableText.includes(query);
    });

    if (catalogState.sort === "price-asc") {
        list.sort((a, b) => a.price - b.price);
    } else if (catalogState.sort === "price-desc") {
        list.sort((a, b) => b.price - a.price);
    } else if (catalogState.sort === "name") {
        list.sort((a, b) => a.name.localeCompare(b.name, "uk"));
    }

    return list;
}

function renderCatalog() {
    const list = getVisibleProducts();

    catalogGrid.replaceChildren(...list.map(createProductCard));
    revealOnScroll(catalogGrid.querySelectorAll(".product-card"));

    resultsCount.textContent = list.length > 0 ? `Знайдено товарів: ${list.length}` : "";
    catalogEmpty.hidden = list.length > 0;
}

// Кнопки-фільтри («Усе», «Рюкзаки», ...) створюємо з об'єкта CATEGORIES
function renderChips() {
    const categories = [["all", "Усе"], ...Object.entries(CATEGORIES)];

    chipsBox.replaceChildren(
        ...categories.map(([key, label]) =>
            el(
                "button",
                {
                    type: "button",
                    class: "chip",
                    "data-category": key,
                    "aria-pressed": key === catalogState.category ? "true" : "false"
                },
                label
            )
        )
    );
}

chipsBox.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-category]");
    if (!chip) {
        return;
    }
    catalogState.category = chip.dataset.category;
    renderChips();
    renderCatalog();

    // Список кнопок створено заново — повертаємо фокус на натиснуту
    chipsBox.querySelector(`[data-category="${catalogState.category}"]`).focus();
});

searchInput.addEventListener("input", () => {
    catalogState.query = searchInput.value;
    renderCatalog();
});

sortSelect.addEventListener("change", () => {
    catalogState.sort = sortSelect.value;
    renderCatalog();
});

resetFiltersButton.addEventListener("click", () => {
    catalogState.category = "all";
    catalogState.query = "";
    catalogState.sort = "default";
    searchInput.value = "";
    sortSelect.value = "default";
    renderChips();
    renderCatalog();
});

renderChips();
renderCatalog();

/* ---------- Пошук у шапці: переходимо до поля пошуку в каталозі ---------- */

function focusSearch() {
    // Невелика пауза, щоб плавна прокрутка встигла дійти до каталогу
    setTimeout(() => searchInput.focus({ preventScroll: true }), 400);
}

document.querySelectorAll("[data-focus-search]").forEach((link) => {
    link.addEventListener("click", focusSearch);
});

if (location.hash === "#catalog-search") {
    focusSearch();
}

/* ---------- Анімація появи блоків ---------- */

revealOnScroll(document.querySelectorAll(".reveal"));

/* ---------- Форма контактів ---------- */

const contactForm = document.querySelector("#contact-form");
const contactStatus = document.querySelector("#contact-status");

enableLiveValidation(contactForm);

contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    contactStatus.textContent = "";

    if (!validateForm(contactForm)) {
        return;
    }

    // Це імітація: повідомлення нікуди не надсилається
    resetForm(contactForm);
    contactStatus.textContent =
        "Дякуємо! Повідомлення прийнято. (Навчальний проєкт: дані нікуди не надсилаються.)";
});
