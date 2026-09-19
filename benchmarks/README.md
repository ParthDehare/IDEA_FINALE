# VaultMind Enterprise API Benchmarks

This directory contains benchmarking tools and historical results for the VaultMind Enterprise API, particularly the core fraud detection endpoint.

## Benchmarked Endpoint
- **Endpoint tested**: `POST /api/v1/scan`
- **Methodology**: Sequential requests, measuring round-trip latency. A warm-up phase is included to mitigate cold start issues and connection pooling overhead.

## Environment Details
The baseline results were gathered on a local Docker environment with the following specs:
- **OS**: Ubuntu 22.04
- **CPU**: 4-core CPU
- **RAM**: 16GB
- **Runtime**: Docker

## Results Summary
Based on 100 sequential requests (after 10 warm-up requests):

| Metric | Latency (ms) |
|--------|--------------|
| Median | 5.90         |
| Mean   | 6.20         |
| P90    | 7.15         |
| P95    | 7.83         |
| P99    | 9.40         |

See `api_latency_results.json` for detailed results.

## How to Reproduce
1. Start the backend stack (FastAPI, Redis, Kafka) using Docker Compose.
2. Install the benchmarking script dependencies (e.g., `requests`).
3. Run the script from the `benchmarks/` folder:
   ```bash
   python benchmark.py --url http://localhost:8000/api/v1/scan --requests 100 --warmup 10
   ```
4. The script will output the stats and save a new JSON result file.
