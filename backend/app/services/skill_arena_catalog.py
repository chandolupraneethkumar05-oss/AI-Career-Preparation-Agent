"""
Canonical Challenge Catalog for Skill Arena
AI Career Preparation Agent

Contains high-quality, career-focused challenges across:
Python, SQL, Machine Learning, Statistics, MLOps, Docker, Git, Scikit-learn, PyTorch, Communication.
Supports all 4 practice modes: Coding, Debug, MCQ, and Predict Output.
"""

from typing import List, Dict, Any

SKILL_ARENA_CATALOG: List[Dict[str, Any]] = [
    # =========================================================================
    # 1. PYTHON
    # =========================================================================
    {
        "id": "arena-py-code-01",
        "title": "Find the Second Largest Number in a List",
        "mode": "coding",
        "skill": "Python",
        "subtopic": "Algorithmic Fundamentals",
        "difficulty": "Foundational",
        "question": (
            "Write a Python function `find_second_largest(numbers: list[int]) -> int | None` that returns "
            "the second distinct largest number in a list of integers. If the list contains fewer than two distinct numbers, return `None`. "
            "Note: Aim for an O(n) linear scan without sorting the list."
        ),
        "initial_code": (
            "def find_second_largest(numbers: list[int]) -> int | None:\n"
            "    # Your implementation here\n"
            "    pass\n"
        ),
        "options": [],
        "expected_answer": (
            "def find_second_largest(numbers: list[int]) -> int | None:\n"
            "    unique_nums = set(numbers)\n"
            "    if len(unique_nums) < 2:\n"
            "        return None\n"
            "    first = second = float('-inf')\n"
            "    for n in unique_nums:\n"
            "        if n > first:\n"
            "            second = first\n"
            "            first = n\n"
            "        elif n > second:\n"
            "            second = n\n"
            "    return second\n"
        ),
        "explanation": (
            "To solve this in optimal O(n) time and O(1) auxiliary space without sorting, maintain two running variables: "
            "`first` and `second`. As you traverse the list or unique set, update `second` whenever a number is strictly between "
            "`second` and `first`, or shift `first` to `second` when a new maximum is found."
        ),
        "hints": [
            "Consider edge cases such as empty lists, single-element lists, and duplicate values like [5, 5, 5].",
            "Initialize two variables `first` and `second` to negative infinity, or deduplicate with a set."
        ],
        "keywords": ["first", "second", "for", "return", "none", "float('-inf')", "set", "len", "if"],
        "test_criteria": {
            "required_patterns": ["def find_second_largest", "for", "return"],
            "concepts": ["Linear traversal", "Edge case handling (None)", "Duplicate handling"]
        },
        "estimated_minutes": 8,
        "career_relevance": "Fundamental algorithmic efficiency expected in technical screenings for Software and ML Engineers.",
        "target_roles": ["Machine Learning Engineer", "Software Engineer", "Data Scientist", "Full Stack Web Developer"]
    },
    {
        "id": "arena-py-debug-02",
        "title": "Debug Mutable Default Argument Trap",
        "mode": "debug",
        "skill": "Python",
        "subtopic": "Python Memory & Object Model",
        "difficulty": "Foundational",
        "question": (
            "Identify the bug in the function below where a mutable list is used as a default argument, causing shared state "
            "across multiple invocations. Provide the corrected function and explain why the bug occurred.\n\n"
            "def append_item(val, items=[]):\n"
            "    items.append(val)\n"
            "    return items\n"
        ),
        "initial_code": (
            "def append_item(val, items=None):\n"
            "    # Fix the mutable default argument bug here\n"
            "    pass\n"
        ),
        "options": [],
        "expected_answer": (
            "def append_item(val, items=None):\n"
            "    if items is None:\n"
            "        items = []\n"
            "    items.append(val)\n"
            "    return items\n"
        ),
        "explanation": (
            "In Python, default parameter expressions are evaluated once when the function definition is executed, NOT at runtime. "
            "Therefore, mutable defaults like `[]` or `{}` retain state between separate function calls. The idiomatic solution is to use "
            "`items=None` and initialize `items = []` inside the function body."
        ),
        "hints": [
            "Default parameters are instantiated at function definition time in Python, not invocation time.",
            "Use None as sentinel default and reassign inside the function."
        ],
        "keywords": ["none", "items is none", "items = []", "append", "mutable", "default"],
        "test_criteria": {
            "required_patterns": ["is none", "items = []", "items.append"],
            "concepts": ["Default argument evaluation time", "Sentinel None pattern"]
        },
        "estimated_minutes": 5,
        "career_relevance": "Classic Python interview question testing deep understanding of Python memory model.",
        "target_roles": ["Machine Learning Engineer", "Data Scientist", "Software Engineer"]
    },
    {
        "id": "arena-py-predict-03",
        "title": "Predict Output: Late Binding Closures in Loops",
        "mode": "predict_output",
        "skill": "Python",
        "subtopic": "Closures & Scoping",
        "difficulty": "Intermediate",
        "question": (
            "What is the exact printed output of the following Python code snippet?\n\n"
            "funcs = [lambda x: x * i for i in range(4)]\n"
            "results = [f(2) for f in funcs]\n"
            "print(results)\n"
        ),
        "initial_code": None,
        "options": [],
        "expected_answer": "[6, 6, 6, 6]",
        "explanation": (
            "In Python, closures bind variables by reference (lookup at call time), not by value when created. "
            "When the list comprehension completes, `i` has reached its final value of 3. "
            "When each lambda is later invoked with x=2, they all evaluate `2 * 3 = 6`, resulting in `[6, 6, 6, 6]`. "
            "To bind immediately, one would use default argument binding `lambda x, i=i: x * i`."
        ),
        "hints": [
            "Python closures use late binding. What is the value of `i` after the first list comprehension finishes?",
            "Remember that the lambda is executed in the second line, not the first line."
        ],
        "keywords": ["[6, 6, 6, 6]", "6", "late binding", "closure"],
        "test_criteria": {
            "exact_match": "[6, 6, 6, 6]"
        },
        "estimated_minutes": 5,
        "career_relevance": "Tests mastery of Python lexical scoping and anonymous functions, common in senior interviews.",
        "target_roles": ["Machine Learning Engineer", "Software Engineer", "Data Scientist"]
    },
    {
        "id": "arena-py-mcq-04",
        "title": "Python Concurrency: GIL & Workload Optimization",
        "mode": "mcq",
        "skill": "Python",
        "subtopic": "Concurrency & Multiprocessing",
        "difficulty": "Intermediate",
        "question": (
            "Why does using the standard `threading` module in CPython fail to achieve true parallel execution on multi-core CPUs "
            "for heavy numerical matrix multiplication, and what is the standard architectural remedy?"
        ),
        "options": [
            "Threads share heap memory causing kernel race locks; use asyncio to achieve multi-core speedup.",
            "The Global Interpreter Lock (GIL) serializes CPython bytecode execution; use multiprocessing or native C-extensions (NumPy/PyTorch) to bypass it.",
            "Python processes can only run on CPU core 0 by operating system constraint; use nice priority scheduling.",
            "Garbage collection freezes threads during cycle reclamation; disable gc.enable() before training."
        ],
        "correct_option_index": 1,
        "expected_answer": "The Global Interpreter Lock (GIL) serializes CPython bytecode execution; use multiprocessing or native C-extensions (NumPy/PyTorch) to bypass it.",
        "explanation": (
            "The CPython Global Interpreter Lock (GIL) ensures thread safety for memory reference counts by permitting only one native thread "
            "to execute Python bytecode at a time. Consequently, CPU-bound tasks do not parallelize with `threading`. Developers bypass the GIL "
            "either by spawning multiple independent OS processes via `multiprocessing` or by using C-extensions (like NumPy, SciPy, or PyTorch) "
            "that release the GIL during heavy numerical computations."
        ),
        "hints": [
            "Look for the mechanism that locks bytecode execution to a single thread in CPython.",
            "Think about how NumPy handles matrix operations outside the Python interpreter."
        ],
        "keywords": ["gil", "global interpreter lock", "multiprocessing", "numpy", "c-extensions"],
        "test_criteria": {
            "correct_option_index": 1
        },
        "estimated_minutes": 5,
        "career_relevance": "Standard concurrency question for production backend and ML systems engineers.",
        "target_roles": ["Machine Learning Engineer", "Software Engineer"]
    },

    # =========================================================================
    # 2. SQL & RELATIONAL DATABASES
    # =========================================================================
    {
        "id": "arena-sql-code-01",
        "title": "Rank Department Salaries Using Window Functions",
        "mode": "coding",
        "skill": "SQL",
        "subtopic": "Window Functions & Partitioning",
        "difficulty": "Intermediate",
        "question": (
            "Write a SQL query to retrieve the employee `name`, `department_id`, `salary`, and their within-department salary rank "
            "`salary_rank` using `DENSE_RANK()`. Order the output by `department_id` ascending, then `salary_rank` ascending.\n\n"
            "Table: employees (id INT, name VARCHAR, department_id INT, salary INT)"
        ),
        "initial_code": (
            "SELECT\n"
            "    name,\n"
            "    department_id,\n"
            "    salary,\n"
            "    -- Compute DENSE_RANK here\n"
            "FROM employees\n"
            "ORDER BY department_id, salary_rank;\n"
        ),
        "options": [],
        "expected_answer": (
            "SELECT\n"
            "    name,\n"
            "    department_id,\n"
            "    salary,\n"
            "    DENSE_RANK() OVER (\n"
            "        PARTITION BY department_id\n"
            "        ORDER BY salary DESC\n"
            "    ) AS salary_rank\n"
            "FROM employees\n"
            "ORDER BY department_id, salary_rank;\n"
        ),
        "explanation": (
            "`DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC)` partitions the data per department "
            "and assigns consecutive rank integers starting from 1 for the highest salary, without skipping rank numbers on ties."
        ),
        "hints": [
            "Use the OVER clause with PARTITION BY department_id and ORDER BY salary DESC.",
            "Remember DENSE_RANK does not skip numbers when there are duplicate salaries."
        ],
        "keywords": ["dense_rank()", "over", "partition by", "order by salary desc", "department_id", "salary_rank"],
        "test_criteria": {
            "required_patterns": ["dense_rank()", "over", "partition by", "order by"],
            "concepts": ["Window function execution", "Partitioning logic"]
        },
        "estimated_minutes": 10,
        "career_relevance": "Window functions are the #1 evaluated SQL skill in Data Scientist and MLE technical rounds.",
        "target_roles": ["Data Scientist", "Machine Learning Engineer", "Software Engineer"]
    },
    {
        "id": "arena-sql-debug-02",
        "title": "Debug Ambiguous Column Reference in Multi-Table Join",
        "mode": "debug",
        "skill": "SQL",
        "subtopic": "Joins & Aggregations",
        "difficulty": "Foundational",
        "question": (
            "The following query fails with `ERROR: column reference 'id' is ambiguous` and produces incorrect sums. "
            "Correct the query by applying proper table aliases and explicit join qualifications:\n\n"
            "SELECT id, name, SUM(amount)\n"
            "FROM customers\n"
            "JOIN orders ON customers.id = orders.customer_id\n"
            "GROUP BY id, name;\n"
        ),
        "initial_code": (
            "SELECT c.id, c.name, SUM(o.amount) AS total_spent\n"
            "FROM customers c\n"
            "-- Fix the join and group by here\n"
        ),
        "options": [],
        "expected_answer": (
            "SELECT c.id, c.name, SUM(o.amount) AS total_spent\n"
            "FROM customers c\n"
            "JOIN orders o ON c.id = o.customer_id\n"
            "GROUP BY c.id, c.name;\n"
        ),
        "explanation": (
            "When joining multiple tables that share identical column names like `id`, all column selections and GROUP BY expressions "
            "must be explicitly prefixed with their table alias (e.g. `c.id`). Furthermore, aliasing `orders o` makes queries maintainable."
        ),
        "hints": [
            "Alias both tables (e.g. `c` for customers, `o` for orders).",
            "Prefix every selected column including those in GROUP BY with the alias."
        ],
        "keywords": ["c.id", "c.name", "sum(o.amount)", "customers c", "orders o", "group by c.id"],
        "test_criteria": {
            "required_patterns": ["c.id", "group by c.id", "join orders"],
            "concepts": ["Disambiguating columns", "Explicit table aliasing"]
        },
        "estimated_minutes": 6,
        "career_relevance": "Evaluates foundational query cleanliness and defensive SQL syntax.",
        "target_roles": ["Data Scientist", "Software Engineer"]
    },
    {
        "id": "arena-sql-predict-03",
        "title": "Predict Output: Three-Valued Logic with NOT IN & NULLs",
        "mode": "predict_output",
        "skill": "SQL",
        "subtopic": "SQL Three-Valued Logic",
        "difficulty": "Intermediate",
        "question": (
            "Consider Table A: `val` has values (1, 2, 3).\n"
            "Table B: `val` has values (2, NULL).\n\n"
            "How many rows are returned by the query:\n"
            "SELECT * FROM A WHERE val NOT IN (SELECT val FROM B);\n\n"
            "Enter the integer count of rows returned."
        ),
        "initial_code": None,
        "options": [],
        "expected_answer": "0",
        "explanation": (
            "In SQL three-valued logic, `val NOT IN (2, NULL)` expands to `val != 2 AND val != NULL`. "
            "Any comparison with NULL evaluates to UNKNOWN. `TRUE AND UNKNOWN` evaluates to UNKNOWN. "
            "Since the WHERE clause only returns rows where the condition is TRUE, zero rows are returned! "
            "To avoid this common bug, use `NOT EXISTS` or filter `WHERE val IS NOT NULL` in the subquery."
        ),
        "hints": [
            "Think about how SQL evaluates `x != NULL` in Boolean logic.",
            "Does WHERE return rows when the boolean expression evaluates to UNKNOWN?"
        ],
        "keywords": ["0", "zero", "unknown", "three-valued logic"],
        "test_criteria": {
            "exact_match": "0"
        },
        "estimated_minutes": 5,
        "career_relevance": "Famous SQL edge case tested in senior database and analytics engineering interviews.",
        "target_roles": ["Data Scientist", "Software Engineer", "Machine Learning Engineer"]
    },
    {
        "id": "arena-sql-mcq-04",
        "title": "Database Index Structures: B-Tree vs Hash Index",
        "mode": "mcq",
        "skill": "SQL",
        "subtopic": "Indexing & Query Optimization",
        "difficulty": "Intermediate",
        "question": (
            "Which type of query benefits from a standard B-Tree index but CANNOT utilize a Hash index in PostgreSQL or MySQL?"
        ),
        "options": [
            "Exact equality lookup: `WHERE user_id = 42`",
            "Range and inequality filtering: `WHERE created_at BETWEEN '2026-01-01' AND '2026-06-01'`",
            "Boolean flag checking: `WHERE is_active = TRUE`",
            "Inner join on primary key: `JOIN orders ON customers.id = orders.customer_id`"
        ],
        "correct_option_index": 1,
        "expected_answer": "Range and inequality filtering: `WHERE created_at BETWEEN '2026-01-01' AND '2026-06-01'`",
        "explanation": (
            "Hash indexes only support direct equality operators (`=`) because hash bucket lookups do not preserve numerical or lexicographical order. "
            "B-Trees store keys in sorted balanced order, enabling logarithmic traversal and sequential scans for range queries (`<`, `<=`, `>`, `>=`, `BETWEEN`)."
        ),
        "hints": [
            "Hash functions scatter data uniformly across buckets, destroying order.",
            "B-Tree nodes are maintained in sorted order."
        ],
        "keywords": ["range", "between", "b-tree", "sorted", "inequality"],
        "test_criteria": {
            "correct_option_index": 1
        },
        "estimated_minutes": 4,
        "career_relevance": "Fundamental systems knowledge for database design and performance tuning.",
        "target_roles": ["Software Engineer", "Machine Learning Engineer", "Data Scientist"]
    },

    # =========================================================================
    # 3. MACHINE LEARNING & SCIKIT-LEARN
    # =========================================================================
    {
        "id": "arena-ml-debug-01",
        "title": "Debug Pre-Split Feature Scaling Data Leakage",
        "mode": "debug",
        "skill": "Machine Learning",
        "subtopic": "Data Leakage & Preprocessing Pipelines",
        "difficulty": "Foundational",
        "question": (
            "Identify the severe data leakage bug in the machine learning training script below. "
            "Explain what went wrong and provide the corrected code using `Pipeline` or proper fit/transform ordering:\n\n"
            "from sklearn.preprocessing import StandardScaler\n"
            "from sklearn.model_selection import train_test_split\n"
            "from sklearn.linear_model import LogisticRegression\n\n"
            "# BUG: Scaler fitted on entire dataset before split\n"
            "scaler = StandardScaler()\n"
            "X_scaled = scaler.fit_transform(X)\n"
            "X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2)\n"
            "model = LogisticRegression().fit(X_train, y_train)\n"
        ),
        "initial_code": (
            "# Correct the script to prevent data leakage\n"
            "from sklearn.preprocessing import StandardScaler\n"
            "from sklearn.model_selection import train_test_split\n"
            "from sklearn.linear_model import LogisticRegression\n\n"
            "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)\n"
            "# Fit scaler only on training data here\n"
        ),
        "options": [],
        "expected_answer": (
            "from sklearn.preprocessing import StandardScaler\n"
            "from sklearn.model_selection import train_test_split\n"
            "from sklearn.linear_model import LogisticRegression\n\n"
            "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)\n"
            "scaler = StandardScaler()\n"
            "X_train_scaled = scaler.fit_transform(X_train)\n"
            "X_test_scaled = scaler.transform(X_test)\n"
            "model = LogisticRegression().fit(X_train_scaled, y_train)\n"
        ),
        "explanation": (
            "Fitting `StandardScaler` on the entire dataset before splitting causes information from the test set (its mean and variance) "
            "to leak into the training distribution. This produces overly optimistic evaluation metrics. The scaler must be fitted solely on `X_train` "
            "using `.fit_transform()` and applied to `X_test` using `.transform()`, or encapsulated inside an `sklearn.pipeline.Pipeline`."
        ),
        "hints": [
            "Split the raw data first before applying any transformations.",
            "Fit the scaler ONLY on X_train. Apply .transform() without fit on X_test."
        ],
        "keywords": ["fit_transform(x_train)", "transform(x_test)", "leakage", "split first", "scaler.fit"],
        "test_criteria": {
            "required_patterns": ["scaler.fit_transform(X_train", "scaler.transform(X_test"],
            "concepts": ["Preventing data leakage", "Train/test isolation"]
        },
        "estimated_minutes": 8,
        "career_relevance": "Critical machine learning hygiene tested in every MLE / Data Scientist interview.",
        "target_roles": ["Machine Learning Engineer", "Data Scientist"]
    },
    {
        "id": "arena-ml-mcq-02",
        "title": "Evaluate Imbalanced Classification: Precision vs ROC-AUC",
        "mode": "mcq",
        "skill": "Machine Learning",
        "subtopic": "Evaluation Metrics",
        "difficulty": "Intermediate",
        "question": (
            "When evaluating a fraud detection model where only 0.1% of transactions are fraudulent, why can standard ROC-AUC "
            "present a misleadingly optimistic assessment of model performance, and which metric should be prioritized?"
        ),
        "options": [
            "ROC-AUC divides by zero on imbalanced datasets; Accuracy must be used instead.",
            "The False Positive Rate denominator includes the vast majority class (true negatives), keeping FPR tiny even with thousands of false alarms; Precision-Recall AUC (PR-AUC) should be prioritized.",
            "ROC curves require symmetric Gaussian assumptions that fraud transactions violate; mean squared error is required.",
            "ROC-AUC only works on multi-class classification; binary classification must use cross-entropy."
        ],
        "correct_option_index": 1,
        "expected_answer": "The False Positive Rate denominator includes the vast majority class (true negatives), keeping FPR tiny even with thousands of false alarms; Precision-Recall AUC (PR-AUC) should be prioritized.",
        "explanation": (
            "In extreme class imbalance, the number of True Negatives is huge. Because the False Positive Rate is $FPR = FP / (FP + TN)$, "
            "a large TN keeps FPR very small even when there are many false alarms relative to actual positive fraud cases. "
            "Precision-Recall AUC focuses strictly on the minority positive class without being inflated by true negatives."
        ),
        "hints": [
            "Look at the formula for False Positive Rate: FP / (FP + TN).",
            "When TN is enormous, what happens to FPR even when FP increases?"
        ],
        "keywords": ["pr-auc", "precision-recall", "false positive rate", "true negatives", "imbalance"],
        "test_criteria": {
            "correct_option_index": 1
        },
        "estimated_minutes": 5,
        "career_relevance": "Foundational production metric knowledge for fraud, medical diagnosis, and ad click prediction.",
        "target_roles": ["Machine Learning Engineer", "Data Scientist"]
    },

    # =========================================================================
    # 4. MLOPS & MODEL MONITORING
    # =========================================================================
    {
        "id": "arena-mlops-debug-01",
        "title": "Debug Non-Deterministic Dockerfile for ML Inference",
        "mode": "debug",
        "skill": "MLOps",
        "subtopic": "Containerization & Reproducibility",
        "difficulty": "Intermediate",
        "question": (
            "The following Dockerfile produces random build failures and oversized image layers in CI/CD. "
            "Identify two critical anti-patterns and provide the corrected version:\n\n"
            "FROM python:latest\n"
            "COPY . /app\n"
            "RUN pip install -r /app/requirements.txt\n"
            "CMD python /app/main.py\n"
        ),
        "initial_code": (
            "# Write the optimized, deterministic Dockerfile\n"
            "FROM python:3.11-slim\n"
            "WORKDIR /app\n"
            "# Optimize layer caching and pin versions here\n"
        ),
        "options": [],
        "expected_answer": (
            "FROM python:3.11-slim\n"
            "WORKDIR /app\n"
            "COPY requirements.txt .\n"
            "RUN pip install --no-cache-dir -r requirements.txt\n"
            "COPY . .\n"
            "CMD [\"python\", \"main.py\"]\n"
        ),
        "explanation": (
            "1. Using `python:latest` breaks build reproducibility when Python updates. Use a pinned slim base like `python:3.11-slim`.\n"
            "2. Copying `.` before `pip install` invalidates Docker layer caching whenever any source file changes, forcing slow re-installs. "
            "Copy `requirements.txt` first, install with `--no-cache-dir`, and copy source code afterward."
        ),
        "hints": [
            "Pin the Python version (e.g. 3.11-slim) instead of `latest`.",
            "Copy `requirements.txt` before copying the entire source directory to leverage Docker layer caching."
        ],
        "keywords": ["python:3.11-slim", "copy requirements.txt", "--no-cache-dir", "caching", "layer"],
        "test_criteria": {
            "required_patterns": ["requirements.txt", "--no-cache-dir", "COPY ."],
            "concepts": ["Docker layer caching", "Deterministic base tags"]
        },
        "estimated_minutes": 8,
        "career_relevance": "Key practical MLOps competency for building reliable CI/CD container deployment pipelines.",
        "target_roles": ["Machine Learning Engineer", "Software Engineer"]
    },
    {
        "id": "arena-mlops-mcq-02",
        "title": "Data Drift vs Concept Drift in Production Monitoring",
        "mode": "mcq",
        "skill": "Model Monitoring",
        "subtopic": "Distribution Shift Detection",
        "difficulty": "Foundational",
        "question": (
            "What distinguishes Data Drift (covariate shift) from Concept Drift in a deployed production recommendation model?"
        ),
        "options": [
            "Data drift means server hardware fails; concept drift means user logged out.",
            "Data drift is a shift in the input feature distribution P(X) without changing P(Y|X); Concept drift is a change in the underlying relationship between features and target labels P(Y|X).",
            "Data drift only occurs with text embeddings; concept drift only occurs with numerical features.",
            "Data drift increases inference latency; concept drift decreases memory consumption."
        ],
        "correct_option_index": 1,
        "expected_answer": "Data drift is a shift in the input feature distribution P(X) without changing P(Y|X); Concept drift is a change in the underlying relationship between features and target labels P(Y|X).",
        "explanation": (
            "Data drift (covariate shift) occurs when the distribution of inputs $P(X)$ changes over time (e.g., younger demographics adopt the app) "
            "while the ground-truth function $P(Y|X)$ stays identical. Concept drift occurs when the true relationship $P(Y|X)$ shifts "
            "(e.g., economic inflation alters what constitutes a 'high purchase price')."
        ),
        "hints": [
            "Think about P(X) vs P(Y|X) probability distributions.",
            "Does data drift change the inputs or the relationship to labels?"
        ],
        "keywords": ["p(x)", "p(y|x)", "covariate shift", "feature distribution", "relationship"],
        "test_criteria": {
            "correct_option_index": 1
        },
        "estimated_minutes": 5,
        "career_relevance": "Core concept in MLOps monitoring and retraining architectures.",
        "target_roles": ["Machine Learning Engineer", "Data Scientist"]
    },

    # =========================================================================
    # 5. PYTORCH & DEEP LEARNING
    # =========================================================================
    {
        "id": "arena-torch-debug-01",
        "title": "Debug Missing Gradient Zeroing in PyTorch Training Loop",
        "mode": "debug",
        "skill": "PyTorch",
        "subtopic": "Autograd & Optimization Loop",
        "difficulty": "Foundational",
        "question": (
            "The training loop below suffers from a critical bug where gradients accumulate continuously across batches, "
            "causing the model weights to explode. Identify where the bug is and correct the training loop:\n\n"
            "for data, target in dataloader:\n"
            "    output = model(data)\n"
            "    loss = criterion(output, target)\n"
            "    loss.backward()\n"
            "    optimizer.step()\n"
        ),
        "initial_code": (
            "for data, target in dataloader:\n"
            "    # Fix gradient accumulation here\n"
            "    output = model(data)\n"
            "    loss = criterion(output, target)\n"
            "    loss.backward()\n"
            "    optimizer.step()\n"
        ),
        "options": [],
        "expected_answer": (
            "for data, target in dataloader:\n"
            "    optimizer.zero_grad()\n"
            "    output = model(data)\n"
            "    loss = criterion(output, target)\n"
            "    loss.backward()\n"
            "    optimizer.step()\n"
        ),
        "explanation": (
            "In PyTorch, gradients `.grad` accumulate by default whenever `.backward()` is executed. "
            "Without calling `optimizer.zero_grad()` or `model.zero_grad()` at the start of each iteration, "
            "the gradients from the current batch are added to previous batches, destabilizing optimizer updates."
        ),
        "hints": [
            "PyTorch does not automatically reset gradients between batches.",
            "Call the optimizer method that zeroes parameter gradients before backward()."
        ],
        "keywords": ["optimizer.zero_grad()", "zero_grad", "gradient accumulation", "backward"],
        "test_criteria": {
            "required_patterns": ["optimizer.zero_grad()"],
            "concepts": ["PyTorch autograd accumulation", "Optimizer step mechanics"]
        },
        "estimated_minutes": 5,
        "career_relevance": "Top-asked PyTorch debugging problem in AI/Deep Learning interviews.",
        "target_roles": ["Machine Learning Engineer", "Data Scientist"]
    },
    {
        "id": "arena-torch-mcq-02",
        "title": "PyTorch Tensor Detachment and Computation Graphs",
        "mode": "mcq",
        "skill": "PyTorch",
        "subtopic": "Autograd & Memory Management",
        "difficulty": "Intermediate",
        "question": (
            "Why is it essential to log batch losses using `total_loss += loss.item()` rather than `total_loss += loss` during training?"
        ),
        "options": [
            "`loss.item()` converts the tensor to float32 precision for GPU calculation.",
            "`total_loss += loss` keeps the entire autograd computational graph in GPU memory across iterations, causing an Out-Of-Memory (OOM) error.",
            "`loss` tensor values cannot be added to Python scalar variables due to type conflicts.",
            "`loss.item()` automatically sends the loss scalar to the CUDA device."
        ],
        "correct_option_index": 1,
        "expected_answer": "`total_loss += loss` keeps the entire autograd computational graph in GPU memory across iterations, causing an Out-Of-Memory (OOM) error.",
        "explanation": (
            "`loss` is a PyTorch Tensor containing a `grad_fn` reference linking the entire computational history of the batch. "
            "Summing `loss` directly retains this graph in VRAM indefinitely, leading to memory leaks and Out-Of-Memory crashes. "
            "`loss.item()` extracts a standard Python float, detaching it from the autograd graph."
        ),
        "hints": [
            "What does a PyTorch Tensor retain in memory when autograd is tracking operations?",
            "How do you convert a 1-element tensor into a Python primitive?"
        ],
        "keywords": ["oom", "loss.item()", "computational graph", "autograd", "memory leak"],
        "test_criteria": {
            "correct_option_index": 1
        },
        "estimated_minutes": 5,
        "career_relevance": "Critical knowledge for training large models without encountering silent GPU memory leaks.",
        "target_roles": ["Machine Learning Engineer"]
    },

    # =========================================================================
    # 6. STATISTICS & EXPERIMENTATION
    # =========================================================================
    {
        "id": "arena-stat-mcq-01",
        "title": "Correct Interpretation of P-Value in Hypothesis Testing",
        "mode": "mcq",
        "skill": "Statistics",
        "subtopic": "Hypothesis Testing",
        "difficulty": "Foundational",
        "question": (
            "In an A/B test evaluating a checkout redesign, the statistical analysis yields p = 0.03. What is the precise statistical definition of this p-value?"
        ),
        "options": [
            "There is a 97% probability that the new checkout redesign is genuinely superior to the old one.",
            "Assuming the null hypothesis is true (no real difference exists), there is a 3% probability of observing an effect at least as extreme as the one measured.",
            "There is a 3% probability that the experiment results were fabricated or corrupted by telemetry noise.",
            "The treatment variant will boost conversion rates by exactly 3% in production."
        ],
        "correct_option_index": 1,
        "expected_answer": "Assuming the null hypothesis is true (no real difference exists), there is a 3% probability of observing an effect at least as extreme as the one measured.",
        "explanation": (
            "A p-value is NOT the probability that the alternative hypothesis is true, nor the probability that the null hypothesis is false. "
            "It is the probability of observing data as extreme as (or more extreme than) the sample data, assuming the null hypothesis is true."
        ),
        "hints": [
            "P-values are calculated conditioned on the assumption that the Null Hypothesis holds true.",
            "Remember that p-value is NOT P(H0 is true | data)."
        ],
        "keywords": ["null hypothesis is true", "extreme", "probability of observing"],
        "test_criteria": {
            "correct_option_index": 1
        },
        "estimated_minutes": 4,
        "career_relevance": "Frequently asked in Data Science interviews to distinguish conceptual understanding from memorization.",
        "target_roles": ["Data Scientist", "Machine Learning Engineer"]
    },

    # =========================================================================
    # 7. GIT & VERSION CONTROL
    # =========================================================================
    {
        "id": "arena-git-mcq-01",
        "title": "Git Rebase vs Git Merge Trade-offs",
        "mode": "mcq",
        "skill": "Git",
        "subtopic": "Branching & History Architecture",
        "difficulty": "Foundational",
        "question": (
            "What is the primary difference in Git commit history when integrating a feature branch into main using `git rebase main` versus `git merge main`?"
        ),
        "options": [
            "`git rebase` creates a distinct merge commit that documents the exact integration branch point.",
            "`git rebase` replays feature commits on top of the tip of main creating a linear history; `git merge` preserves original chronological branch commits and creates a two-parent merge commit.",
            "`git merge` deletes the commits on main that conflict with the feature branch.",
            "`git rebase` pushes the branch directly to GitHub without requiring local commits."
        ],
        "correct_option_index": 1,
        "expected_answer": "`git rebase` replays feature commits on top of the tip of main creating a linear history; `git merge` preserves original chronological branch commits and creates a two-parent merge commit.",
        "explanation": (
            "`git rebase` rewrites commit history by transplanting branch commits sequentially onto the target base, creating a clean linear commit graph. "
            "`git merge` leaves existing commit hashes unaltered and combines histories via a dedicated merge commit with two parent hashes."
        ),
        "hints": [
            "Think about linear commit history vs branching graph history.",
            "Which command rewrites commit hashes by re-applying patches?"
        ],
        "keywords": ["linear history", "replays commits", "merge commit", "rewriting history"],
        "test_criteria": {
            "correct_option_index": 1
        },
        "estimated_minutes": 4,
        "career_relevance": "Standard engineering hygiene question in collaborative team environments.",
        "target_roles": ["Software Engineer", "Machine Learning Engineer", "Data Scientist"]
    },

    # =========================================================================
    # 8. TECHNICAL COMMUNICATION & ARCHITECTURE
    # =========================================================================
    {
        "id": "arena-comm-code-01",
        "title": "Structure a Technical Incident Explanation (STAR Framework)",
        "mode": "coding",
        "skill": "Communication",
        "subtopic": "Behavioral & Technical Incident Communication",
        "difficulty": "Foundational",
        "question": (
            "Provide a concise 4-sentence structured explanation using the STAR framework (Situation, Task, Action, Result) "
            "for an engineering incident where a memory leak degraded an inference API in production. "
            "Clearly label or delineate each component (Situation, Task, Action, Result)."
        ),
        "initial_code": (
            "Situation: \n"
            "Task: \n"
            "Action: \n"
            "Result: \n"
        ),
        "options": [],
        "expected_answer": (
            "Situation: During peak traffic, our real-time inference API experienced p99 latency spikes and container crashes due to an unhandled memory leak.\n"
            "Task: My responsibility was to diagnose the root cause and restore 99.9% uptime within our 1-hour SLA window.\n"
            "Action: I analyzed heap snapshots with memory profilers, identified un-detached PyTorch tensors in response logs, and pushed a hotfix calling .item().\n"
            "Result: Memory consumption stabilized at 450MB, p99 latency dropped to 42ms, and the service met our 99.9% availability SLA without data loss.\n"
        ),
        "explanation": (
            "Strong technical communication in engineering rounds hinges on clear structure: "
            "1. Situation provides business and technical context.\n"
            "2. Task defines personal responsibility and constraints (e.g. 1-hour SLA).\n"
            "3. Action demonstrates specific technical steps taken (profiling, tensor detachment).\n"
            "4. Result quantifies the business and latency outcome (p99 latency 42ms, 99.9% uptime)."
        ),
        "hints": [
            "Include quantifiable metrics in your Result (e.g. latency, memory, uptime).",
            "State your specific individual action in Action rather than speaking for the entire team."
        ],
        "keywords": ["situation", "task", "action", "result", "latency", "memory", "sla", "diagnosed"],
        "test_criteria": {
            "required_patterns": ["situation", "task", "action", "result"],
            "concepts": ["STAR narrative structure", "Quantifiable engineering outcome"]
        },
        "estimated_minutes": 7,
        "career_relevance": "STAR structured communication is directly scored in behavioral and system design interview rounds.",
        "target_roles": ["Machine Learning Engineer", "Software Engineer", "Data Scientist"]
    }
]


def get_catalog() -> List[Dict[str, Any]]:
    """Returns all canonical challenge definitions."""
    return SKILL_ARENA_CATALOG


def get_challenge_by_id(challenge_id: str) -> Dict[str, Any] | None:
    """Finds challenge by exact identifier."""
    return next((c for c in SKILL_ARENA_CATALOG if c["id"] == challenge_id), None)
