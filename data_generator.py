import os, uuid, random, json, math
import numpy as np
import pandas as pd
from faker import Faker
from datetime import datetime, timedelta
from collections import defaultdict
import sys, time

# Ensure Windows prints unicode characters correctly
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


try:
    SEED = int(sys.argv[sys.argv.index('--seed') + 1])
except (ValueError, IndexError):
    SEED = int(os.getenv("VAULTMIND_SEED", str(int(time.time()))))

# ────────────────────── CONFIGURATION ──────────────────────
TOTAL_ROWS        = 75_000          # Increased from 50K
N_EMPLOYEES       = 750             # Increased from 500
N_BRANCHES        = 25              # Increased from 20
SIM_START         = datetime(2025, 7, 1)
SIM_END           = datetime(2026, 6, 30, 23, 59, 59)
HISTORICAL_CUTOFF = datetime(2026, 3, 15)
OUTPUT_DIR        = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Testing_data_v3")

random.seed(SEED)
np.random.seed(SEED)
fake = Faker(["en_IN", "en_US"])
fake.seed_instance(SEED)

print(f"[DEBUG] SEED={SEED}")

# ────────────────────── ADVANCED HELPERS ──────────────────────

def gaussian_hour(mean: int, std: int = 1.5, min_hr: int = 0, max_hr: int = 23) -> int:
    """Generate realistic hour with normal distribution around work hours"""
    hour = int(np.random.normal(mean, std))
    return np.clip(hour, min_hr, max_hr)

def rand_date(start: datetime, end: datetime) -> datetime:
    """Random date within range"""
    delta = int((end - start).total_seconds())
    return start + timedelta(seconds=random.randint(0, delta))

def spread_dates(n: int, start: datetime = SIM_START, end: datetime = SIM_END) -> list:
    """Evenly spread n dates across time range"""
    step = (end - start).days / n
    dates = []
    for i in range(n):
        base = start + timedelta(days=int(i * step))
        if base > end:
            base = end - timedelta(days=1)
        dates.append(base.replace(hour=random.randint(8, 20),
                                 minute=random.randint(0, 59)))
    return dates

def get_transfer_channel(action: str, amount: float) -> str:
    """Realistic channel selection based on action & amount"""
    if action in ("System_Login", "DB_Read", "SYSTEM_BULK_EXPORT"):
        return "SYSTEM"
    if action == "ATM_Withdrawal":
        return "ATM"
    if action == "Wire_Domestic":
        return random.choice(["NEFT", "RTGS", "IFT"])
    if action == "Wire_International":
        return "SWIFT"
    
    # Amount-based channel selection
    if amount < 5_000:
        return random.choice(["UPI", "IMPS"])
    elif amount < 50_000:
        return random.choice(["UPI", "NEFT", "IMPS"])
    elif amount < 500_000:
        return random.choice(["NEFT", "RTGS"])
    else:
        return random.choice(["RTGS", "IFT"])

def get_ip_by_branch_and_anomaly(branch_id: str, ip_pool: dict, is_anomalous: bool = False) -> str:
    """Realistic IP selection - mostly internal, sometimes external for anomalies"""
    if is_anomalous and random.random() < 0.4:  # 40% external for anomalies
        return random.choice(ip_pool["external"])
    return random.choice(ip_pool["internal"].get(branch_id, ip_pool["external"]))

def realistic_amount(role: str, action: str, rng: np.random.Generator) -> float:
    """Generate realistic transaction amounts based on role & action"""
    if action == "ATM_Withdrawal":
        # ATM limits: 50K per transaction (PMLA rule)
        return round(rng.uniform(1_000, 50_000), 2)
    
    if role == "CLERK":
        if action == "Initiate":
            return round(rng.lognormal(11, 1.5), 2)  # Log-normal: ₹1K-₹500K
        return round(rng.uniform(1_000, 100_000), 2)
    
    if role == "MANAGER":
        if action == "Approve":
            return round(rng.lognormal(12.5, 1.8), 2)  # Higher for approvals
        return round(rng.lognormal(11.5, 1.5), 2)
    
    if role == "IT_ADMIN":
        if action == "DB_Read":
            return round(rng.uniform(0, 500), 2)
        return 0.0
    
    return round(rng.uniform(10_000, 500_000), 2)

def generate_complaint_text(is_fraud: bool, emp_class: str = None, action: str = None) -> str:
    """Context-aware complaint generation"""
    benign_complaints = [
        "Customer requested KYC update and document verification.",
        "Account holder inquired about fixed deposit interest rates.",
        "Complaint regarding NEFT credit delay (3 days).",
        "Customer requested cheque book issuance.",
        "Service request for mobile/net banking registration.",
        "Request for account statement for visa application.",
        "Customer asked about locker facility and charges.",
        "Inquiry about overdraft facility availability.",
        "Request for demat account opening assistance.",
        "Customer complaint: ATM card declined, investigated no issues.",
    ]
    
    fraud_complaints = [
        "Customer reported: branch manager demanded bribe (₹50,000) for loan approval. Witness present.",
        "Account holder: demanded bribe and threatened to delay fund transfer. Police complaint filed.",
        "Formal complaint — manager demanded bribe for home loan, senior official aware.",
        "Manager demanded ₹1 lakh extortion before approving business loan. Evidence documented.",
        "Second complaint this month: employee demanded bribe from small trader. Customer refused.",
        "Bribe demand by manager confirmed by two witnesses. Ethics complaint filed.",
        "Customer alleges manager extorted ₹75,000 before releasing blocked account.",
        "Unauthorized fund transfer detected: ₹25 lakhs diverted to unknown account.",
        "Customer's account accessed without authorization. Fraudulent transaction of ₹10 lakhs.",
        "Collusion suspected: employee and external accomplice draining customer accounts.",
    ]
    
    if is_fraud:
        return random.choice(fraud_complaints)
    return random.choice(benign_complaints)

def generate_hr_text(is_fraud: bool) -> str:
    """HR remarks based on fraud status"""
    benign_hr = [
        "Employee performance satisfactory. No concerns.",
        "Completed annual AML & compliance training.",
        "Annual leave approved. No disciplinary issues.",
        "Promotion recommended for next cycle.",
        "Regular attendance. Good team player.",
        "",
    ]
    
    fraud_hr = [
        "Under departmental inquiry for financial misconduct. Conduct unsatisfactory.",
        "Written warning issued. Loan file irregularities noted.",
        "Disciplinary proceedings initiated per Regulation 14(3). Do not reassign.",
        "HR integrity review in progress. Multiple account irregularities detected.",
        "Performance review withheld pending Ethics Committee decision.",
        "Supervisor flagged suspicious transaction patterns. Internal audit initiated.",
        "Employee's financial statements show unexplained wealth. Investigation ongoing.",
        "Attendance at 'high-risk' branches correlates with fraud spike. Monitoring.",
    ]
    
    if is_fraud:
        return random.choice(fraud_hr)
    return random.choice(benign_hr)

# ────────────────────── EMPLOYEE MASTER (ENHANCED) ──────────────────────

def build_employees(n: int, n_branches: int) -> pd.DataFrame:
    """Build employee master with realistic role distribution & clustering"""
    roles = (["CLERK"] * int(n * 0.65) +
             ["MANAGER"] * int(n * 0.25) +
             ["IT_ADMIN"] * int(n * 0.08) +
             ["SENIOR_MGR"] * (n - int(n * 0.65) - int(n * 0.25) - int(n * 0.08)))
    random.shuffle(roles)
    
    employees = []
    for i in range(n):
        branch_id = f"BR_{random.randint(1, n_branches):02d}"
        # Clustering: employees in same branch tend to cluster together
        peer_cluster = random.randint(0, min(19, n_branches // 2))
        
        # Role-specific work hours
        if roles[i] == "CLERK":
            work_start = random.randint(8, 9)
            work_end = random.randint(17, 18)
        elif roles[i] in ["MANAGER", "SENIOR_MGR"]:
            work_start = random.randint(8, 9)
            work_end = random.randint(18, 19)
        else:  # IT_ADMIN
            work_start = random.randint(9, 10)
            work_end = random.randint(17, 18)
        
        employees.append({
            "emp_id": f"EMP_{1000 + i}",
            "emp_class": roles[i],
            "branch_id": branch_id,
            "peer_cluster": peer_cluster,
            "work_start_hr": work_start,
            "work_end_hr": work_end,
            "risk_score": round(random.uniform(0.01, 0.5), 3),  # Baseline risk
        })
    
    return pd.DataFrame(employees)

# ────────────────────── ENHANCED IP POOL ──────────────────────

def build_ip_pool(n_branches: int) -> dict:
    """Realistic IP pool with geographic distribution"""
    return {
        "internal": {
            f"BR_{b:02d}": [
                f"10.{b}.{random.randint(1,254)}.{random.randint(1,254)}"
                for _ in range(25)  # More IPs per branch
            ] for b in range(1, n_branches + 1)
        },
        "external": [fake.ipv4_public() for _ in range(50)],  # More external IPs
        "vpn_pool": [f"203.{random.randint(100,200)}.{random.randint(1,254)}.{random.randint(1,254)}" 
                     for _ in range(20)],  # VPN-like IPs for anomalies
    }

# ────────────────────── NORMAL TRANSACTIONS (ENHANCED) ──────────────────────

ACTION_BY_ROLE = {
    "CLERK": ["Initiate", "DB_Read", "System_Login", "Verify", "Cancel"],
    "MANAGER": ["Approve", "Reject", "DB_Read", "System_Login", "Initiate", "Escalate"],
    "IT_ADMIN": ["DB_Read", "System_Login", "Backup", "Maintain", "Audit"],
    "SENIOR_MGR": ["Approve", "Review", "System_Login", "Authorize", "Escalate"],
}

AMOUNT_RANGE = {
    "CLERK": (1_000, 500_000),
    "MANAGER": (50_000, 5_000_000),
    "IT_ADMIN": (0, 100),
    "SENIOR_MGR": (100_000, 10_000_000),
}

def build_normal_transactions(employees: pd.DataFrame, ip_pool: dict,
                              n: int, rng: np.random.Generator) -> pd.DataFrame:
    """Generate realistic normal transactions with temporal patterns"""
    
    # Weighted sampling by role
    weight_map = {"CLERK": 0.50, "MANAGER": 0.30, "IT_ADMIN": 0.10, "SENIOR_MGR": 0.10}
    weights = employees["emp_class"].map(weight_map).values
    weights = weights / weights.sum()
    idx = rng.choice(len(employees), size=n, p=weights)
    emps = employees.iloc[idx].reset_index(drop=True)
    
    timestamps = []
    for i in range(n):
        row = emps.iloc[i]
        # Realistic temporal distribution
        offset_days = rng.integers(0, (SIM_END - SIM_START).days)
        base_date = SIM_START + timedelta(days=int(offset_days))
        
        # 85% during work hours, 15% outside
        if rng.random() < 0.85:
            hour = gaussian_hour(int((row["work_start_hr"] + row["work_end_hr"]) / 2), std=1.5,
                                min_hr=row["work_start_hr"], max_hr=row["work_end_hr"])
        else:
            hour = rng.integers(0, 24)
        
        minute = rng.integers(0, 60)
        second = rng.integers(0, 60)
        ts = base_date.replace(hour=hour, minute=minute, second=second)
        timestamps.append(pd.Timestamp(ts))
    
    # Actions
    actions = [random.choice(ACTION_BY_ROLE.get(r, ["System_Login"])) 
               for r in emps["emp_class"]]
    
    # Amounts with correlation to role & action
    amounts = np.array([realistic_amount(role, action, rng) 
                       for role, action in zip(emps["emp_class"], actions)])
    
    # Transfer channels based on amount
    channels = [get_transfer_channel(a, amt) for a, amt in zip(actions, amounts)]
    
    # Dwell times (realistic session durations)
    def compute_dwell(action, emp_class):
        if action == "DB_Read" and emp_class == "IT_ADMIN":
            return round(rng.uniform(0.5, 5), 2)
        elif action in ["Approve", "Review"]:
            return round(rng.uniform(120, 600), 2)
        elif action == "Initiate":
            return round(rng.uniform(60, 300), 2)
        else:
            return round(rng.uniform(30, 180), 2)
    
    dwells = [compute_dwell(a, r) for a, r in zip(actions, emps["emp_class"])]
    
    # Records accessed (realistic for DB_Read)
    def compute_records(action, emp_class):
        if emp_class == "IT_ADMIN":
            return int(rng.integers(1000, 100_001))
        elif action == "DB_Read":
            return int(rng.integers(50, 501))
        else:
            return int(rng.integers(0, 10))
    
    records = [compute_records(a, r) for a, r in zip(actions, emps["emp_class"])]
    
    # Generate complaints (mostly benign, 2% fraudulent-like)
    complaint_col = [""] * n
    hr_col = [""] * n
    fraud_indices = rng.choice(n, size=max(1, int(n * 0.01)), replace=False)
    
    for i in range(n):
        if i in fraud_indices:
            complaint_col[i] = generate_complaint_text(is_fraud=False, emp_class=emps.iloc[i]["emp_class"])
            hr_col[i] = generate_hr_text(is_fraud=False)
        else:
            if rng.random() < 0.02:
                complaint_col[i] = generate_complaint_text(is_fraud=False)
                hr_col[i] = generate_hr_text(is_fraud=False)
    
    return pd.DataFrame({
        "timestamp": timestamps,
        "transaction_id": [str(uuid.uuid4()) for _ in range(n)],
        "emp_id": emps["emp_id"].values,
        "emp_class": emps["emp_class"].values,
        "branch_id": emps["branch_id"].values,
        "action_type": actions,
        "amount": amounts,
        "account_touched": [f"ACC_{rng.integers(10_000, 99_999)}" for _ in range(n)],
        "destination_account": [f"ACC_{rng.integers(10_000, 99_999)}" for _ in range(n)],
        "ip_address": [get_ip_by_branch_and_anomaly(br, ip_pool, False) 
                      for br in emps["branch_id"]],
        "transfer_channel": channels,
        "records_accessed": records,
        "dwell_time_seconds": dwells,
        "raw_complaint_text": complaint_col,
        "hr_remark_text": hr_col,
        "is_fraud_flag": 0,
    })

# ────────────────────── ENHANCED FRAUD SCENARIOS ──────────────────────

# SCENARIO 1: MAKER-CHECKER COLLUSION (Enhanced)
def inject_maker_checker_collusion(employees, ip_pool, rng, n_instances=30):
    """High-value transfers with unnatural approval patterns"""
    dates = spread_dates(n_instances)
    rows = []
    
    for ts in dates:
        clerk = employees[employees["emp_class"] == "CLERK"].sample(1).iloc[0]
        manager = employees[employees["emp_class"] == "MANAGER"].sample(1).iloc[0]
        branch = clerk["branch_id"]
        
        # Large amount + instant approval
        amount = round(rng.uniform(50_000_000, 200_000_000), 2)
        acct = f"ACC_{rng.integers(80_000, 89_999)}"
        
        c_ip = get_ip_by_branch_and_anomaly(branch, ip_pool, is_anomalous=True)
        m_ip = get_ip_by_branch_and_anomaly(branch, ip_pool, is_anomalous=True)
        
        base = datetime(ts.year, ts.month, ts.day, 18, 30, 0)
        
        # Initiate
        rows.append({
            "timestamp": pd.Timestamp(base),
            "transaction_id": str(uuid.uuid4()),
            "emp_id": clerk["emp_id"],
            "emp_class": "CLERK",
            "branch_id": branch,
            "action_type": "Initiate",
            "amount": amount,
            "account_touched": acct,
            "destination_account": f"ACC_{rng.integers(80_000, 89_999)}",
            "ip_address": c_ip,
            "transfer_channel": "RTGS",
            "records_accessed": 0,
            "dwell_time_seconds": round(rng.uniform(30, 90), 2),
            "raw_complaint_text": "",
            "hr_remark_text": "Unusual off-hours transaction activity.",
            "is_fraud_flag": 1,
        })
        
        # Instant Approve (too fast - 20 seconds!)
        rows.append({
            "timestamp": pd.Timestamp(base + timedelta(seconds=20)),
            "transaction_id": str(uuid.uuid4()),
            "emp_id": manager["emp_id"],
            "emp_class": "MANAGER",
            "branch_id": branch,
            "action_type": "Approve",
            "amount": amount,
            "account_touched": acct,
            "destination_account": f"ACC_{rng.integers(80_000, 89_999)}",
            "ip_address": m_ip,
            "transfer_channel": "RTGS",
            "records_accessed": 0,
            "dwell_time_seconds": 15.0,  # Dangerously fast!
            "raw_complaint_text": "",
            "hr_remark_text": "",
            "is_fraud_flag": 1,
        })
    
    return pd.DataFrame(rows)

# SCENARIO 2: MIDNIGHT DATA EXFILTRATION
def inject_midnight_exfiltration(employees, ip_pool, rng, n_instances=20):
    """IT Admin bulk exporting customer data at night"""
    dates = spread_dates(n_instances)
    rows = []
    
    for ts in dates:
        admin = employees[employees["emp_class"] == "IT_ADMIN"].sample(1).iloc[0]
        external_ip = random.choice(ip_pool["vpn_pool"] + ip_pool["external"])
        
        # Suspicious 2-4 AM access
        hour = rng.integers(2, 4)
        base = datetime(ts.year, ts.month, ts.day, hour, rng.integers(0, 60), 0)
        
        rows.append({
            "timestamp": pd.Timestamp(base),
            "transaction_id": str(uuid.uuid4()),
            "emp_id": admin["emp_id"],
            "emp_class": "IT_ADMIN",
            "branch_id": admin["branch_id"],
            "action_type": "SYSTEM_BULK_EXPORT",
            "amount": 0.0,
            "account_touched": "CUSTOMER_DB",
            "destination_account": "EXTERNAL_DRIVE",
            "ip_address": external_ip,  # External IP = RED FLAG
            "transfer_channel": "SYSTEM",
            "records_accessed": int(rng.integers(50_000, 500_001)),  # Massive export!
            "dwell_time_seconds": round(rng.uniform(300, 1800), 2),
            "raw_complaint_text": "",
            "hr_remark_text": f"CRITICAL: Bulk export of {rng.integers(50_000, 500_000)} customer records to external IP at {hour}AM.",
            "is_fraud_flag": 1,
        })
    
    return pd.DataFrame(rows)

# SCENARIO 3: TOXIC NLP - BRIBE & CORRUPTION
def inject_bribe_corruption(employees, ip_pool, rng, n_instances=60):
    """Managers with bribe complaints + HR red flags"""
    dates = spread_dates(n_instances)
    rows = []
    
    for i, ts in enumerate(dates):
        manager = employees[employees["emp_class"] == "MANAGER"].sample(1).iloc[0]
        branch = manager["branch_id"]
        m_ip = get_ip_by_branch_and_anomaly(branch, ip_pool, is_anomalous=False)
        
        base = datetime(ts.year, ts.month, ts.day, rng.integers(10, 17), 0, 0)
        
        rows.append({
            "timestamp": pd.Timestamp(base),
            "transaction_id": str(uuid.uuid4()),
            "emp_id": manager["emp_id"],
            "emp_class": "MANAGER",
            "branch_id": branch,
            "action_type": "Approve",
            "amount": round(rng.uniform(500_000, 5_000_000), 2),
            "account_touched": f"ACC_{rng.integers(70_000, 79_999)}",
            "destination_account": f"ACC_{rng.integers(80_000, 89_999)}",
            "ip_address": m_ip,
            "transfer_channel": random.choice(["NEFT", "RTGS"]),
            "records_accessed": 0,
            "dwell_time_seconds": round(rng.uniform(60, 300), 2),
            "raw_complaint_text": generate_complaint_text(is_fraud=True, emp_class="MANAGER"),
            "hr_remark_text": generate_hr_text(is_fraud=True),
            "is_fraud_flag": 1,
        })
    
    return pd.DataFrame(rows)

# SCENARIO 4: ZERO-DAY LOAN VELOCITY (Agent 1 Signal)
def inject_zero_day_loan_burst(employees, ip_pool, rng, n_bursts=35, loans_per_burst=18):
    """Clerk initiates 18 loans in 30 minutes → Manager auto-approves"""
    dates = spread_dates(n_bursts)
    rows = []
    
    for burst_idx, ts in enumerate(dates):
        clerk = employees[employees["emp_class"] == "CLERK"].sample(1).iloc[0]
        manager = employees[employees["emp_class"] == "MANAGER"].sample(1).iloc[0]
        branch = clerk["branch_id"]
        
        c_ip = get_ip_by_branch_and_anomaly(branch, ip_pool, is_anomalous=False)
        m_ip = get_ip_by_branch_and_anomaly(branch, ip_pool, is_anomalous=False)
        
        base = datetime(ts.year, ts.month, ts.day, rng.integers(9, 16), 0, 0)
        
        # 18 rapid loan initiations (one every 90 seconds)
        for j in range(loans_per_burst):
            offset_sec = j * 90  # 90 seconds apart
            amt = round(rng.uniform(1_000_000, 10_000_000), 2)
            
            rows.append({
                "timestamp": pd.Timestamp(base + timedelta(seconds=offset_sec)),
                "transaction_id": str(uuid.uuid4()),
                "emp_id": clerk["emp_id"],
                "emp_class": "CLERK",
                "branch_id": branch,
                "action_type": "Initiate",
                "amount": amt,
                "account_touched": f"ACC_{rng.integers(30_000, 39_999)}",
                "destination_account": f"ACC_{rng.integers(30_000, 39_999)}",
                "ip_address": c_ip,
                "transfer_channel": get_transfer_channel("Initiate", amt),
                "records_accessed": 0,
                "dwell_time_seconds": round(rng.uniform(20, 60), 2),
                "raw_complaint_text": "",
                "hr_remark_text": "",
                "is_fraud_flag": 1,
            })
        
        # Manager batch-approves all loans (one big approval)
        rows.append({
            "timestamp": pd.Timestamp(base + timedelta(seconds=loans_per_burst * 90 + 30)),
            "transaction_id": str(uuid.uuid4()),
            "emp_id": manager["emp_id"],
            "emp_class": "MANAGER",
            "branch_id": branch,
            "action_type": "Approve",
            "amount": round(rng.uniform(10_000_000, 50_000_000), 2),
            "account_touched": f"ACC_{rng.integers(30_000, 39_999)}",
            "destination_account": f"ACC_{rng.integers(30_000, 39_999)}",
            "ip_address": m_ip,
            "transfer_channel": "RTGS",
            "records_accessed": 0,
            "dwell_time_seconds": 10.0,  # Ultra-fast approval!
            "raw_complaint_text": "",
            "hr_remark_text": "High-velocity loan approvals detected.",
            "is_fraud_flag": 1,
        })
    
    return pd.DataFrame(rows)

# SCENARIO 5: ATM STRUCTURING / PMLA VIOLATION (Agent 6 Signal)
ATM_VICTIM_ACCOUNTS = [f"CUST_{i:05d}" for i in range(1000, 1050)]

def inject_atm_structuring(employees, ip_pool, rng, n_events=50, withdrawals_per_event=10):
    """Series of 10 ATM withdrawals (₹9.8K each) within 3 hours - structured to avoid ₹10K threshold"""
    dates = spread_dates(n_events)
    rows = []
    
    for event_idx, ts in enumerate(dates):
        clerk = employees[employees["emp_class"] == "CLERK"].sample(1).iloc[0]
        victim_acc = ATM_VICTIM_ACCOUNTS[event_idx % len(ATM_VICTIM_ACCOUNTS)]
        branch = clerk["branch_id"]
        
        c_ip = get_ip_by_branch_and_anomaly(branch, ip_pool, is_anomalous=False)
        base = datetime(ts.year, ts.month, ts.day, rng.integers(10, 15), 0, 0)
        
        # 10 near-limit withdrawals (just under ₹10K = PMLA reporting threshold)
        for j in range(withdrawals_per_event):
            amt = round(rng.uniform(9_700, 9_950), 2)  # Structured!
            
            rows.append({
                "timestamp": pd.Timestamp(base + timedelta(minutes=j * 18)),  # 18 min apart
                "transaction_id": str(uuid.uuid4()),
                "emp_id": clerk["emp_id"],
                "emp_class": "CLERK",
                "branch_id": branch,
                "action_type": "ATM_Withdrawal",
                "amount": amt,
                "account_touched": victim_acc,
                "destination_account": victim_acc,
                "ip_address": c_ip,
                "transfer_channel": "ATM",
                "records_accessed": 0,
                "dwell_time_seconds": round(rng.uniform(60, 180), 2),
                "raw_complaint_text": "",
                "hr_remark_text": "PMLA alert: Structured withdrawals detected below reporting threshold.",
                "is_fraud_flag": 1,
            })
    
    return pd.DataFrame(rows)

# SCENARIO 6: GHOST LAYERING / CIRCULAR FLOWS (Agent 2 GNN Signal)
def inject_ghost_layering(employees, ip_pool, rng, n_events=40, transfers_per_event=12):
    """Rapid circular fund transfers through fixed account pool"""
    GHOST_ACCOUNTS = [f"LAY_{i:04d}" for i in range(1, 21)]
    dates = spread_dates(n_events)
    rows = []
    
    for event_idx, ts in enumerate(dates):
        clerk = employees[employees["emp_class"] == "CLERK"].sample(1).iloc[0]
        branch = clerk["branch_id"]
        c_ip = get_ip_by_branch_and_anomaly(branch, ip_pool, is_anomalous=False)
        
        base = datetime(ts.year, ts.month, ts.day, rng.integers(10, 17), 0, 0)
        
        # 12 rapid transfers in circular pattern
        for j in range(transfers_per_event):
            amt = round(rng.uniform(200_000, 1_000_000), 2)
            src_acct = GHOST_ACCOUNTS[j % len(GHOST_ACCOUNTS)]
            dest_acct = GHOST_ACCOUNTS[(j + 1) % len(GHOST_ACCOUNTS)]
            
            rows.append({
                "timestamp": pd.Timestamp(base + timedelta(minutes=j * 4)),
                "transaction_id": str(uuid.uuid4()),
                "emp_id": clerk["emp_id"],
                "emp_class": "CLERK",
                "branch_id": branch,
                "action_type": "Wire_Domestic",
                "amount": amt,
                "account_touched": src_acct,
                "destination_account": dest_acct,
                "ip_address": c_ip,
                "transfer_channel": "UPI",
                "records_accessed": 0,
                "dwell_time_seconds": round(rng.uniform(15, 45), 2),
                "raw_complaint_text": "",
                "hr_remark_text": "Circular transaction pattern detected. GNN graph anomaly.",
                "is_fraud_flag": 1,
            })
    
    return pd.DataFrame(rows)

# SCENARIO 7: NETWORK-BASED COLLUSION (Multiple employees)
def inject_network_collusion(employees, ip_pool, rng, n_groups=15, group_size=4):
    """Small group of employees colluding on high-value transfers"""
    rows = []
    
    for group_idx in range(n_groups):
        fraud_emps = employees.sample(min(group_size, len(employees)))
        ts = rand_date(SIM_START, SIM_END)
        base = datetime(ts.year, ts.month, ts.day, rng.integers(14, 18), 0, 0)
        
        # Circular transfer within group
        for i, emp in fraud_emps.iterrows():
            next_emp = fraud_emps.iloc[(i + 1) % len(fraud_emps)]
            amt = round(rng.uniform(5_000_000, 20_000_000), 2)
            
            rows.append({
                "timestamp": pd.Timestamp(base + timedelta(minutes=i * 5)),
                "transaction_id": str(uuid.uuid4()),
                "emp_id": emp["emp_id"],
                "emp_class": emp["emp_class"],
                "branch_id": emp["branch_id"],
                "action_type": "Wire_Domestic",
                "amount": amt,
                "account_touched": f"ACC_{rng.integers(60_000, 69_999)}",
                "destination_account": f"ACC_{rng.integers(60_000, 69_999)}",
                "ip_address": get_ip_by_branch_and_anomaly(emp["branch_id"], ip_pool, is_anomalous=True),
                "transfer_channel": "RTGS",
                "records_accessed": 0,
                "dwell_time_seconds": round(rng.uniform(30, 120), 2),
                "raw_complaint_text": "",
                "hr_remark_text": "Network analysis: collusion pattern with peer cluster members.",
                "is_fraud_flag": 1,
            })
    
    return pd.DataFrame(rows)

# SCENARIO 8: PRIVILEGE ESCALATION / UNAUTHORIZED ACCESS
def inject_privilege_abuse(employees, ip_pool, rng, n_instances=25):
    """Junior employee accessing senior-level accounts/functions"""
    dates = spread_dates(n_instances)
    rows = []
    
    for ts in dates:
        clerk = employees[employees["emp_class"] == "CLERK"].sample(1).iloc[0]
        branch = clerk["branch_id"]
        
        # Accessing VIP account (shouldn't have access)
        vip_acct = f"VIP_{rng.integers(1000, 9999)}"
        
        external_ip = random.choice(ip_pool["vpn_pool"])  # Via VPN = suspicious
        base = datetime(ts.year, ts.month, ts.day, rng.integers(18, 23), 0, 0)
        
        rows.append({
            "timestamp": pd.Timestamp(base),
            "transaction_id": str(uuid.uuid4()),
            "emp_id": clerk["emp_id"],
            "emp_class": "CLERK",
            "branch_id": branch,
            "action_type": "DB_Read",
            "amount": 0.0,
            "account_touched": vip_acct,
            "destination_account": vip_acct,
            "ip_address": external_ip,
            "transfer_channel": "SYSTEM",
            "records_accessed": int(rng.integers(100, 1001)),
            "dwell_time_seconds": round(rng.uniform(30, 300), 2),
            "raw_complaint_text": "",
            "hr_remark_text": "Unauthorized access attempt: CLERK accessing VIP account via VPN.",
            "is_fraud_flag": 1,
        })
    
    return pd.DataFrame(rows)

# ────────────────────── SAVE & VALIDATE ──────────────────────

COLUMN_ORDER = [
    "timestamp", "transaction_id", "emp_id", "emp_class", "branch_id",
    "action_type", "amount", "account_touched", "destination_account", "ip_address", "transfer_channel",
    "records_accessed", "dwell_time_seconds",
    "raw_complaint_text", "hr_remark_text", "is_fraud_flag",
]

def split_and_save(df: pd.DataFrame, employees: pd.DataFrame) -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    mask_hist = df["timestamp"] < HISTORICAL_CUTOFF
    historical = df[mask_hist].sort_values("timestamp").reset_index(drop=True)
    live = df[~mask_hist].sort_values("timestamp").reset_index(drop=True)
    
    historical.to_csv(os.path.join(OUTPUT_DIR, "historical_warmup_data.csv"), index=False)
    live.to_csv(os.path.join(OUTPUT_DIR, "live_demo_stream.csv"), index=False)
    employees.to_csv(os.path.join(OUTPUT_DIR, "employees_master.csv"), index=False)
    
    print(f"\n✓ historical_warmup_data.csv : {len(historical):>7,} rows | fraud: {historical['is_fraud_flag'].sum()}")
    print(f"✓ live_demo_stream.csv       : {len(live):>7,} rows | fraud: {live['is_fraud_flag'].sum()}")
    print(f"✓ employees_master.csv       : {len(employees):>7,} rows")

def validate(df: pd.DataFrame, employees: pd.DataFrame) -> None:
    """15+ validation checks for production quality"""
    print("\n[VALIDATION] Running 15 quality checks...")
    
    assert len(df) == TOTAL_ROWS, f"Row count {len(df)} != {TOTAL_ROWS}"
    print("  ✓ Row count exact match")
    
    assert df["transaction_id"].nunique() == len(df), "Duplicate transaction IDs"
    print("  ✓ No duplicate transaction IDs")
    
    assert df["is_fraud_flag"].isin([0, 1]).all(), "Non-binary fraud flag"
    print("  ✓ Fraud flag is binary (0/1)")
    
    assert not df["timestamp"].isna().any(), "Null timestamps"
    print("  ✓ No null timestamps")
    
    assert all(col in df.columns for col in COLUMN_ORDER), "Missing columns"
    print("  ✓ All 15 columns present")
    
    fraud_rate = df["is_fraud_flag"].mean()
    assert 0.02 <= fraud_rate <= 0.08, f"Fraud rate {fraud_rate:.4f} out of 2-8% range"
    print(f"  ✓ Fraud rate {fraud_rate*100:.2f}% (target: 2-8%)")
    
    fraud_df = df[df["is_fraud_flag"] == 1]
    assert len(fraud_df[fraud_df["action_type"] == "ATM_Withdrawal"]) > 0, "ATM Harvest missing"
    print("  ✓ ATM_Withdrawal scenario present")
    
    assert fraud_df["raw_complaint_text"].str.contains("bribe", case=False).any(), "Toxic NLP missing"
    print("  ✓ Toxic NLP (bribe) keywords detected")
    
    zd = fraud_df[fraud_df["action_type"] == "Initiate"]
    assert len(zd) > 200, f"Zero-Day Loan rows too few: {len(zd)}"
    print(f"  ✓ Zero-Day Loan: {len(zd)} rapid Initiate rows")
    
    # NEW: Check for circular patterns
    ghost_rows = fraud_df[fraud_df["account_touched"].str.startswith("LAY_", na=False)]
    assert len(ghost_rows) > 50, "Ghost Layering rows too few"
    print(f"  ✓ Ghost Layering: {len(ghost_rows)} circular transfer rows")
    
    # NEW: Check collusion network
    network_rows = fraud_df[fraud_df["action_type"] == "Wire_Domestic"]
    assert len(network_rows) > 30, "Network collusion rows too few"
    print(f"  ✓ Network Collusion: {len(network_rows)} colluding transfers")
    
    # NEW: Check privilege abuse
    priv_rows = fraud_df[(fraud_df["emp_class"] == "CLERK") & (fraud_df["action_type"] == "DB_Read")]
    assert len(priv_rows) > 10, "Privilege escalation rows too few"
    print(f"  ✓ Privilege Abuse: {len(priv_rows)} unauthorized access rows")
    
    # NEW: Label integrity check
    normal_complaint = df[df["is_fraud_flag"] == 0]["raw_complaint_text"].fillna("")
    assert not normal_complaint.str.contains("bribe|extort|unauthorized", case=False, na=False).any(), \
        "LABEL LEAK: fraud keywords in normal rows!"
    print("  ✓ Label integrity: no label leakage")
    
    # NEW: Temporal consistency
    assert df["timestamp"].min() >= SIM_START, "Timestamps before simulation start"
    assert df["timestamp"].max() <= SIM_END, "Timestamps after simulation end"
    print(f"  ✓ Temporal range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    
    # NEW: Employee consistency
    assert df["emp_id"].isin(employees["emp_id"]).all(), "Unknown employee IDs"
    print(f"  ✓ Employee consistency: all emp_ids valid")
    
    print("  ✓ ALL VALIDATIONS PASSED ✓\n")

# ────────────────────── MAIN ──────────────────────

def main():
    print("=" * 75)
    print("  VaultMind 3.0 - Advanced Data Generator v3.0")
    print("  Realistic Fraud Detection Dataset")
    print("  Target: 75,000 rows | 8 fraud scenarios | 750 employees")
    print("=" * 75)
    
    rng = np.random.default_rng(SEED)
    
    print(f"\n[1/5] Building {N_EMPLOYEES} employees across {N_BRANCHES} branches...")
    employees = build_employees(N_EMPLOYEES, N_BRANCHES)
    print(f"  Clerks: {(employees['emp_class']=='CLERK').sum()} | " 
          f"Managers: {(employees['emp_class']=='MANAGER').sum()} | "
          f"IT: {(employees['emp_class']=='IT_ADMIN').sum()} | "
          f"Senior: {(employees['emp_class']=='SENIOR_MGR').sum()}")
    
    print(f"\n[2/5] Building IP pool for {N_BRANCHES} branches...")
    ip_pool = build_ip_pool(N_BRANCHES)
    
    print("\n[3/5] Injecting 8 advanced fraud scenarios...")
    s1 = inject_maker_checker_collusion(employees, ip_pool, rng, n_instances=30)
    print(f"  ✓ S1 Maker-Checker Collusion       : {len(s1):>5} rows (colluding approvals)")
    
    s2 = inject_midnight_exfiltration(employees, ip_pool, rng, n_instances=20)
    print(f"  ✓ S2 Midnight Exfiltration        : {len(s2):>5} rows (data theft)")
    
    s3 = inject_bribe_corruption(employees, ip_pool, rng, n_instances=60)
    print(f"  ✓ S3 Bribe & Corruption           : {len(s3):>5} rows (NLP-toxic)")
    
    s4 = inject_zero_day_loan_burst(employees, ip_pool, rng, n_bursts=35, loans_per_burst=18)
    print(f"  ✓ S4 Zero-Day Loan Velocity       : {len(s4):>5} rows (Agent 1 signal) ⭐")
    
    s5 = inject_atm_structuring(employees, ip_pool, rng, n_events=50, withdrawals_per_event=10)
    print(f"  ✓ S5 ATM Structuring (PMLA)       : {len(s5):>5} rows (Agent 6 signal) ⭐")
    
    s6 = inject_ghost_layering(employees, ip_pool, rng, n_events=40, transfers_per_event=12)
    print(f"  ✓ S6 Ghost Layering (GNN)         : {len(s6):>5} rows (Agent 2 signal) ⭐")
    
    s7 = inject_network_collusion(employees, ip_pool, rng, n_groups=15, group_size=4)
    print(f"  ✓ S7 Network Collusion            : {len(s7):>5} rows (peer cluster fraud)")
    
    s8 = inject_privilege_abuse(employees, ip_pool, rng, n_instances=25)
    print(f"  ✓ S8 Privilege Escalation         : {len(s8):>5} rows (unauthorized access)")
    
    df_fraud = pd.concat([s1, s2, s3, s4, s5, s6, s7, s8], ignore_index=True)
    total_fraud = len(df_fraud)
    print(f"\n  📊 TOTAL FRAUD ROWS: {total_fraud:,} rows ({total_fraud/TOTAL_ROWS*100:.2f}%)")
    
    n_normal = TOTAL_ROWS - total_fraud
    print(f"\n[4/5] Generating {n_normal:,} realistic normal transactions...")
    df_normal = build_normal_transactions(employees, ip_pool, n_normal, rng)
    
    print(f"\n[5/5] Combining, validating, splitting & saving...")
    df_final = pd.concat([df_normal, df_fraud], ignore_index=True)
    df_final = df_final.sort_values("timestamp").reset_index(drop=True)
    df_final = df_final[COLUMN_ORDER]
    
    validate(df_final, employees)
    split_and_save(df_final, employees)
    
    # Save metadata
    metadata = {
        "generation_date": datetime.now().isoformat(),
        "seed": SEED,
        "total_rows": len(df_final),
        "fraud_rows": total_fraud,
        "fraud_rate": f"{df_final['is_fraud_flag'].mean()*100:.2f}%",
        "employees": len(employees),
        "branches": N_BRANCHES,
        "date_range": f"{df_final['timestamp'].min()} to {df_final['timestamp'].max()}",
        "scenarios": 8,
        "columns": COLUMN_ORDER,
    }
    
    with open(os.path.join(OUTPUT_DIR, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2, default=str)
    
    print(f"\n📁 Output directory: {OUTPUT_DIR}")
    print(f"✅ Generation complete!\n")

if __name__ == "__main__":
    main()
