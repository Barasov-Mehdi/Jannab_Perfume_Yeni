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
            displaySearchResults(products, query);
        } else {
            searchResults.innerHTML = '';  // Clear results when the input is empty
        }
    });
}

function displaySearchResults(products, query) {
    const searchResults = document.querySelector('.search_results');
    searchResults.innerHTML = '';

    // Sort the products based on whether they include the query in their name
    const sortedProducts = products.sort((a, b) => {
        const aMatches = a.name.toLowerCase().includes(query.toLowerCase());
        const bMatches = b.name.toLowerCase().includes(query.toLowerCase());
        return (aMatches === bMatches) ? 0 : aMatches ? -1 : 1;
    });

    if (sortedProducts.length > 0) {
        sortedProducts.forEach(product => {
            const price = typeof product.price === 'object' && product.price.$numberDecimal
                ? parseFloat(product.price.$numberDecimal)
                : product.price;

            let discountRate = 0;
            if (product.discount) {
                discountRate = typeof product.discount === 'object' && product.discount.$numberDecimal
                    ? parseFloat(product.discount.$numberDecimal)
                    : parseFloat(product.discount);
            }

            const discountedPrice = price * (1 - (discountRate / 100));

            const productElement = document.createElement('div');
            productElement.classList.add('product-result');

            productElement.innerHTML = `
                <a href="/products/${product._id}" class="product-link">
                    <img src="${product.img}" alt="${product.name}" class="product-image" />
                    <div class="product-details">
                        <h2 class="product-name">${product.name}</h2>
                        <p class="product-price">Orijinal: ₼${price.toFixed(2)} <br> İndirimli: ₼${discountedPrice.toFixed(2)}</p>
                    </div>
                </a>
                <div class="volume-select">
                    <select class="volume-options" id="volumeSelect_${product._id}">
                        <option value="15" data-price="${(discountedPrice / 1 * 15).toFixed(2)}">15 ml</option>
                        <option value="30" data-price="${(discountedPrice / 1 * 30).toFixed(2)}">30 ml</option>
                        <option value="50" data-price="${(discountedPrice / 1 * 50).toFixed(2)}">50 ml</option>
                    </select>
                </div>
                <a href="javascript:void(0)" class="add-to-cart" style="background-color: #f76300;" 
                    onclick="addToCart('${product._id}', '${product.name}', '${product.img}', ${discountedPrice}, document.getElementById('volumeSelect_${product._id}').value)">
                    <i class="fa-solid fa-cart-shopping" style="color: white;"></i>

                </a>
            `;

            searchResults.appendChild(productElement);
        });
    } else {
        searchResults.innerHTML = '<p>Hiçbir ürün bulunamadı.</p>'; // No products found message
    }
}
addCardAndSearch();

// zordu 
let skipCount = 2; // İlk başta yüklenecek ürün sayısı
const limit = 2; // Her seferinde yüklenecek ürün sayısı
let loadedProductIds = []; // Daha önce yüklenmiş ürün ID'leri

function loadMoreProducts() {
    fetch(`/api/products?skip=${skipCount}&limit=${limit}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(products => {
            const productsContainer = document.getElementById('productsContainer');

            const newProducts = products.filter(product => !loadedProductIds.includes(product._id));

            if (newProducts.length > 0) {
                newProducts.forEach(product => {
                    // Fiyatı ve indirim oranını doğru bir biçimde oluşturun
                    const originalPrice = (typeof product.price === 'object' && product.price.$numberDecimal)
                        ? parseFloat(product.price.$numberDecimal)
                        : product.price;

                    const discount = (typeof product.discount === 'object' && product.discount.$numberDecimal)
                        ? parseFloat(product.discount.$numberDecimal)
                        : (product.discount ? parseFloat(product.discount) : 0);

                    const discountedPrice = discount > 0
                        ? originalPrice * (1 - discount / 100)
                        : originalPrice;

                    const discountedPrice15ml = (discountedPrice * (15 / 1)).toFixed(2);
                    const discountedPrice30ml = (discountedPrice * (30 / 1)).toFixed(2);
                    const discountedPrice50ml = (discountedPrice * (50 / 1)).toFixed(2);

                    const productHTML = `
                        <div class="product" data-category="${product.category}">
                            <a target="_blank" href="/products/${product._id}">
                                <div class="image-container">
                                    <img src="${product.img}" alt="${product.name}">
                                    ${discount > 0 ? `<div class="discount-badge">-${Math.floor(discount)}%</div>` : ''}
                                </div>
                                <div class="product-details">
                                    <h2>${product.name}</h2>
                                </div>
                            </a>
                            <div class="product-footer">
                                <div class="price" style="display: none;">${originalPrice.toFixed(2)} ₼</div>
                                <div class="volume-select">
                                    <select class="volume-options" id="volumeSelect_${product._id}" 
                                        onchange="updateVolumePrice('${product._id}', ${originalPrice}, ${discount})">
                                        <option value="15" data-price="${discountedPrice15ml}">15 ml - ${discountedPrice15ml} ₼</option>
                                        <option value="30" data-price="${discountedPrice30ml}">30 ml - ${discountedPrice30ml} ₼</option>
                                        <option value="50" data-price="${discountedPrice50ml}">50 ml - ${discountedPrice50ml} ₼</option>
                                    </select>
                                </div>
                                <a href="javascript:void(0)" class="add-to-cart" style="background-color: #f76300;" 
                                    onclick="addToCart('${product._id}', '${product.name}', '${product.img}', ${discountedPrice.toFixed(2)}, 
                                    document.getElementById('volumeSelect_${product._id}').value)">
                                    <i class="fa-solid fa-cart-shopping" style="color: white;"></i>

                                </a>
                            </div>
                        </div>`;

                    productsContainer.insertAdjacentHTML('beforeend', productHTML);
                    loadedProductIds.push(product._id);
                });

                skipCount += limit; // Geçiş sayısını güncelle
            } else {
                document.getElementById('loadMoreButton').style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error loading more products:', error);
        });
}

function resetButtonStyles() {
    newArrivalsButton.classList.remove('active');
    bestSellersButton.classList.remove('active');
    discountedButton.classList.remove('active');

    newArrivalsButton.classList.add('inactive');
    bestSellersButton.classList.add('inactive');
    discountedButton.classList.add('inactive');
}

function addToCart(id, name, img, price, volume) {
    price = parseFloat(price); // Convert to number
    if (isNaN(price)) {
        console.warn(`Kaydedilemiyor, geçersiz fiyat: ${price}`);
        return;
    }

    const volumeSelect = document.querySelector(`#volumeSelect_${id}`);
    let discountedPrice = price; // Default to the primary price

    // Get the selected price based on volume
    if (volumeSelect && volumeSelect.selectedOptions.length > 0) {
        const selectedOption = volumeSelect.selectedOptions[0];
        if (selectedOption.dataset.price) {
            discountedPrice = parseFloat(selectedOption.dataset.price); // Use the selected volume price from data-attribute
        }
    }

    const cartKey = `${id}_${volume}`; // e.g., "productId_30"

    if (!cart[cartKey]) {
        cart[cartKey] = { name, img, price: discountedPrice, quantity: 0, volume };
    }
    cart[cartKey].quantity++; // Increase the quantity
    updateCartDisplay(); // Refresh the cart display
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

async function filterNewArrivals() {
    try {
        const response = await fetch('/admin/new-arrivals');
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching new arrivals:', error);
    }
}

async function filterBestSellers() {
    try {
        const response = await fetch('/admin/best-sellers');
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching best sellers:', error);
    }
}

async function filterDiscountedProducts() {
    try {
        const response = await fetch('/admin/discounted-products');
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching discounted products:', error);
    }
}

async function filterAllProducts() {
    fetch('/api/products')
        .then(response => response.json())
        .then(products => displayProducts(products))
        .catch(error => console.error('Error fetching products:', error));
}

function displayProducts(products) {
    const productsContainer = document.getElementById('productsContainer');
    productsContainer.innerHTML = ''; // Clear existing products

    products.forEach(product => {
        const originalPrice = typeof product.price === 'object' && product.price.$numberDecimal
            ? parseFloat(product.price.$numberDecimal)
            : product.price;

        const discount = product.discount ? parseFloat(product.discount.$numberDecimal) : 0;
        const discountPercentage = discount > 0 ? discount : 0;

        // Calculate discounted prices for different volumes
        const discountedPrice15ml = discount > 0 ? (originalPrice * (15 / 1) * (1 - discount / 100)).toFixed(1) : (originalPrice * (15 / 1)).toFixed(2);
        const discountedPrice30ml = discount > 0 ? (originalPrice * (30 / 1) * (1 - discount / 100)).toFixed(1) : (originalPrice * (30 / 1)).toFixed(2);
        const discountedPrice50ml = discount > 0 ? (originalPrice * (50 / 1) * (1 - discount / 100)).toFixed(1) : (originalPrice * (50 / 1)).toFixed(2);

        const productElement = `
            <div class="product">
                <a href="/products/${product._id}">
                    <div class="image-container">
                        <img src="${product.img}" alt="${product.name}">
                        ${discount > 0 ? `<div class="discount-label">-${discountPercentage}%</div>` : ''}
                    </div>
                    <div class="product-details">
                        <h2>${product.name}</h2>
                        
                    </div>
                </a>
                <div class="product-footer">
                    <div class="price" style="display: none;">${originalPrice.toFixed(2)} ₼</div>
                    <div class="volume-select">
                        <select class="volume-options" id="volumeSelect_${product._id}" onchange="updateVolumePrice('${product._id}', ${originalPrice}, ${discount})">
                            <option value="15" data-price="${discountedPrice15ml}">15 ml - ${discountedPrice15ml} ₼</option>
                            <option value="30" data-price="${discountedPrice30ml}">30 ml - ${discountedPrice30ml} ₼</option>
                            <option value="50" data-price="${discountedPrice50ml}">50 ml - ${discountedPrice50ml} ₼</option>
                        </select>
                    </div>
                    <div class="price-per-volume" id="priceDisplay_${product._id}"></div>
                    <a href="javascript:void(0)" class="add-to-cart" style="background-color: #f76300;"
                       onclick="addToCart('${product._id}', '${product.name}', '${product.img}', ${originalPrice}, document.getElementById('volumeSelect_${product._id}').value)">
                        <i class="fa-solid fa-cart-shopping" style="color: white;"></i>

                    </a>
                </div>
            </div>
        `;

        productsContainer.insertAdjacentHTML('beforeend', productElement);
    });
}

function updateVolumePrice(productId, basePrice, discount) {
    const volumeSelect = document.getElementById(`volumeSelect_${productId}`);
    const selectedOption = volumeSelect.options[volumeSelect.selectedIndex];

    const selectedVolume = parseInt(selectedOption.value); // Get selected volume
    let calculatedPrice = (basePrice * (selectedVolume / 100)); // Base calculation

    // If discount is present, apply it
    if (discount > 0) {
        calculatedPrice *= (1 - discount / 100);
    }

    // Update price display
    const priceDisplayElement = document.getElementById(`priceDisplay_${productId}`);
    if (!isNaN(calculatedPrice) && calculatedPrice > 0) {
        priceDisplayElement.innerHTML = `${calculatedPrice.toFixed(2)} ₼ (${selectedVolume} ml için)`;
    } else {
        priceDisplayElement.innerHTML = ''; // Clear invalid prices
    }
}

async function fetchProducts(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error fetching products: ${response.statusText}`);
    }
    return await response.json();
}

async function filterProducts(gender) {
    try {
        const products = await fetchProducts(`/products/filter/${gender}`);
        renderProducts(products);
    } catch (error) {
        console.error(error);
    }
}

function renderProducts(products) {
    const productsContainer = document.getElementById('productsContainer');
    productsContainer.innerHTML = ''; // Clear existing products

    products.forEach(product => {
        // Determine original price based on the data type
        const originalPrice = typeof product.price === 'object' && product.price.$numberDecimal
            ? parseFloat(product.price.$numberDecimal)
            : product.price;

        // Check if there's a discount and calculate discounted prices
        const discount = product.discount && typeof product.discount === 'object' && product.discount.$numberDecimal
            ? parseFloat(product.discount.$numberDecimal)
            : 0; // Defaults to 0 if no valid discount

        const discountedPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice; // Calculate discounted price

        // Define prices for different volumes
        const discountedPrice15ml = (discountedPrice * (15 / 1)).toFixed(2);
        const discountedPrice30ml = (discountedPrice * (30 / 1)).toFixed(2);
        const discountedPrice50ml = (discountedPrice * (50 / 1)).toFixed(2);

        const productElement = `
             <div class="product">
                <a href="/products/${product._id}">
                    <div class="image-container">
                        <img src="${product.img}" alt="${product.name}">
                        ${discount > 0 ? `<div class="discount-label">-${Math.floor(discount)}%</div>` : ''}
                    </div>
                    <div class="product-details">
                        <h2>${product.name}</h2>
                        
                    </div>
                </a>
                <div class="product-footer">
                    <div class="price" style="display: none;">${originalPrice.toFixed(2)} ₼</div>
                    <div class="volume-select">
                        <select class="volume-options" id="volumeSelect_${product._id}" onchange="updateVolumePrice('${product._id}', ${originalPrice}, ${discount})">
                            <option value="15" data-price="${discountedPrice15ml}">15 ml - ${discountedPrice15ml} ₼</option>
                            <option value="30" data-price="${discountedPrice30ml}">30 ml - ${discountedPrice30ml} ₼</option>
                            <option value="50" data-price="${discountedPrice50ml}">50 ml - ${discountedPrice50ml} ₼</option>
                        </select>
                    </div>
                    <div class="price-per-volume" id="priceDisplay_${product._id}"></div>
                    <a href="javascript:void(0)" class="add-to-cart" style="background-color: #f76300;" 
                       onclick="addToCart('${product._id}', '${product.name}', '${product.img}', ${discountedPrice.toFixed(2)}, document.getElementById('volumeSelect_${product._id}').value)">
                        <i class="fa-solid fa-cart-shopping" style="color: white;"></i>

                    </a>
                </div>
            </div>
        `;

        productsContainer.insertAdjacentHTML('beforeend', productElement); // Append the product element
    });
}
