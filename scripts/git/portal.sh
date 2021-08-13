#!/bin/bash

futureBranch=$1;
featureBranch=${2:-$(git branch --show-current)};

test "$featureBranch" && (
  # shellcheck disable=SC1083
  git rev-parse "$featureBranch^{/future! $futureBranch}" &> /dev/null && (
    git rebase --onto "future/$futureBranch" "$featureBranch^{/future! $futureBranch}" "$featureBranch";
  ) || (
    git rebase "future/$futureBranch" "$featureBranch";
  )
) || (
  echo "Cannot omit feature branch while in detached HEAD"
  echo
  printf "\t Usage: git portal %s <feature-branch>" "$futureBranch"
  exit 1;
)
