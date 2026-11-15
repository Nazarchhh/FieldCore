/* ==========================================================
   product.js — сторінка одного товару (product.html?id=...)
   Підключається ПІСЛЯ ui.js, products.js і cart.js.
   ========================================================== */

const productRoot = document.querySelector("#product-root");

// Беремо id товару з адреси: product.html?id=backpack
const productId = new URLSearchParams(location.search).get("id") || "";
const currentProduct = findProduct(productId);

/* ---------- Товар не знайдено ---------- */

function renderNotFound() {
    document.title = "Товар не знайдено — FIELDCORE";

    productRoot.replaceChildren(
        el(
            "div",
            { class: "not-found" },
            el("h1", {}, "Товар не знайдено"),
            el("p", { class: "muted" }, "Можливо, посилання застаріло."),
            el("a", { class: "btn btn-primary", href: "index.html#catalog" }, "ДО КАТАЛОГУ")
        )
    );
}

/* ---------- Вибір розміру ---------- */

function createSizePicker(product) {
    const options = product.sizes.map((size) =>
        el(
            "label",
            { class: "size-option" },
            el("input", { type: "radio", name: "size", value: size }),
            el("span", {}, size)
        )
    );

    return el(
        "fieldset",
        { class: "size-picker", id: "options" },
        el("legend", {}, "Розмір"),
        el("div", { class: "size-options" }, ...options),
        el("p", { class: "field-error", id: "size-error", role: "alert" })
    );
}

/* ---------- Малювання сторінки ---------- */

function renderProduct(product) {
    // Назва вкладки та опис для пошуковиків
    document.title = `${product.name} — FIELDCORE`;
    const description = document.querySelector('meta[name="description"]');
    if (description) {
        description.setAttribute("content", `${product.name}: ${product.short} Тактичне спорядження FIELDCORE.`);
    }

    const hasSizes = product.sizes.length > 0;

    // Кнопка додавання
    const addButton = el(
        "button",
        { class: "btn btn-primary btn-large", type: "button", id: "add-button", disabled: !product.inStock },
        icon("cart"),
        product.inStock ? "ДО КОШИКА" : "НЕМАЄ В НАЯВНОСТІ"
    );

    const sizePicker = hasSizes ? createSizePicker(product) : null;

    addButton.addEventListener("click", () => {
        let size = "";

        if (hasSizes) {
            const selected = productRoot.querySelector('input[name="size"]:checked');
            const errorBox = productRoot.querySelector("#size-error");

            if (!selected) {
                errorBox.textContent = "Оберіть розмір, щоб додати товар у кошик.";
                productRoot.querySelector('input[name="size"]').focus();
                return;
            }
            errorBox.textContent = "";
            size = selected.value;
        }

        Cart.add(product.id, size);
    });

    // Прибираємо повідомлення про помилку, коли розмір обрано
    if (sizePicker) {
        sizePicker.addEventListener("change", () => {
            productRoot.querySelector("#size-error").textContent = "";
        });
    }

    // Характеристики (показуємо, тільки якщо вони заповнені в products.js)
    const specs =
        product.specs.length > 0
            ? el(
                  "dl",
                  { class: "specs" },
                  ...product.specs.flatMap(([label, value]) => [
                      el("dt", {}, label),
                      el("dd", {}, value)
                  ])
              )
            : null;

    const info = el(
        "div",
        { class: "product-info" },
        el("div", { class: "product-category" }, CATEGORIES[product.category]),
        el("h1", {}, product.name),
        el("p", { class: "product-sku" }, `Артикул: ${product.sku}`),
        el("p", { class: "product-price" }, priceText(product.price)),
        el(
            "p",
            { class: product.inStock ? "stock" : "stock is-out" },
            el("span", { class: "stock-dot", "aria-hidden": "true" }),
            product.inStock ? "В наявності" : "Немає в наявності"
        ),
        el("p", { class: "product-description" }, product.description),
        sizePicker,
        el(
            "div",
            { class: "product-actions" },
            addButton,
            el("a", { class: "btn btn-outline btn-large", href: "index.html#catalog" }, "ДО КАТАЛОГУ")
        ),
        specs
    );

    const gallery = el(
        "div",
        { class: "product-gallery" },
        el("img", {
            src: product.image,
            alt: product.imageAlt,
            class: product.fit === "contain" ? "is-contain" : false
        }),
        createBadge(product)
    );

    const breadcrumbs = el(
        "nav",
        { class: "breadcrumbs", "aria-label": "Шлях до товару" },
        el("a", { href: "index.html" }, "Головна"),
        el("span", { "aria-hidden": "true" }, "/"),
        el("a", { href: "index.html#catalog" }, "Каталог"),
        el("span", { "aria-hidden": "true" }, "/"),
        el("span", { "aria-current": "page" }, product.name)
    );

    // «Вам також може сподобатися»: інші товари
    const others = PRODUCTS.filter((item) => item.id !== product.id);
    const related =
        others.length > 0
            ? el(
                  "section",
                  { class: "related", "aria-labelledby": "related-title" },
                  el("h2", { id: "related-title" }, "ВАМ ТАКОЖ МОЖЕ СПОДОБАТИСЯ"),
                  el("div", { class: "products" }, ...others.map(createProductCard))
              )
            : null;

    productRoot.replaceChildren(
        breadcrumbs,
        el("div", { class: "product-layout" }, gallery, info),
        related
    );

    revealOnScroll(productRoot.querySelectorAll(".product-card"));
}

if (currentProduct) {
    renderProduct(currentProduct);
} else {
    renderNotFound();
}
