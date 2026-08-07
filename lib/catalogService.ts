import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabaseClient';
import { formatPrice } from './utils';

export async function generateProductCatalog(month: string) {
    if (!supabase) throw new Error("Database not connected");

    // 1. Fetch live products
    const { data: products, error } = await supabase
        .from('products')
        .select('name, price, category, image_url, stock')
        .eq('hide_product', false)
        .order('category', { ascending: true });

    if (error) throw error;
    if (!products || products.length === 0) throw new Error("No products found to catalog");

    // 2. Initialize PDF
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    // 3. Header Branding
    doc.setFillColor(245, 160, 0); // Primary Color (#F5A000)
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('APEXSTORES TECH', 14, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`ELITE PRODUCT CATALOG - ${month.toUpperCase()} 2026`, 14, 34);
    doc.text(`Generated: ${date}`, 160, 34);

    // 4. Table Data
    const tableRows = products.map((p, i) => [
        i + 1,
        p.name.toUpperCase(),
        p.category.toUpperCase(),
        formatPrice(p.price),
        p.stock > 0 ? 'INSTOCK' : 'PRE-ORDER'
    ]);

    autoTable(doc, {
        startY: 50,
        head: [['#', 'GADGET IDENTITY', 'SECTOR', 'ELITE PRICE', 'STATUS']],
        body: tableRows,
        theme: 'striped',
        headStyles: {
            fillColor: [15, 23, 42], // Secondary (#0F172A)
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center'
        },
        styles: {
            fontSize: 9,
            cellPadding: 6,
            valign: 'middle'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            3: { halign: 'right', fontStyle: 'bold' },
            4: { halign: 'center' }
        },
        didDrawPage: (data) => {
            // Footer
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                '© 2026 APEXSTORES™ - Nairobi Fast Dispatch Guaranteed. Visit tech-paxv.onrender.com for live stock.',
                14,
                doc.internal.pageSize.height - 10
            );
        }
    });

    // 5. Save/Return
    return doc;
}
