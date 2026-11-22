# modules/pdf_generator.py

import os
import logging
from decimal import Decimal
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

font_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "arial.ttf"))
if os.path.exists(font_path):
    try:
        pdfmetrics.registerFont(TTFont('Arial', font_path))
    except Exception:
        pass

def generate_bill_pdf(bill_data, business_details, output_filename):
    """
    Generates a professional PDF invoice with teal branding.
    """
    # --- CONFIGURATION ---
    THEME_COLOR = HexColor('#035088')  # Teal Brand Color
    TEXT_COLOR = HexColor('#2c3e50')   # Dark Grey
    
    # Document Setup
    doc = SimpleDocTemplate(
        output_filename, 
        pagesize=A4,
        leftMargin=0.5*inch, rightMargin=0.5*inch,
        topMargin=0.5*inch, bottomMargin=0.5*inch
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    style_normal = styles['Normal']
    style_normal.textColor = TEXT_COLOR
    style_normal.fontSize = 10
    style_normal.leading = 14

    style_heading = ParagraphStyle(
        'CustomHeading', 
        parent=styles['Heading1'], 
        textColor=THEME_COLOR, 
        fontSize=24, 
        alignment=TA_RIGHT,
        spaceAfter=10
    )
    
    Story = []

    # --- 1. HEADER SECTION ---
    biz_name = getattr(business_details, 'name', 'Store') or 'Store'
    biz_addr = getattr(business_details, 'address', '') or ''
    biz_phone = getattr(business_details, 'phone', '') or ''
    biz_owner = getattr(business_details, 'owner_name', '') or ''

    biz_info = Paragraph(
        f"<b><font size=14 color='#035088'>{biz_name}</font></b><br/>"
        f"{biz_addr}<br/>"
        f"Phone: {biz_phone}<br/>"
        f"Owner: {biz_owner}",
        style_normal
    )
    
    invoice_title = Paragraph("INVOICE", style_heading)
    invoice_details = Paragraph(
        f"<b>Invoice #:</b> {bill_data['bill_id']}<br/>"
        f"<b>Date:</b> {bill_data['date_time'].strftime('%d-%m-%Y')}<br/>"
        f"<b>Time:</b> {bill_data['date_time'].strftime('%I:%M %p')}",
        ParagraphStyle('InvoiceMeta', parent=style_normal, alignment=TA_RIGHT, leading=14)
    )

    header_data = [[biz_info, [invoice_title, invoice_details]]]
    header_table = Table(header_data, colWidths=[4.2*inch, 3*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('LINEBELOW', (0,0), (-1,0), 2, THEME_COLOR),
        ('BOTTOMPADDING', (0,0), (-1,0), 15),
    ]))
    
    Story.append(header_table)
    Story.append(Spacer(1, 20))

    # --- 2. BILL TO SECTION ---
    customer_info = Paragraph(
        f"<font color='{THEME_COLOR.hexval()}'><b>BILL TO:</b></font><br/>"
        f"<b>{bill_data.get('customer_name', 'Walk-in Customer')}</b><br/>"
        f"Phone: {bill_data.get('mobile_number', 'N/A')}<br/>",
        
        style_normal
    )
    
    cust_table = Table([[customer_info]], colWidths=[7.2*inch])
    cust_table.setStyle(TableStyle([('LEFTPADDING', (0,0), (-1,-1), 5)]))
    Story.append(cust_table)
    Story.append(Spacer(1, 15))

    # --- 3. ITEMS TABLE ---
    col_widths = [0.6*inch, 3.7*inch, 0.8*inch, 1.0*inch, 1.1*inch]
    table_data = [["Sr.", "Item Description", "Qty.", "Rate", "Amount"]]
    
    total_amount = Decimal('0.00')
    
    for item in bill_data['items']:
        try:
            amt = Decimal(str(item['amount']))
            rate = Decimal(str(item['rate']))
            qty = Decimal(str(item['quantity']))
        except:
            amt = Decimal('0.00'); rate = Decimal('0.00'); qty = Decimal('0.00')
            
        total_amount += amt
        table_data.append([
            str(item['sr_no']),
            Paragraph(item['item_name'], style_normal),
            f"{qty:g}",
            f"{rate:,.2f}",
            f"{amt:,.2f}"
        ])

    MIN_ROWS = 12
    current_rows = len(bill_data['items'])
    if current_rows < MIN_ROWS:
        empty_rows_needed = MIN_ROWS - current_rows
        for _ in range(empty_rows_needed):
            table_data.append(["", "", "", "", ""])

    disc_pct = Decimal(str(bill_data.get('discount_percent', 0)))
    disc_amt = (total_amount * (disc_pct / 100)).quantize(Decimal('0.01'))
    net_payable = total_amount - disc_amt

    table_data.append(["", "", "", "Sub Total:", f"{total_amount:,.2f}"])
    table_data.append(["", "", "", f"Discount ({disc_pct}%):", f"- {disc_amt:,.2f}"])
    table_data.append(["", "", "", "Grand Total:", f"{net_payable:,.2f}"])

    item_table = Table(table_data, colWidths=col_widths)
    
    t_style = [
        ('BACKGROUND', (0,0), (-1,0), THEME_COLOR),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('BOTTOMPADDING', (0,0), (-1,0), 10),
        ('TOPPADDING', (0,0), (-1,0), 10),
        ('ALIGN', (0,1), (0,-1), 'CENTER'),
        ('ALIGN', (1,1), (1,-1), 'LEFT'),
        ('ALIGN', (2,1), (-1,-1), 'RIGHT'),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('GRID', (0,0), (-1,-4), 0.5, colors.lightgrey),
        ('LINEABOVE', (3,-3), (-1,-3), 1, THEME_COLOR),
        ('FONTNAME', (3,-3), (-1,-1), 'Helvetica-Bold'),
        ('ALIGN', (3,-3), (3,-1), 'RIGHT'),
        ('BACKGROUND', (3,-1), (-1,-1), colors.whitesmoke),
        ('TEXTCOLOR', (3,-1), (-1,-1), THEME_COLOR),
    ]
    
    item_table.setStyle(TableStyle(t_style))
    Story.append(item_table)
    Story.append(Spacer(1, 30))

    # --- 4. FOOTER ---
    terms_text = (
        "<b>Terms & Conditions:</b><br/>"
        "1. Goods once sold will not be taken back.<br/>"
        "2. Subject to local jurisdiction."
    )
    
    footer_data = [[
        Paragraph(terms_text, style_normal),
        Paragraph(f"<b>Authorized Signature</b><br/><br/><br/>_______________________<br/>{business_details.name}", 
                  ParagraphStyle('Sign', parent=style_normal, alignment=TA_CENTER))
    ]]
    
    footer_table = Table(footer_data, colWidths=[4.5*inch, 2.7*inch])
    footer_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('ALIGN', (1,0), (1,0), 'CENTER')]))
    Story.append(footer_table)
    
    doc.build(Story)
    return output_filename

def generate_thermal_bill_pdf(bill_data, business_details, output_filename, paper_width_mm=80):
    """
    Generates a clean, compact thermal receipt PDF tailored for 80mm or 58mm roll paper.
    """
    width_pt = paper_width_mm * 2.83465
    margin = 8
    printable_width = width_pt - (2 * margin)
    
    items = bill_data.get('items', [])
    num_items = len(items)
    
    # Calculate dynamic height based on number of items
    calculated_height = 210 + (num_items * 26)
    height_pt = max(260, calculated_height)
    
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=(width_pt, height_pt),
        leftMargin=margin,
        rightMargin=margin,
        topMargin=8,
        bottomMargin=8
    )
    
    styles = getSampleStyleSheet()
    font_name = 'Arial' if 'Arial' in pdfmetrics.getRegisteredFontNames() else 'Helvetica'
    font_bold = 'Arial' if 'Arial' in pdfmetrics.getRegisteredFontNames() else 'Helvetica-Bold'
    
    style_center_bold = ParagraphStyle(
        'ThermalTitle',
        fontName=font_bold,
        fontSize=12,
        leading=14,
        alignment=TA_CENTER
    )
    style_center = ParagraphStyle(
        'ThermalCenter',
        fontName=font_name,
        fontSize=8,
        leading=10,
        alignment=TA_CENTER
    )
    style_left = ParagraphStyle(
        'ThermalLeft',
        fontName=font_name,
        fontSize=8,
        leading=10,
        alignment=TA_LEFT
    )
    style_right = ParagraphStyle(
        'ThermalRight',
        fontName=font_name,
        fontSize=8,
        leading=10,
        alignment=TA_RIGHT
    )
    
    story = []
    
    # Business Header
    biz_name = getattr(business_details, 'name', 'Store') or 'Store'
    biz_addr = getattr(business_details, 'address', '') or ''
    biz_phone = getattr(business_details, 'phone', '') or ''
    
    story.append(Paragraph(f"<b>{biz_name}</b>", style_center_bold))
    if biz_addr:
        story.append(Paragraph(biz_addr, style_center))
    if biz_phone:
        story.append(Paragraph(f"Phone: {biz_phone}", style_center))
    
    story.append(Spacer(1, 4))
    story.append(Paragraph("----------------------------------------------------------------", style_center))
    story.append(Spacer(1, 2))
    
    # Bill Meta
    dt = bill_data.get('date_time', None)
    dt_str = dt.strftime("%d-%m-%Y %I:%M %p") if dt else ""
    meta_text = f"<b>Bill:</b> {bill_data.get('bill_id', '')} &nbsp;|&nbsp; {dt_str}"
    story.append(Paragraph(meta_text, style_left))
    
    cust_name = bill_data.get('customer_name', '')
    cust_mob = bill_data.get('mobile_number', '')
    if cust_name or cust_mob:
        cust_line = f"Customer: {cust_name or 'Walk-in'}"
        if cust_mob:
            cust_line += f" ({cust_mob})"
        story.append(Paragraph(cust_line, style_left))
        
    story.append(Spacer(1, 2))
    story.append(Paragraph("----------------------------------------------------------------", style_center))
    story.append(Spacer(1, 2))
    
    # Items Table - 4 Columns with prominent Qty
    col1_w = printable_width * 0.44
    col2_w = printable_width * 0.22
    col3_w = printable_width * 0.17
    col4_w = printable_width * 0.17
    
    style_qty = ParagraphStyle(
        'ThermalQty',
        fontName=font_bold,
        fontSize=9,
        leading=11,
        alignment=TA_CENTER
    )
    style_item_desc = ParagraphStyle(
        'ThermalItemDesc',
        fontName=font_bold,
        fontSize=8.5,
        leading=10,
        alignment=TA_LEFT
    )
    
    table_data = [[
        Paragraph("<b>Item</b>", style_left),
        Paragraph("<b>Qty</b>", style_qty),
        Paragraph("<b>Rate</b>", style_right),
        Paragraph("<b>Amt</b>", style_right)
    ]]
    
    total_amount = Decimal('0.00')
    for item in items:
        try:
            amt = Decimal(str(item['amount']))
            rate = Decimal(str(item['rate']))
            qty = Decimal(str(item['quantity']))
        except Exception:
            amt = Decimal('0.00'); rate = Decimal('0.00'); qty = Decimal('0.00')
            
        total_amount += amt
        qty_unit = item.get('qty_type', '') or ''
        qty_str = f"{qty:g}"
        if qty_unit:
            qty_str += f" {qty_unit}"
            
        item_title = item.get('item_name', '')
        item_code = item.get('item_code', '')
        if item_code:
            desc_text = f"[{item_code}] {item_title}"
        else:
            desc_text = f"{item_title}"
            
        table_data.append([
            Paragraph(desc_text, style_item_desc),
            Paragraph(f"<b>{qty_str}</b>", style_qty),
            Paragraph(f"{rate:,.2f}", style_right),
            Paragraph(f"{amt:,.2f}", style_right)
        ])
    
    item_table = Table(table_data, colWidths=[col1_w, col2_w, col3_w, col4_w])
    item_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(item_table)
    
    story.append(Spacer(1, 3))
    story.append(Paragraph("----------------------------------------------------------------", style_center))
    story.append(Spacer(1, 2))
    
    # Totals
    disc_pct = Decimal(str(bill_data.get('discount_percent', 0) or 0))
    disc_fixed = Decimal(str(bill_data.get('discount_amount', 0) or 0))
    
    if disc_fixed > 0:
        disc_amt = disc_fixed
    elif disc_pct > 0:
        disc_amt = (total_amount * (disc_pct / Decimal('100'))).quantize(Decimal('0.01'))
    else:
        disc_amt = Decimal('0.00')
        
    net_payable = max(Decimal('0.00'), total_amount - disc_amt)
    
    totals_data = []
    totals_data.append(["Sub Total:", f"Rs. {total_amount:,.2f}"])
    if disc_amt > 0:
        disc_label = f"Discount ({disc_pct}%):" if disc_pct > 0 and disc_fixed == 0 else "Discount:"
        totals_data.append([disc_label, f"- Rs. {disc_amt:,.2f}"])
    totals_data.append(["TOTAL:", f"Rs. {net_payable:,.2f}"])
    
    t_tot_col1 = printable_width * 0.55
    t_tot_col2 = printable_width * 0.45
    totals_table = Table(totals_data, colWidths=[t_tot_col1, t_tot_col2])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,-1), 'RIGHT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,-1), font_name),
        ('FONTSIZE', (0,0), (-1,-2), 8),
        ('FONTNAME', (0,-1), (-1,-1), font_bold),
        ('FONTSIZE', (0,-1), (-1,-1), 11),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(totals_table)
    
    story.append(Spacer(1, 4))
    story.append(Paragraph("----------------------------------------------------------------", style_center))
    story.append(Spacer(1, 2))
    story.append(Paragraph("Thank you for shopping with us!", style_center))
    story.append(Paragraph("Visit Again", style_center))
    
    doc.build(story)
    return output_filename


def print_receipt_direct(bill_data, business_details, paper_width_mm=80, printer_name=None):
    """
    Directly sends the thermal receipt to the printer spooler using PyQt6.
    Zero temporary files are created on disk.
    """
    try:
        from PyQt6.QtPrintSupport import QPrinter, QPrinterInfo
        from PyQt6.QtGui import QTextDocument, QPageSize, QPageLayout
        from PyQt6.QtCore import QSizeF, QMarginsF

        if printer_name and ("no printer" in printer_name.lower() or printer_name.lower() == "none"):
            print("\n[PRINTER LOG] ===================================================")
            print("[PRINTER LOG] Printing skipped ('No Printer' configured in settings).")
            print("[PRINTER LOG] ===================================================\n")
            return True, "Printing skipped (No printer configured)"

        printer = QPrinter(QPrinter.PrinterMode.PrinterResolution)
        if printer_name:
            printer.setPrinterName(printer_name)
        else:
            default_name = QPrinterInfo.defaultPrinterName()
            if default_name:
                printer.setPrinterName(default_name)

        target_printer_name = printer.printerName() or "Unknown Printer"

        if not printer.isValid():
            logging.warning(f"Printer '{target_printer_name}' is not valid or no default printer installed.")
            print("\n[PRINTER LOG] ===================================================")
            print(f"[PRINTER LOG] ✗ ERROR: Printer '{target_printer_name}' is not valid or not installed.")
            print("[PRINTER LOG] ===================================================\n")
            return False, "No valid printer found."

        # Configure page layout for physical thermal continuous roll
        page_size = QPageSize(QSizeF(paper_width_mm, 297), QPageSize.Unit.Millimeter)
        page_layout = QPageLayout(page_size, QPageLayout.Orientation.Portrait, QMarginsF(2, 2, 2, 2), QPageLayout.Unit.Millimeter)
        printer.setPageLayout(page_layout)

        biz_name = getattr(business_details, 'name', 'Store') or 'Store'
        biz_addr = getattr(business_details, 'address', '') or ''
        biz_phone = getattr(business_details, 'phone', '') or ''

        dt = bill_data.get('date_time', None)
        dt_str = dt.strftime("%d-%m-%Y %I:%M %p") if dt else ""
        bill_id = bill_data.get('bill_id', '')
        cust_name = bill_data.get('customer_name', '')
        cust_mob = bill_data.get('mobile_number', '')

        items = bill_data.get('items', [])
        rows_html = []
        total_amount = Decimal('0.00')

        for item in items:
            try:
                amt = Decimal(str(item['amount']))
                rate = Decimal(str(item['rate']))
                qty = Decimal(str(item['quantity']))
            except Exception:
                amt = Decimal('0.00'); rate = Decimal('0.00'); qty = Decimal('0.00')
            total_amount += amt

            qty_unit = item.get('qty_type', '') or ''
            qty_str = f"{qty:g}"
            if qty_unit:
                qty_str += f" {qty_unit}"

            icode = item.get('item_code', '')
            iname = item.get('item_name', '')
            label = f"[{icode}] {iname}" if icode else iname

            rows_html.append(f"""
            <tr>
                <td style="padding: 3px 1px; font-weight: bold; font-size: 11px;">{label}</td>
                <td style="padding: 3px 2px; text-align: center; font-weight: bold; font-size: 12px; white-space: nowrap;">{qty_str}</td>
                <td style="padding: 3px 1px; text-align: right; font-size: 11px;">{rate:,.2f}</td>
                <td style="padding: 3px 1px; text-align: right; font-weight: bold; font-size: 11px;">{amt:,.2f}</td>
            </tr>
            """)

        disc_pct = Decimal(str(bill_data.get('discount_percent', 0) or 0))
        disc_fixed = Decimal(str(bill_data.get('discount_amount', 0) or 0))
        if disc_fixed > 0:
            disc_amt = disc_fixed
        elif disc_pct > 0:
            disc_amt = (total_amount * (disc_pct / Decimal('100'))).quantize(Decimal('0.01'))
        else:
            disc_amt = Decimal('0.00')
        net_payable = max(Decimal('0.00'), total_amount - disc_amt)

        disc_row = ""
        if disc_amt > 0:
            disc_label = f"Discount ({disc_pct}%):" if disc_pct > 0 and disc_fixed == 0 else "Discount:"
            disc_row = f"""
            <tr>
                <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 11px;">{disc_label}</td>
                <td style="text-align: right; padding: 2px 0; font-size: 11px;">- Rs. {disc_amt:,.2f}</td>
            </tr>
            """

        cust_info_html = ""
        if cust_name or cust_mob:
            mob_str = f" ({cust_mob})" if cust_mob else ""
            cust_info_html = f"<div style='font-size: 10px; margin-bottom: 3px;'>Customer: {cust_name or 'Walk-in'}{mob_str}</div>"

        html = f"""
        <html>
        <head>
        <style>
            body {{
                font-family: 'Segoe UI', Arial, sans-serif;
                margin: 0;
                padding: 0;
                color: #000;
            }}
            .center {{ text-align: center; }}
            .divider {{
                border-top: 1px dashed #000;
                margin: 4px 0;
            }}
        </style>
        </head>
        <body>
            <div class="center">
                <div style="font-size: 15px; font-weight: bold;">{biz_name}</div>
                {f'<div style="font-size: 10px;">{biz_addr}</div>' if biz_addr else ''}
                {f'<div style="font-size: 10px;">Phone: {biz_phone}</div>' if biz_phone else ''}
            </div>
            <div class="divider"></div>
            <div style="font-size: 10px; margin-bottom: 2px;">
                <b>Bill #:</b> {bill_id} &nbsp;|&nbsp; {dt_str}
            </div>
            {cust_info_html}
            <div class="divider"></div>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 11px;">
                <tr style="border-bottom: 1px solid #000; font-weight: bold;">
                    <th align="left" style="padding-bottom: 2px; font-size: 11px;">Item</th>
                    <th align="center" style="padding-bottom: 2px; font-size: 11px;">Qty</th>
                    <th align="right" style="padding-bottom: 2px; font-size: 11px;">Rate</th>
                    <th align="right" style="padding-bottom: 2px; font-size: 11px;">Amt</th>
                </tr>
                {''.join(rows_html)}
            </table>
            <div class="divider"></div>
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td colspan="3" style="text-align: right; padding: 2px 0; font-size: 11px;">Subtotal:</td>
                    <td style="text-align: right; padding: 2px 0; font-size: 11px;">Rs. {total_amount:,.2f}</td>
                </tr>
                {disc_row}
                <tr style="font-size: 13px; font-weight: bold;">
                    <td colspan="3" style="text-align: right; padding-top: 4px;">TOTAL:</td>
                    <td style="text-align: right; padding-top: 4px;">Rs. {net_payable:,.2f}</td>
                </tr>
            </table>
            <div class="divider"></div>
            <div class="center" style="font-size: 10px; margin-top: 4px;">
                <div>Thank you for shopping with us!</div>
                <div><b>Visit Again</b></div>
            </div>
        </body>
        </html>
        """

        is_pdf_virtual = "pdf" in target_printer_name.lower()

        print("\n[PRINTER LOG] ===================================================")
        print(f"[PRINTER LOG] Job Type       : Thermal Receipt Print Job")
        print(f"[PRINTER LOG] Bill ID        : {bill_id or 'TEST-RECEIPT'}")
        print(f"[PRINTER LOG] Target Printer : '{target_printer_name}'")
        print(f"[PRINTER LOG] Paper Width    : {paper_width_mm}mm")
        print(f"[PRINTER LOG] Customer       : {cust_name or 'Walk-in'}{f' ({cust_mob})' if cust_mob else ''}")
        print(f"[PRINTER LOG] Items Count    : {len(items)}")
        print(f"[PRINTER LOG] Net Payable    : Rs. {net_payable:,.2f}")
        if is_pdf_virtual:
            print(f"[PRINTER LOG] Mode           : Virtual PDF Printer (Microsoft Print to PDF)")
            print(f"[PRINTER LOG] Spool Action   : doc.print() -> Windows 'Save Print Output As' dialog is opening...")
        else:
            print(f"[PRINTER LOG] Mode           : Physical Hardware Thermal Printer")
            print(f"[PRINTER LOG] Spool Action   : doc.print() -> Spooling directly to hardware printer queue...")

        doc = QTextDocument()
        doc.setDocumentMargin(0)
        doc.setTextWidth(paper_width_mm * 2.83465)
        doc.setHtml(html)
        doc.print(printer)

        if is_pdf_virtual:
            print(f"[PRINTER LOG] ✓ Dispatched to '{target_printer_name}'. Windows Save Dialog triggered.")
        else:
            print(f"[PRINTER LOG] ✓ Successfully spooled to '{target_printer_name}'. Paper printing now.")
        print("[PRINTER LOG] ===================================================\n")
        return True, "Printed successfully"
    except Exception as e:
        logging.error(f"Direct print failed: {e}")
        print("\n[PRINTER LOG] ===================================================")
        print(f"[PRINTER LOG] ✗ Print Job Error: {e}")
        print("[PRINTER LOG] ===================================================\n")
        return False, str(e)