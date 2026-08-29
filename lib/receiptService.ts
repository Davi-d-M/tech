import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatPrice } from './utils';

interface Order {
    id: string | number;
    customer_name: string;
    customer_phone: string;
    created_at: string;
    payment_method: string;
    product_id?: string | number;
    product_name?: string;
    quantity: number;
    total_price: number;
    status: string;
}

/**
 * Generates a professional PDF receipt for an order
 */
export async function generateReceiptPDF(order: Order) {
    const doc = new jsPDF() as jsPDF & { autoTable: (options: object) => void; lastAutoTable: { finalY: number } };

    // Header
    doc.setFontSize(22);
    doc.setTextColor(255, 107, 0); // Primary color
    doc.text('APEXSTORES TECH', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Premium Electronics & Mobile Accessories', 14, 26);
    doc.text('Nairobi, Kenya | support@apexstores.com', 14, 31);

    // Receipt Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`RECEIPT: #${order.id}`, 140, 20);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 140, 26);
    doc.text(`Payment: ${order.payment_method}`, 140, 31);

    // Customer Info
    doc.line(14, 40, 196, 40);
    doc.setFontSize(10);
    doc.text('BILL TO:', 14, 50);
    doc.setFontSize(12);
    doc.text(order.customer_name, 14, 56);
    doc.setFontSize(10);
    doc.text(order.customer_phone, 14, 61);

    // Table
    const tableData = [
        ['Item ID', 'Description', 'Qty', 'Unit Price', 'Total'],
        [
            `#${order.product_id || 'N/A'}`,
            order.product_name || 'Gadget Purchase',
            order.quantity,
            formatPrice(order.total_price / order.quantity),
            formatPrice(order.total_price)
        ]
    ];

    doc.autoTable({
        startY: 75,
        head: [tableData[0]],
        body: [tableData[1]],
        theme: 'grid',
        headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255] },
        styles: { fontSize: 10, cellPadding: 5 }
    });

    // Summary
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('TOTAL:', 140, finalY + 10);
    doc.setFontSize(16);
    doc.text(formatPrice(order.total_price), 160, finalY + 10);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Thank you for choosing Apexstores Tech. Warranty valid for 7 days upon delivery.', 14, finalY + 30);
    doc.text('This is an automatically generated receipt.', 14, finalY + 35);

    return doc;
}

/**
 * Creates a WhatsApp share link for a receipt
 */
export function getWhatsAppReceiptLink(order: Order) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tech-paxv.onrender.com';
    const message = `Hello ${order.customer_name}! Thank you for shopping at *Apexstores Tech*.\n\n*Order ID:* #${order.id}\n*Total:* ${formatPrice(order.total_price)}\n*Status:* ${order.status}\n\nYour gadget is ready. View tracking here: ${baseUrl}/track?id=${order.id}`;
    return `https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}
