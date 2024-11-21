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
    var show_product_card_buttons = document.querySelectorAll('.show_product_card');  // Tüm butarı seçiyoruz

    show_product_card_buttons.forEach((button) => {
        button.addEventListener('click', () => {
            product_card.style.display = product_card.style.display === 'none' ? 'flex' : 'none';  // Görünürlüğü değiştiriyoruz
        });
    });
}
showProductCard();

function updateImage() {
    const imgElement = document.getElementById('giftImage');
    const windowWidth = window.innerWidth;

    if (windowWidth < 775) {
        imgElement.src = './img/gift30-50-70new.png'; // 775px'den küçükse
        imgElement.alt = 'endirim 30'; // Alternatif metin
    } else {
        imgElement.src = './img/gift70.png'; // 775px ve üzerindeyse
        imgElement.alt = 'endirim 70'; // Alternatif metin
    }
}

// Sayfa yüklendiğinde ve pencere boyutu değiştiğinde resmi güncelle
window.addEventListener('load', updateImage);
window.addEventListener('resize', updateImage);
updateImage()
function initializeSlider() {
    var imgArrLarge = ["./img/IMG_7812.JPG", "./img/IMG_7855.JPG"]; // Geniş ekranlar için
    var imgArrSmall = ["./img/IMG_7816.JPG", "./img/IMG_7827.JPG"]; // Dar ekranlar için
    var slider_show = document.querySelector('.slider_show');
    var imgArr;
    var i = 0;

    function updateImageArray() {
        if (window.innerWidth <= 775) {
            imgArr = imgArrSmall;
        } else {
            imgArr = imgArrLarge;
        }
        slider_show.src = imgArr[0]; // İlk resmi göster
        i = 0; // Reset index
    }

    function changeImage() {
        i = (i + 1) % imgArr.length; // İndeksi döngüsel hale getir
        slider_show.src = imgArr[i]; // Yeni resmi göster
    }

    updateImageArray(); // Öncelikle diziyi ayarla
    setInterval(changeImage, 3000); // Resimleri değiştir
    window.onresize = updateImageArray; // Boyut değiştiğinde diziyi güncelle
}
initializeSlider();

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

    // Arama kısmına tıkladığınızda, dışındaki herhangi bir yere de tıklarsanız arama kutusunu gizleyin.
    document.addEventListener('click', (event) => {
        const isClickInside = search.contains(event.target) || Array.from(search_btn).some(btn => btn.contains(event.target));

        if (!isClickInside && showSearch) {
            search.style.display = 'none'; // Arama kutusunu gizle
            showSearch = false; // Durumu güncelle
        }
    });

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
        if (query.length > 2) { // Sadece 3 karakterden fazlası için arama yap
            try {
                const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
                if (!response.ok) {
                    throw new Error('Ürünler alınamadı');
                }
                const products = await response.json();
                displaySearchResults(products);
            } catch (error) {
                console.error('Arama yaparken bir hata oluştu:', error);
            }
        } else {
            searchResults.innerHTML = '';  // Arama kutusu boşsa sonuçları temizle
        }
    });
}

function displaySearchResults(products) {
    const searchResults = document.querySelector('.search_results');
    searchResults.innerHTML = ''; // Önceki sonuçları temizle

    if (products.length > 0) {
        products.forEach(product => {
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
                        <option value="15" data-price="${(discountedPrice / 1 * 15).toFixed()}">15 ml</option>
                        <option value="30" data-price="${(discountedPrice / 1 * 30).toFixed()}">30 ml</option>
                        <option value="50" data-price="${(discountedPrice / 1 * 50).toFixed()}">50 ml</option>
                    </select>
                </div>
                <a href="javascript:void(0)" class="add-to-cart" style="background-color: #333333" 
                    onclick="addToCart('${product._id}', '${product.name}', '${product.img}', ${discountedPrice}, document.getElementById('volumeSelect_${product._id}').value)">
                    <i class="fa-solid fa-cart-shopping" style="color: white;"></i>
                </a>
            `;

            searchResults.appendChild(productElement); // Ürün sonuçlarını listele
        });
    } else {
        searchResults.innerHTML = '<p>Ətir tapılmadı.</p>'; // Hiçbir sonuç yoksa mesaj yaz
    }
}
addCardAndSearch();

let skipCount = 2;
const limit = 6;
let loadedProductIds = [];
let currentCategory = 'all';

function loadMoreProducts() {
    let url;

    // Set the URL based on the current category
    if (currentCategory !== 'all') {
        url = `/products/filter/${currentCategory}?skip=${skipCount}&limit=${limit}`;
    } else {
        url = `/api/products?skip=${skipCount}&limit=${limit}`;
    }

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(products => {
            const productsContainer = document.getElementById('productsContainer');

            // Filter out products that have already been loaded
            const newProducts = products.filter(product =>
                !loadedProductIds.includes(product._id)
            );

            if (newProducts.length > 0) {
                newProducts.forEach(product => {
                    const originalPrice = typeof product.price === 'object' && product.price.$numberDecimal
                        ? parseFloat(product.price.$numberDecimal)
                        : product.price;

                    const discount = product.discount ? parseFloat(product.discount.$numberDecimal) : 0;
                    const discountedPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;

                    // Create product HTML
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
                            <div class="volume-select">
                                <select class="volume-options" id="volumeSelect_${product._id}">
                                    <option value="15" data-price="${(discountedPrice * 15).toFixed()}">15 ml - ${(discountedPrice * 15).toFixed()} ₼</option>
                                    <option value="30" data-price="${(discountedPrice * 30).toFixed()}">30 ml - ${(discountedPrice * 30).toFixed()} ₼</option>
                                    <option value="50" data-price="${(discountedPrice * 50).toFixed()}">50 ml - ${(discountedPrice * 50).toFixed()} ₼</option>
                                </select>
                            </div>
                            <a href="javascript:void(0)" class="add-to-cart" style="background-color: #333333;" 
                                onclick="addToCart('${product._id}', '${product.name}', '${product.img}', ${discountedPrice}, document.getElementById('volumeSelect_${product._id}').value)">
                                <i class="fa-solid fa-cart-shopping" style="color: white;"></i>
                            </a>
                        </div>
                    </div>
                    `;

                    // Append new product HTML to the container
                    productsContainer.insertAdjacentHTML('beforeend', productHTML);
                    loadedProductIds.push(product._id); // Track the loaded product ID
                });

                skipCount += newProducts.length; // Increment skip counter for the next load
            } else {
                // If no new products, you can choose to hide the "Load More" button or show a message
                document.getElementById('loadMoreButton').style.display = 'flex';
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

function shareOnWhatsApp() {
    let message = "Salam, Jannab parfümdən bu məhsulları sifariş vermək istəyirəm\n\n";

    // Loop through the cart to get the product details
    for (const key in cart) {
        const { name, price, quantity, volume } = cart[key];
        message += `${name} (${volume} ml) - ₼${price.toFixed(2)} x ${quantity}\n`; // Miktarı ekliyoruz
    }

    // Create the WhatsApp URL
    const phoneNumber = "+994775626277"; // Paylaşım yapılacak telefon numarası
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // Open WhatsApp sharing
    window.open(whatsappURL, '_blank');
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
                    <input type="text" value="${quantity}" ready>
                    <button onclick="changeQuantity('${key}', -1)">-</button>
                </div>
            </div>
        `;
    }

    document.getElementById('totalPrice').innerText = totalPrice.toFixed(2); // Toplam fiyatı 2 ondalık basamakla göster

    // Add WhatsApp share button

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
    currentCategory = 'new_arrivals';  // Update the current category
    skipCount = 0; // Reset skip count
    loadedProductIds = []; // Clear previously loaded IDs
    await fetchAndDisplayProducts('/admin/new-arrivals');
}

async function filterBestSellers() {
    currentCategory = 'best_sellers'; // Update the current category
    skipCount = 0; // Reset skip count
    loadedProductIds = []; // Clear previously loaded IDs
    await fetchAndDisplayProducts('/admin/best-sellers');
}

async function filterDiscountedProducts() {
    currentCategory = 'discounted_products'; // Update the current category
    skipCount = 0; // Reset skip count
    loadedProductIds = []; // Clear previously loaded IDs
    await fetchAndDisplayProducts('/admin/discounted-products');
}

async function fetchAndDisplayProducts(url) {
    try {
        const response = await fetch(url);
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

async function filterAllProducts() {
    currentCategory = 'all'; // Set category to all
    skipCount = 0; // Reset skip
    loadedProductIds = []; // Clear previously loaded IDs
    fetch('/api/products')
        .then(response => response.json())
        .then(products => renderProducts(products))
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
        const discountedPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;

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
                    <div class="price" style="display: none;">
                        ${originalPrice} ₼
                    </div>
                    <div class="volume-select">
                        <select class="volume-options" id="volumeSelect_${product._id}">
                            <option value="15" data-price="${(discountedPrice * 15).toFixed()}">15 ml - ${(discountedPrice * 15).toFixed()} ₼</option>
                            <option value="30" data-price="${(discountedPrice * 30).toFixed()}">30 ml - ${(discountedPrice * 30).toFixed()} ₼</option>
                            <option value="50" data-price="${(discountedPrice * 50).toFixed()}">50 ml - ${(discountedPrice * 50).toFixed()} ₼</option>
                        </select>
                    </div>
                    <a href="javascript:void(0)" class="add-to-cart" 
                        onclick="addToCart('${product._id}', '${product.name}', '${product.img}', ${discountedPrice}, document.getElementById('volumeSelect_${product._id}').value)"
                        style="background-color: #333333;">
                        <i class="fa-solid fa-cart-shopping" style="color: white;"></i>
                    </a>
                </div>
            </div>
        `;

        productsContainer.insertAdjacentHTML('beforeend', productHTML);

        loadedProductIds.push(product._id); // Track loaded product ID
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
    currentCategory = gender; // Update the current category
    skipCount = 0; // Reset skip count for new category
    loadedProductIds = []; // Clear previously loaded product IDs
    try {
        const response = await fetch(`/products/filter/${gender}`); // Fetch filtered products
        if (!response.ok) {
            throw new Error('Hata: Ürünler alınamadı.');
        }
        const products = await response.json();
        renderProducts(products); // Render to display the products
    } catch (error) {
        console.error(error);
    }
}

function renderProducts(products) {
    const productsContainer = document.getElementById('productsContainer');
    productsContainer.innerHTML = ''; // Clear existing products

    products.forEach(product => {
        const originalPrice = typeof product.price === 'object' && product.price.$numberDecimal
            ? parseFloat(product.price.$numberDecimal)
            : product.price;

        const discount = product.discount ? parseFloat(product.discount.$numberDecimal) : 0;
        const discountedPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;

        // Create product element HTML
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
                <div class="volume-select">
                    <select class="volume-options" id="volumeSelect_${product._id}">
                        <option value="15" data-price="${(discountedPrice * 15).toFixed()}">15 ml - ${(discountedPrice * 15).toFixed()} ₼</option>
                        <option value="30" data-price="${(discountedPrice * 30).toFixed()}">30 ml - ${(discountedPrice * 30).toFixed()} ₼</option>
                        <option value="50" data-price="${(discountedPrice * 50).toFixed()}">50 ml - ${(discountedPrice * 50).toFixed()} ₼</option>
                    </select>
                </div>
                <a href="javascript:void(0)" 
                    class="add-to-cart" 
                    onclick="addToCart('${product._id}', '${product.name}', '${product.img}', ${discountedPrice}, document.getElementById('volumeSelect_${product._id}').value)" 
                    style="background-color: #333333">
                    <i class="fa-solid fa-cart-shopping" style="color: white;"></i>
                </a>
            </div>
            </div>
        `;

        productsContainer.insertAdjacentHTML('beforeend', productElement); // Append new product
        loadedProductIds.push(product._id); // Track the loaded product ID

    });
}