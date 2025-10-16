import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css']
})
export class BillingComponent {
  billingForm: FormGroup;
  submitted = false;
  totalAmount = 0;
  receiptNo = '';
  todayDate = new Date();

  fees = {
    visa: 5000,
    slot: 20000,
    dropbox: 20000
  };

  constructor(private fb: FormBuilder) {
    this.billingForm = this.fb.group({
      customerName: ['', Validators.required],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      items: this.fb.array([])
    });

    this.addItem();
    this.generateReceiptNo();
  }

  get items() {
    return this.billingForm.get('items') as FormArray;
  }

  addItem() {
    this.items.push(this.fb.group({
      billType: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      discount: [0, [Validators.min(0)]],
      baseAmount: [0, [Validators.required, Validators.min(0)]],
      description: ['']
    }));
  }

  removeItem(index: number) {
    this.items.removeAt(index);
    this.calculateTotal();
  }

  onBillTypeChange(index: number) {
    const control = this.items.at(index);
    const type = control.get('billType')?.value;

    let baseValue = 0;
    if (type === 'visa') baseValue = this.fees.visa;
    else if (type === 'slot') baseValue = this.fees.slot;
    else if (type === 'dropbox') baseValue = this.fees.dropbox;

    control.patchValue({ baseAmount: baseValue });
    this.calculateTotal();
  }

  calculateTotal() {
    let total = 0;
    this.items.controls.forEach((ctrl) => {
      const quantity = Number(ctrl.get('quantity')?.value || 0);
      const discount = Number(ctrl.get('discount')?.value || 0);
      const baseAmount = Number(ctrl.get('baseAmount')?.value || 0);

      const totalBeforeDiscount = baseAmount * quantity;
      const totalAfterDiscount = totalBeforeDiscount - (discount * quantity);

      if (!isNaN(totalAfterDiscount)) total += totalAfterDiscount;
    });
    this.totalAmount = total;
  }

  generateReceiptNo() {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    this.receiptNo = `#${randomNum}`;
  }

  onSubmit() {
    this.submitted = true;
    if (this.billingForm.invalid) return;
    this.calculateTotal();
  }
  downloadPDF() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // === HEADER SECTION ===
    const logo = new Image();
    logo.src = '../../assets/aa-logo-pr.png'; // Add your logo to src/assets/
    doc.addImage(logo, 'PNG', 10, 10, 30, 30);

    // Company Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(0, 102, 204); // Blue
    doc.text('AA Global Services', 45, 20);

    // Red underline
  const companyTextWidth = doc.getTextWidth('AA Global Services');
  const startX = 45;
  const endX = startX + companyTextWidth + 2; // +2 small buffer
  doc.setDrawColor(255, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(startX, 22, endX, 22); // Thin line just under text

    // Address
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    const address =
      'Flat No H 903, Ambience Courtyard, Survey No. 4,\nOpp. Dream Valley, Tanasha Nagar, Manikonda,\nTelangana 500089';
    doc.text(address, 45, 30);
    
    // Draw thin gray separator line between header and invoice section
    doc.setDrawColor(180);
    doc.setLineWidth(0.2);
    doc.line(10, 45, pageWidth - 10, 45);
      // === BILLING INVOICE SECTION ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);

  // Center "Billing Invoice"
  const title = 'Billing Invoice';
  const textWidth = doc.getTextWidth(title);
  const textX = (pageWidth - textWidth) / 2;
  doc.text(title, textX, 55);

  // Receipt and Date just below invoice title
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Receipt No: ${this.receiptNo}`, pageWidth - 70, 62);
  doc.text(`Date: ${this.todayDate.toLocaleDateString()}`, pageWidth - 70, 68);

  // Customer details
  doc.text(`Customer Name: ${this.billingForm.value.customerName}`, 15, 65);
  doc.text(`Mobile: ${this.billingForm.value.mobileNumber}`, 15, 72);

  // Outer Border for aesthetics
  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.rect(10, 10, pageWidth - 20, 275);

    // === TABLE SECTION ===
    const rows = this.billingForm.value.items.map((item: any) => {
      const type =
        item.billType === 'visa'
          ? 'Visa Processing Fee'
          : item.billType === 'slot'
          ? 'Slot Booking Fee'
          : item.billType === 'dropbox'
          ? 'Drop Box Fee'
          : item.description || 'Other Charges';
      const total = (item.baseAmount * item.quantity) - (item.discount * item.quantity);
      return [type, item.quantity, item.baseAmount, item.discount, total];
    });

    autoTable(doc, {
      head: [['Bill Type', 'Qty', 'Base Amount', 'Discount', 'Total']],
      body: rows,
      startY: 75,
      styles: { fontSize: 10 },
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 204], textColor: 255, halign: 'center' },
      bodyStyles: { halign: 'center' }
    });

    // === TOTAL SECTION ===
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Bill Amount: INR ${this.totalAmount}`, 120, finalY);

    // === FOOTER NOTE ===
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    doc.text(
      'This is an online generated bill. No signature required.',
      15,
      285
    );

    doc.save(`Invoice_${this.receiptNo}.pdf`);
  }
  }
