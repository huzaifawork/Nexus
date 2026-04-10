# Week 3 Milestone 6 - Payment System Testing Guide

**Status**: 🎉 **READY FOR TESTING**  
**Backend**: ✅ Running on http://localhost:5000  
**Frontend**: ✅ Built successfully  
**Database**: ✅ Connected to MongoDB

---

## 🚀 Quick Start

### 1. Ensure Backend is Running

```bash
cd backend
npm start
# Expected output:
# Server running on port 5000
# MongoDB Connected: [connection string]
```

### 2. Start Frontend Development Server

```bash
npm run dev
# Frontend running on http://localhost:5173
```

### 3. Navigate to Payments

1. Log in as Entrepreneur or Investor
2. Click "Payments" in sidebar (Wallet icon)
3. Should see dashboard with $0.00 balance

---

## 📋 Test Scenarios

### Scenario 1: First Deposit ✅

**Goal**: Add funds to wallet

**Steps**:

1. Click "Deposit Funds" button
2. Enter amount: `100`
3. Select payment method: (any available or mock)
4. Leave description empty or add "Initial deposit"
5. Click "Deposit" button
6. **Expected**:
   - Success toast: "Deposit successful!"
   - Wallet balance: $100.00
   - Stats updated: Total Deposited = $100.00
   - Transaction appears in history

**API Call**:

```bash
POST /api/payments/deposit
{
  "amount": 100,
  "paymentMethodId": "...",
  "description": "Initial deposit"
}
```

**Database Result**:

- Transaction created with status: `completed`
- User.walletBalance: 100
- Transaction.type: `deposit`

---

### Scenario 2: Withdrawal with Fee ✅

**Goal**: Withdraw funds and verify 2% fee

**Precondition**: Must have $100+ in wallet (from Scenario 1)

**Steps**:

1. Click "Withdraw Funds" button
2. Enter amount: `50`
3. **Verify fee display**:
   - Amount: $50.00
   - Fee (2%): $1.00
   - Total: $51.00
4. Select destination account
5. Click "Withdraw" button
6. **Expected**:
   - Success toast: "Withdrawal successful!"
   - Wallet balance: $49.00 (100 - 50 - 1)
   - Transaction shows: Amount $50 + Fee $1
   - Type: `withdrawal`

**Fee Calculation**:

- Math: $50 × 0.02 = $1.00
- Total deducted: $50 + $1 = $51

**Database Result**:

- Transaction: status `completed`, amount 50, fee 1.00
- User.walletBalance: 49

---

### Scenario 3: P2P Transfer with Search ✅

**Goal**: Transfer funds to another user with 1% fee

**Precondition**:

- Logged in as User A with $49+ balance
- User B exists with email registered

**Steps**:

1. Click "Transfer Funds" button
2. Enter amount: `20`
3. Enter recipient email: `user2@example.com` (or real registered email)
4. **Wait for search** (500ms debounce)
5. **Verify green confirmation**: "✓ User Name"
6. **Verify fee display**:
   - Amount: $20.00
   - Fee (1%): $0.20
   - Total: $20.20
7. Click "Transfer" button
8. **Expected**:
   - Success toast: "Transfer of $20 to User Name successful!"
   - User A balance: $28.80 (49 - 20 - 0.20)
   - 2 transactions created (transfer_out and transfer_in)

**Fee Calculation**:

- Math: $20 × 0.01 = $0.20
- Total deducted: $20 + $0.20 = $20.20

**Verify Both Users**:

- **User A**: Balance decreased by $20.20
- **User B**: Balance increased by $20
- Both transactions in history for each user

**Database Result**:

- Transaction 1 (transfer_out): User A → User B, $20, status completed
- Transaction 2 (transfer_in): User B received, $20, status completed
- Each user sees their respective transaction

---

### Scenario 4: View Transaction History ✅

**Goal**: View and filter transaction history

**Steps**:

1. Already on Payments page with 3+ transactions
2. **View All Transactions** tab (default)
   - Should show all 3 transactions (deposit, withdrawal, transfer)
3. **Click Deposits filter**
   - Should show only 1 transaction (the deposit)
4. **Click Withdrawals filter**
   - Should show only 1 transaction (the withdrawal)
5. **Click Transfers filter**
   - Should show only 1 transaction (the transfer)
6. **Click All** to reset
7. **Verify columns**:
   - Type (icon shown correctly)
   - Date (formatted: Jan 15, 2024)
   - Amount (with +/- prefix and fee if applicable)
   - Status (icons: ✓ completed, ⏱ pending, ✗ failed)
   - Description (or `-`)

**Expected Display** (example row):

```
📥 Deposit      | Jan 15, 2:30 PM | +$100.00  | ✓ Completed | Initial deposit
📤 Withdrawal   | Jan 15, 2:35 PM | -$50.00   | ✓ Completed | -
                |                 | Fee: $1.00|             |
📤 Transfer Out | Jan 15, 2:40 PM | -$20.00   | ✓ Completed | -
                |                 | Fee: $0.20|             |
```

---

### Scenario 5: Error Handling ✅

**Goal**: Test error scenarios

**Test 5a: Insufficient Balance**

1. Try to withdraw more than balance
2. **Expected**: Error toast "Insufficient balance" or similar
3. Withdraw button disabled or error on submit

**Test 5b: Invalid Recipient**

1. In TransferModal, enter non-existent email: `fake@fake.com`
2. **Expected**: No green checkmark, red "User not found"
3. Transfer button disabled until valid recipient

**Test 5c: Self-Transfer Prevention**

1. In TransferModal, enter own email
2. Click Transfer
3. **Expected**: Error "You cannot transfer to yourself"

**Test 5d: Invalid Amount**

1. Enter amount: `0` or negative
2. **Expected**: "Please enter a valid amount" error
3. Submit button disabled

**Test 5e: Missing Payment Method**

1. In DepositModal, don't select payment method
2. Click Deposit
3. **Expected**: "Please select a payment method" error

---

### Scenario 6: Payment Methods Management ✅

**Goal**: Manage saved payment methods

**Steps**:

1. Scroll to "Payment Methods" section
2. **View saved methods**
   - Should list all payment methods
   - One marked as "Default Method"
3. **Delete a method**
   - Click settings/delete icon
   - Confirm deletion
   - **Expected**: Method removed from list, success toast
4. **Try to delete last method** (optional safety check)
   - **Expected**: Either prevents deletion or shows warning

**Display Format**:

```
Payment Method          | Default Indicator
─────────────────────────────────────
Visa Card **** 4242     | Default Method
Bank Account Chase      | (no badge)
PayPal (email@...)      | (no badge)
```

---

### Scenario 7: Wallet Statistics ✅

**Goal**: Verify statistics are calculated correctly

**After completing Scenarios 1-3, verify stats**:

```
Total Deposited:  $100.00  (From deposit)
Total Withdrawn:  $50.00   (From withdrawal)
Total Transferred: $20.00   (From transfer)
Total Transactions: 3        (All transactions count)
Current Balance:  $28.80    (100 - 50 - 1 - 20 - 0.20)
```

**Calculation Breakdown**:

```
Starting:        $0.00
+ Deposit:       $100.00
= Balance:       $100.00
- Withdrawal:    -$50.00
- Withdrawal Fee: -$1.00
= Balance:       $49.00
- Transfer:      -$20.00
- Transfer Fee:  -$0.20
= Final Balance: $28.80
```

---

### Scenario 8: Real-Time Fee Calculation ✅

**Goal**: Verify fees calculated before submission

**Test Different Amounts**:

1. **Withdrawal**:
   - Amount: $100 → Fee: $2.00 → Total: $102.00
   - Amount: $50 → Fee: $1.00 → Total: $51.00
   - Amount: $25.50 → Fee: $0.51 → Total: $26.01

2. **Transfer**:
   - Amount: $100 → Fee: $1.00 → Total: $101.00
   - Amount: $50 → Fee: $0.50 → Total: $50.50
   - Amount: $10 → Fee: $0.10 → Total: $10.10

**Verify**: Fee display updates in real-time as amount changes

---

### Scenario 9: Pagination ✅

**Goal**: Test transaction history pagination

**Steps**:

1. Create 15+ transactions (multiple deposits)
2. Go to Payments page
3. **First page** should show 10 transactions
4. Click "Next"
5. **Second page** should show 5 transactions
6. Click "Previous"
7. **Back to first page** with 10 transactions
8. **Verify page indicator**: "Page 1 of 2"

---

### Scenario 10: Loading States ✅

**Goal**: Verify loading states during API calls

**Test**:

1. Click Deposit, fill form, click Deposit
2. **Expected**:
   - Button shows spinner "Processing..."
   - Inputs disabled
   - Can't click again
   - After success, button returns to normal

---

## 🔬 API Endpoint Testing (Using cURL/Postman)

### Get Wallet Balance

```bash
curl -X GET http://localhost:5000/api/payments/wallet \
  -H "Authorization: Bearer <your_token>"

# Response:
{
  "balance": 28.80,
  "currency": "USD",
  "stats": {
    "totalDeposited": 100,
    "totalWithdrawn": 50,
    "totalTransferred": 20,
    "transactionCount": 3
  }
}
```

### Get Transactions

```bash
curl -X GET "http://localhost:5000/api/payments/transactions?limit=10&page=1" \
  -H "Authorization: Bearer <your_token>"

# Response:
{
  "transactions": [
    {
      "_id": "...",
      "type": "deposit",
      "amount": 100,
      "status": "completed",
      "createdAt": "2024-01-15T14:30:00Z"
    },
    ...
  ],
  "total": 3
}
```

### Deposit

```bash
curl -X POST http://localhost:5000/api/payments/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "amount": 100,
    "paymentMethodId": "...",
    "description": "Test deposit"
  }'
```

### Withdraw

```bash
curl -X POST http://localhost:5000/api/payments/withdraw \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "amount": 50,
    "paymentMethodId": "...",
    "description": "Test withdrawal"
  }'
```

### Transfer

```bash
curl -X POST http://localhost:5000/api/payments/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "amount": 20,
    "recipientId": "...",
    "description": "Test transfer"
  }'
```

---

## 📊 Expected Test Results

| Scenario   | Test             | Expected Result                          | Status |
| ---------- | ---------------- | ---------------------------------------- | ------ |
| Deposit    | Add funds        | Balance +$100, transaction created       | ✅     |
| Withdrawal | Remove with fee  | Balance -$50-$1, transaction created     | ✅     |
| Transfer   | P2P with search  | Both balances updated, dual transactions | ✅     |
| History    | View & filter    | Transactions displayed, pagination works | ✅     |
| Errors     | Invalid input    | Proper error messages                    | ✅     |
| Methods    | Manage payments  | Add/delete/default works                 | ✅     |
| Stats      | Calculate totals | Sums match transactions                  | ✅     |
| Fees       | Fee calculation  | Correct percentages applied              | ✅     |
| Pagination | View pages       | 10 per page, next/prev works             | ✅     |
| Loading    | UI feedback      | Buttons disabled during submission       | ✅     |

---

## 🐛 Troubleshooting

### "MongoDB Connected" but API returns 500 error

- Ensure Payment model is properly connected
- Check if Transaction collection exists in MongoDB
- Restart backend: `npm start`

### Transfer recipient not found

- Verify recipient email exists in Users collection
- Check email is exact match (case-sensitive)
- Try with a test user email

### Withdraw button disabled even with balance

- Check that walletBalance > amount entered
- Wallets are $0 by default, must deposit first
- Check fees: withdraw amount must be: `balance >= amount + (amount * 0.02)`

### Transaction not appearing in history

- Check database directly: `db.transactions.find()`
- Verify userId matches current user
- Check transaction status is "completed"

### Fee calculation wrong

- Verify formula:
  - Withdrawal: `amount * 0.02`
  - Transfer: `amount * 0.01`
- Check fee is added to total deduction

---

## ✅ Sign-Off Checklist

- [ ] Deposit successful, balance updated
- [ ] Withdrawal successful with 2% fee deducted
- [ ] Transfer successful with 1% fee deducted
- [ ] Transaction history displays data correctly
- [ ] Pagination works (10 per page)
- [ ] Filters work (All, Deposits, Withdrawals, Transfers)
- [ ] Error messages show for invalid input
- [ ] Loading states visible during submission
- [ ] Payment methods visible in management section
- [ ] Statistics calculated correctly
- [ ] Sidebar navigation works to /payments
- [ ] JWT authentication enforced on all endpoints
- [ ] Mobile responsive design works
- [ ] No console errors in browser DevTools
- [ ] Backend logs show all API calls

---

**Last Updated**: Week 3 Milestone 6  
**Ready for**: QA Testing, User Acceptance Testing (UAT), Deployment
