import argparse
import time
import requests
import statistics
import json
from datetime import datetime, timezone

def run_benchmark(url: str, num_requests: int, num_warmup: int):
    print(f"Starting benchmark for {url}")
    print(f"Warm-up requests: {num_warmup}")
    
    payload = {
        "transaction_id": "test_tx_001",
        "user_id": "usr_999",
        "amount": 250.00,
        "currency": "USD",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Warm-up
    for i in range(num_warmup):
        try:
            requests.post(url, json=payload, timeout=5)
        except Exception:
            pass

    print(f"Executing {num_requests} sequential requests...")
    latencies = []
    
    for i in range(num_requests):
        start = time.perf_counter()
        try:
            resp = requests.post(url, json=payload, timeout=5)
            if resp.status_code == 200:
                end = time.perf_counter()
                latencies.append((end - start) * 1000)
        except Exception as e:
            print(f"Request failed: {e}")
            
    if not latencies:
        print("No successful requests to calculate metrics.")
        return

    latencies.sort()
    
    def percentile(data, p):
        k = (len(data) - 1) * (p / 100.0)
        f = int(k)
        c = f + 1
        if f == c or c >= len(data):
            return data[f]
        return data[f] + (k - f) * (data[c] - data[f])

    results = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "benchmark_config": {
            "endpoint_tested": f"POST {url}",
            "number_of_requests": len(latencies),
            "warm_up_requests": num_warmup
        },
        "results_ms": {
            "min": round(latencies[0], 2),
            "median": round(statistics.median(latencies), 2),
            "mean": round(statistics.mean(latencies), 2),
            "p90": round(percentile(latencies, 90), 2),
            "p95": round(percentile(latencies, 95), 2),
            "p99": round(percentile(latencies, 99), 2),
            "max": round(latencies[-1], 2)
        }
    }
    
    print(json.dumps(results, indent=2))
    
    output_file = "api_latency_results_new.json"
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="API Latency Benchmark")
    parser.add_argument("--url", default="http://localhost:8000/api/v1/scan", help="Endpoint URL")
    parser.add_argument("--requests", type=int, default=100, help="Number of requests")
    parser.add_argument("--warmup", type=int, default=10, help="Number of warm-up requests")
    args = parser.parse_args()
    
    run_benchmark(args.url, args.requests, args.warmup)
