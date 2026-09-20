"""
Abstract Base Class for Sandbox Executors
AI Career Preparation Agent
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from .models import ExecutionJob, ExecutionResult, TestCase


class SandboxExecutor(ABC):
    """
    Abstract interface for isolated code execution backends.
    Allows swapping execution environments (Docker, Firecracker, Process)
    without rewriting application controllers or evaluation logic.
    """

    @abstractmethod
    def is_available(self) -> bool:
        """Returns True if this executor is supported and ready on current host."""
        pass

    @abstractmethod
    def get_capabilities(self) -> Dict[str, Any]:
        """Returns metadata about isolation mechanisms and resource controls."""
        pass

    @abstractmethod
    def execute(
        self,
        job: ExecutionJob,
        test_cases: Optional[List[TestCase]] = None
    ) -> ExecutionResult:
        """Executes candidate code inside isolated environment and returns structured result."""
        pass
