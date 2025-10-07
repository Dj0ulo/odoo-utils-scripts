#!/usr/bin/env python3

import subprocess
import sys
import re


def get_all_branches():
    """Get all git branches (local and remote)."""
    try:
        result = subprocess.run(
            ["git", "branch", "-a"],
            capture_output=True,
            text=True,
            check=True
        )
        branches = []
        for line in result.stdout.splitlines():
            # Remove leading * and whitespace
            branch = line.strip().lstrip('* ')
            # Skip HEAD references
            if 'HEAD ->' in branch:
                continue
            # Extract branch name from remotes/origin/branch format
            if branch.startswith('remotes/origin/'):
                branch = branch.replace('remotes/origin/', '')
            branches.append(branch)
        # Remove duplicates
        return list(set(branches))
    except subprocess.CalledProcessError as e:
        print(f"Error getting branches: {e}", file=sys.stderr)
        sys.exit(1)


def filter_branches(branches, pattern):
    """Filter branches by regex pattern."""
    regex = re.compile(pattern)
    return [branch for branch in branches if regex.match(branch)]


def is_ancestor(commit, branch):
    """Check if commit is an ancestor of branch."""
    try:
        subprocess.run(
            ["git", "merge-base", "--is-ancestor", commit, branch],
            capture_output=True,
            check=True
        )
        return True
    except subprocess.CalledProcessError:
        return False


def main():
    if len(sys.argv) != 2:
        print("Usage: python check_commit_branches.py <commit_hash>", file=sys.stderr)
        sys.exit(1)

    commit_hash = sys.argv[1]

    # Get all branches
    all_branches = get_all_branches()

    # Filter branches matching the pattern
    pattern = r'^(\d\d\.0|saas-\d\d\.\d)$'
    filtered_branches = filter_branches(all_branches, pattern)

    # Check which branches have the commit as an ancestor
    matching_branches = []
    for branch in filtered_branches:
        if is_ancestor(commit_hash, branch):
            matching_branches.append(branch)

    # Output the results
    for branch in sorted(matching_branches):
        print(branch)


if __name__ == "__main__":
    main()
