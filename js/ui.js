/* ==========================================================
   ui.js — спільні допоміжні функції для всіх сторінок
   Підключається ПЕРШИМ (інші файли користуються його функціями).
   ========================================================== */

/* ---------- Створення елементів ----------
   el("a", { class: "btn", href: "#" }, "Текст", іншийЕлемент)
   Це безпечніше за innerHTML: текст завжди вставляється як текст,
   а не як код, тому «вставити чужий код» через дані не вийде. */
function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);

    Object.entries(attrs).forEach(([key, value]) => {
        if (value === false || value === null || value === undefined) {
            return;
        }
        node.setAttribute(key, value === true ? "" : String(value));
    });

    children.flat().forEach((child) => {
        if (child === null || child === undefined || child === false) {
            return;
        }
        node.append(child); // рядок стане текстовим вузлом
    });

    return node;
}

/* ---------- Іконки ----------
   SVG-рядки тут написані нами (не приходять від користувача),
   тому використати innerHTML для них безпечно. */
const ICONS = {
    cart: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    arrowLeft: '<path d="M15 5l-7 7 7 7"/>'
};

function icon(name, size = 20) {
    const wrapper = document.createElement("span");
    wrapper.innerHTML =
        `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" ` +
        `stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ` +
        `stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
    return wrapper.firstElementChild;
}

/* ---------- Ціни ----------
   formatPrice(27500) → «27 500»  (з нерозривним пробілом)
   priceText(27500)   → «27 500 грн» (число і «грн» не розірвуться між рядками) */
function formatPrice(value) {
    return value.toLocaleString("uk-UA");
}

function priceText(value) {
    return `${formatPrice(value)} грн`;
}

/* ---------- Спливаюче повідомлення (toast) ----------
   Елемент створюємо одразу: скрінрідери краще оголошують зміни
   у «живій» області, яка вже була на сторінці. */
const toastElement = el("div", {
    id: "toast",
    class: "toast",
    role: "status",
    "aria-live": "polite"
});
document.body.append(toastElement);

let toastTimer;

function showToast(message) {
    toastElement.textContent = message;
    toastElement.classList.add("is-visible");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toastElement.classList.remove("is-visible");
    }, 2600);
}

/* ---------- Анімація появи при прокручуванні ----------
   Додає клас .show, коли елемент з'являється на екрані. */
function revealOnScroll(elements) {
    const list = Array.from(elements);

    // Старі браузери без IntersectionObserver: просто показуємо все
    if (!("IntersectionObserver" in window)) {
        list.forEach((item) => item.classList.add("show"));
        return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                currentObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    list.forEach((item) => observer.observe(item));
}

/* ---------- Перевірка форм ----------
   У полі пишемо data-validate="name" (або phone, address, message),
   а повідомлення про помилку показуємо в елементі з id="<id поля>-error". */
const validators = {
    name: (value) =>
        value.trim().length >= 2
            ? ""
            : "Вкажіть ім'я (мінімум 2 символи).",

    phone: (value) => {
        const digits = value.replace(/\D/g, "");
        return digits.length >= 10 && digits.length <= 13
            ? ""
            : "Вкажіть телефон, наприклад +380 50 123 45 67.";
    },

    address: (value) =>
        value.trim().length >= 5
            ? ""
            : "Вкажіть місто та спосіб доставки (мінімум 5 символів).",

    message: (value) =>
        value.trim().length >= 10
            ? ""
            : "Напишіть повідомлення (мінімум 10 символів)."
};

function validateField(input) {
    const rule = validators[input.dataset.validate];
    if (!rule) {
        return true;
    }

    const message = rule(input.value);
    const errorBox = document.getElementById(`${input.id}-error`);

    if (errorBox) {
        errorBox.textContent = message;
    }
    input.setAttribute("aria-invalid", message ? "true" : "false");

    return message === "";
}

function validateForm(form) {
    let firstInvalid = null;

    form.querySelectorAll("[data-validate]").forEach((input) => {
        if (!validateField(input) && !firstInvalid) {
            firstInvalid = input;
        }
    });

    if (firstInvalid) {
        firstInvalid.focus();
    }
    return firstInvalid === null;
}

function enableLiveValidation(form) {
    form.querySelectorAll("[data-validate]").forEach((input) => {
        input.addEventListener("blur", () => validateField(input));
        input.addEventListener("input", () => {
            // Після першої помилки перевіряємо одразу під час набору
            if (input.getAttribute("aria-invalid") === "true") {
                validateField(input);
            }
        });
    });
}

function resetForm(form) {
    form.reset();
    form.querySelectorAll("[data-validate]").forEach((input) => {
        input.removeAttribute("aria-invalid");
        const errorBox = document.getElementById(`${input.id}-error`);
        if (errorBox) {
            errorBox.textContent = "";
        }
    });
}

/* ---------- Рік у футері ---------- */
document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
});
