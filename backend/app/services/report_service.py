from fpdf import FPDF
from io import BytesIO

class PDFReport(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 15)
        self.cell(0, 10, 'AI Code Review Report', border=0, ln=True, align='C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', border=0, ln=True, align='C')

def add_section(pdf: FPDF, title: str, items):
    if not items:
        return
    
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_text_color(41, 128, 185) # Blue title
    pdf.cell(0, 10, title, ln=True)
    
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(0, 0, 0)
    
    if isinstance(items, list):
        for item in items:
            pdf.multi_cell(0, 6, f"\x95 {item}")
    else:
        pdf.multi_cell(0, 6, str(items))
    pdf.ln(4)

def generate_pdf_report(review) -> bytes:
    """
    Generate a PDF report using fpdf2 and return its bytes representation.
    """
    pdf = PDFReport()
    pdf.add_page()
    
    res = review.review_result or {}
    
    # Metadata Overview
    pdf.set_font('helvetica', 'B', 12)
    pdf.cell(0, 8, f"Review ID: {review.id}", ln=True)
    pdf.cell(0, 8, f"Date: {review.created_at}", ln=True)
    pdf.cell(0, 8, f"Language: {review.language}", ln=True)
    pdf.ln(5)
    
    # Scores
    pdf.set_font('helvetica', 'B', 11)
    # Using .get for fallback compatibility with old reviews
    score = review.overall_score
    sec_score = res.get('security_score', 'N/A')
    maint_score = res.get('maintainability_score', 'N/A')
    complexity = res.get('complexity', 'N/A')
    time_comp = res.get('estimated_time_complexity', 'N/A')
    
    pdf.cell(50, 8, f"Overall Score: {score}/100")
    pdf.cell(50, 8, f"Security Score: {sec_score}/100")
    pdf.cell(50, 8, f"Maintainability: {maint_score}/100")
    pdf.ln(8)
    
    pdf.cell(50, 8, f"Risk Level: {review.risk_level}")
    pdf.cell(50, 8, f"Complexity: {complexity}")
    pdf.cell(80, 8, f"Time Complexity: {time_comp}")
    pdf.ln(12)
    
    # Text sections
    add_section(pdf, "Summary", res.get('summary', ''))
    add_section(pdf, "Bugs", res.get('bugs', []))
    add_section(pdf, "Security Issues", res.get('security_issues', []))
    add_section(pdf, "Best Practices", res.get('best_practices', []))
    add_section(pdf, "Optimizations", res.get('optimizations', []))
    add_section(pdf, "Root Cause Analysis", res.get('root_cause', []))
    add_section(pdf, "Corrected Code", res.get('corrected_code', ''))

    # Output bytes
    buffer = pdf.output(dest='S')
    return bytes(buffer)

def export_json_report(review) -> dict:
    """
    Generate a JSON export dictionary for the report.
    """
    res = review.review_result or {}
    return {
        "metadata": {
            "review_id": review.id,
            "date": str(review.created_at),
            "language": review.language,
            "overall_score": review.overall_score,
            "risk_level": review.risk_level,
        },
        "advanced_metrics": {
            "security_score": res.get("security_score"),
            "maintainability_score": res.get("maintainability_score"),
            "complexity": res.get("complexity"),
            "estimated_time_complexity": res.get("estimated_time_complexity")
        },
        "analysis_details": {
            "summary": res.get("summary"),
            "bugs": res.get("bugs", []),
            "security_issues": res.get("security_issues", []),
            "best_practices": res.get("best_practices", []),
            "optimizations": res.get("optimizations", []),
            "root_cause": res.get("root_cause", []),
            "corrected_code": res.get("corrected_code", "")
        }
    }
