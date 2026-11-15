/* ==========================================================
   cart.js — кошик: дані, збереження, бокова панель, оформлення
   Підключається на кожній сторінці ПІСЛЯ ui.js і products.js.

   У кошику зберігаємо лише {id, size, qty}: який товар, розмір і
   скільки штук. Назву і ціну завжди беремо з PRODUCTS, тому підмінити
   ціну через localStorage не вийде.
   ========================================================== */

const Cart = (() => {
    const STORAGE_KEY = "fieldcore-cart";
    const MAX_QTY = 99;

    /* ---------- 1. Дані кошика ---------- */

    // Читаємо кошик із localStorage. Якщо щось не так — порожній кошик.
    function load() {
        let raw;
        try {
            raw = localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            return [];
        }
        if (raw === null) {
            return [];
        }

        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? normalize(parsed) : [];
        } catch (error) {
            return [];
        }
    }

    // Перевіряє записи й приводить їх до єдиного формату.
    // Підтримує і СТАРИЙ формат кошика ({name, price}), щоб ніхто не втратив товари.
    function normalize(list) {
        const result = [];

        list.forEach((entry) => {
            if (entry === null || typeof entry !== "object") {
                return;
            }

            let product = null;
            let size = "";
            let qty = 1;

            if (typeof entry.id === "string") {
                product = findProduct(entry.id);
                size = typeof entry.size === "string" ? entry.size : "";
                qty = Number(entry.qty);
            } else if (typeof entry.name === "string") {
                // Старий формат: шукаємо товар за назвою
                product = PRODUCTS.find((item) => item.name === entry.name);
                if (product && product.sizes.length > 0) {
                    size = product.sizes.includes("M") ? "M" : product.sizes[0];
                }
            }

            if (!product) {
                return;
            }
            if (product.sizes.length === 0) {
                size = "";
            } else if (!product.sizes.includes(size)) {
                return;
            }
            if (!Number.isInteger(qty) || qty < 1) {
                qty = 1;
            }
            qty = Math.min(qty, MAX_QTY);

            // Однакові товари з однаковим розміром зливаємо в один рядок
            const same = result.find(
                (line) => line.id === product.id && line.size === size
            );
            if (same) {
                same.qty = Math.min(same.qty + qty, MAX_QTY);
            } else {
                result.push({ id: product.id, size, qty });
            }
        });

        return result;
    }

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            // Приватний режим або повний диск: кошик працюватиме до закриття вкладки
        }
    }

    let items = load();

    function count() {
        return items.reduce((sum, line) => sum + line.qty, 0);
    }

    function total() {
        return items.reduce(
            (sum, line) => sum + findProduct(line.id).price * line.qty,
            0
        );
    }

    // Будь-яка зміна: зберегти і перемалювати
    function commit() {
        save();
        render();
    }

    function add(id, size = "") {
        const product = findProduct(id);
        if (!product || !product.inStock) {
            return false;
        }
        if (product.sizes.length > 0 && !product.sizes.includes(size)) {
            return false;
        }
        if (product.sizes.length === 0) {
            size = "";
        }

        const line = items.find((item) => item.id === id && item.size === size);
        if (line) {
            line.qty = Math.min(line.qty + 1, MAX_QTY);
        } else {
            items.push({ id, size, qty: 1 });
        }

        commit();
        showToast(`Додано до кошика: ${product.name}`);
        return true;
    }

    function changeQty(index, delta) {
        const line = items[index];
        if (!line) {
            return;
        }
        line.qty = Math.min(Math.max(line.qty + delta, 1), MAX_QTY);
        commit();
    }

    function remove(index) {
        if (index < 0 || index >= items.length) {
            return;
        }
        items.splice(index, 1);
        commit();
    }

    function clear() {
        items = [];
        commit();
    }

    /* ---------- 2. Елементи сторінки ---------- */

    const modal = document.querySelector("#cart-modal");
    const panel = modal.querySelector(".cart-panel");
    const cartButton = document.querySelector("#cart-button");
    const cartCount = document.querySelector("#cart-count");
    const closeButton = document.querySelector("#close-cart");
    const titleText = document.querySelector("#cart-title-text");
    const titleCount = document.querySelector("#cart-title-count");

    const viewCart = document.querySelector("#cart-view-cart");
    const viewCheckout = document.querySelector("#cart-view-checkout");
    const viewSuccess = document.querySelector("#cart-view-success");

    const itemsBox = document.querySelector("#cart-items");
    const totalBox = document.querySelector("#cart-total");
    const checkoutButton = document.querySelector("#checkout-button");

    const checkoutForm = document.querySelector("#checkout-form");
    const checkoutSummary = document.querySelector("#checkout-summary");
    const backButton = document.querySelector("#back-to-cart");

    const orderNumber = document.querySelector("#order-number");
    const orderSummary = document.querySelector("#order-summary");
    const successClose = document.querySelector("#success-close");

    let lastFocused = null;

    /* ---------- 3. Малювання кошика ---------- */

    function createCartLine(line, index) {
        const product = findProduct(line.id);
        const lineTotal = product.price * line.qty;

        const thumb = el(
            "a",
            { class: "cart-thumb", href: productUrl(product), tabindex: "-1", "aria-hidden": "true" },
            el("img", {
                src: product.image,
                alt: "",
                class: product.fit === "contain" ? "is-contain" : false
            })
        );

        const meta = [product.sku];
        if (line.size) {
            meta.push(`Розмір ${line.size}`);
        }
        meta.push(`${priceText(product.price)} за шт.`);

        const stepper = el(
            "div",
            { class: "qty", role: "group", "aria-label": `Кількість: ${product.name}` },
            el(
                "button",
                {
                    type: "button",
                    class: "qty-button",
                    "data-action": "decrease",
                    "data-index": index,
                    "aria-label": "Зменшити кількість",
                    disabled: line.qty <= 1
                },
                "−"
            ),
            el("span", { class: "qty-value" }, String(line.qty)),
            el(
                "button",
                {
                    type: "button",
                    class: "qty-button",
                    "data-action": "increase",
                    "data-index": index,
                    "aria-label": "Збільшити кількість",
                    disabled: line.qty >= MAX_QTY
                },
                "+"
            )
        );

        return el(
            "div",
            { class: "cart-item" },
            thumb,
            el(
                "div",
                { class: "cart-info" },
                el(
                    "div",
                    { class: "cart-row" },
                    el("a", { class: "cart-name", href: productUrl(product) }, product.name),
                    el("span", { class: "cart-line-price" }, priceText(lineTotal))
                ),
                el("span", { class: "cart-meta" }, meta.join(" · ")),
                el(
                    "div",
                    { class: "cart-row cart-controls" },
                    stepper,
                    el(
                        "button",
                        {
                            type: "button",
                            class: "link-button",
                            "data-action": "remove",
                            "data-index": index,
                            "aria-label": `Видалити з кошика: ${product.name}`
                        },
                        "Видалити"
                    )
                )
            )
        );
    }

    function render() {
        const quantity = count();

        // Лічильник у шапці та підпис для скрінрідерів
        cartCount.textContent = String(quantity);
        cartButton.setAttribute("aria-label", `Кошик, товарів: ${quantity}`);
        titleCount.textContent = `(${quantity})`;

        // Список товарів
        itemsBox.replaceChildren();

        if (items.length === 0) {
            itemsBox.append(
                el(
                    "div",
                    { class: "empty-cart" },
                    el("p", { class: "empty-title" }, "Кошик порожній."),
                    el("p", { class: "muted" }, "Додайте спорядження з каталогу."),
                    el(
                        "a",
                        { class: "btn btn-outline", href: "index.html#catalog", "data-close-cart": "" },
                        "ДО КАТАЛОГУ"
                    )
                )
            );
        } else {
            items.forEach((line, index) => {
                itemsBox.append(createCartLine(line, index));
            });
        }

        totalBox.textContent = formatPrice(total());
        checkoutButton.disabled = items.length === 0;
    }

    /* ---------- 4. Екрани панелі: кошик → оформлення → успіх ---------- */

    function setView(name) {
        viewCart.hidden = name !== "cart";
        viewCheckout.hidden = name !== "checkout";
        viewSuccess.hidden = name !== "success";

        titleCount.hidden = name !== "cart";
        titleText.textContent = {
            cart: "ВАШ КОШИК",
            checkout: "ОФОРМЛЕННЯ",
            success: "ДЯКУЄМО"
        }[name];

        if (name === "checkout") {
            checkoutSummary.textContent =
                `Товарів: ${count()} · Разом: ${priceText(total())}`;
            document.querySelector("#o-name").focus();
        }
    }

    /* ---------- 5. Відкриття і закриття панелі ---------- */

    function open() {
        if (!modal.hidden) {
            return;
        }
        lastFocused = document.activeElement;
        toastElement.classList.remove("is-visible"); // повідомлення не має перекривати кошик
        setView("cart");
        modal.hidden = false;
        document.body.classList.add("no-scroll");
        cartButton.setAttribute("aria-expanded", "true");
        closeButton.focus();
    }

    function close() {
        if (modal.hidden) {
            return;
        }
        modal.hidden = true;
        document.body.classList.remove("no-scroll");
        cartButton.setAttribute("aria-expanded", "false");

        if (lastFocused && typeof lastFocused.focus === "function") {
            lastFocused.focus();
        }
    }

    // Елементи, до яких можна дійти клавішею Tab усередині панелі
    function focusableElements() {
        const selector =
            'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

        return Array.from(panel.querySelectorAll(selector)).filter(
            (node) => node.getClientRects().length > 0
        );
    }

    /* ---------- 6. Обробники подій ---------- */

    cartButton.addEventListener("click", open);

    document.addEventListener("click", (event) => {
        // Будь-який елемент із data-close-cart закриває панель
        if (event.target.closest("[data-close-cart]")) {
            close();
            return;
        }

        // Кнопка «ДО КОШИКА» на картках товарів
        const addButton = event.target.closest("[data-add-to-cart]");
        if (addButton) {
            add(addButton.dataset.addToCart);
        }
    });

    // Кнопки «−», «+», «Видалити» всередині кошика
    itemsBox.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) {
            return;
        }

        const index = Number(button.dataset.index);
        const action = button.dataset.action;

        if (action === "increase") {
            changeQty(index, 1);
        } else if (action === "decrease") {
            changeQty(index, -1);
        } else if (action === "remove") {
            remove(index);
        }

        // Список перемалювався: повертаємо фокус, щоб клавіатурою можна було продовжити
        const sameButton = itemsBox.querySelector(
            `[data-action="${action}"][data-index="${index}"]:not([disabled])`
        );
        const fallback =
            itemsBox.querySelector(`.qty-button[data-index="${index}"]:not([disabled])`) ||
            itemsBox.querySelector("[data-action]:not([disabled])") ||
            closeButton;

        (sameButton || fallback).focus();
    });

    // Esc закриває; Tab не виходить за межі панелі
    document.addEventListener("keydown", (event) => {
        if (modal.hidden) {
            return;
        }

        if (event.key === "Escape") {
            close();
            return;
        }

        if (event.key === "Tab") {
            const focusable = focusableElements();
            if (focusable.length === 0) {
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    });

    checkoutButton.addEventListener("click", () => setView("checkout"));

    backButton.addEventListener("click", () => {
        setView("cart");
        checkoutButton.focus();
    });

    enableLiveValidation(checkoutForm);

    checkoutForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (items.length === 0 || !validateForm(checkoutForm)) {
            return;
        }

        // Це імітація: замовлення нікуди не надсилається
        const number = `FC-${String(Math.floor(10000 + Math.random() * 90000))}`;
        const summary = `Товарів: ${count()} · Сума: ${priceText(total())}`;

        orderNumber.textContent = `Замовлення №${number} прийнято`;
        orderSummary.textContent = summary;

        resetForm(checkoutForm);
        clear();
        setView("success");
        document.querySelector("#success-title").focus();
    });

    successClose.addEventListener("click", close);

    // Якщо кошик змінили в іншій вкладці — оновлюємо і тут
    window.addEventListener("storage", (event) => {
        if (event.key === STORAGE_KEY) {
            items = load();
            render();
        }
    });

    render();

    return { add, open, close, count, total };
})();
