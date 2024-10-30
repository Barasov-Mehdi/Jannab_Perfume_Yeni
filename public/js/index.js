let cart = {};
let totalQuantity = 0;
let totalPrice = 0;

function closeLeftMenu() {
    var close_left_menu = document.querySelector('.close_left_menu');
    var open_left_menu = document.querySelector('.open_left_menu');
    var container = document.querySelector('.container');
    var left_menu = document.querySelector('.left_menu');

    close_left_menu.addEventListener('click', () => {
        // Use 'toggle' method to switch between showing and hiding the menu
        if (left_menu.style.display === 'flex' || left_menu.style.display === '') {
            left_menu.style.display = 'none';
        }
    });
    open_left_menu.addEventListener('click', () => {
        // Use 'toggle' method to switch between showing and hiding the menu
        if (left_menu.style.display === 'none' || left_menu.style.display === '') {
            left_menu.style.display = 'flex';
            left_menu.style.position = 'fixed'; // Ensure it's fixed
            left_menu.style.left = '0'; // Position it at the left
            left_menu.style.top = '0'; // Position it at the top
            container.style.overflowY = 'hidden'; // Prevent scrolling
        }
    });
}
closeLeftMenu();

function showProductCard() {
    var product_card = document.querySelector('.product_card');  // Sadece bir tane product_card seçiyoruz
    var show_product_card_buttons = document.querySelectorAll('.show_product_card');  // Tüm butonları seçiyoruz

    show_product_card_buttons.forEach((button) => {
        button.addEventListener('click', () => {
            product_card.style.display = product_card.style.display === 'none' ? 'flex' : 'none';  // Görünürlüğü değiştiriyoruz
        });
    });
}
showProductCard();

function slidShowFunction() {
    var imgArr = ["./img/FotoSLIDE4.jpg", "./img/FotoSLIDE2.jpg", "./img/FotoSLIDE3.jpg"];
    var slider_show = document.querySelector('.slider_show');
    slider_show.src = "./img/FotoSLIDE1.jpg"
    var i = 0;
    setInterval(() => {
        slider_show.src = imgArr[i];
        i = (i + 1) % imgArr.length;
    }, 3000);
}
slidShowFunction();

function searchBtn() {
    var search_btn = document.querySelectorAll('.search_btn');
    var search = document.querySelector('.search');
    var close_search = document.querySelector('.close_search');
    var showSearch = false;

    search_btn.forEach((e) => {
        e.addEventListener('click', () => {
            showSearch = !showSearch;

            if (showSearch) {
                search.style.display = 'flex';  // Arama kutusunu göster
            } else {
                search.style.display = 'none';  // Arama kutusunu gizle
            }
        })
    })

    close_search.addEventListener('click', () => {
        search.style.display = 'none';
    })

}
searchBtn();

function textSlider() {
    const textArray = [
        "LACOSTE",
        "ROJA",
        "TOM FORD",
        "VERSACE",
        "XERJOFF",
        "ZARA",
        "GUCCI",
        "KENZO",
    ];

    const textSliderElement = document.querySelector('.scrolling-text');

    // İlk metni ayarlama
    textSliderElement.innerHTML = textArray.map(text => `<span>${text}</span>`).join('<span>|</span>'); // Metinlerin arasına ayırıcı eklemek için

    // Metinleri döngüsel olarak kaydırmak için
    setInterval(() => {
        // İlk metni sona ekle
        const firstChild = textSliderElement.firstElementChild;
        textSliderElement.appendChild(firstChild);
    }, 5000); // 5 saniye aralıklarla geçiş
}
textSlider();

async function addCardAndSearch() {
    const searchInput = document.querySelector('.search_inp');
    const searchResults = document.querySelector('.search_results');

    searchInput.addEventListener('input', async function () {
        const query = this.value.trim();
        if (query.length > 2) {
            const response = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
            if (!response.ok) {
                console.error('Error fetching products:', response.statusText);
                return;
            }
            const products = await response.json();
            displaySearchResults(products);
        } else {
            searchResults.innerHTML = '';  // Arama boşken sonuçları gizle
        }
    });
}
addCardAndSearch();

function displaySearchResults(products) {
    const searchResults = document.querySelector('.search_results');
    searchResults.innerHTML = '';

    if (products.length > 0) {
        products.forEach(product => {
            const price = typeof product.price === 'object' && product.price.$numberDecimal
                ? parseFloat(product.price.$numberDecimal)
                : product.price;

            const productElement = document.createElement('div');
            productElement.classList.add('product-result');

            productElement.innerHTML = `
                <a href="/products/${product._id}" class="product-link">
                    <img src="${product.img}" alt="${product.name}" class="product-image" />
                    <div class="product-details">
                        <h2 class="product-name">${product.name}</h2>
                        <p class="product-price">${price ? price.toFixed(2) : 'Fiyat mevcut değil'}</p>
                    </div>
                </a>
                <div class="volume-select">
                    <select class="volume-options" id="volumeSelect_${product._id}">
                        <option value="15" data-price="${(price / 1 * 15).toFixed()}">15 ml</option>
                        <option value="30" data-price="${(price / 1 * 30).toFixed()}">30 ml</option>
                        <option value="50" data-price="${(price / 1 * 50).toFixed()}">50 ml</option>
                    </select>
                </div>
                <a href="javascript:void(0)" class="add-to-cart" 
                    onclick="addToCart('${product._id}', '${product.name}', '${product.img}', ${price}, document.getElementById('volumeSelect_${product._id}').value)">
                    <i class="fas fa-plus"></i>
                </a>
            `;

            searchResults.appendChild(productElement);
        });
    } else {
        searchResults.innerHTML = '<p>Hiçbir ürün bulunamadı.</p>'; // No products found message
    }
}

function addToCart(id, name, img, price, volume) {
    price = parseFloat(price); // Sayıya dönüştür
    if (isNaN(price)) {
        console.warn(`Kaydedilemiyor, geçersiz fiyat: ${price}`); // Hata mesajı
        return; // Geçersiz fiyat durumu
    }

    let priceMultiplier = volume / 1; // Hacim oranını hesapla
    let calculatedPrice = price * priceMultiplier; // Hacmi dikkate alarak fiyatı çarp

    // Ürün anahtarını hacim ile birleştir
    const cartKey = `${id}_${volume}`; // Örneğin: "productId_30"

    if (!cart[cartKey]) {
        cart[cartKey] = { name, img, price: calculatedPrice, quantity: 0, volume }; // Hacmi burada kaydediyoruz
    }
    cart[cartKey].quantity++;
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    cartItems.innerHTML = '';
    let totalQuantity = 0;
    let totalPrice = 0;

    for (const key in cart) {
        const { name, img, price, quantity, volume } = cart[key];
        totalQuantity += quantity;
        totalPrice += price * quantity; // Toplam fiyatı hesapla
        cartItems.innerHTML += `
            <div class="product_item">
                <img src="${img}" alt="${name}">
                <div>${name} (${volume} ml)</div> <!-- Hacim bilgisini buraya ekliyoruz -->
                <div class="quantity">
                    <button onclick="changeQuantity('${key}', 1)">+</button>
                    <input type="text" value="${quantity}" readonly>
                    <button onclick="changeQuantity('${key}', -1)">-</button>
                </div>
            </div>
        `;
    }

    document.getElementById('totalPrice').innerText = totalPrice.toFixed(2); // Toplam fiyatı 2 ondalık basamakla göster
    document.querySelector('.added_product').innerText = totalQuantity;
    document.querySelector('.productNo').innerText = totalQuantity;
}

function changeQuantity(key, delta) {
    if (cart[key]) {
        cart[key].quantity += delta;

        if (cart[key].quantity <= 0) {
            delete cart[key]; // Miktar 0'ın altına inerse ürünü sepetten çıkar
        }

        updateCartDisplay();
    }
}

function changeQuantity(id, delta) {
    if (cart[id]) {
        cart[id].quantity += delta;
        if (cart[id].quantity <= 0) {
            delete cart[id];
        }
        updateCartDisplay();
    }
}

function toggleCart() {
    const cartDisplay = document.getElementById('productCard');
    cartDisplay.style.display = cartDisplay.style.display === 'flex' ? 'none' : 'flex';
}

function closeCart() {
    document.getElementById('productCard').style.display = 'none';
}

document.getElementById('viewDetailsButton').onclick = function () {
    window.location.href = '/productDetails';
};

async function filterBestSellers() {
    fetch('/bestsellers')
        .then(response => response.json())
        .then(data => displayProducts(data))
        .catch(error => console.error('Error fetching best sellers:', error));
}

async function filterNewArrivals() {
    fetch('/api/new-arrivals')
        .then(response => response.json())
        .then(products => displayProducts(products))
        .catch(error => console.error('Error fetching new arrivals:', error));
}

async function filterAllProducts() {
    fetch('/api/products')
        .then(response => response.json())
        .then(products => displayProducts(products))
        .catch(error => console.error('Error fetching products:', error));
}

function displayProducts(products) {
    const productsContainer = document.getElementById('productsContainer');
    productsContainer.innerHTML = ''; // Mevcut ürünleri temizle

    products.forEach(product => {
        const price = typeof product.price === 'object' && product.price.$numberDecimal
            ? parseFloat(product.price.$numberDecimal)
            : product.price;

        const productElement = `
            <div class="product">
                <a href="/products/${product._id}">
                    <div class="image-container">
                        <img src="${product.img}" alt="${product.name}">
                    </div>
                    <div class="product-details">
                        <h2>${product.name}</h2>
                        <div class="rating">
                            ${[...Array(5)].map((_, i) => `<span class="star ${i < product.rating ? 'filled' : ''}">★</span>`).join('')}
                        </div>
                    </div>
                </a>
                <div class="product-footer">
                    <div class="price" style="display: none;">${price.toFixed(2)} ₼</div>
                    <div class="volume-select">
                        <select class="volume-options" id="volumeSelect_${product._id}" onchange="updateVolumePrice('${product._id}', ${price})">
                            <option value="15" data-price="${(price / 1 * 15).toFixed()}">15 ml</option>
                            <option value="30" data-price="${(price / 1 * 30).toFixed()}">30 ml</option>
                            <option value="50" data-price="${(price / 1 * 50).toFixed()}">50 ml</option>
                        </select>
                    </div>
                    <div class="price-per-volume" id="priceDisplay_${product._id}">
                        <!-- Fiyat burada gösterilecek -->
                    </div>
                    <a href="javascript:void(0)" class="add-to-cart"
                        onclick="addToCart('${product._id}', '${product.name}', '${product.img}', ${price}, document.getElementById('volumeSelect_${product._id}').value)">
                        <i class="fas fa-plus"></i>
                    </a>
                </div>
            </div>
        `;
        productsContainer.insertAdjacentHTML('beforeend', productElement);
    });
}

// Volume price update function
function updateVolumePrice(productId, basePrice) {
    const volumeSelect = document.getElementById(`volumeSelect_${productId}`);
    const selectedOption = volumeSelect.options[volumeSelect.selectedIndex];

    const calculatedPrice = parseFloat(selectedOption.getAttribute('data-price')); // Seçilen hacmin fiyatını al

    // Sadece geçerli fiyatı göster
    if (!isNaN(calculatedPrice) && calculatedPrice > 0) {
        document.getElementById(`priceDisplay_${productId}`).innerHTML = `${calculatedPrice.toFixed(2)} ₼ (${volumeSelect.value} ml üçün)`; 
    } else {
        document.getElementById(`priceDisplay_${productId}`).innerHTML = ''; // Geçersiz fiyat için boş bırak
    }
}