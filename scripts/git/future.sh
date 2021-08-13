#!/bin/bash

futureBranch=${1:-$(git branch --show-current)};
featureBranch=$2;

git checkout develop --detach;
git merge --no-ff -m "future! $futureBranch" "$futureBranch" && (
  git tag -f future/"$futureBranch";
  test "$featureBranch" && (
    git checkout -b "$featureBranch" ||
      portal.sh "$futureBranch" "$featureBranch";
  )
)
