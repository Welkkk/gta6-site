document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // LICENSE KEY SYSTEM
    // ==========================================================================
    function getDeviceFingerprint() {
        const parts = [
            navigator.userAgent,
            screen.width,
            screen.height,
            navigator.language,
            new Date().getTimezoneOffset()
        ];
        let hash = 0;
        const str = parts.join('|');
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0;
        }
        return 'PC-' + Math.abs(hash);
    }

    const fingerprint = getDeviceFingerprint();
    const storedKey = localStorage.getItem('gta6_license_key');
    const activationScreen = document.getElementById('activation-screen');
    const activationInput = document.getElementById('activation-key-input');
    const activationBtn = document.getElementById('btn-activate-key');
    const activationError = document.getElementById('activation-error');

    // Auto-verify on page load
    if (storedKey) {
        verifyLicenseKey(storedKey);
    } else {
        activationScreen.classList.remove('hidden');
    }

    async function verifyLicenseKey(key) {
        try {
            const res = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, fingerprint })
            });
            const data = await res.json();
            if (data.success) {
                activationScreen.classList.add('hidden');
            } else {
                localStorage.removeItem('gta6_license_key');
                activationScreen.classList.remove('hidden');
                activationError.textContent = data.reason;
            }
        } catch (e) {
            activationScreen.classList.remove('hidden');
            activationError.textContent = 'Connection to validation server failed.';
        }
    }

    // Submit key handler
    activationBtn.addEventListener('click', async () => {
        const key = activationInput.value.trim().toUpperCase();
        if (!key) {
            activationError.textContent = 'Please enter an access code.';
            return;
        }

        activationBtn.disabled = true;
        activationBtn.querySelector('span').textContent = 'Validating...';
        activationError.textContent = '';

        try {
            const res = await fetch('/api/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, fingerprint })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('gta6_license_key', key);
                activationScreen.classList.add('hidden');
            } else {
                activationError.textContent = data.reason;
            }
        } catch (e) {
            activationError.textContent = 'Failed to contact activation server.';
        } finally {
            activationBtn.disabled = false;
            activationBtn.querySelector('span').textContent = 'Activate Access Code';
        }
    });

    // Auto format input to format GTA6-XXXX-XXXX-XXXX-XXXX
    activationInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        if (value.startsWith('G') && !value.startsWith('GTA6')) {
            if ('GTA6'.startsWith(value)) {
                // allow typing
            } else {
                value = 'GTA6' + value.slice(1);
            }
        }
        
        const segments = [];
        if (value.length > 0) {
            if (value.startsWith('GTA6')) {
                segments.push(value.slice(0, 4));
                let rest = value.slice(4);
                while (rest.length > 0) {
                    segments.push(rest.slice(0, 4));
                    rest = rest.slice(4);
                }
            } else {
                let rest = value;
                while (rest.length > 0) {
                    segments.push(rest.slice(0, 4));
                    rest = rest.slice(4);
                }
            }
        }
        e.target.value = segments.slice(0, 5).join('-');
    });

    // ==========================================================================
    // STATE VARIABLES
    // ==========================================================================
    let currentPlatform = 'xbox'; // 'xbox' or 'ps5'
    let enteredUsername = '';
    let preorderTotal = 20584;
    let selectedEdition = 'standard';
    let selectedPrice = 69.99;

    // Target Date: November 19, 2026
    const targetDate = new Date('November 19, 2026 00:00:00').getTime();

    // ==========================================================================
    // DOM ELEMENTS
    // ==========================================================================
    // Countdown
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minsEl = document.getElementById('mins');
    const secsEl = document.getElementById('secs');

    // Preorder counter
    const preorderCountEl = document.getElementById('preorder-count');

    // Modals & Card
    const modalContainer = document.getElementById('modal-container');
    const modalCard = document.getElementById('modal-card');
    const closeBtns = document.querySelectorAll('.close-modal-btn');

    // Platform buttons
    const btnPs5 = document.getElementById('btn-ps5');
    const btnXbox = document.getElementById('btn-xbox');

    // Modal Stage Elements
    const stageSelectEdition = document.getElementById('stage-select-edition');
    const stageLink = document.getElementById('stage-link');
    const stageConfirm = document.getElementById('stage-confirm');
    const stageCheckout = document.getElementById('stage-checkout');
    const stageSuccess = document.getElementById('stage-success');

    // Stage 0 (Select Edition) Elements
    const selectStoreTitle = document.getElementById('select-store-title');
    const cardStandardEdition = document.getElementById('card-standard-edition');
    const cardUltimateEdition = document.getElementById('card-ultimate-edition');
    const btnNextEdition = document.getElementById('btn-next-edition');

    // Stage 1 (Link Account) Elements
    const linkStoreTitle = document.getElementById('link-store-title');
    const linkInputHeading = document.getElementById('link-input-heading');
    const gamertagInput = document.getElementById('gamertag-input');
    const btnFindAccount = document.getElementById('btn-find-account');
    const gamertagError = document.getElementById('gamertag-error');
    const btnBackLanding = document.querySelector('.btn-back-landing');
    const btnBackToEdition = document.getElementById('btn-back-to-edition');

    // Stage 2 (Confirmation) Elements
    const confirmStoreTitle = document.getElementById('confirm-store-title');
    const confirmAvatarImg = document.getElementById('confirm-avatar-img');
    const confirmUsernameText = document.getElementById('confirm-username-text');
    const confirmPlatformText = document.getElementById('confirm-platform-text');
    const btnConfirmYes = document.getElementById('btn-confirm-yes');
    const btnConfirmNo = document.getElementById('btn-confirm-no');
    const btnBackToLink = document.getElementById('btn-back-to-link');
    const avatarSyncTip = document.getElementById('avatar-sync-tip');
    const syncTipText = document.getElementById('sync-tip-text');

    // Stage 3 (Checkout) Elements
    const checkoutStoreTitle = document.getElementById('checkout-store-title');
    const checkoutRefCode = document.getElementById('checkout-ref-code');
    const checkoutDeliverUsername = document.getElementById('checkout-deliver-username');
    const checkoutPlatformBadge = document.getElementById('checkout-platform-badge');
    const btnConfirmPurchase = document.getElementById('btn-confirm-purchase');
    const btnBackToConfirm = document.getElementById('btn-back-to-confirm');
    const checkoutCoverImg = document.getElementById('checkout-cover-img');
    const checkoutEditionText = document.getElementById('checkout-edition-text');
    const checkoutPriceLabel = document.getElementById('checkout-price-label');
    const checkoutPriceValue = document.getElementById('checkout-price-value');
    const checkoutVatValue = document.getElementById('checkout-vat-value');
    const checkoutTotalValue = document.getElementById('checkout-total-value');

    // Stage 4 (Success) Elements
    const successUsername = document.getElementById('success-username');
    const successPlatform = document.getElementById('success-platform');
    const receiptOrderId = document.getElementById('receipt-order-id');
    const receiptEmail = document.getElementById('receipt-email');
    const btnSuccessDone = document.getElementById('btn-success-done');
    const successEditionText = document.getElementById('success-edition-text');
    const receiptTotalValue = document.getElementById('receipt-total-value');

    // Custom Profile Picture Uploader Elements
    const avatarDropzone = document.getElementById('avatar-dropzone');
    const avatarFileInput = document.getElementById('avatar-file-input');
    let uploadedAvatarBase64 = null;

    // ==========================================================================
    // COUNTDOWN TIMER LOGIC
    // ==========================================================================
    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference <= 0) {
            // Target date reached
            daysEl.textContent = '00';
            hoursEl.textContent = '00';
            minsEl.textContent = '00';
            secsEl.textContent = '00';
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        daysEl.textContent = formatTimeNumber(days);
        hoursEl.textContent = formatTimeNumber(hours);
        minsEl.textContent = formatTimeNumber(minutes);
        secsEl.textContent = formatTimeNumber(seconds);
    }

    function formatTimeNumber(num) {
        return num < 10 ? '0' + num : num;
    }

    // Run immediately and then every second
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // ==========================================================================
    // DYNAMIC PRE-ORDER COUNTER INCREMENTS
    // ==========================================================================
    function formatCount(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function incrementPreorder() {
        // Increment by a random small number (1 to 3) to feel organic
        const increment = Math.floor(Math.random() * 3) + 1;
        preorderTotal += increment;
        
        preorderCountEl.innerHTML = `<span class="count-num">${formatCount(preorderTotal)}</span> pre-orders in the last 24h`;
        
        // Dynamic pulse animation trigger
        const pulseDot = preorderCountEl.previousElementSibling;
        if (pulseDot) {
            pulseDot.style.animation = 'none';
            // Force reflow
            void pulseDot.offsetWidth;
            pulseDot.style.animation = 'pulse 1.8s infinite';
        }
    }

    // Increment every 4 to 8 seconds
    setInterval(incrementPreorder, 5000);

    // ==========================================================================
    // STAGE NAVIGATION UTILITIES
    // ==========================================================================
    function setStage(stageEl) {
        // Hide all stages
        document.querySelectorAll('.modal-stage').forEach(stage => {
            stage.classList.remove('active');
        });
        // Show specified stage
        stageEl.classList.add('active');
    }

    function openModal(platform) {
        currentPlatform = platform;
        enteredUsername = '';
        gamertagInput.value = '';
        gamertagError.style.display = 'none';
        
        // Reset edition selection
        selectedEdition = 'standard';
        selectedPrice = 69.99;
        cardStandardEdition.classList.add('selected');
        cardUltimateEdition.classList.remove('selected');

        // Reset checkout button state
        btnConfirmPurchase.disabled = false;
        btnConfirmPurchase.textContent = 'Confirm purchase - £69.99';
        
        // Reset custom uploaded image
        uploadedAvatarBase64 = null;
        avatarDropzone.querySelector('.upload-text').innerHTML = '<strong>Click to upload</strong> or drag and drop';
        avatarDropzone.querySelector('.upload-subtext').textContent = 'PNG, JPG or JPEG (Max 5MB)';

        // Apply platform theme to card
        modalCard.className = 'modal-card'; // clear previous theme
        if (platform === 'xbox') {
            modalCard.classList.add('theme-xbox');
            
            // Set Stage 0 Text
            selectStoreTitle.textContent = 'MICROSOFT STORE · SELECT EDITION';

            // Set Stage 1 Text
            linkStoreTitle.textContent = 'MICROSOFT STORE · LINK ACCOUNT';
            linkInputHeading.textContent = 'Enter your Xbox Gamertag';
            gamertagInput.placeholder = 'Johnsonxbox892 Xbox';
            
            // Set Stage 2 Text
            confirmStoreTitle.textContent = 'MICROSOFT STORE · ACCOUNT VERIFICATION';
            confirmAvatarImg.src = 'assets/avatar_xbox.png';
            confirmPlatformText.textContent = 'Xbox Live Network';
            
            // Set Stage 3 Text
            checkoutStoreTitle.textContent = 'Microsoft Store · Checkout';
            checkoutPlatformBadge.textContent = 'XBOX SERIES X|S';
            checkoutRefCode.textContent = `XBL-${generateRandomCode()}`;
            
        } else {
            modalCard.classList.add('theme-psn');
            
            // Set Stage 0 Text
            selectStoreTitle.textContent = 'PLAYSTATION STORE · SELECT EDITION';

            // Set Stage 1 Text
            linkStoreTitle.textContent = 'PLAYSTATION NETWORK · LINK ACCOUNT';
            linkInputHeading.textContent = 'Enter your PSN Online ID';
            gamertagInput.placeholder = 'Johnsonpsn892';
            
            // Set Stage 2 Text
            confirmStoreTitle.textContent = 'PLAYSTATION NETWORK · ACCOUNT VERIFICATION';
            confirmAvatarImg.src = 'assets/avatar_psn.png';
            confirmPlatformText.textContent = 'PlayStation Network';
            
            // Set Stage 3 Text
            checkoutStoreTitle.textContent = 'PlayStation Store · Checkout';
            checkoutPlatformBadge.textContent = 'PLAYSTATION 5';
            checkoutRefCode.textContent = `PSN-${generateRandomCode()}`;
        }

        // Set to stage 0 (Select Edition) and open modal
        setStage(stageSelectEdition);
        modalContainer.classList.add('active');
    }

    function closeModal() {
        modalContainer.classList.remove('active');
    }

    function generateRandomCode() {
        // e.g. 5406-398653
        const part1 = Math.floor(1000 + Math.random() * 9000);
        const part2 = Math.floor(100000 + Math.random() * 900000);
        return `${part1}-${part2}`;
    }

    function getUsernameHash(username) {
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
    }

    function cleanUsernameForEmail(name) {
        // Replace spaces and special characters with dots or dashes, convert to lowercase
        return name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(10 + Math.random() * 90);
    }

    // ==========================================================================
    // INTERACTIVE FLOW EVENT LISTENERS
    // ==========================================================================
    
    // Open buttons
    btnXbox.addEventListener('click', () => openModal('xbox'));
    btnPs5.addEventListener('click', () => openModal('ps5'));

    // Close buttons
    closeBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Close modal on click outside card
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            closeModal();
        }
    });

    // Back to landing from Stage 0 (Close Modal)
    btnBackLanding.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
    });

    // Stage 0 Edition Cards Click Events
    cardStandardEdition.addEventListener('click', () => {
        selectedEdition = 'standard';
        selectedPrice = 69.99;
        cardStandardEdition.classList.add('selected');
        cardUltimateEdition.classList.remove('selected');
    });

    cardUltimateEdition.addEventListener('click', () => {
        selectedEdition = 'ultimate';
        selectedPrice = 99.99;
        cardUltimateEdition.classList.add('selected');
        cardStandardEdition.classList.remove('selected');
    });

    // Stage 0 -> Stage 1 (Link Account)
    btnNextEdition.addEventListener('click', () => {
        // Update Stage 1 subtitle description text
        const editionName = selectedEdition === 'standard' ? 'Standard Edition' : 'Ultimate Edition';
        const linkSubtitle = stageLink.querySelector('.modal-subtitle-main');
        linkSubtitle.innerHTML = `We'll attach <strong>${editionName}</strong> to this profile on release day.`;

        setStage(stageLink);
        gamertagInput.focus();
    });

    // Stage 1 -> Back to Stage 0 (Select Edition)
    btnBackToEdition.addEventListener('click', (e) => {
        e.preventDefault();
        setStage(stageSelectEdition);
    });

    // Validate Gamertag -> Move to Stage 2 (Confirmation)
    btnFindAccount.addEventListener('click', () => {
        const rawInput = gamertagInput.value.trim();
        
        if (rawInput.length < 3) {
            gamertagError.style.display = 'block';
            gamertagInput.focus();
            return;
        }

        gamertagError.style.display = 'none';
        enteredUsername = rawInput;

        // Set Stage 2 dynamic values
        confirmUsernameText.textContent = enteredUsername;

        // Use custom uploaded profile picture if available, otherwise use default gray silhouette SVG
        if (uploadedAvatarBase64) {
            confirmAvatarImg.src = uploadedAvatarBase64;
        } else {
            confirmAvatarImg.src = 'assets/default_avatar.svg';
        }

        // Hide the sync tip container (it's not needed since we use a clean default)
        avatarSyncTip.style.display = 'none';

        // Advance
        setStage(stageConfirm);
    });

    // Handle pressing Enter inside the gamertag input field
    gamertagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            btnFindAccount.click();
        }
    });

    // Stage 2: Back to Stage 1
    btnBackToLink.addEventListener('click', (e) => {
        e.preventDefault();
        setStage(stageLink);
        gamertagInput.focus();
    });

    btnConfirmNo.addEventListener('click', () => {
        setStage(stageLink);
        gamertagInput.focus();
    });

    // Stage 2: Yes -> Go to Stage 3 (Checkout)
    btnConfirmYes.addEventListener('click', () => {
        // Populate Checkout elements dynamically based on selected edition
        checkoutDeliverUsername.textContent = enteredUsername;
        
        if (selectedEdition === 'standard') {
            checkoutCoverImg.src = 'assets/gta6_cover.png';
            checkoutEditionText.textContent = 'Standard Edition';
            checkoutPriceLabel.textContent = 'Standard Edition';
            checkoutPriceValue.textContent = '£69.99';
            checkoutVatValue.textContent = '£14.00';
            checkoutTotalValue.textContent = '£69.99';
            btnConfirmPurchase.textContent = 'Confirm purchase - £69.99';
        } else {
            checkoutCoverImg.src = 'assets/gta6_ultimate_edition.png';
            checkoutEditionText.textContent = 'Ultimate Edition';
            checkoutPriceLabel.textContent = 'Ultimate Edition';
            checkoutPriceValue.textContent = '£99.99';
            checkoutVatValue.textContent = '£20.00';
            checkoutTotalValue.textContent = '£99.99';
            btnConfirmPurchase.textContent = 'Confirm purchase - £99.99';
        }

        setStage(stageCheckout);
    });

    // Stage 3: Back to Stage 2
    btnBackToConfirm.addEventListener('click', (e) => {
        e.preventDefault();
        setStage(stageConfirm);
    });

    // Stage 3: Confirm Purchase -> Loading -> Success
    btnConfirmPurchase.addEventListener('click', () => {
        btnConfirmPurchase.disabled = true;
        btnConfirmPurchase.innerHTML = `
            <svg class="spinner" viewBox="0 0 50 50" style="width: 20px; height: 20px; animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px;">
                <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="80, 200" stroke-dashoffset="0" style="stroke-linecap: round;"></circle>
            </svg>
            Processing secure pre-order...
        `;

        // Simulate secure verification
        setTimeout(() => {
            // Setup Success Screen values
            successUsername.textContent = enteredUsername;
            successPlatform.textContent = currentPlatform === 'xbox' ? 'Xbox Series X|S' : 'PlayStation 5';
            
            // Set dynamic edition name and price on receipt
            const editionName = selectedEdition === 'standard' ? 'Standard Edition' : 'Ultimate Edition';
            successEditionText.textContent = editionName;
            receiptTotalValue.textContent = '£' + selectedPrice.toFixed(2);

            receiptOrderId.textContent = `816-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100000 + Math.random() * 900000)}`;
            
            const cleanName = cleanUsernameForEmail(enteredUsername);
            receiptEmail.textContent = `${cleanName}@proton.me`;

            setStage(stageSuccess);
            
            // Add a permanent preorder increment for the active user purchase
            preorderTotal += 1;
            preorderCountEl.innerHTML = `<span class="count-num">${formatCount(preorderTotal)}</span> pre-orders in the last 24h`;
        }, 1800);
    });

    // Stage 4: Done -> Close Modal
    btnSuccessDone.addEventListener('click', () => {
        closeModal();
    });

    // Custom Profile Picture Upload Event Listeners
    avatarDropzone.addEventListener('click', () => {
        avatarFileInput.click();
    });

    avatarFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleAvatarFile(file);
        }
    });

    // Drag and Drop
    avatarDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        avatarDropzone.style.background = 'rgba(255, 255, 255, 0.05)';
    });

    avatarDropzone.addEventListener('dragleave', () => {
        avatarDropzone.style.background = 'rgba(255, 255, 255, 0.01)';
    });

    avatarDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        avatarDropzone.style.background = 'rgba(255, 255, 255, 0.01)';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleAvatarFile(file);
        }
    });

    function handleAvatarFile(file) {
        if (file.size > 5 * 1024 * 1024) {
            alert('File is too large. Max size is 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            uploadedAvatarBase64 = event.target.result;
            avatarDropzone.querySelector('.upload-text').innerHTML = `<strong>Selected file:</strong> ${file.name}`;
            avatarDropzone.querySelector('.upload-subtext').textContent = 'Successfully linked! Click Find to preview.';
        };
        reader.readAsDataURL(file);
    }
});

// CSS Injection for dynamic spinner
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
