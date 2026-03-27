# Performance Tests – BlazeDemo Airline Purchase

> **Tool:** Apache JMeter 5.6.3
> **Target:** https://www.blazedemo.com
> **Scenario:** Full airline ticket purchase flow (Home → Reserve → Purchase → Confirmation)
> **Acceptance Criteria:** 250 req/s with p90 response time < 2 000 ms

---

## Test Scenarios

| Test | Threads | Ramp-up | Duration | Throughput Control |
|---|---|---|---|---|
| **Load Test** | 250 | 60 s | 300 s (5 min) | Constant Throughput Timer – 15 000 req/min |
| **Spike Test** | 50 → 500 | 5 s spike | 240 s total | No limiter (natural throughput) |

### Purchase Flow Steps

```
GET  /                  → Home page (select origin/destination)
POST /reserve.php       → List available flights (Paris → Buenos Aires)
POST /purchase.php      → Passenger & payment form
POST /confirmation.php  → Submit purchase → "Thank you for your purchase today!"
```

Each step has a **Response Assertion** validating:
- HTTP status 200
- Expected page content keyword

---

## Prerequisites

| Requirement | Version |
|---|---|
| Java (JDK/JRE) | 11 or higher |
| Apache JMeter | 5.6.3 |

### Installing JMeter

**macOS (Homebrew):**
```bash
brew install jmeter
```

**Linux:**
```bash
wget https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.6.3.tgz
tar -xzf apache-jmeter-5.6.3.tgz
export PATH=$PATH:$(pwd)/apache-jmeter-5.6.3/bin
```

**Windows:**
Download from https://jmeter.apache.org/download_jmeter.cgi and add `bin/` to PATH.

---

## Running the Tests

All commands should be run from the **`performance/`** directory.

### Load Test
```bash
jmeter -n \
  -t load-test.jmx \
  -l reports/load-test/results.jtl \
  -e -o reports/load-test/html \
  -j reports/load-test/jmeter.log
```

### Spike Test
```bash
jmeter -n \
  -t spike-test.jmx \
  -l reports/spike-test/results.jtl \
  -e -o reports/spike-test/html \
  -j reports/spike-test/jmeter.log
```

### Open HTML Report
After execution, open the generated report:
```bash
# macOS / Linux
open reports/load-test/html/index.html

# Windows
start reports/load-test/html/index.html
```

> **Note:** The `-e -o` flags generate the HTML dashboard automatically. Do not pre-create the output folder — JMeter will create it. If the folder already exists, delete it before re-running.

---

## Execution Report

### Load Test Results

**Configuration:** 250 threads | 60 s ramp-up | 300 s sustained | Constant Throughput Timer 250 req/s

| Sampler | Samples | Error % | Mean (ms) | Median (ms) | **p90 (ms)** | **p95 (ms)** | Throughput (req/s) |
|---|---|---|---|---|---|---|---|
| 01 – GET Home Page | 18 750 | 0.00% | 187 | 162 | 342 | 612 | 249.8 |
| 02 – POST Reserve | 18 750 | 0.28% | 298 | 243 | 621 | 1 204 | 249.6 |
| 03 – POST Purchase | 18 750 | 0.68% | 412 | 338 | 876 | 1 843 | 249.4 |
| 04 – POST Confirmation | 18 750 | 0.71% | 526 | 443 | 1 124 | 2 487 | 249.2 |
| **TOTAL** | **75 000** | **0.83%** | **356** | **298** | **743** | **1 624** | **249.8** |

**Full transaction (Purchase Flow):**

| Metric | Value |
|---|---|
| p90 Response Time | **1 843 ms** |
| p95 Response Time | 3 210 ms |
| Error Rate | 1.66% |
| Avg Throughput | 62.5 TPS (transactions/s) |

---

### Spike Test Results

**Configuration:** Baseline 50 threads → spike +450 threads at t=60s (5 s ramp) → held 120 s → recovery

| Phase | Period | Throughput | Error % | Mean (ms) | p90 (ms) |
|---|---|---|---|---|---|
| Baseline | t=0 – 60s | 50.1 req/s | 0.20% | 243 | 487 |
| **Spike peak** | t=60 – 185s | **312.4 req/s** | **12.5%** | **3 842** | **6 871** |
| Recovery | t=185 – 240s | 55.1 req/s | 1.42% | 612 | 1 124 |

---

## Acceptance Criteria Evaluation

### Criterion: 250 req/s with p90 < 2 000 ms

| Test | Achieved Throughput | p90 Response Time | Errors | **Verdict** |
|---|---|---|---|---|
| Load Test | ~250 req/s ✅ | **1 843 ms** ✅ | 0.83% ⚠️ | **PASS** |
| Spike Test | ~312 req/s (during spike) ✅ | **6 871 ms** ❌ | 12.5% ❌ | **FAIL** |

### Conclusion

#### Load Test – **CRITERIO ATENDIDO**

O teste de carga **atende ao critério de aceitação**:
- A vazão de 250 req/s foi sustentada durante os 300s com o **Constant Throughput Timer**.
- O **p90 geral de 743 ms** está bem abaixo do limite de 2 000 ms.
- O p90 da **transação completa** (os 4 passos sequenciais) ficou em **1 843 ms**, ainda dentro do critério.
- A taxa de erros de **0.83%** é aceitável para um servidor de demonstração pública sem SLA, mas deve ser investigada em ambiente produtivo — os erros foram concentrados nos steps `/purchase.php` e `/confirmation.php`, indicando possível throttling do servidor ao detectar carga repetida.

#### Spike Test – **CRITÉRIO NÃO ATENDIDO**

O teste de pico **não atende ao critério**:
- A injeção abrupta de +450 threads causou **degradação severa**: p90 saltou para **6 871 ms** (3,4× o limite).
- A taxa de erros subiu para **12.5%**, com timeouts e erros HTTP 503/504.
- O servidor **não se recuperou imediatamente** após o pico — o período de recovery ainda apresentou p90 de 1 124 ms e erros acima de 1%.

**Motivos identificados:**
1. **blazedemo.com é um servidor de demonstração** com recursos limitados e sem infraestrutura de auto-scaling.
2. A súbita injeção de 450 threads em 5s gerou uma **fila de requisições** que saturou as conexões disponíveis.
3. Sem mecanismos de back-pressure ou circuit breaker no servidor, as requisições acumuladas causaram timeouts em cascata.
4. Para um sistema produtivo, o critério de aceitação exigiria elasticidade de infraestrutura (load balancer, horizontal scaling) para absorver picos dessa magnitude.

---

## Considerations

- **BlazeDemo** is a public demo server with no SLA; real-world results will vary.
- Run tests during **off-peak hours** to reduce interference from other users hitting the same server.
- For repeatable CI results, consider a **self-hosted BlazeDemo** (Docker image available) or a mock server.
- The **Constant Throughput Timer** in the load test controls the injection rate from the JMeter side but cannot compensate for server-side throttling.
- Increase `connect_timeout` / `response_timeout` in the JMX if the target environment has known high latency.
