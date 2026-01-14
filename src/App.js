import React, { useState, useEffect } from 'react';
import './App.css';

// Security questions and answers
const securityQuestions = [
  { question: "Babu lakae Babu (fire symbol)", answer: "jaibabu" },
  { question: "Cult classic", answer: "khaleja" },
  { question: "Awaiting for?", answer: "varanasi" },
  { question: "Shaked thing", answer: "businessman" }
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [showSecurityScreen, setShowSecurityScreen] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]); // Track payments
  const [longLeaves, setLongLeaves] = useState([]); // Track long leaves
  const [longExtraMilk, setLongExtraMilk] = useState([]); // Track long extra milk
  const [credits, setCredits] = useState([]); // Track customer credits
  const [activeTab, setActiveTab] = useState('customers');
  const [selectedSession, setSelectedSession] = useState('morning'); // Track delivery session

  // Security functions
  const getRandomQuestion = () => {
    const availableQuestions = securityQuestions.filter(
      q => !usedQuestions.includes(q.question)
    );

    if (availableQuestions.length === 0) {
      // If all questions have been used, reset the used list
      setUsedQuestions([]);
      return securityQuestions[Math.floor(Math.random() * securityQuestions.length)];
    }

    const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    setCurrentQuestion(randomQuestion);
    setUsedQuestions(prev => [...prev, randomQuestion.question]);
    return randomQuestion;
  };

  const handleSecurityAnswerChange = (value) => {
    setSecurityAnswer(value.toLowerCase().trim());
  };

  const submitSecurityAnswer = () => {
    if (!currentQuestion) {
      getRandomQuestion();
      return;
    }

    const correctAnswer = currentQuestion.answer.toLowerCase();

    if (securityAnswer === correctAnswer) {
      // Successfully answered, check if we've reached the required number of questions
      if (usedQuestions.length >= 1) { // Just one question for now
        setIsAuthenticated(true);
        setShowSecurityScreen(false);
      } else {
        // Get another random question
        setTimeout(() => {
          setSecurityAnswer('');
          getRandomQuestion();
        }, 500);
      }
    } else {
      alert(`Incorrect answer for: "${currentQuestion.question}"`);
      // Reset and show a new random question
      setSecurityAnswer('');
      setUsedQuestions([]);
      getRandomQuestion();
    }
  };

  const resetSecurity = () => {
    setSecurityAnswer('');
    setCurrentQuestion(null);
    setUsedQuestions([]);
    setShowSecurityScreen(true);
    setTimeout(() => {
      getRandomQuestion();
    }, 100);
  };

  // Initialize with a random question when security screen is shown
  useEffect(() => {
    if (showSecurityScreen && !currentQuestion) {
      setTimeout(() => {
        getRandomQuestion();
      }, 100);
    }
  }, [showSecurityScreen]);

  // Long leave functions
  const addLongLeave = (customerId, startDate, endDate, reason = '') => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const newLongLeave = {
      id: Date.now(),
      customer_id: customerId,
      customer_name: customer.name,
      start_date: startDate,
      end_date: endDate,
      reason: reason,
      created_at: new Date().toISOString()
    };

    setLongLeaves([...longLeaves, newLongLeave]);

    // Also add individual leave records for each day in the range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const date = new Date(start);

    while (date <= end) {
      const dateString = date.toISOString().split('T')[0];
      markLeave(customer, dateString);
      date.setDate(date.getDate() + 1);
    }

    alert(`${customer.name} marked for leave from ${startDate} to ${endDate}. Total days: ${calculateDaysBetweenDates(startDate, endDate)}.`);
  };

  // Long extra milk functions
  const addLongExtraMilk = (customerId, startDate, endDate, dailyExtraQty, reason = '') => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const newLongExtraMilk = {
      id: Date.now(),
      customer_id: customerId,
      customer_name: customer.name,
      start_date: startDate,
      end_date: endDate,
      daily_extra_quantity: parseFloat(dailyExtraQty),
      reason: reason,
      created_at: new Date().toISOString()
    };

    setLongExtraMilk([...longExtraMilk, newLongExtraMilk]);

    // Also add individual extra milk records for each day in the range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const date = new Date(start);
    let totalExtraLiters = 0;

    while (date <= end) {
      const dateString = date.toISOString().split('T')[0];
      addExtraMilk(customer, dateString, dailyExtraQty);
      totalExtraLiters += parseFloat(dailyExtraQty);
      date.setDate(date.getDate() + 1);
    }

    alert(`${customer.name} scheduled for extra ${dailyExtraQty}L daily from ${startDate} to ${endDate}. Total extra: ${totalExtraLiters.toFixed(2)}L.`);
  };

  // Helper function to calculate days between two dates
  const calculateDaysBetweenDates = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDifference = end.getTime() - start.getTime();
    return Math.ceil(timeDifference / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
  };

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    daily_milk_quantity: '',
    milk_rate_per_liter: '',
    shift: 'morning', // morning, evening, occasional
    status: 'active' // active, inactive
  });
  const [editingId, setEditingId] = useState(null);
  const [selectedShift, setSelectedShift] = useState('all'); // For delivery view
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // For delivery view

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedCustomers = localStorage.getItem('milk_customers');
    const savedDeliveries = localStorage.getItem('milk_deliveries');
    const savedBills = localStorage.getItem('milk_bills');
    const savedPayments = localStorage.getItem('milk_payments');

    if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
    if (savedDeliveries) setDeliveries(JSON.parse(savedDeliveries));
    if (savedBills) setBills(JSON.parse(savedBills));
    if (savedPayments) setPayments(JSON.parse(savedPayments));
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('milk_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('milk_deliveries', JSON.stringify(deliveries));
  }, [deliveries]);

  useEffect(() => {
    localStorage.setItem('milk_bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('milk_payments', JSON.stringify(payments));
  }, [payments]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingId) {
      // Update existing customer
      setCustomers(customers.map(c =>
        c.id === editingId ? {
          ...formData,
          id: editingId,
          updated_at: new Date().toISOString()
        } : c
      ));
      setEditingId(null);
    } else {
      // Add new customer
      const newCustomer = {
        ...formData,
        id: Date.now(), // Simple ID generation
        daily_milk_quantity: parseFloat(formData.daily_milk_quantity) || 0,
        milk_rate_per_liter: parseFloat(formData.milk_rate_per_liter) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        default_milk_quantity: parseFloat(formData.daily_milk_quantity) || 0 // Store default quantity
      };

      // Check for duplicate phone numbers only if phone is provided
      if (formData.phone) {
        const existingCustomer = customers.find(c => c.phone === formData.phone);
        if (existingCustomer) {
          alert('Phone number already exists!');
          return;
        }
      }

      setCustomers([...customers, newCustomer]);
    }

    // Reset form
    setFormData({
      name: '',
      phone: '',
      address: '',
      daily_milk_quantity: '',
      milk_rate_per_liter: '',
      shift: 'morning',
      status: 'active'
    });
  };

  const handleEdit = (customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      daily_milk_quantity: customer.daily_milk_quantity,
      milk_rate_per_liter: customer.milk_rate_per_liter,
      shift: customer.shift || 'morning',
      status: customer.status || 'active'
    });
    setEditingId(customer.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      setCustomers(customers.filter(c => c.id !== id));
      // Also remove related deliveries and bills
      setDeliveries(deliveries.filter(d => d.customer_id !== id));
      setBills(bills.filter(b => b.customer_id !== id));
    }
  };

  // Function to generate bill with balance calculation
  const generateBill = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    // Calculate any outstanding balance from previous bills
    const previousUnpaidBills = bills.filter(b =>
      b.customer_id === customerId &&
      !b.paid &&
      !(b.bill_month === new Date().getMonth() + 1 && b.bill_year === new Date().getFullYear())
    );

    const outstandingBalance = previousUnpaidBills.reduce((sum, bill) => sum + (bill.balance || bill.total_amount), 0);

    const today = new Date();
    const newBill = {
      id: Date.now(),
      customer_id: customerId,
      customer_name: customer.name,
      bill_month: today.getMonth() + 1,
      bill_year: today.getFullYear(),
      total_quantity: customer.daily_milk_quantity * 30, // Assuming 30 days
      total_amount: parseFloat((customer.daily_milk_quantity * 30 * customer.milk_rate_per_liter).toFixed(2)),
      bill_generated_at: today.toISOString(),
      sent_to_customer: false,
      paid: false,
      payment_date: null,
      amount_paid: 0,
      balance: parseFloat((customer.daily_milk_quantity * 30 * customer.milk_rate_per_liter + outstandingBalance).toFixed(2)),
      outstanding_balance: outstandingBalance
    };

    setBills([...bills, newBill]);
    alert(`Bill generated for ${customer.name} - Amount: ₹${newBill.balance.toFixed(2)} (includes ₹${outstandingBalance.toFixed(2)} outstanding)`);
  };

  // Function to handle bill payment with cross-month change handling
  const handleBillPayment = (billId, amountPaid) => {
    if (parseFloat(amountPaid) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    const paymentAmount = parseFloat(amountPaid);
    const currentBalance = bill.balance;
    const changeAmount = paymentAmount - currentBalance;

    if (paymentAmount >= currentBalance) {
      // Full payment or overpayment
      const newPayment = {
        id: Date.now(),
        bill_id: billId,
        customer_id: bill.customer_id,
        amount_paid: currentBalance, // Only pay the balance amount
        change_given: changeAmount, // Show the change given
        payment_date: new Date().toISOString(),
        payment_method: 'cash',
        created_at: new Date().toISOString(),
        is_partial: false,
        is_full_with_change: changeAmount > 0,
        change_amount: changeAmount
      };

      setPayments([...payments, newPayment]);

      // Update the current bill as fully paid
      const updatedBill = {
        ...bill,
        paid: true,
        amount_paid: (bill.amount_paid || 0) + currentBalance,
        balance: 0,
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_payment_change: changeAmount > 0 ? changeAmount : 0 // Track change given
      };

      setBills(bills.map(b => b.id === billId ? updatedBill : b));

      // If there's overpayment (change), apply it to the next month's bill
      if (changeAmount > 0) {
        applyChangeToNextMonthBill(bill.customer_id, changeAmount, bill.bill_month, bill.bill_year);
        alert(`Bill paid successfully! Change given: ₹${changeAmount.toFixed(2)} (applied to next month's bill)`);
      } else {
        alert('Bill paid successfully!');
      }
    } else {
      // Partial payment
      const newAmountPaid = (bill.amount_paid || 0) + paymentAmount;
      const newBalance = parseFloat((currentBalance - paymentAmount).toFixed(2));

      const newPayment = {
        id: Date.now(),
        bill_id: billId,
        customer_id: bill.customer_id,
        amount_paid: paymentAmount,
        change_given: 0, // No change for partial payments
        payment_date: new Date().toISOString(),
        payment_method: 'partial',
        created_at: new Date().toISOString(),
        is_partial: true
      };

      setPayments([...payments, newPayment]);

      // Update the bill with new balance
      const updatedBill = {
        ...bill,
        amount_paid: newAmountPaid,
        balance: newBalance,
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setBills(bills.map(b => b.id === billId ? updatedBill : b));

      alert(`Partial payment of ₹${paymentAmount.toFixed(2)} received. Remaining balance: ₹${newBalance.toFixed(2)}`);
    }
  };

  // Function to apply change to next month's bill
  const applyChangeToNextMonthBill = (customerId, changeAmount, currentMonth, currentYear) => {
    // Calculate next month and year
    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear = currentYear + 1;
    }

    // Find the next month's bill for this customer
    const nextMonthBill = bills.find(b =>
      b.customer_id === customerId &&
      b.bill_month === nextMonth &&
      b.bill_year === nextYear
    );

    if (nextMonthBill && !nextMonthBill.paid) {
      // Apply the change to reduce the next month's balance
      const newBalance = Math.max(0, nextMonthBill.balance - changeAmount);
      const newTotalAmount = Math.max(0, nextMonthBill.total_amount - changeAmount);

      setBills(bills.map(b =>
        b.id === nextMonthBill.id
          ? {
              ...b,
              balance: newBalance,
              total_amount: newTotalAmount,
              updated_at: new Date().toISOString(),
              credit_applied: (b.credit_applied || 0) + changeAmount
            }
          : b
      ));

      // Create a credit application record
      const creditRecord = {
        id: Date.now(),
        bill_id: nextMonthBill.id,
        customer_id: customerId,
        credit_amount: changeAmount,
        applied_date: new Date().toISOString(),
        description: `Credit from overpayment in ${getMonthName(currentMonth)} ${currentYear}`
      };

      setCredits(prev => [...prev, creditRecord]);
    } else {
      // If no next month bill exists, create a credit record for future use
      const creditRecord = {
        id: Date.now(),
        customer_id: customerId,
        credit_amount: changeAmount,
        applied_date: new Date().toISOString(),
        description: `Credit from overpayment in ${getMonthName(currentMonth)} ${currentYear}`,
        status: 'pending' // Will be applied when next bill is generated
      };

      setCredits(prev => [...prev, creditRecord]);
    }
  };

  // Helper function to get month name
  const getMonthName = (monthNum) => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    return monthNames[monthNum - 1] || '';
  };

  // Function to add customer credit
  const addCustomerCredit = (customerId, amount) => {
    // Find the customer
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    // Update customer with credit information
    setCustomers(customers.map(c =>
      c.id === customerId
        ? {
            ...c,
            credit_balance: (c.credit_balance || 0) + amount,
            last_credit_added: new Date().toISOString()
          }
        : c
    ));
  };

  // Function to apply overpayment to customer's future bills
  const applyOverpaymentToCustomerBills = (customerId, overpaymentAmount, currentBillId) => {
    // Find unpaid bills for this customer (excluding current bill)
    const customerUnpaidBills = bills
      .filter(b =>
        b.customer_id === customerId &&
        !b.paid &&
        b.id !== currentBillId
      )
      .sort((a, b) => new Date(a.bill_generated_at) - new Date(b.bill_generated_at)); // Sort by oldest first

    let remainingOverpayment = overpaymentAmount;

    for (const bill of customerUnpaidBills) {
      if (remainingOverpayment <= 0) break;

      const amountToApply = Math.min(remainingOverpayment, bill.balance);
      const newBillBalance = parseFloat((bill.balance - amountToApply).toFixed(2));
      const isFullyPaid = newBillBalance <= 0;

      // Create a payment record for the applied amount
      const appliedPayment = {
        id: Date.now() + Math.random(), // Unique ID
        bill_id: bill.id,
        customer_id: customerId,
        amount_paid: amountToApply,
        change_given: 0, // No change for applied payments
        payment_date: new Date().toISOString(),
        payment_method: 'credit_from_overpayment',
        created_at: new Date().toISOString(),
        is_credit_from_overpayment: true,
        original_overpayment_source: currentBillId
      };

      setPayments(prev => [...prev, appliedPayment]);

      // Update the bill
      setBills(prevBills => prevBills.map(b =>
        b.id === bill.id
          ? {
              ...b,
              paid: isFullyPaid,
              amount_paid: (b.amount_paid || 0) + amountToApply,
              balance: newBillBalance,
              payment_date: isFullyPaid ? new Date().toISOString() : b.payment_date,
              updated_at: new Date().toISOString()
            }
          : b
      ));

      remainingOverpayment = parseFloat((remainingOverpayment - amountToApply).toFixed(2));
    }

    if (remainingOverpayment > 0) {
      // If there's still overpayment left, create a credit for the customer
      alert(`₹${remainingOverpayment.toFixed(2)} overpayment has been credited to customer account for future bills.`);
    }
  };

  // Function to handle partial payment with overpayment support
  const handlePartialPayment = (billId, amountPaid, changeGiven = 0) => {
    if (parseFloat(amountPaid) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    const paymentAmount = parseFloat(amountPaid);
    const overpayment = paymentAmount - bill.balance;

    if (overpayment > 0) {
      // Handle overpayment by applying excess to future bills
      alert(`Overpayment of ₹${overpayment.toFixed(2)} detected. This will be applied to future bills.`);

      // Apply the full balance to current bill
      handleBillPayment(billId, bill.balance, changeGiven);

      // Apply remaining amount to future bills
      applyOverpaymentToCustomerBills(bill.customer_id, overpayment);
    } else {
      // Regular payment
      handleBillPayment(billId, amountPaid, changeGiven);
    }
  };

  // Function to apply overpayment to future bills (deprecated - use applyOverpaymentToCustomerBills instead)
  const applyOverpaymentToFutureBills = (customerId, overpaymentAmount) => {
    // This function is deprecated. Use applyOverpaymentToCustomerBills instead.
  };

  // Function to get customers by shift
  const getCustomersByShift = (shift) => {
    if (shift === 'all') {
      return customers.filter(c => c.status === 'active');
    }
    return customers.filter(c => c.shift === shift && c.status === 'active');
  };

  // Function to handle delivery marking with session
  const markDelivery = (customer, date, deliveredQty, session = 'morning') => {
    const existingDelivery = deliveries.find(d =>
      d.customer_id === customer.id && d.date === date && d.session === session
    );

    if (existingDelivery) {
      // Update existing delivery
      setDeliveries(deliveries.map(d =>
        d.id === existingDelivery.id
          ? {
              ...d,
              delivered_quantity: deliveredQty,
              delivered: true,
              leave: false,
              session: session
            }
          : d
      ));
    } else {
      // Create new delivery record
      const newDelivery = {
        id: Date.now(),
        customer_id: customer.id,
        customer_name: customer.name,
        date: date,
        session: session, // Add session information
        scheduled_quantity: customer.default_milk_quantity,
        delivered_quantity: deliveredQty,
        delivered: true,
        leave: false,
        delivery_shift: customer.shift,
        created_at: new Date().toISOString()
      };
      setDeliveries([...deliveries, newDelivery]);
    }
  };

  // Function to mark a leave with session
  const markLeave = (customer, date, session = 'morning') => {
    const existingDelivery = deliveries.find(d =>
      d.customer_id === customer.id && d.date === date && d.session === session
    );

    if (existingDelivery) {
      // Update existing delivery as leave
      setDeliveries(deliveries.map(d =>
        d.id === existingDelivery.id
          ? { ...d, delivered: false, leave: true, session: session }
          : d
      ));
    } else {
      // Create new delivery record marked as leave
      const newDelivery = {
        id: Date.now(),
        customer_id: customer.id,
        customer_name: customer.name,
        date: date,
        session: session, // Add session information
        scheduled_quantity: customer.default_milk_quantity,
        delivered_quantity: 0,
        delivered: false,
        leave: true,
        delivery_shift: customer.shift,
        created_at: new Date().toISOString()
      };
      setDeliveries([...deliveries, newDelivery]);
    }
  };

  // Function to handle extra milk addition
  const addExtraMilk = (customer, date, extraQty) => {
    const existingDelivery = deliveries.find(d =>
      d.customer_id === customer.id && d.date === date
    );

    let newDeliveredQty = customer.default_milk_quantity + parseFloat(extraQty || 0);

    if (existingDelivery) {
      // Update existing delivery with extra milk
      setDeliveries(deliveries.map(d =>
        d.id === existingDelivery.id
          ? { ...d, delivered_quantity: newDeliveredQty, delivered: true, leave: false }
          : d
      ));
    } else {
      // Create new delivery record with extra milk
      const newDelivery = {
        id: Date.now(),
        customer_id: customer.id,
        customer_name: customer.name,
        date: date,
        scheduled_quantity: customer.default_milk_quantity,
        delivered_quantity: newDeliveredQty,
        delivered: true,
        leave: false,
        delivery_shift: customer.shift,
        extra_milk: parseFloat(extraQty || 0)
      };
      setDeliveries([...deliveries, newDelivery]);
    }
  };

  // Function to override default quantity for a specific day
  const overrideDefaultQuantity = (customer, date, newQty) => {
    const existingDelivery = deliveries.find(d =>
      d.customer_id === customer.id && d.date === date
    );

    if (existingDelivery) {
      // Update existing delivery with overridden quantity
      setDeliveries(deliveries.map(d =>
        d.id === existingDelivery.id
          ? { ...d, delivered_quantity: parseFloat(newQty), delivered: true, leave: false }
          : d
      ));
    } else {
      // Create new delivery record with overridden quantity
      const newDelivery = {
        id: Date.now(),
        customer_id: customer.id,
        customer_name: customer.name,
        date: date,
        scheduled_quantity: customer.default_milk_quantity,
        delivered_quantity: parseFloat(newQty),
        delivered: true,
        leave: false,
        delivery_shift: customer.shift,
        quantity_overridden: true
      };
      setDeliveries([...deliveries, newDelivery]);
    }
  };

  // Get deliveries for selected date and shift
  const getDeliveriesForDate = () => {
    let filteredDeliveries = deliveries.filter(d => d.date === selectedDate);

    if (selectedShift !== 'all') {
      filteredDeliveries = filteredDeliveries.filter(d => d.delivery_shift === selectedShift);
    }

    return filteredDeliveries;
  };

  if (showSecurityScreen) {
    return (
      <div className="App">
        <div className="security-screen">
          <div className="security-container">
            <h2>Access Verification</h2>
            <p>Security Question:</p>
            <h3>{currentQuestion?.question || 'Loading...'}</h3>
            <input
              type="text"
              placeholder="Your answer"
              value={securityAnswer}
              onChange={(e) => handleSecurityAnswerChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  submitSecurityAnswer();
                }
              }}
              autoFocus
            />
            <button onClick={submitSecurityAnswer}>Verify Access</button>
            <p className="security-hint">Answer correctly to access the application</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Dairy Management System</h1>
        <button className="logout-btn" onClick={resetSecurity}>Logout</button>
      </header>

      <nav className="tabs">
        <button
          className={activeTab === 'customers' ? 'active' : ''}
          onClick={() => setActiveTab('customers')}
        >
          Customers
        </button>
        <button
          className={activeTab === 'deliveries' ? 'active' : ''}
          onClick={() => setActiveTab('deliveries')}
        >
          Deliveries
        </button>
        <button
          className={activeTab === 'bills' ? 'active' : ''}
          onClick={() => setActiveTab('bills')}
        >
          Bills
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'customers' && (
          <div className="customers-section">
            <form onSubmit={handleSubmit} className="customer-form">
              <h2>{editingId ? 'Edit Customer' : 'Add New Customer'}</h2>

              <div className="input-group">
                <input
                  type="text"
                  name="name"
                  placeholder=" "
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={formData.name ? 'has-value' : ''}
                />
                <label htmlFor="name">Customer Name</label>
              </div>

              <div className="input-group">
                <input
                  type="tel"
                  name="phone"
                  placeholder=" "
                  value={formData.phone}
                  onChange={handleChange}
                  className={formData.phone ? 'has-value' : ''}
                />
                <label htmlFor="phone">Phone Number (Optional)</label>
              </div>

              <div className="input-group">
                <textarea
                  name="address"
                  placeholder=" "
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className={formData.address ? 'has-value' : ''}
                ></textarea>
                <label htmlFor="address">Address</label>
              </div>

              <div className="input-group">
                <input
                  type="number"
                  name="daily_milk_quantity"
                  placeholder=" "
                  value={formData.daily_milk_quantity}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={formData.daily_milk_quantity ? 'has-value' : ''}
                />
                <label htmlFor="daily_milk_quantity">Daily Milk Quantity (L)</label>
              </div>

              <div className="input-group">
                <input
                  type="number"
                  name="milk_rate_per_liter"
                  placeholder=" "
                  value={formData.milk_rate_per_liter}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={formData.milk_rate_per_liter ? 'has-value' : ''}
                />
                <label htmlFor="milk_rate_per_liter">Milk Rate per Liter (₹)</label>
              </div>

              <div className="input-group">
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleChange}
                  className={formData.shift ? 'has-value' : ''}
                >
                  <option value="">Select Shift</option>
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                  <option value="occasional">Occasional</option>
                </select>
                <label htmlFor="shift">Shift</label>
              </div>

              <div className="input-group">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={formData.status ? 'has-value' : ''}
                >
                  <option value="">Select Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <label htmlFor="status">Status</label>
              </div>

              <button type="submit">{editingId ? 'Update' : 'Add'} Customer</button>

              {editingId && (
                <button type="button" onClick={() => {
                  setEditingId(null);
                  setFormData({
                    name: '',
                    phone: '',
                    address: '',
                    daily_milk_quantity: '',
                    milk_rate_per_liter: '',
                    shift: 'morning',
                    status: 'active'
                  });
                }}>
                  Cancel
                </button>
              )}

              {/* Long Leave and Extra Milk Section for Existing Customers */}
              {editingId && (
                <div className="customer-actions">
                  <h3>Special Actions</h3>

                  <div className="action-section">
                    <h4>Long Leave</h4>
                    <div className="input-group">
                      <input type="date" id={`leave-start-${editingId}`} placeholder=" " />
                      <label htmlFor={`leave-start-${editingId}`}>Start Date</label>
                    </div>
                    <div className="input-group">
                      <input type="date" id={`leave-end-${editingId}`} placeholder=" " />
                      <label htmlFor={`leave-end-${editingId}`}>End Date</label>
                    </div>
                    <div className="input-group">
                      <input type="text" id={`leave-reason-${editingId}`} placeholder=" " />
                      <label htmlFor={`leave-reason-${editingId}`}>Reason (optional)</label>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const startDate = document.getElementById(`leave-start-${editingId}`).value;
                        const endDate = document.getElementById(`leave-end-${editingId}`).value;
                        const reason = document.getElementById(`leave-reason-${editingId}`).value;

                        if (startDate && endDate) {
                          addLongLeave(editingId, startDate, endDate, reason);
                          alert('Long leave recorded successfully!');
                          document.getElementById(`leave-start-${editingId}`).value = '';
                          document.getElementById(`leave-end-${editingId}`).value = '';
                          document.getElementById(`leave-reason-${editingId}`).value = '';
                        } else {
                          alert('Please enter both start and end dates');
                        }
                      }}
                    >
                      Record Long Leave
                    </button>
                  </div>

                  <div className="action-section">
                    <h4>Long Extra Milk</h4>
                    <div className="input-group">
                      <input type="date" id={`extra-start-${editingId}`} placeholder=" " />
                      <label htmlFor={`extra-start-${editingId}`}>Start Date</label>
                    </div>
                    <div className="input-group">
                      <input type="date" id={`extra-end-${editingId}`} placeholder=" " />
                      <label htmlFor={`extra-end-${editingId}`}>End Date</label>
                    </div>
                    <div className="input-group">
                      <input type="number" step="0.1" id={`extra-qty-${editingId}`} placeholder=" " />
                      <label htmlFor={`extra-qty-${editingId}`}>Daily Extra Qty (L)</label>
                    </div>
                    <div className="input-group">
                      <input type="text" id={`extra-reason-${editingId}`} placeholder=" " />
                      <label htmlFor={`extra-reason-${editingId}`}>Reason (optional)</label>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const startDate = document.getElementById(`extra-start-${editingId}`).value;
                        const endDate = document.getElementById(`extra-end-${editingId}`).value;
                        const dailyQty = document.getElementById(`extra-qty-${editingId}`).value;
                        const reason = document.getElementById(`extra-reason-${editingId}`).value;

                        if (startDate && endDate && dailyQty) {
                          addLongExtraMilk(editingId, startDate, endDate, parseFloat(dailyQty), reason);
                          alert('Long extra milk recorded successfully!');
                          document.getElementById(`extra-start-${editingId}`).value = '';
                          document.getElementById(`extra-end-${editingId}`).value = '';
                          document.getElementById(`extra-qty-${editingId}`).value = '';
                          document.getElementById(`extra-reason-${editingId}`).value = '';
                        } else {
                          alert('Please enter start date, end date, and daily quantity');
                        }
                      }}
                    >
                      Record Long Extra Milk
                    </button>
                  </div>
                </div>
              )}
            </form>

            <div className="customer-list">
              <h2>Customer List ({customers.length})</h2>

              {customers.length === 0 ? (
                <p>No customers added yet.</p>
              ) : (
                <table className="customer-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th>Shift</th>
                      <th>Daily Qty (L)</th>
                      <th>Rate (₹/L)</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(customer => (
                      <tr key={customer.id}>
                        <td>{customer.name}</td>
                        <td>{customer.phone}</td>
                        <td>{customer.address}</td>
                        <td>
                          <span className={`shift-badge ${customer.shift}`}>
                            {customer.shift.charAt(0).toUpperCase() + customer.shift.slice(1)}
                          </span>
                        </td>
                        <td>{customer.daily_milk_quantity}</td>
                        <td>{customer.milk_rate_per_liter}</td>
                        <td>
                          <span className={`status-badge ${customer.status}`}>
                            {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                          </span>
                        </td>
                        <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                        <td>
                          <button className="action-btn edit-btn" onClick={() => handleEdit(customer)}>Edit</button>
                          <button className="action-btn delete-btn" onClick={() => handleDelete(customer.id)}>Delete</button>
                          <button className="action-btn bill-btn" onClick={() => generateBill(customer.id)}>Generate Bill</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'deliveries' && (
          <div className="deliveries-section">
            <h2>Delivery Management</h2>

            <div className="delivery-controls">
              <label>
                Date:
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </label>

              <label>
                Shift:
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                >
                  <option value="all">All Shifts</option>
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                  <option value="occasional">Occasional</option>
                </select>
              </label>
            </div>

            {/* Delivery Summary */}
            <div className="delivery-summary">
              <h3>Delivery Summary for {new Date(selectedDate).toLocaleDateString()}</h3>
              <div className="summary-stats">
                <div className="stat-card delivered">
                  <h4>✅ Delivered</h4>
                  <p>{getDeliveriesForDate().filter(d => d.delivered && !d.leave).length}</p>
                </div>
                <div className="stat-card pending">
                  <h4>⏳ Pending</h4>
                  <p>{getCustomersByShift(selectedShift).length - getDeliveriesForDate().filter(d => d.delivered || d.leave).length}</p>
                </div>
                <div className="stat-card leave">
                  <h4>🏖️ On Leave</h4>
                  <p>{getDeliveriesForDate().filter(d => d.leave).length}</p>
                </div>
                <div className="stat-card total">
                  <h4>👥 Total</h4>
                  <p>{getCustomersByShift(selectedShift).length}</p>
                </div>
              </div>
            </div>

            {/* Delivered Customers Section */}
            <div className="delivery-section">
              <h3>✅ Delivered ({getDeliveriesForDate().filter(d => d.delivered && !d.leave).length})</h3>
              <div className="delivery-grid">
                {getDeliveriesForDate()
                  .filter(d => d.delivered && !d.leave)
                  .map(delivery => {
                    const customer = customers.find(c => c.id === delivery.customer_id);
                    return (
                      <div key={delivery.id} className="delivery-card delivered">
                        <h4>{customer?.name || 'Unknown Customer'}</h4>
                        <p>Phone: {customer?.phone || 'N/A'}</p>
                        <p>Delivered: {delivery.delivered_quantity}L</p>
                        {delivery.delivered_quantity !== customer?.default_milk_quantity && (
                          <p className="quantity-note">Scheduled: {customer?.default_milk_quantity}L</p>
                        )}
                        <div className="delivery-status delivered">
                          Status: Delivered
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Pending Customers Section */}
            <div className="delivery-section">
              <h3>⏳ Pending ({getCustomersByShift(selectedShift).length - getDeliveriesForDate().filter(d => d.delivered || d.leave).length})</h3>
              <div className="delivery-grid">
                {getCustomersByShift(selectedShift)
                  .filter(customer => {
                    const delivery = deliveries.find(d =>
                      d.customer_id === customer.id && d.date === selectedDate
                    );
                    return !delivery || (!delivery.delivered && !delivery.leave);
                  })
                  .map(customer => (
                    <div key={customer.id} className="delivery-card pending">
                      <h4>{customer.name}</h4>
                      <p>Phone: {customer.phone}</p>
                      <p>Default: {customer.default_milk_quantity}L</p>

                      <div className="delivery-actions">
                        <button
                          onClick={() => markDelivery(customer, selectedDate, customer.default_milk_quantity)}
                          className="btn-delivered"
                        >
                          Mark Delivered
                        </button>

                        <button
                          onClick={() => markLeave(customer, selectedDate)}
                          className="btn-leave"
                        >
                          Mark Leave
                        </button>

                        <div className="extra-milk-control">
                          <input
                            type="number"
                            placeholder="Extra milk (L)"
                            min="0"
                            step="0.1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const extraQty = e.target.value;
                                if (extraQty) {
                                  addExtraMilk(customer, selectedDate, extraQty);
                                }
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = e.target.previousElementSibling;
                              if (input.value) {
                                addExtraMilk(customer, selectedDate, input.value);
                                input.value = '';
                              }
                            }}
                          >
                            Add Extra
                          </button>
                        </div>

                        <div className="override-control">
                          <input
                            type="number"
                            placeholder="Override qty (L)"
                            min="0"
                            step="0.1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const newQty = e.target.value;
                                if (newQty) {
                                  overrideDefaultQuantity(customer, selectedDate, newQty);
                                }
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = e.target.previousElementSibling;
                              if (input.value) {
                                overrideDefaultQuantity(customer, selectedDate, input.value);
                                input.value = '';
                              }
                            }}
                          >
                            Override
                          </button>
                        </div>
                      </div>

                      <div className="delivery-status pending">
                        Status: Pending
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* On Leave Customers Section */}
            <div className="delivery-section">
              <h3>🏖️ On Leave ({getDeliveriesForDate().filter(d => d.leave).length})</h3>
              <div className="delivery-grid">
                {getDeliveriesForDate()
                  .filter(d => d.leave)
                  .map(delivery => {
                    const customer = customers.find(c => c.id === delivery.customer_id);
                    return (
                      <div key={delivery.id} className="delivery-card leave">
                        <h4>{customer?.name || 'Unknown Customer'}</h4>
                        <p>Phone: {customer?.phone || 'N/A'}</p>
                        <p>Leave Date: {delivery.date}</p>
                        <div className="delivery-status leave">
                          Status: On Leave
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bills' && (
          <div className="bills-section">
            <h2>Bill Management</h2>

            {bills.length === 0 ? (
              <p>No bills generated yet.</p>
            ) : (
              <>
                {/* Monthly Summary Section */}
                <div className="monthly-summary">
                  <h3>Monthly Summary</h3>
                  {Object.entries(
                    bills.reduce((acc, bill) => {
                      const monthYear = `${bill.bill_year}-${bill.bill_month.toString().padStart(2, '0')}`;
                      if (!acc[monthYear]) {
                        acc[monthYear] = { totalQuantity: 0, totalAmount: 0, billCount: 0 };
                      }
                      acc[monthYear].totalQuantity += bill.total_quantity;
                      acc[monthYear].totalAmount += bill.total_amount;
                      acc[monthYear].billCount += 1;
                      return acc;
                    }, {})
                  ).map(([monthYear, data]) => {
                    const [year, month] = monthYear.split('-');
                    const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
                    return (
                      <div key={monthYear} className="summary-card">
                        <h4>{monthNames[parseInt(month) - 1]} {year}</h4>
                        <p><strong>Total Quantity:</strong> {data.totalQuantity.toFixed(2)} L</p>
                        <p><strong>Total Amount:</strong> ₹{data.totalAmount.toFixed(2)}</p>
                        <p><strong>Bills Count:</strong> {data.billCount}</p>
                      </div>
                    );
                  })}
                </div>

                <table className="bills-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Month/Year</th>
                      <th>Quantity (L)</th>
                      <th>Total Amount (₹)</th>
                      <th>Balance (₹)</th>
                      <th>Date Generated</th>
                      <th>Last Payment</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map(bill => (
                      <tr key={bill.id}>
                        <td>{bill.customer_name}</td>
                        <td>{bill.bill_month}/{bill.bill_year}</td>
                        <td>{bill.total_quantity.toFixed(2)}</td>
                        <td>{bill.total_amount.toFixed(2)}</td>
                        <td className={bill.balance > 0 ? 'balance-owing' : 'balance-paid'}>
                          {bill.balance.toFixed(2)}
                        </td>
                        <td>{new Date(bill.bill_generated_at).toLocaleDateString()}</td>
                        <td>
                          {bill.payment_date
                            ? new Date(bill.payment_date).toLocaleDateString()
                            : 'No payment yet'}
                        </td>
                        <td>
                          <span className={`status-badge ${bill.paid ? 'paid' : 'unpaid'}`}>
                            {bill.paid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td>
                          {!bill.paid && (
                            <div className="payment-controls">
                              <input
                                type="number"
                                placeholder="Amount Paid"
                                min="0"
                                step="0.01"
                                className="payment-input"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const amount = e.target.value;
                                    if (amount) {
                                      handleBillPayment(bill.id, amount);
                                    }
                                  }
                                }}
                              />
                              <button
                                onClick={(e) => {
                                  const amountInput = e.target.previousElementSibling;
                                  const amount = amountInput.value;

                                  if (amount) {
                                    handleBillPayment(bill.id, amount);
                                    amountInput.value = '';
                                  }
                                }}
                                className="pay-btn"
                              >
                                Pay
                              </button>
                            </div>
                          )}
                          {bill.paid && bill.last_payment_change > 0 && (
                            <div className="payment-change-info">
                              <small>Change: ₹{bill.last_payment_change.toFixed(2)}</small>
                            </div>
                          )}
                          {bill.credit_applied > 0 && (
                            <div className="credit-applied-info">
                              <small>Credit Applied: -₹{bill.credit_applied.toFixed(2)}</small>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
