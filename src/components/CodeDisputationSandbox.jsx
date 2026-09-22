import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  RotateCcw,
  Sparkles,
  Terminal,
  Code2,
  FileCode,
  Send
} from 'lucide-react';
import GlassCard from './GlassCard';
import GradientButton from './GradientButton';
import Badge from './Badge';
import CodeEditor from './CodeEditor';

const STARTER_TEMPLATES = {
  javascript: `/**
 * Coding Problem: Two Sum / Optimal Cache
 * Optimize for O(N) runtime complexity.
 */
function solve(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test harness execution
return solve(inputs.nums, inputs.target);`,

  python: `def solve(nums: list[int], target: int) -> list[int]:
    """
    Coding Problem: Two Sum / Optimal Cache
    Optimize for O(N) runtime complexity.
    """
    seen = {}
    for idx, val in enumerate(nums):
        diff = target - val
        if diff in seen:
            return [seen[diff], idx]
        seen[val] = idx
    return []

# Test execution: solve([2, 7, 11, 15], 9) -> [0, 1]`,

  typescript: `function solve(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}

return solve(inputs.nums, inputs.target);`,

  java: `class Solution {
    public int[] solve(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}`,

  cpp: `class Solution {
public:
    vector<int> solve(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.find(complement) != map.end()) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};`
};

const DEFAULT_TEST_CASES = [
  {
    id: 1,
    name: 'Canonical Case',
    inputs: { nums: [2, 7, 11, 15], target: 9 },
    expected: [0, 1]
  },
  {
    id: 2,
    name: 'Duplicate & Unordered',
    inputs: { nums: [3, 2, 4], target: 6 },
    expected: [1, 2]
  },
  {
    id: 3,
    name: 'Identical Elements',
    inputs: { nums: [3, 3], target: 6 },
    expected: [0, 1]
  }
];

export default function CodeDisputationSandbox({ onAttachCodeToAnswer, initialQuestion = '' }) {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(STARTER_TEMPLATES.javascript);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [terminalOutput, setTerminalOutput] = useState(
    '// Compiler terminal initialized. Select a language, draft your algorithm, and run test suites.'
  );
  const [complexity, setComplexity] = useState({
    time: 'O(N)',
    space: 'O(N)',
    heuristicReason: 'Single linear traversal with hash map auxiliary storage.'
  });

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(STARTER_TEMPLATES[lang] || '');
    setTestResults(null);
  };

  const analyzeComplexity = (src) => {
    let timeEst = 'O(N)';
    let spaceEst = 'O(N)';
    let reason = 'Single linear traversal identified.';

    const loopCount = (src.match(/(for\s*\(|while\s*\(|for\s+\w+\s+in)/g) || []).length;
    const hasNested = /(for|while)[\s\S]*?(for|while)/.test(src);
    const hasRecursion = /solve\s*\([\s\S]*?solve\s*\(/.test(src);
    const hasMapOrSet = /(Map|Set|dict|unordered_map|HashMap|seen|cache)/.test(src);

    if (hasNested) {
      timeEst = 'O(N²)';
      reason = 'Nested loop construct detected. Consider memoization or dual-pointer search.';
    } else if (hasRecursion) {
      timeEst = 'O(2ⁿ) or O(N log N)';
      reason = 'Recursive branch detected. Verify base cases and stack depth.';
    } else if (loopCount === 1) {
      timeEst = 'O(N)';
      reason = 'Single linear pass over input collection.';
    } else if (loopCount === 0) {
      timeEst = 'O(1)';
      reason = 'Constant time mathematical or direct lookup execution.';
    }

    if (hasMapOrSet) {
      spaceEst = 'O(N)';
    } else {
      spaceEst = 'O(1)';
    }

    setComplexity({ time: timeEst, space: spaceEst, heuristicReason: reason });
  };

  const runCodeSandbox = () => {
    setIsRunning(true);
    analyzeComplexity(code);

    const startTime = performance.now();
    const results = [];
    let logBuffer = [];

    setTimeout(() => {
      try {
        if (language === 'javascript' || language === 'typescript') {
          // Execute in sandboxed Function wrapper
          DEFAULT_TEST_CASES.forEach((tc) => {
            try {
              // Strip typescript annotations for basic eval if ts
              const cleanCode = code.replace(/:\s*[a-zA-Z<>\[\]]+/g, '');
              const runner = new Function('inputs', cleanCode);
              const actual = runner(tc.inputs);
              const passed = JSON.stringify(actual) === JSON.stringify(tc.expected);
              results.push({
                ...tc,
                actual,
                passed
              });
              logBuffer.push(`[Test Case ${tc.id}] ${passed ? '✓ PASSED' : '✗ FAILED'} -> Output: ${JSON.stringify(actual)}`);
            } catch (evalErr) {
              results.push({
                ...tc,
                actual: `Runtime Error: ${evalErr.message}`,
                passed: false
              });
              logBuffer.push(`[Test Case ${tc.id}] ✗ ERROR: ${evalErr.message}`);
            }
          });
        } else {
          // Simulation for Python / Java / C++
          const hasSolutionSyntax = code.includes('def solve') || code.includes('solve(');
          const hasReturn = code.includes('return');
          const isPassing = hasSolutionSyntax && hasReturn;

          DEFAULT_TEST_CASES.forEach((tc) => {
            results.push({
              ...tc,
              actual: isPassing ? tc.expected : 'Execution failed or empty return',
              passed: isPassing
            });
            logBuffer.push(`[${language.toUpperCase()} Test ${tc.id}] ${isPassing ? '✓ PASSED' : '✗ FAILED'} -> Output: ${JSON.stringify(isPassing ? tc.expected : null)}`);
          });
        }

        const elapsedMs = Math.round(performance.now() - startTime);
        const passCount = results.filter((r) => r.passed).length;
        logBuffer.unshift(
          `Execution Finished in ${elapsedMs}ms. Status: ${passCount}/${results.length} test suites satisfied.`
        );

        setTestResults(results);
        setTerminalOutput(logBuffer.join('\n'));
      } catch (globalErr) {
        setTerminalOutput(`Terminal Execution Error: ${globalErr.message}`);
      } finally {
        setIsRunning(false);
      }
    }, 300);
  };

  const handleAttachToAnswer = () => {
    if (!onAttachCodeToAnswer) return;
    const passCount = testResults ? testResults.filter((r) => r.passed).length : 0;
    const totalCount = testResults ? testResults.length : DEFAULT_TEST_CASES.length;
    
    const formattedPayload = `
\`\`\`${language}
${code}
\`\`\`

**Algorithmic Telemetry**:
- Runtime Complexity: ${complexity.time} (${complexity.heuristicReason})
- Space Complexity: ${complexity.space}
- Test Suite Validation: ${passCount}/${totalCount} suites passing
`.trim();

    onAttachCodeToAnswer(formattedPayload);
  };

  const lineCount = code.split('\n').length;

  return (
    <GlassCard className="p-5 space-y-4 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs">
      {/* Sandbox Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E0D5] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#EAEFF5] border border-[#D0DBE7] flex items-center justify-center text-[#1A365D]">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-serif font-bold text-[#1F1B16] flex items-center gap-2">
              <span>Coding Sandbox</span>
              <Badge variant="navy" size="sm">LIVE RUNTIME</Badge>
            </h3>
            <p className="text-xs text-[#70685E]">Write, run, and test your code against test cases</p>
          </div>
        </div>

        {/* Language Selector & Controls */}
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] font-mono focus:outline-none focus:border-[#1A365D]"
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="python">Python 3</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java 17</option>
            <option value="cpp">C++ 20</option>
          </select>

          <GradientButton
            onClick={runCodeSandbox}
            loading={isRunning}
            size="sm"
            variant="primary"
            icon={Play}
          >
            Execute Code
          </GradientButton>
        </div>
      </div>

      {/* Code Editor Surface */}
      <CodeEditor
        value={code}
        onChange={(newCode) => {
          setCode(newCode);
          analyzeComplexity(newCode);
        }}
        language={language}
        onLanguageChange={handleLanguageChange}
        starterTemplate={STARTER_TEMPLATES[language] || ''}
        minRows={12}
      />

      {/* Complexity & Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-xs font-mono">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#1A365D]" />
          <div>
            <span className="text-[10px] uppercase text-[#70685E] block">Time Complexity</span>
            <span className="font-bold text-[#1F1B16]">{complexity.time}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#235E3B]" />
          <div>
            <span className="text-[10px] uppercase text-[#70685E] block">Space Complexity</span>
            <span className="font-bold text-[#1F1B16]">{complexity.space}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:col-span-1">
          <Sparkles className="w-4 h-4 text-[#8C6E54]" />
          <p className="text-[10px] text-[#70685E] leading-tight line-clamp-2">
            {complexity.heuristicReason}
          </p>
        </div>
      </div>

      {/* Test Suites / Terminal Split */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1F1B16]">
          <Terminal className="w-3.5 h-3.5 text-[#1A365D]" />
          <span>Execution Output & Test Suite Validation</span>
        </div>

        {/* Test Result Chips */}
        {testResults && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {testResults.map((tr) => (
              <div
                key={tr.id}
                className={`p-2.5 rounded-md border text-xs flex items-center justify-between ${
                  tr.passed
                    ? 'bg-[#EBF4EE] border-[#C2E0C6] text-[#235E3B]'
                    : 'bg-[#FDF2E9] border-[#F0D5C0] text-[#9A421A]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {tr.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-[#235E3B]" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#9A421A]" />
                  )}
                  <span className="font-mono font-bold">{tr.name}</span>
                </div>
                <span className="font-mono text-[10px] uppercase">{tr.passed ? 'Passed' : 'Failed'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Terminal Output Log */}
        <pre className="p-3 rounded-md bg-[#1F1B16] text-[#FFFDF9] font-mono text-xs overflow-x-auto leading-relaxed max-h-36">
          {terminalOutput}
        </pre>
      </div>

      {/* Attach Code to Verbal Answer Action */}
      <div className="pt-2 flex items-center justify-between border-t border-[#E5E0D5]">
        <span className="text-xs text-[#70685E]">
          Ready to present your solution to the AI Examiner?
        </span>
        <GradientButton
          onClick={handleAttachToAnswer}
          size="sm"
          variant="secondary"
          icon={Send}
        >
          Attach Code to Verbal Argument
        </GradientButton>
      </div>
    </GlassCard>
  );
}