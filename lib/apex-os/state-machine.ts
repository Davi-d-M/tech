export type OrderStatus =
    | 'Created'
    | 'Quote Pending'
    | 'Payment Pending'
    | 'Paid'
    | 'Stock Reserved'
    | 'Supplier Confirmed'
    | 'Processing'
    | 'Packed'
    | 'Dispatched'
    | 'Out for Delivery'
    | 'Delivered'
    | 'Completed'
    | 'Cancelled'
    | 'Payment Failed'
    | 'Refunded'
    | 'Warranty'
    | 'Returned';

/**
 * Apex OS State Machine Protocol
 * Defines valid transitions for orders.
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    'Created': ['Quote Pending', 'Payment Pending', 'Cancelled'],
    'Quote Pending': ['Payment Pending', 'Cancelled'],
    'Payment Pending': ['Paid', 'Payment Failed', 'Cancelled'],
    'Paid': ['Stock Reserved', 'Cancelled', 'Refunded'],
    'Stock Reserved': ['Supplier Confirmed', 'Processing', 'Cancelled', 'Refunded'],
    'Supplier Confirmed': ['Processing', 'Cancelled', 'Refunded'],
    'Processing': ['Packed', 'Cancelled', 'Refunded'],
    'Packed': ['Dispatched', 'Cancelled', 'Refunded'],
    'Dispatched': ['Out for Delivery', 'Delivered', 'Cancelled', 'Refunded'],
    'Out for Delivery': ['Delivered', 'Returned', 'Cancelled'],
    'Delivered': ['Completed', 'Warranty', 'Returned'],
    'Completed': ['Warranty', 'Returned'],

    // Termination/Special States
    'Cancelled': [],
    'Payment Failed': ['Payment Pending'],
    'Refunded': [],
    'Warranty': ['Processing', 'Completed'],
    'Returned': ['Refunded', 'Stock Reserved']
};

export function isValidTransition(current: OrderStatus, next: OrderStatus): boolean {
    const allowed = VALID_TRANSITIONS[current] || [];
    return allowed.includes(next);
}

export function getAvailableActions(current: OrderStatus): OrderStatus[] {
    return VALID_TRANSITIONS[current] || [];
}
