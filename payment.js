const token = new URLSearchParams(window.location.search).get('token') || '';

const elements = {
  paymentLead: document.getElementById('paymentLead'),
  paymentSummary: document.getElementById('paymentSummary'),
  paymentError: document.getElementById('paymentError'),
  payNowBtn: document.getElementById('payNowBtn'),
};

let paymentState = null;

bootstrap();

async function bootstrap() {
  elements.payNowBtn.addEventListener('click', handlePayNow);
  await loadPaymentSummary();
}

async function loadPaymentSummary() {
  elements.paymentError.textContent = '';
  elements.paymentSummary.innerHTML = '';
  elements.payNowBtn.disabled = true;

  if (!token) {
    elements.paymentError.textContent = 'Invalid payment link.';
    return;
  }

  try {
    paymentState = await api(`/api/public/payments/booking?token=${encodeURIComponent(token)}`);
    renderPaymentSummary();
  } catch (error) {
    elements.paymentError.textContent = error.message || 'Unable to load payment details.';
  }
}

function renderPaymentSummary() {
  if (!paymentState) return;

  const summary = paymentState.summary || {};
  const addOnLines = Array.isArray(summary.addOnItems) ? summary.addOnItems : [];
  const detailCard = document.createElement('article');
  detailCard.className = 'admin-membership-card';
  detailCard.innerHTML = `
    <div class="admin-membership-head">
      <div>
        <h3>${escapeHtml(paymentState.booking?.serviceName || 'Booking')}</h3>
        <p>${escapeHtml(paymentState.customer?.name || '')} • ${escapeHtml(paymentState.customer?.email || '')}</p>
      </div>
      <span class="status-chip payment-${escapeHtml(paymentState.paymentStatus || 'unpaid')}">${escapeHtml(
    paymentState.paymentStatus || 'unpaid'
  )}</span>
    </div>
    <div class="admin-membership-meta">
      <div class="admin-membership-meta-item">
        <strong>Slot</strong>
        <span>${escapeHtml(formatDateTime(paymentState.booking?.bookingDate, paymentState.booking?.bookingTime))}</span>
      </div>
      <div class="admin-membership-meta-item">
        <strong>Items</strong>
        <span>${escapeHtml(String(summary.bookingCount || 1))}</span>
      </div>
      <div class="admin-membership-meta-item">
        <strong>Status</strong>
        <span>${escapeHtml(paymentState.status || 'pending')}</span>
      </div>
      <div class="admin-membership-meta-item">
        <strong>Total</strong>
        <span>Rs. ${Number(summary.totalAmountInr || 0).toLocaleString('en-IN')}</span>
      </div>
    </div>
  `;

  const breakdown = document.createElement('div');
  breakdown.className = 'admin-membership-members';
  breakdown.innerHTML = '<h4>Payment Breakdown</h4>';

  const items = [];
  if (Number(summary.packagePriceInr || 0) > 0) {
    items.push(`${summary.serviceName || paymentState.booking?.serviceName}: Rs. ${Number(summary.packagePriceInr).toLocaleString('en-IN')}`);
  } else if (Number(summary.amountInr || 0) > 0) {
    items.push(`${paymentState.booking?.serviceName || 'Service'}: Rs. ${Number(summary.amountInr).toLocaleString('en-IN')}`);
  }
  if (Number(summary.extraSessions || 0) > 0 && Number(summary.extraSessionPriceInr || 0) > 0) {
    items.push(
      `${summary.extraSessions} extra session(s): Rs. ${Number(summary.extraSessions * summary.extraSessionPriceInr).toLocaleString('en-IN')}`
    );
  }
  addOnLines.forEach((item) => {
    items.push(`${item.serviceName}: Rs. ${Number(item.amountInr || 0).toLocaleString('en-IN')}`);
  });
  if (!items.length) {
    items.push('No payable items found.');
  }

  items.forEach((line) => {
    const row = document.createElement('div');
    row.className = 'admin-member-field';
    row.innerHTML = `<span>${escapeHtml(line)}</span>`;
    breakdown.appendChild(row);
  });

  detailCard.appendChild(breakdown);
  elements.paymentSummary.appendChild(detailCard);
  elements.paymentLead.textContent =
    paymentState.paymentStatus === 'paid'
      ? 'This booking is already paid.'
      : 'Review the booking details below and complete payment.';
  elements.payNowBtn.disabled = paymentState.paymentStatus === 'paid' || paymentState.status === 'cancelled';
}

async function handlePayNow() {
  if (!token) return;
  elements.paymentError.textContent = '';

  try {
    const order = await api('/api/public/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!window.Razorpay) {
      throw new Error('Razorpay SDK not loaded');
    }

    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'H2 House Of Health',
      description: order.booking?.serviceName || 'Booking Payment',
      order_id: order.orderId,
      prefill: {
        name: order.customer?.name || '',
        email: order.customer?.email || '',
      },
      theme: {
        color: '#8b5e3c',
      },
      handler: async (response) => {
        try {
          await api('/api/public/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          await loadPaymentSummary();
          alert('Payment successful.');
        } catch (error) {
          elements.paymentError.textContent = error.message || 'Payment verification failed.';
        }
      },
    });

    checkout.open();
  } catch (error) {
    elements.paymentError.textContent = error.message || 'Unable to start payment.';
  }
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : {};
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

function formatDateTime(dateISO, time24) {
  if (!dateISO || !time24) return '-';
  const date = new Date(`${dateISO}T${time24}`);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
