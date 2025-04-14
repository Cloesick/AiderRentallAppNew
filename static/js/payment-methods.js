// Payment Methods Management
document.addEventListener('DOMContentLoaded', function() {
    // Initialize payment methods if the user is logged in
    if (document.querySelector('.payment-methods-container')) {
        initializePaymentMethods();
    }
});

function initializePaymentMethods() {
    const container = document.querySelector('.payment-methods-container');
    if (!container) return;
    
    // Load saved payment methods
    loadPaymentMethods(container);
    
    // Add new payment method button
    const addButton = container.querySelector('.add-payment-method');
    if (addButton) {
        addButton.addEventListener('click', function() {
            showAddPaymentMethodModal();
        });
    }
}

// Load saved payment methods from localStorage or server
function loadPaymentMethods(container) {
    const paymentMethodsList = container.querySelector('.payment-methods-list');
    if (!paymentMethodsList) return;
    
    // In a real app, this would fetch from the server
    // For demo, we'll use localStorage
    const savedMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
    
    if (savedMethods.length === 0) {
        paymentMethodsList.innerHTML = '<p>No payment methods added yet.</p>';
        return;
    }
    
    // Clear the list
    paymentMethodsList.innerHTML = '';
    
    // Add each payment method to the list
    savedMethods.forEach(method => {
        const methodElement = document.createElement('div');
        methodElement.className = 'payment-method-item';
        methodElement.dataset.id = method.id;
        
        // Create payment method content based on type
        let methodContent = '';
        
        switch (method.type) {
            case 'credit-card':
                methodContent = `
                    <div class="payment-method-icon ${method.brand.toLowerCase()}"></div>
                    <div class="payment-method-details">
                        <div class="payment-method-name">${method.brand} •••• ${method.last4}</div>
                        <div class="payment-method-expiry">Expires ${method.expMonth}/${method.expYear}</div>
                    </div>
                `;
                break;
                
            case 'bank-account':
                methodContent = `
                    <div class="payment-method-icon bank-account"></div>
                    <div class="payment-method-details">
                        <div class="payment-method-name">Bank Account</div>
                        <div class="payment-method-number">•••• ${method.last4}</div>
                    </div>
                `;
                break;
                
            case 'paypal':
                methodContent = `
                    <div class="payment-method-icon paypal"></div>
                    <div class="payment-method-details">
                        <div class="payment-method-name">PayPal</div>
                        <div class="payment-method-email">${method.email}</div>
                    </div>
                `;
                break;
        }
        
        // Add actions
        methodContent += `
            <div class="payment-method-actions">
                <button class="edit-payment-method" data-id="${method.id}">Edit</button>
                <button class="delete-payment-method" data-id="${method.id}">Delete</button>
            </div>
        `;
        
        methodElement.innerHTML = methodContent;
        paymentMethodsList.appendChild(methodElement);
        
        // Add event listeners
        methodElement.querySelector('.edit-payment-method').addEventListener('click', function() {
            editPaymentMethod(method.id);
        });
        
        methodElement.querySelector('.delete-payment-method').addEventListener('click', function() {
            deletePaymentMethod(method.id);
        });
    });
}

// Show modal to add a new payment method
function showAddPaymentMethodModal() {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'payment-method-modal';
    modal.innerHTML = `
        <div class="payment-method-modal-content">
            <h2>Add Payment Method</h2>
            <div class="payment-method-tabs">
                <button class="payment-method-tab active" data-tab="credit-card">Credit Card</button>
                <button class="payment-method-tab" data-tab="bank-account">Bank Account</button>
                <button class="payment-method-tab" data-tab="paypal">PayPal</button>
            </div>
            
            <div class="payment-method-tab-content active" id="credit-card-tab">
                <form id="credit-card-form">
                    <div class="form-group">
                        <label for="card-number">Card Number</label>
                        <input type="text" id="card-number" placeholder="1234 5678 9012 3456" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="card-expiry">Expiration Date</label>
                            <input type="text" id="card-expiry" placeholder="MM/YY" required>
                        </div>
                        <div class="form-group">
                            <label for="card-cvc">CVC</label>
                            <input type="text" id="card-cvc" placeholder="123" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="card-name">Name on Card</label>
                        <input type="text" id="card-name" required>
                    </div>
                    <div class="form-group">
                        <label>Card Type</label>
                        <div class="card-types">
                            <label class="card-type-option">
                                <input type="radio" name="card-type" value="visa" checked>
                                <span class="card-type-icon visa"></span>
                            </label>
                            <label class="card-type-option">
                                <input type="radio" name="card-type" value="mastercard">
                                <span class="card-type-icon mastercard"></span>
                            </label>
                            <label class="card-type-option">
                                <input type="radio" name="card-type" value="amex">
                                <span class="card-type-icon amex"></span>
                            </label>
                            <label class="card-type-option">
                                <input type="radio" name="card-type" value="discover">
                                <span class="card-type-icon discover"></span>
                            </label>
                        </div>
                    </div>
                </form>
            </div>
            
            <div class="payment-method-tab-content" id="bank-account-tab">
                <form id="bank-account-form">
                    <div class="form-group">
                        <label for="account-name">Account Holder Name</label>
                        <input type="text" id="account-name" required>
                    </div>
                    <div class="form-group">
                        <label for="account-number">Account Number</label>
                        <input type="text" id="account-number" required>
                    </div>
                    <div class="form-group">
                        <label for="routing-number">Routing Number</label>
                        <input type="text" id="routing-number" required>
                    </div>
                    <div class="form-group">
                        <label for="bank-name">Bank Name</label>
                        <input type="text" id="bank-name" required>
                    </div>
                </form>
            </div>
            
            <div class="payment-method-tab-content" id="paypal-tab">
                <form id="paypal-form">
                    <div class="form-group">
                        <label for="paypal-email">PayPal Email</label>
                        <input type="email" id="paypal-email" required>
                    </div>
                    <p>You will be redirected to PayPal to complete the connection.</p>
                </form>
            </div>
            
            <div class="modal-buttons">
                <button class="cancel-button">Cancel</button>
                <button class="save-button">Save Payment Method</button>
            </div>
        </div>
    `;
    
    // Add modal to the page
    document.body.appendChild(modal);
    
    // Add event listeners
    const tabs = modal.querySelectorAll('.payment-method-tab');
    const tabContents = modal.querySelectorAll('.payment-method-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Cancel button
    modal.querySelector('.cancel-button').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // Save button
    modal.querySelector('.save-button').addEventListener('click', function() {
        const activeTab = modal.querySelector('.payment-method-tab.active').getAttribute('data-tab');
        
        switch (activeTab) {
            case 'credit-card':
                saveCardPaymentMethod(modal);
                break;
                
            case 'bank-account':
                saveBankAccountPaymentMethod(modal);
                break;
                
            case 'paypal':
                savePayPalPaymentMethod(modal);
                break;
        }
    });
}

// Save credit card payment method
function saveCardPaymentMethod(modal) {
    const cardNumber = modal.querySelector('#card-number').value;
    const cardExpiry = modal.querySelector('#card-expiry').value;
    const cardCVC = modal.querySelector('#card-cvc').value;
    const cardName = modal.querySelector('#card-name').value;
    const cardType = modal.querySelector('input[name="card-type"]:checked').value;
    
    // Validate inputs
    if (!cardNumber || !cardExpiry || !cardCVC || !cardName) {
        alert('Please fill in all fields');
        return;
    }
    
    // Parse expiry date
    const [expMonth, expYear] = cardExpiry.split('/');
    
    // Create payment method object
    const paymentMethod = {
        id: 'card_' + Date.now(),
        type: 'credit-card',
        brand: cardType.charAt(0).toUpperCase() + cardType.slice(1),
        last4: cardNumber.slice(-4),
        expMonth,
        expYear,
        name: cardName
    };
    
    // Save payment method
    savePaymentMethod(paymentMethod);
    
    // Close modal
    document.body.removeChild(modal);
}

// Save bank account payment method
function saveBankAccountPaymentMethod(modal) {
    const accountName = modal.querySelector('#account-name').value;
    const accountNumber = modal.querySelector('#account-number').value;
    const routingNumber = modal.querySelector('#routing-number').value;
    const bankName = modal.querySelector('#bank-name').value;
    
    // Validate inputs
    if (!accountName || !accountNumber || !routingNumber || !bankName) {
        alert('Please fill in all fields');
        return;
    }
    
    // Create payment method object
    const paymentMethod = {
        id: 'bank_' + Date.now(),
        type: 'bank-account',
        last4: accountNumber.slice(-4),
        name: accountName,
        bankName
    };
    
    // Save payment method
    savePaymentMethod(paymentMethod);
    
    // Close modal
    document.body.removeChild(modal);
}

// Save PayPal payment method
function savePayPalPaymentMethod(modal) {
    const email = modal.querySelector('#paypal-email').value;
    
    // Validate inputs
    if (!email) {
        alert('Please enter your PayPal email');
        return;
    }
    
    // Create payment method object
    const paymentMethod = {
        id: 'paypal_' + Date.now(),
        type: 'paypal',
        email
    };
    
    // Save payment method
    savePaymentMethod(paymentMethod);
    
    // Close modal
    document.body.removeChild(modal);
}

// Save payment method to localStorage or server
function savePaymentMethod(paymentMethod) {
    // In a real app, this would send to the server
    // For demo, we'll use localStorage
    const savedMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
    savedMethods.push(paymentMethod);
    localStorage.setItem('paymentMethods', JSON.stringify(savedMethods));
    
    // Reload payment methods
    const container = document.querySelector('.payment-methods-container');
    if (container) {
        loadPaymentMethods(container);
    }
}

// Edit payment method
function editPaymentMethod(id) {
    // In a real app, this would fetch the payment method from the server
    // For demo, we'll use localStorage
    const savedMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
    const method = savedMethods.find(m => m.id === id);
    
    if (!method) {
        alert('Payment method not found');
        return;
    }
    
    // Show edit modal based on payment method type
    switch (method.type) {
        case 'credit-card':
            showEditCardModal(method);
            break;
            
        case 'bank-account':
            showEditBankAccountModal(method);
            break;
            
        case 'paypal':
            showEditPayPalModal(method);
            break;
    }
}

// Delete payment method
function deletePaymentMethod(id) {
    if (!confirm('Are you sure you want to delete this payment method?')) {
        return;
    }
    
    // In a real app, this would send to the server
    // For demo, we'll use localStorage
    let savedMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
    savedMethods = savedMethods.filter(m => m.id !== id);
    localStorage.setItem('paymentMethods', JSON.stringify(savedMethods));
    
    // Reload payment methods
    const container = document.querySelector('.payment-methods-container');
    if (container) {
        loadPaymentMethods(container);
    }
}

// Show edit card modal
function showEditCardModal(method) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'payment-method-modal';
    modal.innerHTML = `
        <div class="payment-method-modal-content">
            <h2>Edit Credit Card</h2>
            <form id="edit-credit-card-form">
                <div class="form-group">
                    <label>Card Number</label>
                    <div class="card-number-display">•••• •••• •••• ${method.last4}</div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-card-expiry">Expiration Date</label>
                        <input type="text" id="edit-card-expiry" value="${method.expMonth}/${method.expYear}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="edit-card-name">Name on Card</label>
                    <input type="text" id="edit-card-name" value="${method.name}" required>
                </div>
            </form>
            
            <div class="modal-buttons">
                <button class="cancel-button">Cancel</button>
                <button class="save-button">Save Changes</button>
            </div>
        </div>
    `;
    
    // Add modal to the page
    document.body.appendChild(modal);
    
    // Cancel button
    modal.querySelector('.cancel-button').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // Save button
    modal.querySelector('.save-button').addEventListener('click', function() {
        const cardExpiry = modal.querySelector('#edit-card-expiry').value;
        const cardName = modal.querySelector('#edit-card-name').value;
        
        // Validate inputs
        if (!cardExpiry || !cardName) {
            alert('Please fill in all fields');
            return;
        }
        
        // Parse expiry date
        const [expMonth, expYear] = cardExpiry.split('/');
        
        // Update payment method
        const savedMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
        const index = savedMethods.findIndex(m => m.id === method.id);
        
        if (index !== -1) {
            savedMethods[index] = {
                ...savedMethods[index],
                expMonth,
                expYear,
                name: cardName
            };
            
            localStorage.setItem('paymentMethods', JSON.stringify(savedMethods));
            
            // Reload payment methods
            const container = document.querySelector('.payment-methods-container');
            if (container) {
                loadPaymentMethods(container);
            }
        }
        
        // Close modal
        document.body.removeChild(modal);
    });
}

// Show edit bank account modal
function showEditBankAccountModal(method) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'payment-method-modal';
    modal.innerHTML = `
        <div class="payment-method-modal-content">
            <h2>Edit Bank Account</h2>
            <form id="edit-bank-account-form">
                <div class="form-group">
                    <label for="edit-account-name">Account Holder Name</label>
                    <input type="text" id="edit-account-name" value="${method.name}" required>
                </div>
                <div class="form-group">
                    <label>Account Number</label>
                    <div class="account-number-display">•••• •••• •••• ${method.last4}</div>
                </div>
                <div class="form-group">
                    <label for="edit-bank-name">Bank Name</label>
                    <input type="text" id="edit-bank-name" value="${method.bankName}" required>
                </div>
            </form>
            
            <div class="modal-buttons">
                <button class="cancel-button">Cancel</button>
                <button class="save-button">Save Changes</button>
            </div>
        </div>
    `;
    
    // Add modal to the page
    document.body.appendChild(modal);
    
    // Cancel button
    modal.querySelector('.cancel-button').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // Save button
    modal.querySelector('.save-button').addEventListener('click', function() {
        const accountName = modal.querySelector('#edit-account-name').value;
        const bankName = modal.querySelector('#edit-bank-name').value;
        
        // Validate inputs
        if (!accountName || !bankName) {
            alert('Please fill in all fields');
            return;
        }
        
        // Update payment method
        const savedMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
        const index = savedMethods.findIndex(m => m.id === method.id);
        
        if (index !== -1) {
            savedMethods[index] = {
                ...savedMethods[index],
                name: accountName,
                bankName
            };
            
            localStorage.setItem('paymentMethods', JSON.stringify(savedMethods));
            
            // Reload payment methods
            const container = document.querySelector('.payment-methods-container');
            if (container) {
                loadPaymentMethods(container);
            }
        }
        
        // Close modal
        document.body.removeChild(modal);
    });
}

// Show edit PayPal modal
function showEditPayPalModal(method) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'payment-method-modal';
    modal.innerHTML = `
        <div class="payment-method-modal-content">
            <h2>Edit PayPal</h2>
            <form id="edit-paypal-form">
                <div class="form-group">
                    <label for="edit-paypal-email">PayPal Email</label>
                    <input type="email" id="edit-paypal-email" value="${method.email}" required>
                </div>
            </form>
            
            <div class="modal-buttons">
                <button class="cancel-button">Cancel</button>
                <button class="save-button">Save Changes</button>
            </div>
        </div>
    `;
    
    // Add modal to the page
    document.body.appendChild(modal);
    
    // Cancel button
    modal.querySelector('.cancel-button').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // Save button
    modal.querySelector('.save-button').addEventListener('click', function() {
        const email = modal.querySelector('#edit-paypal-email').value;
        
        // Validate inputs
        if (!email) {
            alert('Please enter your PayPal email');
            return;
        }
        
        // Update payment method
        const savedMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
        const index = savedMethods.findIndex(m => m.id === method.id);
        
        if (index !== -1) {
            savedMethods[index] = {
                ...savedMethods[index],
                email
            };
            
            localStorage.setItem('paymentMethods', JSON.stringify(savedMethods));
            
            // Reload payment methods
            const container = document.querySelector('.payment-methods-container');
            if (container) {
                loadPaymentMethods(container);
            }
        }
        
        // Close modal
        document.body.removeChild(modal);
    });
}
