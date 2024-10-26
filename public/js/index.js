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
            console.log(products); // Ürün verisini konsola yazdırma

            searchResults.innerHTML = '';

            if (products.length > 0) {
                // Arama kelimesinin hangi ürün adında geçtiğine göre sıralama
                const sortedProducts = products.sort((a, b) => {
                    const aContainsQuery = a.name.toLowerCase().includes(query.toLowerCase());
                    const bContainsQuery = b.name.toLowerCase().includes(query.toLowerCase());
                    
                    // Eşleşme var ise öncelik ver
                    if (aContainsQuery && !bContainsQuery) {
                        return -1; // a önce gelsin
                    } else if (!aContainsQuery && bContainsQuery) {
                        return 1; // b önce gelsin
                    }
                    return 0; // Değişiklik yoksa sıralama aynı kalsın
                });

                sortedProducts.forEach(product => {
                    const productElement = document.createElement('div');
                    productElement.classList.add('product-result');

                    const highlightedName = product.name.replace(new RegExp(`(${query})`, 'gi'), '<strong>$1</strong>');

                    // Fiyatı kontrol et ve al
                    let price;
                    if (product.price) {
                        console.log(`Ürün Fiyatı: ${JSON.stringify(product.price)}`); // Fiyat yapısını görmek için

                        // Fiyatı işleme
                        if (typeof product.price === 'object' && product.price.$numberDecimal) {
                            price = parseFloat(product.price.$numberDecimal); // Fiyata float olarak eriş
                        } else if (typeof product.price === 'number') {
                            price = product.price; // Eğer price doğrudan bir sayı ise
                        }
                    }

                    // Fiyatın geçerli olup olmadığını kontrol et
                    if (isNaN(price)) {
                        console.warn(`Fiyat geçersiz: ${JSON.stringify(product.price)}`);
                        price = null; // Geçersiz fiyat durumunda null'a ata
                    }

                    productElement.innerHTML = `
                        <a href="/products/${product._id}" class="product-link">
                            <img src="${product.img}" alt="${product.name}" class="product-image" />
                            <div class="product-details">
                                <h2 class="product-name">${highlightedName}</h2>
                                <p class="product-price">${price !== null ? price.toFixed(2) : 'Fiyat mevcut değil'}</p>
                            </div>
                        </a>
                        <a href="javascript:void(0)" class="add-to-cart" data-id="${product._id}" data-name="${product.name}" data-img="${product.img}" data-price="${price !== null ? price : '0'}">
                            <i class="fas fa-plus"></i>
                        </a>
                    `;

                    searchResults.appendChild(productElement);
                });

                // Sepete ekleme butonlarına tıklama olayını burada ekle
                document.querySelectorAll('.add-to-cart').forEach(button => {
                    button.addEventListener('click', function () {
                        const productId = this.getAttribute('data-id');
                        const productName = this.getAttribute('data-name');
                        const productImg = this.getAttribute('data-img');
                        const productPrice = this.getAttribute('data-price');

                        const parsedPrice = parseFloat(productPrice);
                        if (isNaN(parsedPrice)) {
                            console.warn(`Fiyat geçersiz: ${productPrice}`);
                            return; // Geçersiz fiyat durumunda işlemi durdur
                        }

                        addToCart(productId, productName, productImg, parsedPrice); 
                    });
                });
            } else {
                searchResults.innerHTML = '<p>Hiçbir ürün bulunamadı.</p>'; // No products found message
            }
        } else {
            searchResults.innerHTML = '';  // Arama boşken sonuçları gizle
        }
    });
}

addCardAndSearch();


let cart = {};
let totalQuantity = 0;
let totalPrice = 0;

function addToCart(id, name, img, price) {
    price = parseFloat(price); // Sayıya dönüştür
    if (isNaN(price)) {
        console.warn(`Kaydedilemiyor, geçersiz fiyat: ${price}`); // Hata mesajı
        return; // Geçersiz fiyat durumu
    }
    if (!cart[id]) {
        cart[id] = { name, img, price, quantity: 0 };
    }
    cart[id].quantity++;
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    cartItems.innerHTML = '';
    totalQuantity = 0;
    totalPrice = 0;

    for (const id in cart) {
        const { name, img, price, quantity } = cart[id];
        totalQuantity += quantity;
        totalPrice += price * quantity;  // Toplam fiyatı hesapla
        cartItems.innerHTML += `
            <div class="product_item">
                <img src="${img}" alt="${name}">
                <div>${name}</div>
                <div class="quantity">
                    <button onclick="changeQuantity('${id}', 1)">+</button>
                    <input type="text" value="${quantity}" readonly>
                    <button onclick="changeQuantity('${id}', -1)">-</button>
                </div>
            </div>
        `;
    }

    document.getElementById('totalPrice').innerText = totalPrice.toFixed(2);  // Toplam fiyatı 2 ondalık basamakla göster
    document.querySelector('.added_product').innerText = totalQuantity;
    document.querySelector('.productNo').innerText = totalQuantity;
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


