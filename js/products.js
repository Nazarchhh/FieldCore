/* ==========================================================
   products.js — дані товарів і картка товару
   ЩОБ ДОДАТИ НОВИЙ ТОВАР: скопіюйте один блок { ... } у списку
   PRODUCTS нижче, змініть id (унікальний!), назву, ціну та фото.
   Каталог, сторінка товару і кошик підхоплять його самі.
   ========================================================== */

// Категорії: ключ → назва, яку бачить покупець
const CATEGORIES = {
    backpacks: "Рюкзаки",
    protection: "Захист",
    vests: "Жилети"
};

const PRODUCTS = [
    {
        id: "backpack",                 // унікальний ідентифікатор (латиницею)
        sku: "FC-001",                  // артикул
        name: "Тактичний рюкзак",
        category: "backpacks",
        price: 27500,                   // число без пробілів
        image: "images/backpack.jpg",
        imageAlt: "Тактичний рюкзак",
        fit: "cover",                   // "cover" — фото на всю картку, "contain" — фото цілком
        badge: "ХІТ",                   // мітка на фото (або null)
        badgeTone: "accent",            // "accent" — салатова, "sand" — піщана
        inStock: true,                  // true — є в наявності
        sizes: [],                      // розміри; порожній список — розмір не потрібен
        short: "Місткий рюкзак для складних умов.",
        description:
            "Місткий рюкзак для складних умов. Створений для тривалих виходів, " +
            "де важливі міцність, зручність та швидкий доступ до спорядження.",
        // Характеристики для сторінки товару: пари ["Назва", "Значення"].
        // Якщо список порожній — блок на сторінці не показується.
        specs: [
            ["Об'єм", "45 л"],
            ["Матеріал", "Cordura 500D"],
            ["Вага", "1,9 кг"],
            ["Кріплення", "Система MOLLE"],
            ["Колір", "Койот"]
        ]
    },
    {
        id: "helmet",
        sku: "FC-002",
        name: "Балістичний шолом",
        category: "protection",
        price: 18900,
        image: "images/helmet.webp",
        imageAlt: "Балістичний шолом",
        fit: "contain",
        badge: "НОВИНКА",
        badgeTone: "sand",
        inStock: true,
        sizes: [],
        short: "Надійний захист та комфорт.",
        description:
            "Надійний захист та комфорт. Шолом розрахований на тривале носіння " +
            "і сумісний з додатковим спорядженням.",
        specs: [
            ["Колір", "Койот"],
            ["Підвісна система", "Регульована"],
            ["Кріплення аксесуарів", "Бічні рейки та передня планка"],
            ["Підборідний ремінь", "Швидкознімний"]
        ]
    },
    {
        id: "vest",
        sku: "FC-003",
        name: "Тактичний жилет",
        category: "vests",
        price: 25200,
        image: "images/vest.jpg",
        imageAlt: "Тактичний жилет",
        fit: "cover",
        badge: null,
        badgeTone: "accent",
        inStock: true,
        sizes: ["S", "M", "L", "XL"],   // для жилета покупець обирає розмір
        short: "Функціональність і зручність.",
        description:
            "Функціональність і зручність. Жилет із модульною системою кріплення, " +
            "яку можна налаштувати під ваші завдання.",
        specs: [
            ["Матеріал", "Cordura 500D"],
            ["Кріплення", "Система MOLLE"],
            ["Регулювання", "Плечі та пояс"],
            ["Камуфляж", "Багатоколірний"],
            ["Розміри", "S, M, L, XL"]
        ]
    }
];

function findProduct(id) {
    return PRODUCTS.find((product) => product.id === id);
}

function productUrl(product) {
    return `product.html?id=${encodeURIComponent(product.id)}`;
}

/* Мітка на фото («ХІТ», «НОВИНКА») */
function createBadge(product) {
    if (!product.badge) {
        return null;
    }
    return el(
        "span",
        { class: `badge badge-${product.badgeTone}` },
        product.badge
    );
}

/* Картка товару для каталогу.
   Кнопка «ДО КОШИКА» має атрибут data-add-to-cart — кошик
   (cart.js) сам реагує на нього, тут додавати обробник не треба. */
function createProductCard(product) {
    const url = productUrl(product);

    const media = el(
        "a",
        { class: "product-media", href: url, tabindex: "-1", "aria-hidden": "true" },
        el("img", {
            src: product.image,
            alt: product.imageAlt,
            loading: "lazy",
            decoding: "async",
            class: product.fit === "contain" ? "is-contain" : false
        }),
        createBadge(product),
        el("span", { class: "sku" }, product.sku)
    );

    let action;
    if (!product.inStock) {
        action = el(
            "button",
            { class: "buy-button", type: "button", disabled: true },
            "НЕМАЄ В НАЯВНОСТІ"
        );
    } else if (product.sizes.length > 0) {
        // Є розміри: спершу треба обрати розмір на сторінці товару
        action = el(
            "a",
            { class: "buy-button", href: `${url}#options` },
            "ОБРАТИ РОЗМІР"
        );
    } else {
        action = el(
            "button",
            { class: "buy-button", type: "button", "data-add-to-cart": product.id },
            icon("cart"),
            "ДО КОШИКА"
        );
    }

    const stock = el(
        "span",
        { class: product.inStock ? "stock" : "stock is-out" },
        el("span", { class: "stock-dot", "aria-hidden": "true" }),
        product.inStock ? "В наявності" : "Немає в наявності"
    );

    return el(
        "article",
        { class: "product-card" },
        media,
        el(
            "div",
            { class: "product-body" },
            el("div", { class: "product-category" }, CATEGORIES[product.category]),
            el("h3", {}, el("a", { href: url }, product.name)),
            el("p", { class: "product-short" }, product.short),
            el(
                "div",
                { class: "product-meta" },
                el("span", { class: "price" }, priceText(product.price)),
                stock
            ),
            action
        )
    );
}
