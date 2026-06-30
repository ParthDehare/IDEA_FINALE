import smtplib
from email.message import EmailMessage
import os

async def send_fraud_alert(transaction: dict, score: int):
    """
    Asynchronously sends an urgent email alert to the auditor when critical fraud is detected.
    """
    auditor_email = os.getenv("AUDITOR_EMAIL", "auditor@vaultmind.local")
    smtp_server = os.getenv("SMTP_SERVER", "localhost")
    smtp_port = int(os.getenv("SMTP_PORT", 1025))
    
    msg = EmailMessage()
    msg.set_content(f"""
    URGENT: CRITICAL FRAUD DETECTED
    
    A transaction has breached the strict > 70 CBSI threshold.
    
    Transaction ID: {transaction.get('transaction_id')}
    Employee ID: {transaction.get('emp_id')}
    CBSI Score: {score}/100
    Amount: {transaction.get('amount')}
    
    Please review the evidence package immediately.
    """)
    
    msg['Subject'] = f"CRITICAL FRAUD ALERT - Score {score} - {transaction.get('emp_id')}"
    msg['From'] = "alerts@vaultmind.local"
    msg['To'] = auditor_email
    
    try:
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            if smtp_user and smtp_password:
                server.login(smtp_user, smtp_password)
            server.send_message(msg)
        print(f"[NOTIFIER] Fraud alert email sent to {auditor_email} for TXN {transaction.get('transaction_id')}")
    except Exception as e:
        print(f"[NOTIFIER] Failed to send email alert: {e}")

# ==========================================
# FUTURE CAPABILITY: TWILIO SMS INTEGRATION
# ==========================================
async def send_sms_alert(transaction: dict, score: int):
    """
    Sends an SMS alert via Twilio for critical breaches.
    """
    from twilio.rest import Client
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    
    if not account_sid or not auth_token:
        print("[NOTIFIER] Missing Twilio credentials. Skipping SMS.")
        return

    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=f"VAULTMIND ALERT: Critical Fraud (Score {score}) detected for {transaction.get('emp_id')}. Review dashboard.",
            from_=os.getenv("TWILIO_FROM_NUMBER"),
            to=os.getenv("AUDITOR_PHONE")
        )
        print(f"[NOTIFIER] SMS sent: {message.sid}")
    except Exception as e:
        print(f"[NOTIFIER] Failed to send SMS alert: {e}")

