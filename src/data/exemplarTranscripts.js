/**
 * Master Defense Exemplar Archive
 * Calibrated transcripts of top-percentile (92-98) FAANG & Tier-1 interview defenses.
 * Includes candidate transcripts, hiring committee rationales, and 4-pillar rubric scores.
 * Phase 18 — AI Career Preparation Agent
 */

export const MASTER_EXEMPLARS = [
  {
    id: 'exemplar-google-l5',
    company: 'Google',
    role: 'Senior Software Engineer (L5)',
    domain: 'Distributed Systems & Infrastructure',
    question: 'Design an idempotency and deduplication layer for high-throughput payment webhooks processing 50,000 requests/sec.',
    score: 96,
    verdict: 'Strong Hire',
    calibratedLevel: 'L5 — Senior Software Engineer',
    timeElapsed: '18 min defense',
    summary: 'Candidate flawlessly formulated a multi-tiered deduplication architecture leveraging Redis clusters with optimistic locking, local Bloom filters, and PostgreSQL outbox transactional guarantees.',
    candidateDefense: `To build an idempotency and deduplication layer operating at 50,000 RPS, we cannot rely on a single central relational lock because of connection pool saturation and write amplification. 

I propose a three-tier deduplication pipeline:

1. Edge Ingress & Bloom Filter Gate:
At the API gateway/edge tier, each incoming webhook must mandate an 'Idempotency-Key' HTTP header (typically UUIDv4 or deterministic hash of client_id + merchant_transaction_id). We first check a distributed Bloom filter (or Cuckoo filter) stored in-memory with a 24-hour sliding TTL. If the key is definitively absent, we know with 100% certainty it is new and bypass immediate cache-miss penalties.

2. Redis Distributed Lease (Distributed Mutex):
If the Bloom filter indicates the key might exist or for authoritative confirmation, the request attempts an atomic 'SET key idempotency_lock NX EX 120' in a sharded Redis cluster (consistent hashing with 3x replicas).
- If the command returns OK: The worker acquires the processing lease and continues execution.
- If it returns nil: A duplicate request is actively inflight. We respond with HTTP 409 Conflict or hold connection with exponential backoff long-polling (max 3s) awaiting the final result payload cached at 'result:idempotency_key'.

3. Database Transaction & Transactional Outbox:
When the downstream state machine completes the charge, we write both the business record and the idempotency receipt inside the same atomic PostgreSQL transaction (ACID boundary). Once committed, the final response snapshot is published back to Redis with a 72-hour TTL and published via a Debezium CDC outbox pipeline to Kafka.

Failure Modes & Edge Cases:
If a worker node crashes mid-flight while holding the Redis lease, the 120-second lease expiry frees subsequent retries from client webhooks. Furthermore, if a network partition isolates a Redis shard, our Postgres unique constraint 'CONSTRAINT uq_merchant_idem_key UNIQUE (merchant_id, idempotency_key)' acts as the absolute invariant safety net, preventing double billing under any chaotic partition.`,
    committeeDeliberation: {
      consensus: 'Universal Strong Hire across all 4 committee members. Candidate demonstrated senior engineering trade-off instinct, moving immediately beyond basic DB constraints into multi-tiered caching, failure mode recovery, and concurrency isolation.',
      strengths: [
        'Differentiated between in-flight deduplication (distributed mutex) and terminal deduplication (cached response snapshot).',
        'Acknowledged Redis node crash failure modes with explicit TTL expiry safety valves.',
        'Preserved transactional atomicity using PostgreSQL unique constraints as the final invariant safety net.'
      ],
      coachingNotes: 'Candidate spoke with exceptional structure. Could have mentioned dead-letter queues (DLQ) for poisoned webhook payloads, but addressed it promptly when queried.'
    },
    rubricBreakdown: {
      algorithmicDepth: 95,
      architectureQuality: 98,
      communicationPacing: 94,
      autonomyCoachability: 97
    },
    keyTakeawayLesson: 'In system design, never rely on a single layer for idempotency. Pair fast transient locks (Redis NX) with durable relational unique constraints (PostgreSQL) to satisfy both throughput and correctness.'
  },
  {
    id: 'exemplar-amazon-l5',
    company: 'Amazon',
    role: 'Senior Applied Scientist / ML Tech Lead (L5)',
    domain: 'Machine Learning Platforms & Production Drift',
    question: 'How do you detect feature drift in real-time recommendation engines and deploy shadow models with zero downtime?',
    score: 94,
    verdict: 'Strong Hire',
    calibratedLevel: 'L5 — Tech Lead / Senior Specialist',
    timeElapsed: '22 min defense',
    summary: 'Candidate demonstrated deep empirical rigor, designing an asynchronous drift computation engine with Wasserstein Distance and KS-testing alongside blue/green canary inference routing.',
    candidateDefense: `In a production recommendation system processing streaming user interactions, detecting distribution shifts requires separating feature drift (covariate shift) from concept drift (P(Y|X) changes).

My architecture comprises two coupled subsystems:

Part 1: Real-Time Feature Drift Detection Pipeline:
- Streaming Ingestion: Raw inference requests and predicted logits are mirrored asynchronously via AWS Kinesis to avoid adding latency to the P99 critical path (which must remain under 15ms).
- Micro-Batching & Sliding Windows: An Apache Flink job aggregates feature statistics across a rolling 1-hour window against a baseline reference distribution calculated from the training corpus.
- Statistical Tests: For continuous variables (e.g., user dwell time, item pricing percentile), we compute Population Stability Index (PSI) and the Wasserstein Distance (Earth Mover's Distance). When PSI exceeds 0.2, an automated drift alarm fires. For categorical features (e.g., device category, category affinities), we employ Chi-Square goodness-of-fit and Jensen-Shannon Divergence.

Part 2: Zero-Downtime Shadow & Canary Deployment:
- Envoy Service Mesh Dark Traffic Duplication: We configure an Envoy ingress route with 'shadow_policy' pointing to the candidate model (Model B). Client requests receive the response from the live model (Model A), while a mirrored copy is asynchronously evaluated on Model B.
- Telemetry & Parity Validation: We emit latency percentiles, GPU memory saturation, and prediction correlation metrics to Prometheus/CloudWatch. Model B must achieve >= 99.2% inference parity without triggering OOM spikes under 150% peak load.
- Progressive Canary Rollout: Once shadow validation passes 48 continuous hours, traffic is gradually shifted: 1% -> 5% -> 25% -> 100%, guarded by automatic rollback triggers linked to business conversion rate drops > 1.5%.`,
    committeeDeliberation: {
      consensus: 'Clear Hire/Strong Hire consensus. Exemplifies Amazon Leadership Principles "Dive Deep" and "Bias for Action". Selected appropriate statistical metrics (PSI and Wasserstein over simple mean/variance tracking).',
      strengths: [
        'Recognized that statistical drift checks should never reside in the synchronous inference hot path.',
        'Distinguished between continuous and discrete statistical metrics (Wasserstein vs Chi-Square).',
        'Constructed realistic production canary guardrails tied directly to business KPIs.'
      ],
      coachingNotes: 'Candidate demonstrated authoritative production instincts. Well calibrated for L5 Tech Lead scope.'
    },
    rubricBreakdown: {
      algorithmicDepth: 93,
      architectureQuality: 96,
      communicationPacing: 95,
      autonomyCoachability: 92
    },
    keyTakeawayLesson: 'Asynchronous traffic shadowing via service mesh (Envoy) is superior to in-app branching because it prevents candidate model latency bugs from impacting production users.'
  },
  {
    id: 'exemplar-meta-l4',
    company: 'Meta',
    role: 'Software Engineer II (L4)',
    domain: 'Concurrency & Edge Systems',
    question: 'Implement an in-memory rate limiter supporting burst traffic across distributed edge clusters.',
    score: 92,
    verdict: 'Hire',
    calibratedLevel: 'L4 — Software Engineer II',
    timeElapsed: '16 min defense',
    summary: 'Candidate articulately defended the Token Bucket algorithm over Sliding Window Log for high-concurrency memory efficiency, implementing atomic operations and local token refills.',
    candidateDefense: `When evaluating algorithms for an edge rate limiter with burst tolerance, we have three primary candidates: Fixed Window, Sliding Window Log, and Token Bucket.

Why Token Bucket is optimal:
- Fixed Window suffers from traffic boundary doubling (2x rate at window edges).
- Sliding Window Log requires storing a timestamp for every request in a Redis sorted set (ZSET), which consumes O(N) memory and becomes prohibitive at 100,000 RPS.
- Token Bucket provides O(1) memory per user and gracefully permits bursts up to capacity 'C' while enforcing an average fill rate 'r'.

Implementation Strategy:
Instead of running a background cron worker to increment tokens every second (which would be disastrous with 10 million active users), we calculate the replenishment lazily on every request:

\`\`\`python
class TokenBucket:
    def __init__(self, capacity: int, fill_rate_per_sec: float):
        self.capacity = capacity
        self.fill_rate = fill_rate_per_sec
        self.tokens = capacity
        self.last_refill_timestamp = time.monotonic()
        self.lock = threading.Lock()

    def allow_request(self, tokens_requested: int = 1) -> bool:
        with self.lock:
            now = time.monotonic()
            elapsed = now - self.last_refill_timestamp
            self.last_refill_timestamp = now
            # Replenish tokens lazily
            self.tokens = min(self.capacity, self.tokens + elapsed * self.fill_rate)
            
            if self.tokens >= tokens_requested:
                self.tokens -= tokens_requested
                return True
            return False
\`\`\`

In a distributed multi-cluster setup:
To avoid cross-datacenter WAN round-trips on every request, edge nodes operate a local bucket pre-allocated with a tranche of tokens requested from a central Redis cluster every 500ms via Lua scripts (e.g., batch-requesting 50 tokens at a time). If an edge node gets severed from Redis, it enters a degraded safe mode limiting local burst to 20% of its normal quota.`,
    committeeDeliberation: {
      consensus: 'Solid L4 Hire verdict with strong support from systems reviewers. Candidate cleanly explained lazy replenishment mathematics and prevented global lock contention.',
      strengths: [
        'Avoided background timer threads by implementing time-delta lazy replenishment.',
        'Identified the memory explosion trap of Sliding Window Log in high-RPS environments.',
        'Proposed token tranches to eliminate cross-WAN synchronization latency.'
      ],
      coachingNotes: 'Candidate demonstrated crisp fluency. For L5 consideration, deeper analysis of Redis cluster split-brain scenarios would have been expected.'
    },
    rubricBreakdown: {
      algorithmicDepth: 94,
      architectureQuality: 91,
      communicationPacing: 92,
      autonomyCoachability: 91
    },
    keyTakeawayLesson: 'Always compute token replenishment lazily based on elapsed time rather than maintaining active background ticking threads.'
  },
  {
    id: 'exemplar-stripe-l5',
    company: 'Stripe',
    role: 'Staff / Senior Infrastructure Engineer (L5/L6)',
    domain: 'Financial Consistency & Eventual Consistency',
    question: 'Reconcile two asynchronous event streams where events may arrive out-of-order or duplicated with guaranteed ledger consistency.',
    score: 98,
    verdict: 'Strong Hire',
    calibratedLevel: 'L5+ / L6 — Senior / Staff Engineer',
    timeElapsed: '25 min defense',
    summary: 'Masterclass defense on financial correctness. Implemented immutable double-entry ledger semantics, vector clock ordering, and bi-temporal database reconciliation.',
    candidateDefense: `In financial ledger infrastructure, you cannot mutate existing balances or rely on wall-clock timestamps because NTP clock skew will corrupt transaction order.

Our system must guarantee three fundamental properties:
1. Immutability (Double-Entry Ledger): Balances are never updated in place; they are computed as the append-only sum of debits and credits. Every transaction consists of balanced ledger entries where Sum(Debits) - Sum(Credits) == 0.
2. Monotonic Causal Ordering: We utilize Lamport logical timestamps paired with sequence numbers generated by Kafka partition offsets, rather than system epoch timestamps.
3. Bi-Temporal Data Modeling: Every event maintains two distinct timelines:
   - Event-Time (when the financial transaction occurred in the physical world).
   - Ingestion-Time (when our ledger received and recorded the event).

Reconciliation Engine Architecture:
- Out-of-Order Buffer: Events stream into a Kafka partitioned topic keyed by 'account_id'. A stateful stream processor (Apache Flink or Kafka Streams with RocksDB local state) maintains a tumbling reconciliation buffer with a defined watermark (e.g., 15 minutes of allowed lateness).
- Duplicate Suppression: Each event contains an immutable SHA-256 hash of its source payload. A RocksDB state store verifies uniqueness within the reconciliation window.
- Back-Dated Adjustments: When an event arrives past the watermark (late-arriving credit), we NEVER rewrite previous ledger lines. Instead, the engine generates an explicit compensating entry (Reversal Entry) labeled 'adjustment_for_event_id' with retroactive accounting effective dates. This preserves full historical auditability for SOC-2 and regulatory audits.`,
    committeeDeliberation: {
      consensus: 'Top 1% defense of the year. Candidate demonstrated pristine financial domain mastery, immediate clarity on bi-temporal semantics, and zero ambiguity on distributed consistency.',
      strengths: [
        'Emphasized double-entry immutable accounting principles without prompting.',
        'Clarified NTP clock drift vulnerabilities and applied logical sequence ordering.',
        'Utilized compensating reversal entries rather than mutating historical records.'
      ],
      coachingNotes: 'Flawless execution. Candidate would serve as an immediate architectural anchor.'
    },
    rubricBreakdown: {
      algorithmicDepth: 97,
      architectureQuality: 99,
      communicationPacing: 98,
      autonomyCoachability: 98
    },
    keyTakeawayLesson: 'In critical systems, never rewrite history to fix late-arriving events. Emit compensating ledger transactions so audit trails remain mathematically verifiable.'
  }
];
